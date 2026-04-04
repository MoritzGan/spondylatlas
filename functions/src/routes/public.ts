import { Router } from "express";
import type { Request } from "express";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../lib/errors.js";
import { contentReportSchema, hypothesisPublicListSchema, metaStudyPublicListSchema } from "../middleware/validate.js";
import { publicWriteRateLimitMiddleware } from "../middleware/rateLimit.js";
import { verifyOptionalFirebaseUser } from "../middleware/firebaseUserAuth.js";
import { param } from "../types/index.js";

const router = Router();

function db() {
  return getFirestore();
}

function toIsoString(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return null;
}

/**
 * Batch-fetch paper titles for a set of IDs.
 * Returns a map of paperId → title.
 */
async function fetchPaperTitles(paperIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paperIds)].filter(Boolean);
  if (unique.length === 0) return {};

  const titles: Record<string, string> = {};
  for (let i = 0; i < unique.length; i += 30) {
    const batch = unique.slice(i, i + 30);
    const snap = await db()
      .collection("papers")
      .where("__name__", "in", batch)
      .select("title")
      .get();
    for (const doc of snap.docs) {
      titles[doc.id] = doc.data().title ?? "";
    }
  }
  return titles;
}


function serializeHypothesis(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data();
  if (!data) {
    return null;
  }

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    rationale: data.rationale,
    paperIds: Array.isArray(data.paperIds) ? data.paperIds : [],
    status: data.status,
    criticArgument: data.criticArgument ?? null,
    criticPaperIds: Array.isArray(data.criticPaperIds) ? data.criticPaperIds : [],
    commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
    generatedAt: toIsoString(data.generatedAt),
    reviewedAt: toIsoString(data.reviewedAt),
  };
}

function serializeHypothesisComment(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    hypothesisId: data.hypothesisId,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function sanitizeRun(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    agent: data.agent,
    runId: data.runId ?? doc.id,
    status: data.status,
    startedAt: toIsoString(data.startedAt ?? data.runAt),
    completedAt: toIsoString(data.completedAt),
    itemsProcessed: typeof data.itemsProcessed === "number"
      ? data.itemsProcessed
      : (typeof data.postsProcessed === "number" ? data.postsProcessed : 0) +
        (typeof data.reportsProcessed === "number" ? data.reportsProcessed : 0),
    summary: typeof data.summary === "string" ? data.summary : "Agent run completed",
  };
}

function sanitizeEvent(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    agent: data.agent,
    runId: data.runId ?? null,
    type: data.type,
    message: typeof data.message === "string" ? data.message.slice(0, 160) : "Agent event",
    detail: typeof data.detail === "string" ? data.detail.slice(0, 220) : null,
    timestamp: toIsoString(data.timestamp),
  };
}

function normalizeTargetId(contentType: string, rawInput: string) {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmed, "https://spondylatlas.invalid");
    if (contentType === "forum_reply" && parsedUrl.hash) {
      return parsedUrl.hash.replace(/^#comment-?/, "").trim() || null;
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return trimmed;
  }
}

async function getOptionalReporter(req: Request) {
  return verifyOptionalFirebaseUser(req);
}

router.get("/hypotheses", async (req, res, next) => {
  try {
    const params = hypothesisPublicListSchema.parse(req.query);
    const query: FirebaseFirestore.Query = db()
      .collection("hypotheses")
      .where("status", "in", params.status ? [params.status] : ["open", "challenged"])
      .orderBy("generatedAt", "desc");

    const snap = await query.limit(params.limit + params.offset).get();
    const docs = snap.docs.slice(params.offset, params.offset + params.limit).map(serializeHypothesis).filter(Boolean);

    // Enrich hypotheses with paper titles for critic references
    const allCriticPaperIds = docs.flatMap((d: Record<string, unknown>) => (d.criticPaperIds as string[]) ?? []);
    const paperTitles = await fetchPaperTitles(allCriticPaperIds);
    const enriched = docs.map((d: Record<string, unknown>) => ({ ...d, criticPaperTitles: paperTitles }));

    res.json({ data: enriched, total: snap.size, limit: params.limit, offset: params.offset });
  } catch (err) {
    next(err);
  }
});

router.get("/hypotheses/:id", async (req, res, next) => {
  try {
    const hypothesisId = param(req, "id");
    const hypothesisDoc = await db().collection("hypotheses").doc(hypothesisId).get();
    if (!hypothesisDoc.exists) {
      throw ApiError.notFound("Hypothesis not found");
    }

    const hypothesis = serializeHypothesis(hypothesisDoc);
    if (!hypothesis || !["open", "challenged"].includes(String(hypothesis.status))) {
      throw ApiError.notFound("Hypothesis not found");
    }

    const commentsSnap = await db()
      .collection("hypothesis_comments")
      .where("hypothesisId", "==", hypothesisId)
      .orderBy("createdAt", "asc")
      .get();

    // Enrich with paper titles for critic references
    const paperTitles = await fetchPaperTitles(hypothesis.criticPaperIds ?? []);

    res.json({
      ...hypothesis,
      criticPaperTitles: paperTitles,
      comments: commentsSnap.docs.map(serializeHypothesisComment),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/arena", async (_req, res, next) => {
  try {
    const [runsSnap, eventsSnap] = await Promise.all([
      db().collection("agent_runs").orderBy("startedAt", "desc").limit(50).get(),
      db().collection("agent_events").orderBy("timestamp", "desc").limit(100).get(),
    ]);

    res.json({
      runs: runsSnap.docs.map(sanitizeRun),
      events: eventsSnap.docs.map(sanitizeEvent),
    });
  } catch (err) {
    next(err);
  }
});

function serializeMetaStudy(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    hypothesisId: data.hypothesisId ?? null,
    title: data.title ?? "",
    status: data.status,
    currentRound: typeof data.currentRound === "number" ? data.currentRound : 1,
    sections: data.sections ?? {},
    references: Array.isArray(data.references) ? data.references : [],
    paperIds: Array.isArray(data.paperIds) ? data.paperIds : [],
    searchStrategy: data.searchStrategy ?? null,
    inclusionCriteria: Array.isArray(data.inclusionCriteria) ? data.inclusionCriteria : [],
    exclusionCriteria: Array.isArray(data.exclusionCriteria) ? data.exclusionCriteria : [],
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    wordCount: typeof data.wordCount === "number" ? data.wordCount : 0,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    publishedAt: toIsoString(data.publishedAt),
  };
}

router.get("/meta-studies", async (req, res, next) => {
  try {
    const params = metaStudyPublicListSchema.parse(req.query);
    const snap = await db()
      .collection("meta_studies")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(params.limit + params.offset)
      .get();

    const docs = snap.docs
      .slice(params.offset, params.offset + params.limit)
      .map(serializeMetaStudy)
      .filter(Boolean);

    res.json({ data: docs, total: snap.size, limit: params.limit, offset: params.offset });
  } catch (err) {
    next(err);
  }
});

router.get("/meta-studies/:id", async (req, res, next) => {
  try {
    const studyId = param(req, "id");
    const studyDoc = await db().collection("meta_studies").doc(studyId).get();
    if (!studyDoc.exists) {
      throw ApiError.notFound("Meta-study not found");
    }

    const study = serializeMetaStudy(studyDoc);
    if (!study || study.status !== "published") {
      throw ApiError.notFound("Meta-study not found");
    }

    // Fetch linked hypothesis title
    let hypothesisTitle: string | null = null;
    if (study.hypothesisId) {
      const hypoDoc = await db().collection("hypotheses").doc(study.hypothesisId).get();
      if (hypoDoc.exists) {
        hypothesisTitle = (hypoDoc.data()?.title as string) ?? null;
      }
    }

    res.json({ ...study, hypothesisTitle });
  } catch (err) {
    next(err);
  }
});

router.post("/reports", publicWriteRateLimitMiddleware, async (req, res, next) => {
  try {
    const payload = contentReportSchema.parse(req.body);
    const firebaseUser = await getOptionalReporter(req);
    const targetId = normalizeTargetId(payload.contentType, payload.contentUrl);

    const ref = await db().collection("content_reports").add({
      reporterUserId: firebaseUser?.uid ?? null,
      reporterEmail: firebaseUser?.email ?? (payload.reporterEmail?.trim() || null),
      contentUrl: payload.contentUrl,
      contentType: payload.contentType,
      reason: payload.reason,
      details: payload.details,
      targetId,
      targetType: payload.contentType,
      status: "new",
      processingStatus: "pending_review",
      statementConfirmed: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      scope: payload.contentType === "forum_post" || payload.contentType === "forum_reply"
        ? "community_forum"
        : "general",
    });

    res.status(201).json({ id: ref.id });
  } catch (err) {
    next(err);
  }
});

export default router;

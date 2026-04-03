import { Router } from "express";
import type { Request } from "express";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../lib/errors.js";
import { contentReportSchema, hypothesisPublicListSchema } from "../middleware/validate.js";
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
    let query: FirebaseFirestore.Query = db()
      .collection("hypotheses")
      .where("status", "in", params.status ? [params.status] : ["open", "challenged"])
      .orderBy("generatedAt", "desc");

    const snap = await query.limit(params.limit + params.offset).get();
    const docs = snap.docs.slice(params.offset, params.offset + params.limit).map(serializeHypothesis);
    res.json({ data: docs.filter(Boolean), total: snap.size, limit: params.limit, offset: params.offset });
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

    res.json({
      ...hypothesis,
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

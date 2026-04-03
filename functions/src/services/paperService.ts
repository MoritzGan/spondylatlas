import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../lib/errors.js";
import type { PaperSubmission, PaperReview } from "../types/index.js";

function db() {
  return getFirestore();
}

export async function searchPapers(params: {
  q?: string;
  tags?: string;
  evidenceLevel?: string;
  limit: number;
  offset: number;
}) {
  let query: FirebaseFirestore.Query = db()
    .collection("papers")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc");

  if (params.evidenceLevel) {
    query = query.where("evidenceLevel", "==", params.evidenceLevel);
  }

  // Firestore doesn't support full-text search, so we fetch more and filter client-side for q
  const fetchLimit = params.q ? 500 : params.limit + params.offset;
  const snap = await query.limit(fetchLimit).get();

  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (params.q) {
    const terms = params.q.toLowerCase().split(/\s+/);
    docs = docs.filter((doc: Record<string, unknown>) => {
      const text = `${doc.title ?? ""} ${doc.abstract ?? ""}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }

  if (params.tags) {
    const filterTags = params.tags.split(",").map((t) => t.trim().toLowerCase());
    docs = docs.filter((doc: Record<string, unknown>) => {
      const docTags = (doc.tags as string[] | undefined)?.map((t) => t.toLowerCase()) ?? [];
      return filterTags.some((ft) => docTags.includes(ft));
    });
  }

  const total = docs.length;
  const data = docs.slice(params.offset, params.offset + params.limit);

  return { data, total, limit: params.limit, offset: params.offset };
}

export async function getPaper(id: string) {
  const doc = await db().collection("papers").doc(id).get();
  if (!doc.exists) throw ApiError.notFound("Paper not found");
  return { id: doc.id, ...doc.data() };
}

export async function submitPaper(
  submission: PaperSubmission,
  agentId: string,
) {
  // Check for duplicates
  if (submission.doi) {
    const existing = await db()
      .collection("papers")
      .where("doi", "==", submission.doi)
      .limit(1)
      .get();
    if (!existing.empty) throw ApiError.conflict("Paper with this DOI already exists");

    const staged = await db()
      .collection("agent_submissions")
      .where("doi", "==", submission.doi)
      .limit(1)
      .get();
    if (!staged.empty) throw ApiError.conflict("Paper with this DOI already submitted");
  }

  if (submission.pubmedId) {
    const existing = await db()
      .collection("papers")
      .where("pubmedId", "==", submission.pubmedId)
      .limit(1)
      .get();
    if (!existing.empty) throw ApiError.conflict("Paper with this PubMed ID already exists");
  }

  const ref = await db().collection("agent_submissions").add({
    ...submission,
    submittedBy: agentId,
    status: "pending",
    createdAt: Timestamp.now(),
  });

  return { id: ref.id, status: "pending" };
}

export async function reviewPaper(
  paperId: string,
  review: PaperReview,
  agentId: string,
  agentName: string,
) {
  // Verify paper exists
  const paper = await db().collection("papers").doc(paperId).get();
  if (!paper.exists) throw ApiError.notFound("Paper not found");

  const ref = await db().collection("agent_reviews").add({
    targetType: "paper",
    targetId: paperId,
    agentId,
    agentName,
    verdict: review.evidenceLevel,
    content: review.rationale,
    confidence: review.confidence,
    metadata: {
      evidenceLevel: review.evidenceLevel,
      studyType: review.studyType,
      tags: review.tags ?? [],
    },
    createdAt: Timestamp.now(),
  });

  return { id: ref.id };
}

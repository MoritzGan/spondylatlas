import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ApiError } from "../lib/errors.js";
import type { HypothesisReview } from "../types/index.js";

function db() {
  return getFirestore();
}

export async function listHypotheses(params: {
  status?: string;
  limit: number;
  offset: number;
}) {
  let query: FirebaseFirestore.Query = db()
    .collection("hypotheses")
    .orderBy("generatedAt", "desc");

  if (params.status) {
    query = query.where("status", "==", params.status);
  }

  const snap = await query.limit(params.limit + params.offset).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const data = docs.slice(params.offset, params.offset + params.limit);
  return { data, total: docs.length, limit: params.limit, offset: params.offset };
}

export async function getHypothesis(id: string) {
  const doc = await db().collection("hypotheses").doc(id).get();
  if (!doc.exists) throw ApiError.notFound("Hypothesis not found");

  const comments = await db()
    .collection("hypothesis_comments")
    .where("hypothesisId", "==", id)
    .orderBy("createdAt", "asc")
    .get();

  return {
    id: doc.id,
    ...doc.data(),
    comments: comments.docs.map((c) => ({ id: c.id, ...c.data() })),
  };
}

export async function reviewHypothesis(
  hypothesisId: string,
  review: HypothesisReview,
  agentId: string,
  agentName: string,
) {
  const hyp = await db().collection("hypotheses").doc(hypothesisId).get();
  if (!hyp.exists) throw ApiError.notFound("Hypothesis not found");

  const ref = await db().collection("agent_reviews").add({
    targetType: "hypothesis",
    targetId: hypothesisId,
    agentId,
    agentName,
    verdict: review.verdict,
    content: review.argument,
    confidence: review.confidence,
    metadata: {
      researchQuery: review.researchQuery ?? null,
      referencePaperIds: review.referencePaperIds ?? [],
    },
    createdAt: Timestamp.now(),
  });

  return { id: ref.id };
}

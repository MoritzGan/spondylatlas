import { Router } from "express";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { ApiError } from "../lib/errors.js";
import { validate, forumCommentSchema, hypothesisCommentSchema } from "../middleware/validate.js";
import { getFirebaseUser, param } from "../types/index.js";

const router = Router();
const FORUM_POSTS = "forum_posts";
const FORUM_COMMENTS = "forum_comments";
const HYPOTHESES = "hypotheses";
const HYPOTHESIS_COMMENTS = "hypothesis_comments";

function db() {
  return getFirestore();
}

async function assertCommunityAccess(uid: string, emailVerified: boolean) {
  if (!emailVerified) {
    throw ApiError.forbidden("Verified email is required for community access");
  }

  const consent = await db().collection("health_data_consents").doc(uid).get();
  if (!consent.exists || consent.data()?.granted !== true) {
    throw ApiError.forbidden("Active health-data consent is required for community access");
  }
}

router.post("/forum/comments", validate(forumCommentSchema), async (req, res, next) => {
  try {
    const firebaseUser = getFirebaseUser(req);
    const { postId, content } = req.body;

    await assertCommunityAccess(firebaseUser.uid, firebaseUser.emailVerified);

    const postRef = db().collection(FORUM_POSTS).doc(postId);
    const commentsRef = db().collection(FORUM_COMMENTS).doc();

    await db().runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw ApiError.notFound("Forum post not found");
      }

      const post = postDoc.data();
      if (!post) {
        throw ApiError.notFound("Forum post not found");
      }

      const readable =
        post.status === "published" || post.authorId === firebaseUser.uid;

      if (!readable) {
        throw ApiError.forbidden("Forum post is not commentable");
      }

      transaction.set(commentsRef, {
        postId,
        content,
        authorId: firebaseUser.uid,
        authorName: firebaseUser.name ?? firebaseUser.email ?? "Anonym",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(postRef, {
        replyCount: FieldValue.increment(1),
        lastReplyAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    res.status(201).json({ id: commentsRef.id });
  } catch (err) {
    next(err);
  }
});

router.post("/hypotheses/:id/comments", validate(hypothesisCommentSchema), async (req, res, next) => {
  try {
    const firebaseUser = getFirebaseUser(req);
    const hypothesisId = param(req, "id");
    const { content } = req.body;

    await assertCommunityAccess(firebaseUser.uid, firebaseUser.emailVerified);

    const hypothesisRef = db().collection(HYPOTHESES).doc(hypothesisId);
    const commentsRef = db().collection(HYPOTHESIS_COMMENTS).doc();

    await db().runTransaction(async (transaction) => {
      const hypothesisDoc = await transaction.get(hypothesisRef);
      if (!hypothesisDoc.exists) {
        throw ApiError.notFound("Hypothesis not found");
      }

      const hypothesis = hypothesisDoc.data();
      if (!hypothesis || !["open", "challenged"].includes(hypothesis.status)) {
        throw ApiError.forbidden("Hypothesis is not open for public discussion");
      }

      transaction.set(commentsRef, {
        hypothesisId,
        content,
        authorId: firebaseUser.uid,
        authorName: firebaseUser.name ?? firebaseUser.email ?? "Anonym",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(hypothesisRef, {
        commentCount: FieldValue.increment(1),
      });
    });

    res.status(201).json({ id: commentsRef.id });
  } catch (err) {
    next(err);
  }
});

export default router;

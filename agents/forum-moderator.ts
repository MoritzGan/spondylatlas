import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

// ── Init ─────────────────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

interface ForumPost {
  id?: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  status: string;
  createdAt: Timestamp;
}

interface Report {
  id?: string;
  postId?: string;
  commentId?: string;
  reason: string;
  reporterId: string;
  createdAt: Timestamp;
}

type ModerationDecision = "approve" | "reject" | "escalate";

interface ModerationResult {
  decision: ModerationDecision;
  reason: string;
}

// ── Claude Moderation ─────────────────────────────────────────────────────────

async function moderateContent(
  title: string,
  content: string,
  context: string = "Morbus Bechterew Community-Forum"
): Promise<ModerationResult> {
  const prompt = `Du bist Moderator eines Community-Forums für Menschen mit Morbus Bechterew (axiale Spondyloarthritis). 
Bitte prüfe den folgenden Beitrag auf Angemessenheit.

Kontext: ${context}

Titel: "${title}"
Inhalt: "${content}"

Bewertungskriterien:
- APPROVE: Sachlicher, respektvoller Austausch zu Erkrankung, Symptomen, Behandlung, Erfahrungen, Forschung oder Gemeinschaft
- REJECT: Spam, Werbung, Beleidigungen, Hassrede, explizit gefährliche Falschinformationen (z.B. "nehmt kein Medikament X"), persönliche Angriffe
- ESCALATE: Suizidgedanken, Krisen, medizinische Notfälle, grenzwertige Inhalte die menschliche Entscheidung erfordern

Antworte NUR mit diesem JSON-Format (kein Markdown, kein Text davor/danach):
{"decision":"approve|reject|escalate","reason":"Kurze Begründung auf Deutsch (max 100 Zeichen)"}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    return JSON.parse(text) as ModerationResult;
  } catch {
    console.warn("Failed to parse moderation response:", text);
    return { decision: "escalate", reason: "Parse-Fehler — manuelle Prüfung" };
  }
}

// ── Moderate pending posts ────────────────────────────────────────────────────

async function moderatePendingPosts(): Promise<void> {
  const snap = await db
    .collection("forum_posts")
    .where("status", "==", "pending_moderation")
    .orderBy("createdAt", "asc")
    .limit(20)
    .get();

  if (snap.empty) {
    console.log("No pending posts.");
    return;
  }

  console.log(`Found ${snap.size} pending post(s).`);

  for (const doc of snap.docs) {
    const post = { id: doc.id, ...doc.data() } as ForumPost;
    console.log(`Moderating post "${post.title}" (${post.id})...`);

    const result = await moderateContent(post.title, post.content);
    console.log(`  → ${result.decision}: ${result.reason}`);

    const newStatus =
      result.decision === "approve"
        ? "published"
        : result.decision === "reject"
        ? "rejected"
        : "escalated";

    await doc.ref.update({
      status: newStatus,
      moderatedAt: Timestamp.now(),
      moderationReason: result.reason,
      moderationDecision: result.decision,
    });
  }
}

// ── Moderate reported content ─────────────────────────────────────────────────

async function moderateReports(): Promise<void> {
  const snap = await db
    .collection("reports")
    .where("reviewed", "==", false)
    .orderBy("createdAt", "asc")
    .limit(10)
    .get();

  if (snap.empty) {
    console.log("No unreviewed reports.");
    return;
  }

  console.log(`Found ${snap.size} report(s).`);

  for (const doc of snap.docs) {
    const report = { id: doc.id, ...doc.data() } as Report;

    if (report.postId) {
      const postDoc = await db
        .collection("forum_posts")
        .doc(report.postId)
        .get();
      if (!postDoc.exists) {
        await doc.ref.update({ reviewed: true, reviewNote: "Post not found" });
        continue;
      }
      const post = postDoc.data() as ForumPost;
      console.log(`Reviewing report for post "${post.title}"...`);

      const result = await moderateContent(
        post.title,
        post.content,
        `Gemeldeter Inhalt. Meldegrund: "${report.reason}"`
      );
      console.log(`  → ${result.decision}: ${result.reason}`);

      if (result.decision === "reject") {
        await postDoc.ref.update({
          status: "rejected",
          moderatedAt: Timestamp.now(),
          moderationReason: `Gemeldet + abgelehnt: ${result.reason}`,
        });
      }

      await doc.ref.update({
        reviewed: true,
        reviewNote: result.reason,
        reviewDecision: result.decision,
        reviewedAt: Timestamp.now(),
      });
    }
  }
}

// ── Log run ───────────────────────────────────────────────────────────────────

async function logRun(
  postsProcessed: number,
  reportsProcessed: number
): Promise<void> {
  await db.collection("agent_runs").add({
    agent: "forum-moderator",
    postsProcessed,
    reportsProcessed,
    runAt: Timestamp.now(),
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== Forum Moderator Agent ===");
  console.log(new Date().toISOString());

  const postsSnap = await db
    .collection("forum_posts")
    .where("status", "==", "pending_moderation")
    .get();
  const reportsSnap = await db
    .collection("reports")
    .where("reviewed", "==", false)
    .get();

  await moderatePendingPosts();
  await moderateReports();
  await logRun(postsSnap.size, reportsSnap.size);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

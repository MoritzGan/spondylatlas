import Anthropic from "@anthropic-ai/sdk";
import { Timestamp } from "firebase-admin/firestore";
import { mapModerationDecisionToStatus, type ForumModerationDecision } from "../../shared/domain/forum.js";

export interface ModerationResult {
  decision: ForumModerationDecision;
  reason: string;
}

export interface ModeratorLogger {
  logStart(detail?: string): Promise<void>;
  logEvent(type: "start" | "step" | "complete" | "error" | "skip", message: string, detail?: string): Promise<void>;
  logComplete(summary: string, itemsProcessed?: number): Promise<void>;
  logError(error: string): Promise<void>;
}

type QuerySnapshot = {
  empty: boolean;
  size: number;
  docs: Array<{
    id: string;
    data(): Record<string, any>;
    ref: {
      update(data: Record<string, unknown>): Promise<unknown>;
    };
  }>;
};

type FirestoreLike = {
  collection(name: string): {
    where(field: string, op: "==" | "in", value: unknown): {
      orderBy(field: string, direction?: "asc" | "desc"): {
        limit(count: number): {
          get(): Promise<QuerySnapshot>;
        };
      };
      get(): Promise<QuerySnapshot>;
    };
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): Record<string, any> | undefined; ref: { update(data: Record<string, unknown>): Promise<unknown> } }>;
    };
  };
};

export function parseModerationResponse(text: string): ModerationResult {
  try {
    const parsed = JSON.parse(text.trim()) as Partial<ModerationResult>;
    if (parsed.decision === "approve" || parsed.decision === "flag" || parsed.decision === "remove") {
      return {
        decision: parsed.decision,
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
      };
    }
  } catch {
    // fall through to safe default
  }
  return { decision: "flag", reason: "Parse-Fehler - manuelle Prüfung" };
}

export async function moderateContent(
  anthropic: Anthropic,
  title: string,
  content: string,
  context = "Morbus Bechterew Community-Forum"
): Promise<ModerationResult> {
  const prompt = `Du bist Moderator eines Community-Forums für Menschen mit Morbus Bechterew (axiale Spondyloarthritis).
Bitte prüfe den folgenden Beitrag auf Angemessenheit.

Kontext: ${context}

Titel: "${title}"
Inhalt: "${content}"

Bewertungskriterien:
- APPROVE: Sachlicher, respektvoller Austausch zu Erkrankung, Symptomen, Behandlung, Erfahrungen, Forschung oder Gemeinschaft
- FLAG: Grenzwertig, potenziell schädlich, medizinisch unsicher, Spam-Verdacht oder menschliche Nachprüfung sinnvoll
- REMOVE: Spam, Werbung, Beleidigungen, Hassrede, explizit gefährliche Falschinformationen, persönliche Angriffe

Antworte NUR mit diesem JSON-Format (kein Markdown, kein Text davor/danach):
{"decision":"approve|flag|remove","reason":"Kurze Begründung auf Deutsch (max 100 Zeichen)"}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-20250414",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  const text = block.type === "text" ? block.text : "";
  return parseModerationResponse(text);
}

export async function runForumModerator({
  db,
  anthropic,
  logger,
}: {
  db: FirestoreLike;
  anthropic: Anthropic;
  logger: ModeratorLogger;
}) {
  await logger.logStart("Prüfe neue Forum-Beiträge und Meldungen");

  const pendingPosts = await db
    .collection("forum_posts")
    .where("status", "==", "pending_moderation")
    .orderBy("createdAt", "asc")
    .limit(20)
    .get();

  let processedPosts = 0;
  for (const doc of pendingPosts.docs) {
    const post = doc.data();
    const result = await moderateContent(
      anthropic,
      typeof post.title === "string" ? post.title : "",
      typeof post.content === "string" ? post.content : ""
    );

    await doc.ref.update({
      status: mapModerationDecisionToStatus(result.decision),
      moderatedAt: Timestamp.now(),
      moderationReason: result.reason,
      moderationDecision: result.decision,
    });
    await logger.logEvent("step", "Beitrag moderiert", doc.id);
    processedPosts++;
  }

  const openReports = await db
    .collection("reports")
    .where("reviewed", "==", false)
    .get();

  let processedReports = 0;
  for (const doc of openReports.docs) {
    await doc.ref.update({
      reviewed: true,
      reviewDecision: "flag",
      reviewNote: "Manuelle Nachprüfung erforderlich",
      reviewedAt: Timestamp.now(),
    });
    processedReports++;
  }

  await logger.logComplete(
    `${processedPosts} Beiträge moderiert, ${processedReports} Meldungen markiert`,
    processedPosts + processedReports
  );

  return { processedPosts, processedReports };
}

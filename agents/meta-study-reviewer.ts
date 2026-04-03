import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_ROUNDS = 3;

interface MetaStudySections {
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
}

interface ReviewResult {
  verdict: "revision_needed" | "approved" | "major_issues";
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  methodologyCritique: string;
  statisticalCritique: string;
  citationCheck: string;
}

async function findDraftsToReview(): Promise<
  { docId: string; title: string; sections: MetaStudySections; currentRound: number; references: unknown[] }[]
> {
  const snap = await db
    .collection("meta_studies")
    .where("status", "==", "draft")
    .limit(5)
    .get();

  return snap.docs.map((d) => ({
    docId: d.id,
    title: d.data().title as string,
    sections: d.data().sections as MetaStudySections,
    currentRound: (d.data().currentRound as number) ?? 1,
    references: (d.data().references ?? []) as unknown[],
  }));
}

async function reviewMetaStudy(
  study: { title: string; sections: MetaStudySections; references: unknown[] }
): Promise<ReviewResult> {
  const fullText = Object.entries(study.sections)
    .map(([key, val]) => `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n${val}`)
    .join("\n\n");

  const refCount = study.references.length;

  const prompt = `Du bist ein erfahrener akademischer Reviewer für systematische Reviews und Meta-Analysen im Bereich der axialen Spondyloarthritis.

Prüfe die folgende Meta-Studie nach strengen akademischen Standards.

TITEL: "${study.title}"

VOLLTEXT:
${fullText}

ANZAHL REFERENZEN: ${refCount}

Bewerte nach folgenden Kriterien:

1. **Methodologie**: Sind PRISMA-Richtlinien eingehalten? Ist die Suchstrategie reproduzierbar? Sind Ein-/Ausschlusskriterien klar nach PICO definiert?
2. **Statistik**: Sind Evidenzgrade korrekt zugeordnet? Werden Effektgrößen oder Konfidenzintervalle wo möglich angegeben? Sind Heterogenitätsmaße berichtet?
3. **Zitationen**: Werden alle Behauptungen durch Quellen gestützt? Sind die Referenzen korrekt im Vancouver-Stil formatiert?
4. **Logik**: Sind die Schlussfolgerungen durch die Evidenz gedeckt? Gibt es logische Sprünge oder übertriebene Claims?
5. **Sprache**: Ist der akademische Ton durchgängig? Werden Konjunktive bei unsicheren Aussagen verwendet? Sind Fachbegriffe korrekt?
6. **Vollständigkeit**: Sind alle Sektionen (Abstract, Einleitung, Methoden, Ergebnisse, Diskussion, Schlussfolgerung) vollständig und substantiell?

Verdikt:
- **approved**: Die Studie erfüllt akademische Standards und kann veröffentlicht werden.
- **revision_needed**: Die Studie hat Potenzial, braucht aber Überarbeitung in bestimmten Bereichen.
- **major_issues**: Fundamentale Probleme, die eine grundlegende Überarbeitung erfordern.

Antworte NUR mit diesem JSON (kein Markdown):
{
  "verdict": "approved|revision_needed|major_issues",
  "strengths": ["Stärke 1", "Stärke 2", "..."],
  "weaknesses": ["Schwäche 1", "Schwäche 2", "..."],
  "suggestions": ["Konkreter Vorschlag 1", "Konkreter Vorschlag 2", "..."],
  "methodologyCritique": "Detaillierte Bewertung der Methodik",
  "statisticalCritique": "Detaillierte Bewertung der Statistik",
  "citationCheck": "Detaillierte Bewertung der Zitationen"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(text) as ReviewResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ReviewResult;
    throw new Error(`Failed to parse review: ${text.slice(0, 200)}`);
  }
}

async function main() {
  console.log("=== Meta-Study Reviewer ===");
  initLogger("meta-study-reviewer" as AgentName);
  await logStart("Prüfe Meta-Studien-Entwürfe");

  const drafts = await findDraftsToReview();

  if (drafts.length === 0) {
    await logComplete("Keine Entwürfe zu prüfen", 0);
    console.log("No drafts to review.");
    return;
  }

  console.log(`Found ${drafts.length} draft(s) to review.`);
  await logEvent("step" as EventType, `${drafts.length} Entwurf/Entwürfe zu prüfen`);

  let approved = 0, revised = 0, needsHuman = 0;

  for (const draft of drafts) {
    console.log(`\nReviewing: "${draft.title.slice(0, 70)}" (round ${draft.currentRound})`);

    let result: ReviewResult;
    try {
      result = await reviewMetaStudy(draft);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Review failed: ${msg}`);
      await logEvent("step" as EventType, `[FEHLER] Review: ${draft.title.slice(0, 60)}`, msg.slice(0, 120));
      continue;
    }

    console.log(`  → Verdict: ${result.verdict}`);
    console.log(`  → Strengths: ${result.strengths.length}, Weaknesses: ${result.weaknesses.length}`);

    const reviewRound = {
      round: draft.currentRound,
      reviewedAt: Timestamp.now(),
      verdict: result.verdict,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
      methodologyCritique: result.methodologyCritique,
      statisticalCritique: result.statisticalCritique,
      citationCheck: result.citationCheck,
    };

    if (result.verdict === "approved") {
      // Publish the study
      await db.collection("meta_studies").doc(draft.docId).update({
        status: "published",
        publishedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        reviews: FieldValue.arrayUnion(reviewRound),
      });
      await logEvent("step" as EventType, `✅ PUBLIZIERT: ${draft.title.slice(0, 70)}`);
      console.log(`  ✓ Published!`);
      approved++;
    } else if (draft.currentRound >= MAX_ROUNDS) {
      // Max rounds reached — escalate to human
      await db.collection("meta_studies").doc(draft.docId).update({
        status: "needs_human",
        updatedAt: Timestamp.now(),
        reviews: FieldValue.arrayUnion(reviewRound),
      });
      await logEvent("step" as EventType, `⚠️ NEEDS_HUMAN: ${draft.title.slice(0, 70)} (Runde ${draft.currentRound})`);
      console.log(`  ⚠ Needs human review (max rounds reached)`);
      needsHuman++;
    } else {
      // Send back for revision
      await db.collection("meta_studies").doc(draft.docId).update({
        status: "revision",
        currentRound: draft.currentRound + 1,
        updatedAt: Timestamp.now(),
        reviews: FieldValue.arrayUnion(reviewRound),
      });
      await logEvent(
        "step" as EventType,
        `🔄 REVISION: ${draft.title.slice(0, 70)} (→ Runde ${draft.currentRound + 1})`,
        result.weaknesses.slice(0, 3).join("; ").slice(0, 120)
      );
      console.log(`  → Sent back for revision (round ${draft.currentRound + 1})`);
      revised++;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  const summary = `${approved} publiziert, ${revised} zur Revision, ${needsHuman} brauchen Mensch`;
  await logComplete(summary, drafts.length);
  console.log(`\nDone. ${summary}`);
}

// Import types used with casts
type AgentName = import("./lib/logger.js").AgentName;
type EventType = import("./lib/logger.js").EventType;

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch { /* logger may fail */ }
  process.exit(1);
});

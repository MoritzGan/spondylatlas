import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_PAPERS = 30;
const MAX_HYPOTHESES_PER_RUN = 5;

interface Paper {
  id: string;
  title: string;
  abstract: string;
  summary: string;
  evidenceLevel?: string;
  evidenceConfidence?: string;
  tags?: string[];
  publishedAt?: Timestamp;
}

interface BilingualField {
  de: string;
  en: string;
}

interface Hypothesis {
  title: BilingualField;
  description: BilingualField;
  rationale: BilingualField;
  paperIds: string[];
  status: "pending_review";
  generatedAt: Timestamp;
  generatedBy: "hypothesis-generator";
}

async function loadRecentPapers(): Promise<Paper[]> {
  const snap = await db
    .collection("papers")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(MAX_PAPERS)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title ?? "",
    abstract: d.data().abstract ?? "",
    summary: d.data().summary ?? "",
    evidenceLevel: d.data().evidenceLevel,
    evidenceConfidence: d.data().evidenceConfidence,
    tags: d.data().tags ?? [],
  }));
}

async function getExistingHypothesisTitles(): Promise<Set<string>> {
  const snap = await db.collection("hypotheses").get();
  return new Set(snap.docs.map((d) => d.data().title as string));
}

async function generateHypotheses(papers: Paper[]): Promise<
  { title: BilingualField; description: BilingualField; rationale: BilingualField; paperIds: string[] }[]
> {
  const paperSummaries = papers
    .slice(0, 20)
    .map(
      (p) =>
        `ID:${p.id}\nTitel: ${p.title}\nEvidenz: ${p.evidenceLevel ?? "?"}\nKonfidenz: ${p.evidenceConfidence ?? "?"}\nZusammenfassung: ${(p.summary || p.abstract).slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Du bist ein Wissenschaftler, der sich auf axiale Spondyloarthritis (Morbus Bechterew) spezialisiert hat.

Analysiere die folgenden ${papers.length} aktuellen Studien und leite daraus ${MAX_HYPOTHESES_PER_RUN} neue, spannende wissenschaftliche Hypothesen ab.

Anforderungen:
- Hypothesen müssen NEU und noch NICHT explizit in den Papers bewiesen sein
- Sie sollen testbare Zusammenhänge zwischen Faktoren beschreiben
- Formuliere ALLE Textfelder (title, description, rationale) zweisprachig: Deutsch UND Englisch
- Jedes Feld ist ein Objekt mit "de" und "en" Schlüssel
- Beziehe dich konkret auf Paper-Titel als Basis (keine rohen IDs verwenden)
- WICHTIG: Gewichte Studien mit hoher Evidenz-Konfidenz stärker. Papers mit niedriger Konfidenz ("low") sollten nur als unterstützende Hinweise genutzt werden, nie als Hauptgrundlage einer Hypothese.

Studien:
${paperSummaries}

Antworte NUR mit diesem JSON-Array (kein Markdown):
[
  {
    "title": "Kurzer Hypothesentitel (max 80 Zeichen)",
    "description": "Vollständige Hypothese in 2-3 Sätzen",
    "rationale": "Warum legen die Paper das nahe? Zitiere ausschließlich den vollen Studientitel (z.B. 'Die Studie „Titel..." zeigt...') — NIEMALS Nummern wie [1], [6], 'Paper 1' oder rohe IDs",
    "paperIds": ["id1", "id2"]
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";

  // Strip markdown code fences the model may emit despite instructions
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Attempt 1: direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Attempt 2: extract array block + jsonrepair
    const block = text.match(/\[[\s\S]*\]/)?.[0] ?? text;
    try {
      return JSON.parse(jsonrepair(block));
    } catch {
      // Attempt 3: jsonrepair on full text
      try {
        return JSON.parse(jsonrepair(text));
      } catch {
        console.error("Failed to parse hypotheses after repair:", rawText.slice(0, 300));
        return [];
      }
    }
  }
}

async function loadChallengedHypotheses(): Promise<
  { id: string; title: BilingualField; description: BilingualField; rationale: BilingualField; paperIds: string[]; criticArgument: BilingualField; criticPaperIds: string[]; defenseRound?: number }[]
> {
  const snap = await db
    .collection("hypotheses")
    .where("status", "==", "challenged")
    .where("defenseRound", "==", null)
    .orderBy("reviewedAt", "asc")
    .limit(5)
    .get();

  // Fallback: also check hypotheses without defenseRound field at all
  const snap2 = await db
    .collection("hypotheses")
    .where("status", "==", "challenged")
    .orderBy("reviewedAt", "asc")
    .limit(10)
    .get();

  const seen = new Set<string>();
  const results: typeof snap.docs = [];

  for (const doc of [...snap.docs, ...snap2.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    const data = doc.data();
    // Skip if already defended (defenseRound >= 1) or withdrawn
    if (data.defenseRound && data.defenseRound >= 1) continue;
    if (data.status === "withdrawn") continue;
    results.push(doc);
    if (results.length >= 5) break;
  }

  return results.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title as BilingualField,
      description: data.description as BilingualField,
      rationale: data.rationale as BilingualField,
      paperIds: (data.paperIds ?? []) as string[],
      criticArgument: data.criticArgument as BilingualField,
      criticPaperIds: (data.criticPaperIds ?? []) as string[],
      defenseRound: data.defenseRound as number | undefined,
    };
  });
}

async function defendHypothesis(
  hypothesis: { title: BilingualField; description: BilingualField; rationale: BilingualField; criticArgument: BilingualField },
  papers: Paper[]
): Promise<{ action: "defend" | "withdraw"; defense?: BilingualField; additionalPaperIds?: string[] }> {
  const paperContext = papers
    .slice(0, 20)
    .map(
      (p) =>
        `ID:${p.id}\nTitel: ${p.title}\nEvidenz: ${p.evidenceLevel ?? "?"}\nZusammenfassung: ${(p.summary || p.abstract).slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const titleDe = typeof hypothesis.title === "string" ? hypothesis.title : hypothesis.title.de;
  const descDe = typeof hypothesis.description === "string" ? hypothesis.description : hypothesis.description.de;
  const rationaleDe = typeof hypothesis.rationale === "string" ? hypothesis.rationale : hypothesis.rationale.de;
  const criticDe = typeof hypothesis.criticArgument === "string" ? hypothesis.criticArgument : hypothesis.criticArgument.de;

  const prompt = `Du bist ein Wissenschaftler, der eine seiner Hypothesen gegen Kritik verteidigen muss.

DEINE HYPOTHESE:
Titel: "${titleDe}"
Beschreibung: ${descDe}
Begründung: ${rationaleDe}

KRITIK DES REVIEWERS:
${criticDe}

VERFÜGBARE STUDIEN (für zusätzliche Belege):
${paperContext}

ENTSCHEIDE:
1. **defend**: Du hast neue/zusätzliche Argumente oder Papers, die die Kritik entkräften
2. **withdraw**: Die Kritik ist berechtigt, die Hypothese sollte zurückgezogen werden

Sei intellektuell ehrlich: Verteidige NUR, wenn du tatsächlich stichhaltige Gegenargumente hast.

WICHTIG: Das "defense"-Feld MUSS ein Objekt mit "de" und "en" sein (zweisprachig).
Nenne Papers immer beim vollen Titel, KEINE IDs oder Nummern im Fließtext.
Gib im "additionalPaperIds"-Feld die IDs der Papers an, die deine Verteidigung stützen.

Antworte NUR mit JSON:
{
  "action": "defend|withdraw",
  "defense": { "de": "Verteidigung auf Deutsch (3-5 Sätze)", "en": "Defense in English (3-5 sentences)" },
  "additionalPaperIds": ["id1", "id2"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(jsonrepair(text));
    } catch {
      console.warn("Failed to parse defense response");
      return { action: "withdraw" };
    }
  }
}

async function main() {
  console.log("=== Hypothesis Generator ===");
  initLogger("hypothesis-generator" as any);
  await logStart("Generiere neue Hypothesen und verteidige angegriffene");

  const papers = await loadRecentPapers();
  await logEvent("step" as any, `${papers.length} Papers geladen`);

  // Phase 1: Defend challenged hypotheses
  const challenged = await loadChallengedHypotheses();
  let defended = 0, withdrawn = 0;

  if (challenged.length > 0) {
    console.log(`\n--- Phase 1: Defending ${challenged.length} challenged hypothesis/hypotheses ---`);
    await logEvent("step" as any, `${challenged.length} angegriffene Hypothese(n) zu verteidigen`);

    for (const h of challenged) {
      const titleStr = typeof h.title === "string" ? h.title : h.title.de;
      console.log(`\nDefending: "${titleStr.slice(0, 70)}"`);

      try {
        const result = await defendHypothesis(h, papers);

        if (result.action === "withdraw") {
          await db.collection("hypotheses").doc(h.id).update({
            status: "withdrawn",
            defenseRound: 1,
            defenseAction: "withdraw",
            defendedAt: Timestamp.now(),
          });
          console.log(`  → Withdrawn`);
          await logEvent("step" as any, `[WITHDRAWN] ${titleStr.slice(0, 70)}`);
          withdrawn++;
        } else {
          await db.collection("hypotheses").doc(h.id).update({
            status: "pending_defense_review",
            defenseRound: 1,
            defenseAction: "defend",
            defenseArgument: result.defense ?? { de: "", en: "" },
            additionalPaperIds: result.additionalPaperIds ?? [],
            defendedAt: Timestamp.now(),
          });
          const defDe = result.defense ? (typeof result.defense === "string" ? result.defense : result.defense.de) : "";
          console.log(`  → Defended: ${defDe.slice(0, 100)}`);
          await logEvent("step" as any, `[DEFENDED] ${titleStr.slice(0, 70)}`, defDe.slice(0, 120));
          defended++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  Error: ${msg}`);
        await logEvent("step" as any, `[FEHLER] Verteidigung: ${titleStr.slice(0, 60)}`, msg.slice(0, 120));
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Phase 2: Generate new hypotheses
  if (papers.length < 5) {
    await logComplete(`${defended} verteidigt, ${withdrawn} zurückgezogen, zu wenige Papers für neue`, defended + withdrawn);
    console.log("Not enough papers for new hypotheses.");
    return;
  }

  console.log(`\n--- Phase 2: Generating new hypotheses from ${papers.length} papers ---`);
  const existing = await getExistingHypothesisTitles();
  const hypotheses = await generateHypotheses(papers);
  let saved = 0;

  for (const h of hypotheses) {
    const titleStr = typeof h.title === "string" ? h.title : h.title.de;
    if (existing.has(titleStr)) {
      console.log(`  → Duplicate skipped: ${titleStr.slice(0, 60)}`);
      continue;
    }
    const doc: Hypothesis = {
      title: h.title,
      description: h.description,
      rationale: h.rationale,
      paperIds: h.paperIds ?? [],
      status: "pending_review",
      generatedAt: Timestamp.now(),
      generatedBy: "hypothesis-generator",
    };
    await db.collection("hypotheses").add(doc);
    const logTitle = typeof h.title === "string" ? h.title : h.title.de;
    const logDesc = typeof h.description === "string" ? h.description : h.description.de;
    await logEvent("step" as any, `Hypothese gespeichert: ${logTitle.slice(0, 80)}`, logDesc.slice(0, 120));
    console.log(`  ✓ ${logTitle.slice(0, 70)}`);
    saved++;
  }

  const summary = `${saved} neue Hypothesen, ${defended} verteidigt, ${withdrawn} zurückgezogen`;
  await logComplete(summary, saved + defended + withdrawn);
  console.log(`\nDone. ${summary}`);
}

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch {}
  process.exit(1);
});

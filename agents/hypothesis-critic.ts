import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CriticVerdict = "challenged" | "open" | "needs_research";

interface CriticResult {
  verdict: CriticVerdict;
  argument: string;
  researchQuery?: string;
  paperIds: string[];
}

async function loadPapersForHypothesis(hypothesisPaperIds: string[]): Promise<
  { id: string; title: string; abstract: string; summary: string; evidenceLevel?: string }[]
> {
  // Load all papers (up to 40 most recent) for broad context
  const snap = await db
    .collection("papers")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title ?? "",
    abstract: d.data().abstract ?? "",
    summary: d.data().summary ?? "",
    evidenceLevel: d.data().evidenceLevel,
  }));
}

async function critiqueHypothesis(
  hypothesis: { id: string; title: string; description: string; rationale: string; paperIds: string[] },
  papers: { id: string; title: string; abstract: string; summary: string; evidenceLevel?: string }[]
): Promise<CriticResult> {
  const slicedPapers = papers.slice(0, 25);

  // Build numbered context — IDs are NOT exposed to the LLM to prevent raw-ID leakage in argument text.
  // After parsing, we map 1-based paper numbers back to real Firestore IDs.
  const paperContext = slicedPapers
    .map(
      (p, i) =>
        `[${i + 1}] Evidenz: ${p.evidenceLevel ?? "?"}\nTitel: ${p.title}\n${(p.summary || p.abstract).slice(0, 350)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Du bist ein kritischer Wissenschaftler für axiale Spondyloarthritis (Morbus Bechterew).

Deine Aufgabe: Versuche die folgende Hypothese auf Basis der verfügbaren Studien zu WIDERLEGEN.

HYPOTHESE:
Titel: "${hypothesis.title}"
Beschreibung: ${hypothesis.description}
Begründung: ${hypothesis.rationale}

VERFÜGBARE STUDIEN (nummeriert [1]–[${slicedPapers.length}]):
${paperContext}

Bewerte streng nach diesen Kategorien:

- **challenged**: Du hast konkrete Gegenbeweise in den Papers gefunden.
- **needs_research**: Die vorhandenen Papers sind unvollständig. Definiere einen konkreten Rechercheauftrag.
- **open**: Keine Widerlegung möglich, aber auch keine volle Bestätigung. Hypothese bleibt offen.

WICHTIG für das "argument"-Feld:
- Nenne Papers immer beim vollen Titel (z.B. 'Die Studie "Sex differences in clinical characteristics..." zeigt...')
- Schreibe für Endnutzer verständlich — KEINE technischen IDs, KEINE Nummern wie "[1]" im Fließtext

WICHTIG für das "paperNumbers"-Feld:
- Gib die Nummern (1-basiert) der relevanten Papers als Integer-Array an (z.B. [2, 5])
- Leer-Array wenn keine Papers direkt relevant sind

Antworte NUR mit diesem JSON (kein Markdown):
{
  "verdict": "challenged|open|needs_research",
  "argument": "Deine Begründung auf Deutsch (3-5 Sätze), Paper-Referenzen nur per vollem Titel",
  "researchQuery": "Nur bei needs_research: Konkreter Suchauftrag für weitere Papers (1-2 Sätze)",
  "paperNumbers": [1, 2]
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";

  // Strip markdown code fences the model may emit despite instructions
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: { verdict: CriticVerdict; argument: string; researchQuery?: string; paperNumbers?: number[] } | null = null;

  // Attempt 1: direct parse
  try {
    parsed = JSON.parse(text);
  } catch {
    // Attempt 2: extract first {...} block (handles leading/trailing prose)
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // Attempt 3: sanitize literal control chars inside JSON string values and retry
        // Root cause of "Expected ',' or '}' at position N": LLM writes multi-sentence
        // text with bare newlines inside a JSON string value, which is invalid per spec.
        try {
          const sanitized = match[0].replace(
            /"((?:[^"\\]|\\.)*)"/gs,
            (_m: string, inner: string) =>
              `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`
          );
          parsed = JSON.parse(sanitized);
        } catch {
          // fallthrough to safe default
        }
      }
    }
  }

  if (!parsed) {
    console.warn(`JSON parse failed for hypothesis "${hypothesis.title.slice(0, 50)}". Response: ${rawText.slice(0, 300)}`);
    return { verdict: "open", argument: "Parse-Fehler — manuelle Prüfung nötig", paperIds: [] };
  }

  // Map 1-based paper numbers back to real Firestore IDs
  const paperIds = (parsed.paperNumbers ?? [])
    .filter((n) => typeof n === "number" && n >= 1 && n <= slicedPapers.length)
    .map((n) => slicedPapers[n - 1].id);

  return {
    verdict: parsed.verdict,
    argument: parsed.argument,
    researchQuery: parsed.researchQuery,
    paperIds,
  };
}

async function main() {
  console.log("=== Hypothesis Critic ===");
  initLogger("hypothesis-critic" as any);
  await logStart("Prüfe und widerlege offene Hypothesen");

  const snap = await db
    .collection("hypotheses")
    .where("status", "==", "pending_review")
    .orderBy("generatedAt", "asc")
    .limit(10)
    .get();

  if (snap.empty) {
    await logComplete("Keine offenen Hypothesen zu prüfen", 0);
    console.log("No pending hypotheses.");
    return;
  }

  console.log(`Found ${snap.size} hypothesis/hypotheses to critique.`);
  await logEvent("step" as any, `${snap.size} Hypothesen zu prüfen`);

  const papers = await loadPapersForHypothesis([]);
  await logEvent("step" as any, `${papers.length} Papers als Wissensbasis geladen`);

  let challenged = 0, open = 0, needsResearch = 0;

  for (const doc of snap.docs) {
    const h = { id: doc.id, ...doc.data() } as any;
    console.log(`\nCritiquing: "${h.title.slice(0, 70)}"`);

    let result: CriticResult;
    try {
      result = await critiqueHypothesis(h, papers);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ critiqueHypothesis threw: ${msg}`);
      await logEvent("step" as any, `[FEHLER] ${h.title.slice(0, 70)}`, msg.slice(0, 120));
      open++;
      continue;
    }
    console.log(`  → Verdict: ${result.verdict}`);
    console.log(`  → ${result.argument.slice(0, 100)}`);

    // Update hypothesis
    await doc.ref.update({
      status: result.verdict,
      criticArgument: result.argument,
      criticPaperIds: result.paperIds,
      reviewedAt: Timestamp.now(),
      reviewedBy: "hypothesis-critic",
    });

    await logEvent(
      "step" as any,
      `[${result.verdict.toUpperCase()}] ${h.title.slice(0, 70)}`,
      result.argument.slice(0, 120)
    );

    // Create research task if needed
    if (result.verdict === "needs_research" && result.researchQuery) {
      await db.collection("research_tasks").add({
        hypothesisId: doc.id,
        hypothesisTitle: h.title,
        query: result.researchQuery,
        reason: result.argument,
        status: "open",
        createdAt: Timestamp.now(),
        createdBy: "hypothesis-critic",
      });
      await logEvent(
        "step" as any,
        `📋 Rechercheauftrag erstellt`,
        result.researchQuery.slice(0, 120)
      );
      console.log(`  → Research task created: ${result.researchQuery.slice(0, 80)}`);
      needsResearch++;
    } else if (result.verdict === "challenged") {
      challenged++;
    } else {
      open++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  const summary = `${challenged} widerlegt, ${open} offen, ${needsResearch} Rechercheaufträge`;
  await logComplete(summary, snap.size);
  console.log(`\nDone. ${summary}`);
}

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch {}
  process.exit(1);
});

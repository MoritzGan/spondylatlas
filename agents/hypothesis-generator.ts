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

const MAX_PAPERS = 30;
const MAX_HYPOTHESES_PER_RUN = 5;

interface Paper {
  id: string;
  title: string;
  abstract: string;
  summary: string;
  evidenceLevel?: string;
  tags?: string[];
  publishedAt?: Timestamp;
}

interface Hypothesis {
  title: string;
  description: string;
  rationale: string;
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
    tags: d.data().tags ?? [],
  }));
}

async function getExistingHypothesisTitles(): Promise<Set<string>> {
  const snap = await db.collection("hypotheses").get();
  return new Set(snap.docs.map((d) => d.data().title as string));
}

async function generateHypotheses(papers: Paper[]): Promise<
  { title: string; description: string; rationale: string; paperIds: string[] }[]
> {
  const paperSummaries = papers
    .slice(0, 20)
    .map(
      (p, i) =>
        `[${i + 1}] ID:${p.id}\nTitel: ${p.title}\nEvidenz: ${p.evidenceLevel ?? "?"}\nZusammenfassung: ${(p.summary || p.abstract).slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Du bist ein Wissenschaftler, der sich auf axiale Spondyloarthritis (Morbus Bechterew) spezialisiert hat.

Analysiere die folgenden ${papers.length} aktuellen Studien und leite daraus ${MAX_HYPOTHESES_PER_RUN} neue, spannende wissenschaftliche Hypothesen ab.

Anforderungen:
- Hypothesen müssen NEU und noch NICHT explizit in den Papers bewiesen sein
- Sie sollen testbare Zusammenhänge zwischen Faktoren beschreiben
- Formuliere auf Deutsch, klar und präzise
- Beziehe dich konkret auf die Paper-IDs als Basis

Studien:
${paperSummaries}

Antworte NUR mit diesem JSON-Array (kein Markdown):
[
  {
    "title": "Kurzer Hypothesentitel (max 80 Zeichen)",
    "description": "Vollständige Hypothese in 2-3 Sätzen",
    "rationale": "Warum legen die Paper das nahe? Welche Paper-IDs stützen das?",
    "paperIds": ["id1", "id2"]
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON array
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    console.error("Failed to parse hypotheses:", text.slice(0, 200));
    return [];
  }
}

async function main() {
  console.log("=== Hypothesis Generator ===");
  initLogger("hypothesis-generator" as any);
  await logStart("Generiere neue Hypothesen aus aktuellen Papers");

  const papers = await loadRecentPapers();
  await logEvent("step" as any, `${papers.length} Papers geladen`);

  if (papers.length < 5) {
    await logComplete("Zu wenige Papers für Hypothesen-Generierung", 0);
    console.log("Not enough papers yet.");
    return;
  }

  const existing = await getExistingHypothesisTitles();
  console.log(`Generating hypotheses from ${papers.length} papers...`);

  const hypotheses = await generateHypotheses(papers);
  let saved = 0;

  for (const h of hypotheses) {
    if (existing.has(h.title)) {
      console.log(`  → Duplicate skipped: ${h.title.slice(0, 60)}`);
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
    await logEvent("step" as any, `Hypothese gespeichert: ${h.title.slice(0, 80)}`, h.description.slice(0, 120));
    console.log(`  ✓ ${h.title.slice(0, 70)}`);
    saved++;
  }

  await logComplete(`${saved} neue Hypothesen generiert`, saved);
  console.log(`\nDone. ${saved} hypotheses saved.`);
}

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch {}
  process.exit(1);
});

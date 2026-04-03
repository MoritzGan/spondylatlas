import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";
import { jsonrepair } from "jsonrepair";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Paper {
  id: string;
  title: string;
  abstract: string;
  summary: string;
  authors?: string[];
  evidenceLevel?: string;
  doi?: string;
  url?: string;
}

interface Reference {
  authors: string;
  title: string;
  source: string;
  year: string;
  doi?: string;
  url?: string;
}

interface MetaStudySections {
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
}

interface ReviewRound {
  round: number;
  reviewedAt: Timestamp;
  verdict: "revision_needed" | "approved" | "major_issues";
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  methodologyCritique: string;
  statisticalCritique: string;
  citationCheck: string;
}

interface MetaStudyDraft {
  title: string;
  sections: MetaStudySections;
  references: Reference[];
  searchStrategy: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
}

async function loadPapersForHypothesis(paperIds: string[]): Promise<Paper[]> {
  if (paperIds.length === 0) return [];
  // Firestore "in" queries support max 30 elements
  const chunks: string[][] = [];
  for (let i = 0; i < paperIds.length; i += 30) {
    chunks.push(paperIds.slice(i, i + 30));
  }
  const papers: Paper[] = [];
  for (const chunk of chunks) {
    const snap = await db
      .collection("papers")
      .where("__name__", "in", chunk)
      .get();
    for (const d of snap.docs) {
      papers.push({
        id: d.id,
        title: d.data().title ?? "",
        abstract: d.data().abstract ?? "",
        summary: d.data().summary ?? "",
        authors: d.data().authors ?? [],
        evidenceLevel: d.data().evidenceLevel,
        doi: d.data().doi,
        url: d.data().url,
      });
    }
  }
  return papers;
}

async function findEligibleHypotheses(): Promise<
  { id: string; title: string; description: string; rationale: string; paperIds: string[] }[]
> {
  const hypoSnap = await db
    .collection("hypotheses")
    .where("status", "in", ["open", "challenged"])
    .orderBy("generatedAt", "desc")
    .limit(50)
    .get();

  const eligible: { id: string; title: string; description: string; rationale: string; paperIds: string[] }[] = [];

  for (const doc of hypoSnap.docs) {
    const data = doc.data();
    const paperIds = Array.isArray(data.paperIds) ? data.paperIds as string[] : [];
    if (paperIds.length < 3) continue;

    // Check if a meta-study already exists for this hypothesis
    const existing = await db
      .collection("meta_studies")
      .where("hypothesisId", "==", doc.id)
      .limit(1)
      .get();
    if (!existing.empty) continue;

    eligible.push({
      id: doc.id,
      title: data.title as string,
      description: data.description as string,
      rationale: data.rationale as string,
      paperIds,
    });
  }

  return eligible;
}

async function findRevisionDrafts(): Promise<
  { docId: string; hypothesisId: string; title: string; sections: MetaStudySections; reviews: ReviewRound[]; paperIds: string[] }[]
> {
  const snap = await db
    .collection("meta_studies")
    .where("status", "==", "revision")
    .limit(5)
    .get();

  return snap.docs.map((d) => ({
    docId: d.id,
    hypothesisId: d.data().hypothesisId as string,
    title: d.data().title as string,
    sections: d.data().sections as MetaStudySections,
    reviews: (d.data().reviews ?? []) as ReviewRound[],
    paperIds: (d.data().paperIds ?? []) as string[],
  }));
}

async function writeNewMetaStudy(
  hypothesis: { id: string; title: string; description: string; rationale: string; paperIds: string[] },
  papers: Paper[]
): Promise<MetaStudyDraft> {
  const paperContext = papers
    .map(
      (p, i) =>
        `[${i + 1}] Titel: ${p.title}\nAutoren: ${(p.authors ?? []).join(", ") || "k.A."}\nEvidenzlevel: ${p.evidenceLevel ?? "?"}\nDOI: ${p.doi ?? "k.A."}\nZusammenfassung: ${(p.summary || p.abstract).slice(0, 600)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Du bist ein akademischer Wissenschaftler, der eine Meta-Studie / Systematic Review zu axialer Spondyloarthritis (Morbus Bechterew) verfasst.

HYPOTHESE:
Titel: "${hypothesis.title}"
Beschreibung: ${hypothesis.description}
Begründung: ${hypothesis.rationale}

VERFÜGBARE STUDIEN (${papers.length} Papers):
${paperContext}

Schreibe eine vollständige Meta-Studie im PRISMA-Stil. Die Studie soll 3000–5000 Wörter umfassen und auf Deutsch verfasst sein (Fachbegriffe auf Englisch beibehalten).

Anforderungen:
- Strukturiertes Abstract (Hintergrund, Methoden, Ergebnisse, Schlussfolgerung)
- Einleitung: Hintergrund, Forschungsfrage, klinische Relevanz
- Methoden: Suchstrategie, Ein-/Ausschlusskriterien nach PICO, Qualitätsbewertung
- Ergebnisse: Zusammenfassung der Evidenz, Evidenzgrade nach Oxford CEBM
- Diskussion: Interpretation, Limitationen, Vergleich mit bestehender Literatur
- Schlussfolgerung: Kernaussagen, Forschungsbedarf
- Vancouver-Zitierstil (nummeriert [1], [2], etc.)
- Akademische Sprache: "suggests" statt "proves", Konjunktiv wo angemessen
- Keine übertriebenen Schlussfolgerungen

Antworte NUR mit diesem JSON (kein Markdown):
{
  "title": "Akademischer Titel der Meta-Studie",
  "sections": {
    "abstract": "Strukturiertes Abstract...",
    "introduction": "Einleitung...",
    "methods": "Methoden...",
    "results": "Ergebnisse...",
    "discussion": "Diskussion...",
    "conclusion": "Schlussfolgerung..."
  },
  "references": [
    {
      "authors": "Nachname AB, Nachname CD",
      "title": "Originaltitel der Studie",
      "source": "Journal Name. Jahr;Vol(Issue):Pages",
      "year": "2024",
      "doi": "10.xxxx/xxxxx"
    }
  ],
  "searchStrategy": "Beschreibung der Suchstrategie",
  "inclusionCriteria": ["Kriterium 1", "Kriterium 2"],
  "exclusionCriteria": ["Kriterium 1", "Kriterium 2"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(text) as MetaStudyDraft;
  } catch {
    try {
      return JSON.parse(jsonrepair(text)) as MetaStudyDraft;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(jsonrepair(match[0])) as MetaStudyDraft; } catch { /* fall through */ }
      }
      throw new Error(`Failed to parse meta-study draft: ${text.slice(0, 200)}`);
    }
  }
}

async function reviseMetaStudy(
  draft: { title: string; sections: MetaStudySections; reviews: ReviewRound[]; paperIds: string[] },
  papers: Paper[]
): Promise<MetaStudyDraft> {
  const latestReview = draft.reviews[draft.reviews.length - 1];

  const paperContext = papers
    .map(
      (p, i) =>
        `[${i + 1}] Titel: ${p.title}\nAutoren: ${(p.authors ?? []).join(", ") || "k.A."}\nEvidenzlevel: ${p.evidenceLevel ?? "?"}\nZusammenfassung: ${(p.summary || p.abstract).slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const feedbackText = `
Stärken: ${latestReview.strengths.join("; ")}
Schwächen: ${latestReview.weaknesses.join("; ")}
Vorschläge: ${latestReview.suggestions.join("; ")}
Methodenkritik: ${latestReview.methodologyCritique}
Statistikkritik: ${latestReview.statisticalCritique}
Zitationsprüfung: ${latestReview.citationCheck}`;

  const currentText = Object.entries(draft.sections)
    .map(([key, val]) => `## ${key}\n${val}`)
    .join("\n\n");

  const prompt = `Du bist ein akademischer Wissenschaftler, der eine Meta-Studie überarbeitet.

AKTUELLER ENTWURF:
${currentText}

REVIEWER-FEEDBACK (Runde ${latestReview.round}):
${feedbackText}

VERFÜGBARE STUDIEN:
${paperContext}

Überarbeite die Meta-Studie basierend auf dem Reviewer-Feedback. Behalte die Stärken bei und adressiere alle Schwächen und Vorschläge systematisch.

Antworte NUR mit diesem JSON (kein Markdown):
{
  "title": "Überarbeiteter Titel",
  "sections": {
    "abstract": "...",
    "introduction": "...",
    "methods": "...",
    "results": "...",
    "discussion": "...",
    "conclusion": "..."
  },
  "references": [{"authors": "...", "title": "...", "source": "...", "year": "...", "doi": "..."}],
  "searchStrategy": "...",
  "inclusionCriteria": ["..."],
  "exclusionCriteria": ["..."]
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(text) as MetaStudyDraft;
  } catch {
    try {
      return JSON.parse(jsonrepair(text)) as MetaStudyDraft;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(jsonrepair(match[0])) as MetaStudyDraft; } catch { /* fall through */ }
      }
      throw new Error(`Failed to parse revised meta-study: ${text.slice(0, 200)}`);
    }
  }
}

function countWords(sections: MetaStudySections): number {
  return Object.values(sections).join(" ").split(/\s+/).length;
}

async function main() {
  console.log("=== Meta-Study Writer ===");
  initLogger("meta-study-writer" as AgentName);
  await logStart("Suche nach Hypothesen für Meta-Studien");

  // Priority 1: Revise existing drafts with reviewer feedback
  const revisions = await findRevisionDrafts();
  if (revisions.length > 0) {
    await logEvent("step" as EventType, `${revisions.length} Revision(en) zu überarbeiten`);
    let revised = 0;

    for (const draft of revisions) {
      console.log(`\nRevising: "${draft.title.slice(0, 70)}"`);
      const papers = await loadPapersForHypothesis(draft.paperIds);

      try {
        const result = await reviseMetaStudy(draft, papers);
        await db.collection("meta_studies").doc(draft.docId).update({
          title: result.title,
          sections: result.sections,
          references: result.references ?? [],
          searchStrategy: result.searchStrategy ?? "",
          inclusionCriteria: result.inclusionCriteria ?? [],
          exclusionCriteria: result.exclusionCriteria ?? [],
          status: "draft",
          wordCount: countWords(result.sections),
          updatedAt: Timestamp.now(),
        });
        await logEvent("step" as EventType, `Revision abgeschlossen: ${result.title.slice(0, 80)}`);
        console.log(`  ✓ Revised: ${result.title.slice(0, 70)}`);
        revised++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ Revision failed: ${msg}`);
        await logEvent("step" as EventType, `[FEHLER] Revision: ${draft.title.slice(0, 60)}`, msg.slice(0, 120));
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    await logComplete(`${revised} Meta-Studie(n) überarbeitet`, revised);
    console.log(`\nDone. ${revised} revision(s) completed.`);
    return;
  }

  // Priority 2: Write new meta-studies
  const eligible = await findEligibleHypotheses();
  await logEvent("step" as EventType, `${eligible.length} geeignete Hypothese(n) gefunden`);

  if (eligible.length === 0) {
    await logComplete("Keine geeigneten Hypothesen für neue Meta-Studien", 0);
    console.log("No eligible hypotheses found.");
    return;
  }

  // Process up to 2 per run
  const toProcess = eligible.slice(0, 2);
  let saved = 0;

  for (const hypothesis of toProcess) {
    console.log(`\nWriting meta-study for: "${hypothesis.title.slice(0, 70)}"`);
    const papers = await loadPapersForHypothesis(hypothesis.paperIds);

    if (papers.length < 3) {
      console.log(`  → Skipping: only ${papers.length} papers found`);
      continue;
    }

    try {
      const draft = await writeNewMetaStudy(hypothesis, papers);
      await db.collection("meta_studies").add({
        hypothesisId: hypothesis.id,
        title: draft.title,
        status: "draft",
        currentRound: 1,
        maxRounds: 3,
        sections: draft.sections,
        references: draft.references ?? [],
        paperIds: hypothesis.paperIds,
        searchStrategy: draft.searchStrategy ?? "",
        inclusionCriteria: draft.inclusionCriteria ?? [],
        exclusionCriteria: draft.exclusionCriteria ?? [],
        reviews: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: null,
        generatedBy: "meta-study-writer",
        wordCount: countWords(draft.sections),
        language: "de",
      });

      await logEvent("step" as EventType, `Meta-Studie erstellt: ${draft.title.slice(0, 80)}`);
      console.log(`  ✓ ${draft.title.slice(0, 70)} (${countWords(draft.sections)} Wörter)`);
      saved++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed: ${msg}`);
      await logEvent("step" as EventType, `[FEHLER] ${hypothesis.title.slice(0, 60)}`, msg.slice(0, 120));
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  await logComplete(`${saved} neue Meta-Studie(n) erstellt`, saved);
  console.log(`\nDone. ${saved} meta-studies created.`);
}

// Import types used with casts
type AgentName = import("./lib/logger.js").AgentName;
type EventType = import("./lib/logger.js").EventType;

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch { /* logger may fail */ }
  process.exit(1);
});

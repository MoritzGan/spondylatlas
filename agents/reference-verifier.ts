import "dotenv/config";
import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";
import type { AgentName, EventType } from "./lib/logger.js";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VerificationStatus = "verified" | "unverifiable" | "title_mismatch" | "doi_mismatch" | "hallucinated";

interface ReferenceVerification {
  refIndex: number;
  claimedTitle: string;
  claimedDoi?: string;
  claimedAuthors?: string;
  status: VerificationStatus;
  matchedPaperId?: string;
  matchedTitle?: string;
  issues: string[];
}

interface ClaimVerification {
  section: string;
  claim: string;
  referencedPaperTitle: string;
  supportedByAbstract: boolean;
  explanation: string;
}

interface VerificationReport {
  metaStudyId: string;
  totalReferences: number;
  verified: number;
  unverifiable: number;
  mismatched: number;
  hallucinated: number;
  referenceDetails: ReferenceVerification[];
  claimChecks: ClaimVerification[];
  overallScore: number; // 0-100
  verifiedAt: Timestamp;
  verifiedBy: "reference-verifier";
}

interface MetaStudyReference {
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

// ---------------------------------------------------------------------------
// Firestore queries
// ---------------------------------------------------------------------------

async function findDraftsToVerify(): Promise<
  { docId: string; title: string; sections: MetaStudySections; references: MetaStudyReference[]; paperIds: string[] }[]
> {
  // Verify drafts that have status "draft" but no verification report yet
  const snap = await db
    .collection("meta_studies")
    .where("status", "==", "draft")
    .limit(5)
    .get();

  const drafts: { docId: string; title: string; sections: MetaStudySections; references: MetaStudyReference[]; paperIds: string[] }[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    // Skip if already verified in this round
    if (data.verificationReport && data.verificationReport.verifiedAt) {
      const verifiedAt = data.verificationReport.verifiedAt.toDate();
      const updatedAt = data.updatedAt?.toDate() ?? new Date(0);
      // Only re-verify if content changed after last verification
      if (verifiedAt > updatedAt) continue;
    }

    drafts.push({
      docId: doc.id,
      title: data.title as string,
      sections: data.sections as MetaStudySections,
      references: (data.references ?? []) as MetaStudyReference[],
      paperIds: (data.paperIds ?? []) as string[],
    });
  }

  return drafts;
}

async function loadAllPapers(): Promise<
  Map<string, { id: string; title: string; abstract: string; authors: string[]; doi?: string; evidenceLevel?: string }>
> {
  const snap = await db
    .collection("papers")
    .where("status", "==", "published")
    .get();

  const papers = new Map<string, { id: string; title: string; abstract: string; authors: string[]; doi?: string; evidenceLevel?: string }>();

  for (const doc of snap.docs) {
    const d = doc.data();
    papers.set(doc.id, {
      id: doc.id,
      title: d.title ?? "",
      abstract: d.abstract ?? "",
      authors: d.authors ?? [],
      doi: d.doi,
      evidenceLevel: d.evidenceLevel,
    });
  }

  return papers;
}

// ---------------------------------------------------------------------------
// Reference matching
// ---------------------------------------------------------------------------

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1.0;

  // Jaccard similarity on word sets
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(nb.split(" ").filter((w) => w.length > 2));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

function verifyReference(
  ref: MetaStudyReference,
  refIndex: number,
  papers: Map<string, { id: string; title: string; abstract: string; authors: string[]; doi?: string; evidenceLevel?: string }>
): ReferenceVerification {
  const issues: string[] = [];

  // 1. Try DOI match first (strongest signal)
  if (ref.doi) {
    for (const [, paper] of papers) {
      if (paper.doi && paper.doi.toLowerCase() === ref.doi.toLowerCase()) {
        // DOI matches — verify title consistency
        const sim = titleSimilarity(ref.title, paper.title);
        if (sim < 0.5) {
          issues.push(`DOI stimmt, aber Titel weicht ab (Similarity: ${(sim * 100).toFixed(0)}%)`);
          return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "title_mismatch", matchedPaperId: paper.id, matchedTitle: paper.title, issues };
        }
        return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "verified", matchedPaperId: paper.id, matchedTitle: paper.title, issues };
      }
    }
  }

  // 2. Try title match
  let bestMatch: { id: string; title: string; similarity: number } | null = null;
  for (const [, paper] of papers) {
    const sim = titleSimilarity(ref.title, paper.title);
    if (sim > (bestMatch?.similarity ?? 0)) {
      bestMatch = { id: paper.id, title: paper.title, similarity: sim };
    }
  }

  if (bestMatch && bestMatch.similarity >= 0.7) {
    // Good title match
    if (ref.doi && bestMatch.similarity < 1.0) {
      // Has DOI but didn't match by DOI — check if paper has no DOI stored
      const matchedPaper = papers.get(bestMatch.id);
      if (matchedPaper?.doi && matchedPaper.doi.toLowerCase() !== ref.doi.toLowerCase()) {
        issues.push(`Titel passt, aber DOI weicht ab: claimed=${ref.doi}, actual=${matchedPaper.doi}`);
        return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "doi_mismatch", matchedPaperId: bestMatch.id, matchedTitle: bestMatch.title, issues };
      }
    }
    return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "verified", matchedPaperId: bestMatch.id, matchedTitle: bestMatch.title, issues };
  }

  if (bestMatch && bestMatch.similarity >= 0.4) {
    issues.push(`Schwache Titelübereinstimmung (${(bestMatch.similarity * 100).toFixed(0)}%) — möglicherweise halluziniert oder paraphrasiert`);
    return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "unverifiable", matchedPaperId: bestMatch.id, matchedTitle: bestMatch.title, issues };
  }

  // No match found — likely hallucinated
  issues.push("Kein passendes Paper in der Datenbank gefunden");
  return { refIndex, claimedTitle: ref.title, claimedDoi: ref.doi, claimedAuthors: ref.authors, status: "hallucinated", issues };
}

// ---------------------------------------------------------------------------
// Claim verification via LLM
// ---------------------------------------------------------------------------

async function verifyClaimsAgainstSources(
  sections: MetaStudySections,
  references: MetaStudyReference[],
  verifiedRefs: ReferenceVerification[],
  papers: Map<string, { id: string; title: string; abstract: string; authors: string[]; doi?: string; evidenceLevel?: string }>
): Promise<ClaimVerification[]> {
  // Build context of verified papers with their abstracts
  const verifiedPapers = verifiedRefs
    .filter((r) => r.status === "verified" && r.matchedPaperId)
    .slice(0, 10) // Limit for token budget
    .map((r) => {
      const paper = papers.get(r.matchedPaperId!);
      if (!paper) return null;
      return `[${r.refIndex + 1}] "${paper.title}"\nAbstract: ${paper.abstract.slice(0, 500)}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!verifiedPapers) return [];

  // Extract results and discussion sections — most likely to contain claims
  const textToCheck = `ERGEBNISSE:\n${sections.results}\n\nDISKUSSION:\n${sections.discussion}`.slice(0, 4000);

  const prompt = `Du bist ein wissenschaftlicher Faktenprüfer. Prüfe ob die Behauptungen in der Meta-Studie durch die Quellen gestützt werden.

META-STUDIE (Ergebnisse + Diskussion):
${textToCheck}

VERIFIZIERTE QUELLEN MIT ABSTRACTS:
${verifiedPapers}

Identifiziere bis zu 5 spezifische Behauptungen in der Meta-Studie, die sich auf nummerierte Referenzen beziehen. Prüfe für jede, ob der Abstract der zitierten Studie die Behauptung tatsächlich stützt.

Antworte NUR mit JSON (kein Markdown):
[
  {
    "section": "results|discussion",
    "claim": "Die spezifische Behauptung aus der Meta-Studie (max 100 Zeichen)",
    "referencedPaperTitle": "Titel des zitierten Papers",
    "supportedByAbstract": true/false,
    "explanation": "Kurze Begründung (1-2 Sätze)"
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
  const text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(text) as ClaimVerification[];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]) as ClaimVerification[]; } catch { /* fall through */ }
    }
    console.warn("  Could not parse claim verification response");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Reference Verifier ===");
  initLogger("reference-verifier" as AgentName);
  await logStart("Verifiziere Referenzen in Meta-Studien-Entwürfen");

  const drafts = await findDraftsToVerify();

  if (drafts.length === 0) {
    await logComplete("Keine Entwürfe zu verifizieren", 0);
    console.log("No drafts to verify.");
    return;
  }

  console.log(`Found ${drafts.length} draft(s) to verify.`);
  await logEvent("step" as EventType, `${drafts.length} Entwurf/Entwürfe zu verifizieren`);

  // Load all papers once for matching
  const allPapers = await loadAllPapers();
  console.log(`Loaded ${allPapers.size} papers for reference matching.`);

  let verified = 0;

  for (const draft of drafts) {
    console.log(`\nVerifying: "${draft.title.slice(0, 70)}" (${draft.references.length} references)`);

    // Step 1: Verify each reference against Firestore papers
    const refResults: ReferenceVerification[] = draft.references.map((ref, i) =>
      verifyReference(ref, i, allPapers)
    );

    const stats = {
      verified: refResults.filter((r) => r.status === "verified").length,
      unverifiable: refResults.filter((r) => r.status === "unverifiable").length,
      mismatched: refResults.filter((r) => r.status === "title_mismatch" || r.status === "doi_mismatch").length,
      hallucinated: refResults.filter((r) => r.status === "hallucinated").length,
    };

    console.log(`  References: ${stats.verified} verified, ${stats.unverifiable} unverifiable, ${stats.mismatched} mismatched, ${stats.hallucinated} hallucinated`);

    // Step 2: Verify claims against source abstracts (only if we have verified refs)
    let claimChecks: ClaimVerification[] = [];
    if (stats.verified >= 2) {
      try {
        claimChecks = await verifyClaimsAgainstSources(draft.sections, draft.references, refResults, allPapers);
        const supported = claimChecks.filter((c) => c.supportedByAbstract).length;
        console.log(`  Claims: ${supported}/${claimChecks.length} supported by source abstracts`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  Claim verification failed: ${msg}`);
      }
    }

    // Calculate overall score (0-100)
    const total = draft.references.length;
    const refScore = total > 0 ? (stats.verified / total) * 70 : 0; // 70% weight on references
    const claimScore = claimChecks.length > 0
      ? (claimChecks.filter((c) => c.supportedByAbstract).length / claimChecks.length) * 30
      : 15; // 30% weight on claims, default 50% if no claims checked
    const overallScore = Math.round(refScore + claimScore);

    const report: VerificationReport = {
      metaStudyId: draft.docId,
      totalReferences: total,
      verified: stats.verified,
      unverifiable: stats.unverifiable,
      mismatched: stats.mismatched,
      hallucinated: stats.hallucinated,
      referenceDetails: refResults,
      claimChecks,
      overallScore,
      verifiedAt: Timestamp.now(),
      verifiedBy: "reference-verifier",
    };

    // Store verification report on the meta-study document
    await db.collection("meta_studies").doc(draft.docId).update({
      verificationReport: report,
    });

    await logEvent(
      "step" as EventType,
      `Verifiziert: ${draft.title.slice(0, 60)} — Score: ${overallScore}/100`,
      `${stats.verified}/${total} Refs verifiziert, ${stats.hallucinated} halluziniert`
    );

    // If hallucination rate is high, flag for immediate attention
    if (total > 0 && stats.hallucinated / total > 0.3) {
      console.log(`  WARNING: High hallucination rate (${((stats.hallucinated / total) * 100).toFixed(0)}%) — flagging for revision`);
      await logEvent(
        "step" as EventType,
        `WARNUNG: Hohe Halluzinationsrate bei "${draft.title.slice(0, 50)}"`,
        `${stats.hallucinated}/${total} Referenzen nicht verifizierbar`
      );
    }

    verified++;
    await new Promise((r) => setTimeout(r, 500));
  }

  await logComplete(`${verified} Meta-Studie(n) verifiziert`, verified);
  console.log(`\nDone. ${verified} meta-studies verified.`);
}

main().catch(async (err) => {
  console.error(err);
  try { await logError(err.message); } catch { /* logger may fail */ }
  process.exit(1);
});

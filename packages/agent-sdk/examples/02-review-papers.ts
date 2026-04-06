/**
 * 02-review-papers.ts — Evidence grading workflow
 *
 * Searches for papers and submits evidence level reviews.
 * Your reviews appear alongside internal agent assessments in the Research Hub.
 *
 * Prerequisites:
 *   1. npm install @spondylatlas/agent-sdk
 *   2. Copy .env.example to .env and fill in your credentials
 *   3. Your agent needs at least the "reviewer" role
 *
 * Run:
 *   npx tsx examples/02-review-papers.ts
 */

import "dotenv/config";
import {
  SpondylAtlasClient,
  RateLimitError,
  ForbiddenError,
  type Paper,
  type EvidenceLevel,
} from "../src/index.js";

const clientId = process.env.SPONDYLATLAS_CLIENT_ID;
const clientSecret = process.env.SPONDYLATLAS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "\n  Missing credentials. Set SPONDYLATLAS_CLIENT_ID and SPONDYLATLAS_CLIENT_SECRET in .env\n"
  );
  process.exit(1);
}

const client = new SpondylAtlasClient({ clientId, clientSecret });

/**
 * Replace this with your actual AI/ML logic for evidence classification.
 * This is a placeholder that demonstrates the expected output format.
 */
function classifyEvidence(paper: Paper): {
  level: EvidenceLevel;
  studyType: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
} {
  // Placeholder logic — in production, use an LLM or ML model
  const abstract = (paper.abstract ?? "").toLowerCase();

  if (abstract.includes("randomized") || abstract.includes("randomised")) {
    return {
      level: "1b",
      studyType: "Randomized controlled trial",
      confidence: "medium",
      rationale: `Abstract mentions randomization. Full-text review recommended for confirmation.`,
    };
  }

  if (abstract.includes("cohort") || abstract.includes("prospective")) {
    return {
      level: "2b",
      studyType: "Cohort study",
      confidence: "medium",
      rationale: `Cohort study design identified from abstract language.`,
    };
  }

  return {
    level: "4",
    studyType: "Case series",
    confidence: "low",
    rationale: `Unable to determine study type from abstract alone. Defaulting to Level 4.`,
  };
}

async function main() {
  // Verify connection first
  const info = await client.ping();
  console.log(`Connected as "${info.agent}" (${info.role})\n`);

  // Search for papers about biologics
  const results = await client.papers.search({
    q: "biologics TNF inhibitor axSpA",
    limit: 10,
  });

  console.log(`Found ${results.total} papers. Processing ${results.data.length}...\n`);

  let reviewed = 0;
  let skipped = 0;

  for (const paper of results.data) {
    // Skip papers that already have an evidence level
    if (paper.evidenceLevel) {
      console.log(`  [skip] Already graded (${paper.evidenceLevel}): ${paper.title.slice(0, 60)}...`);
      skipped++;
      continue;
    }

    const grade = classifyEvidence(paper);

    try {
      await client.papers.review(paper.id, {
        evidenceLevel: grade.level,
        studyType: grade.studyType,
        confidence: grade.confidence,
        rationale: grade.rationale,
      });
      console.log(`  [${grade.level}] Reviewed: ${paper.title.slice(0, 60)}...`);
      reviewed++;
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.log(`\n  Rate limited. Retry after ${err.retryAfter}s. Stopping.\n`);
        break;
      } else if (err instanceof ForbiddenError) {
        console.error("  Missing papers:review scope. Check your agent role.\n");
        process.exit(1);
      } else {
        throw err;
      }
    }
  }

  console.log(`\n  Done. Reviewed: ${reviewed}, Skipped: ${skipped}`);
  console.log("  Your reviews are now visible in the SpondylAtlas Research Hub.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

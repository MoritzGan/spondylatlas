import { initLogger, logStart, logComplete, logError, logEvent } from "./lib/logger.js";
import "dotenv/config";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

const serviceAccount = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ?? fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf-8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type EvidenceLevel = "1a" | "1b" | "2a" | "2b" | "3" | "4" | "5";

// ---------------------------------------------------------------------------
// Heuristic cross-validation for evidence grades
// ---------------------------------------------------------------------------

interface HeuristicCheck {
  passed: boolean;
  flag?: string;
}

function crossValidateGrade(level: string, studyType: string, abstract: string): HeuristicCheck {
  const text = abstract.toLowerCase();

  // RCT claimed (1b) but no randomization language
  if ((level === "1b" || studyType.toLowerCase().includes("rct")) &&
      !text.match(/random(iz|is)/i) && !text.includes("placebo") && !text.includes("double-blind")) {
    return { passed: false, flag: "RCT/1b claimed but no randomization/placebo/blinding language in abstract" };
  }

  // Systematic review claimed (1a/2a) but no systematic language
  if ((level === "1a" || level === "2a") &&
      !text.includes("systematic") && !text.includes("meta-analysis") && !text.includes("meta analysis") &&
      !text.includes("prisma") && !text.includes("search strategy")) {
    return { passed: false, flag: "Systematic review claimed but no systematic/meta-analysis language in abstract" };
  }

  // Case report/expert opinion (5) but mentions cohort or large sample
  if (level === "5" &&
      (text.includes("cohort") || text.match(/n\s*=\s*\d{3,}/) || text.includes("population-based"))) {
    return { passed: false, flag: "Level 5 (expert opinion) claimed but abstract suggests larger study design" };
  }

  // Cohort study (2b) but mentions randomization
  if (level === "2b" && text.match(/random(iz|is)/i) && text.includes("placebo")) {
    return { passed: false, flag: "Cohort (2b) claimed but abstract describes randomization with placebo" };
  }

  return { passed: true };
}

async function gradeEvidence(title: string, abstract: string) {
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Bewerte diese Studie zu Morbus Bechterew nach Oxford CEBM Evidence Levels:
1a=Sys.Review RCTs, 1b=Einzel-RCT, 2a=Sys.Review Kohorten, 2b=Kohortenstudie, 3=Fall-Kontroll, 4=Fallserie, 5=Expertenmeinung

Titel: ${title}
Abstract: ${abstract.substring(0, 600)}

Antworte NUR mit JSON:
{"level":"1b","studyType":"RCT","confidence":"high","rationale":"Kurz auf Deutsch max 80 Zeichen","tags":["biologics"]}`
    }]
  });

  const raw = (msg.content[0] as any).text.trim();
  // Strip optional markdown code fences (```json ... ``` or ``` ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`JSON parse failed. Raw response: ${raw.substring(0, 200)}`);
  }

  // Cross-validate with heuristics
  const check = crossValidateGrade(result.level, result.studyType ?? "", abstract);
  if (!check.passed) {
    console.log(`    ⚠ Heuristic flag: ${check.flag}`);
    result.confidence = "low";
    result.heuristicFlag = check.flag;
    result.rationale = `${result.rationale} [FLAGGED: ${check.flag}]`;
  }

  return result;
}

async function run() {
  initLogger("evidence-grader");
  await logStart("Bewerte Evidenzqualität neuer Papers");

  const snapshot = await db.collection("papers").orderBy("createdAt", "desc").limit(100).get();
  const toGrade = snapshot.docs.filter(d => !d.data().evidenceLevel).slice(0, 20);

  if (toGrade.length === 0) {
    await logComplete("Alle Papers bereits bewertet", 0);
    console.log("✅ Alle Papers bewertet."); return;
  }
  console.log(`📊 Bewerte ${toGrade.length} Papers...`);
  await logEvent("step", `${toGrade.length} Papers zu bewerten`);

  const MAX_CONSECUTIVE_FAILURES = 3;
  let graded = 0;
  let consecutiveFailures = 0;
  for (const doc of toGrade) {
    const data = doc.data();
    try {
      const result = await gradeEvidence(data.title, data.abstract || "");
      const updateData: Record<string, unknown> = {
        evidenceLevel: result.level,
        studyType: result.studyType,
        evidenceConfidence: result.confidence,
        evidenceRationale: result.rationale,
        gradedAt: Timestamp.now(),
        tags: [...new Set([...(data.tags || []), ...result.tags])],
      };
      if (result.heuristicFlag) {
        updateData.heuristicFlag = result.heuristicFlag;
      }
      await doc.ref.update(updateData);
      graded++;
      consecutiveFailures = 0;
      await logEvent("step", `[${result.level}] ${data.title.substring(0, 80)}`, result.rationale);
      console.log(`  ✓ [${result.level}] ${data.title.substring(0, 60)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      consecutiveFailures++;
      console.error(`  ✗ ${data.title.substring(0, 40)}`, msg);
      await logEvent("error", `✗ ${data.title.substring(0, 60)}`, msg.substring(0, 120));
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        const reason = `Circuit Breaker: ${MAX_CONSECUTIVE_FAILURES} aufeinanderfolgende Fehler — Run abgebrochen`;
        console.error(`\n⚡ ${reason}`);
        await logEvent("error", reason, msg.substring(0, 200));
        await logComplete(`${graded}/${toGrade.length} Papers bewertet (abgebrochen)`, graded);
        return;
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
  await logComplete(`${graded}/${toGrade.length} Papers bewertet`, graded);
  console.log(`\n✅ ${graded}/${toGrade.length} bewertet.`);
}

run().catch(async (err) => { try { await logError(err.message); } catch {} console.error(err); });

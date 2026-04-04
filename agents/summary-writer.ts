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

async function writePatientSummary(title: string, abstract: string, evidenceLevel: string) {
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Du schreibst für Patienten mit Morbus Bechterew (Ankylosing Spondylitis). Keine Fachbegriffe ohne Erklärung. Empathisch, klar, auf Augenhöhe.

Studie: ${title}
Abstract: ${abstract.substring(0, 800)}
Evidenzlevel: ${evidenceLevel}

Schreibe eine Zusammenfassung auf DEUTSCH und ENGLISCH. Antworte NUR mit JSON:
{
  "de": "2-3 Sätze auf Deutsch: Was wurde untersucht? Was hat man herausgefunden? Was bedeutet das für Patienten?",
  "en": "Same in English, 2-3 sentences."
}`
    }]
  });

  const text = (msg.content[0] as any).text.trim();
  return JSON.parse(text);
}

async function run() {
  // Papers with evidenceLevel but no patientSummary
  const snapshot = await db.collection("papers").orderBy("gradedAt", "desc").limit(50).get();
  const toSummarize = snapshot.docs
    .filter(d => d.data().evidenceLevel && !d.data().patientSummary)
    .slice(0, 15);

  if (toSummarize.length === 0) { console.log("✅ Alle bewerteten Papers haben Zusammenfassungen."); return; }
  initLogger("summary-writer");
  await logStart("Schreibe patientenfreundliche Zusammenfassungen");
  if (toSummarize.length === 0) { await logComplete("Alle Papers bereits zusammengefasst", 0); console.log("✅ Fertig."); return; }
  await logEvent("step", `${toSummarize.length} Papers zu zusammenfassen`);
  console.log(`✍️  Schreibe ${toSummarize.length} Patientenzusammenfassungen...`);

  let written = 0;
  for (const doc of toSummarize) {
    const data = doc.data();
    try {
      const summaries = await writePatientSummary(data.title, data.abstract || "", data.evidenceLevel);
      await doc.ref.update({
        patientSummary: summaries,
        summarizedAt: Timestamp.now(),
      });
      written++;
      await logEvent("step", `Zusammenfassung geschrieben`, data.title.substring(0, 100));
      console.log(`  ✓ ${data.title.substring(0, 60)}`);
    } catch (err) { console.error(`  ✗ ${data.title.substring(0, 40)}`, err); }
    await new Promise(r => setTimeout(r, 400));
  }
  await logComplete(`${written}/${toSummarize.length} Zusammenfassungen geschrieben`, written);
  console.log(`\n✅ ${written}/${toSummarize.length} Zusammenfassungen geschrieben.`);
}

run().catch(async (err) => { try { await logError(err.message); } catch {} console.error(err); });

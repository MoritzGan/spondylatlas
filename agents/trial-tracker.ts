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

interface Trial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  locations: string[];
  enrollmentCount: number | null;
  startDate: string | null;
  completionDate: string | null;
  url: string;
  summaryDe: string;
  fetchedAt: Timestamp;
}

async function fetchTrials(): Promise<any[]> {
  const url = "https://clinicaltrials.gov/api/v2/studies?query.cond=Ankylosing+Spondylitis&filter.overallStatus=RECRUITING,ENROLLING_BY_INVITATION&pageSize=20&format=json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ClinicalTrials API error: ${res.status}`);
  const data = await res.json() as any;
  return data.studies || [];
}

async function summarizeTrial(title: string, description: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Fasse diese klinische Studie für Morbus Bechterew Patienten auf Deutsch in 2 Sätzen zusammen. Was wird untersucht und wer kann teilnehmen?

Titel: ${title}
Beschreibung: ${description.substring(0, 400)}

Nur die 2-Satz-Zusammenfassung, kein anderer Text.`
    }]
  });
  return (msg.content[0] as any).text.trim();
}

async function run() {
  console.log("🔬 Suche aktive klinische Studien zu Morbus Bechterew...");

  // Get existing trial IDs
  const existing = await db.collection("trials").select("nctId").get();
  const existingIds = new Set(existing.docs.map(d => d.data().nctId));

  const rawTrials = await fetchTrials();
  const newTrials = rawTrials.filter(t => {
    const nctId = t.protocolSection?.identificationModule?.nctId;
    return nctId && !existingIds.has(nctId);
  });

  if (newTrials.length === 0) { console.log("✅ Keine neuen Studien gefunden."); return; }
  console.log(`📋 ${newTrials.length} neue Studien gefunden.`);

  for (const raw of newTrials) {
    const id = raw.protocolSection;
    const nctId = id?.identificationModule?.nctId;
    const title = id?.identificationModule?.briefTitle || "";
    const description = id?.descriptionModule?.briefSummary || "";
    const status = id?.statusModule?.overallStatus || "";
    const phase = id?.designModule?.phases?.[0] || "N/A";
    const locations = (id?.contactsLocationsModule?.locations || [])
      .slice(0, 5)
      .map((l: any) => `${l.city || ""}, ${l.country || ""}`.trim());
    const enrollment = id?.designModule?.enrollmentInfo?.count || null;
    const startDate = id?.statusModule?.startDateStruct?.date || null;
    const completionDate = id?.statusModule?.primaryCompletionDateStruct?.date || null;
    const interventions = (id?.armsInterventionsModule?.interventions || [])
      .slice(0, 3)
      .map((i: any) => i.name || "");

    try {
      const summaryDe = await summarizeTrial(title, description);
      const trial: Trial = {
        nctId, title, status, phase,
        conditions: ["Ankylosing Spondylitis", "Morbus Bechterew"],
        interventions, locations,
        enrollmentCount: enrollment,
        startDate, completionDate,
        url: `https://clinicaltrials.gov/study/${nctId}`,
        summaryDe,
        fetchedAt: Timestamp.now(),
      };
      await db.collection("trials").doc(nctId).set(trial);
      console.log(`  ✓ ${nctId}: ${title.substring(0, 60)}`);
    } catch (err) { console.error(`  ✗ ${nctId}`, err); }
    await new Promise(r => setTimeout(r, 400));
  }
  await logEvent("step", `Klinische Studie gespeichert`, "trial-tracker");
  console.log(`\n✅ Studien-Datenbank aktualisiert.`);
  await logComplete("Klinische Studien aktualisiert");
}

run().catch(async (err) => { try { await logError(err.message); } catch {} console.error(err); });

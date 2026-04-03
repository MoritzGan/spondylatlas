import { Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

export interface Trial {
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

export interface TrialLogger {
  logStart(detail?: string): Promise<void>;
  logEvent(type: "start" | "step" | "complete" | "error" | "skip", message: string, detail?: string): Promise<void>;
  logComplete(summary: string, itemsProcessed?: number): Promise<void>;
  logError(error: string): Promise<void>;
}

type FirestoreLike = {
  collection(name: string): {
    select(...fields: string[]): {
      get(): Promise<{ docs: Array<{ data(): Record<string, string> }> }>;
    };
    doc(id: string): {
      set(data: Trial, options?: unknown): Promise<unknown>;
    };
  };
};

const CLINICAL_TRIALS_URL =
  "https://clinicaltrials.gov/api/v2/studies?query.cond=Ankylosing+Spondylitis&filter.overallStatus=RECRUITING,ENROLLING_BY_INVITATION&pageSize=20&format=json";

export function mapStudyToTrial(raw: Record<string, any>, summaryDe: string): Trial {
  const section = raw.protocolSection ?? {};
  const nctId = section.identificationModule?.nctId ?? "";
  const title = section.identificationModule?.briefTitle ?? "";
  const description = section.descriptionModule?.briefSummary ?? "";
  const status = section.statusModule?.overallStatus ?? "";
  const phase = section.designModule?.phases?.[0] ?? "N/A";
  const locations = Array.isArray(section.contactsLocationsModule?.locations)
    ? section.contactsLocationsModule.locations
        .slice(0, 5)
        .map((location: { city?: string; country?: string }) => `${location.city ?? ""}, ${location.country ?? ""}`.trim())
        .filter(Boolean)
    : [];
  const interventions = Array.isArray(section.armsInterventionsModule?.interventions)
    ? section.armsInterventionsModule.interventions
        .slice(0, 3)
        .map((intervention: { name?: string }) => intervention.name ?? "")
        .filter(Boolean)
    : [];

  return {
    nctId,
    title,
    status,
    phase,
    conditions: ["Ankylosing Spondylitis", "Morbus Bechterew"],
    interventions,
    locations,
    enrollmentCount: section.designModule?.enrollmentInfo?.count ?? null,
    startDate: section.statusModule?.startDateStruct?.date ?? null,
    completionDate: section.statusModule?.primaryCompletionDateStruct?.date ?? null,
    url: `https://clinicaltrials.gov/study/${nctId}`,
    summaryDe,
    fetchedAt: Timestamp.now(),
  };
}

export async function fetchTrials(fetchFn: typeof fetch): Promise<Record<string, any>[]> {
  const response = await fetchFn(CLINICAL_TRIALS_URL);
  if (!response.ok) {
    throw new Error(`ClinicalTrials API error: ${response.status}`);
  }
  const data = await response.json() as { studies?: Record<string, any>[] };
  return data.studies ?? [];
}

export async function summarizeTrial(client: Anthropic, title: string, description: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Fasse diese klinische Studie für Morbus Bechterew Patienten auf Deutsch in 2 Sätzen zusammen. Was wird untersucht und wer kann teilnehmen?

Titel: ${title}
Beschreibung: ${description.substring(0, 400)}

Nur die 2-Satz-Zusammenfassung, kein anderer Text.`,
    }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

export async function runTrialTracker({
  db,
  anthropic,
  logger,
  fetchFn = fetch,
  sleep = async () => {},
}: {
  db: FirestoreLike;
  anthropic: Anthropic;
  logger: TrialLogger;
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}) {
  await logger.logStart("Suche aktive klinische Studien zu Morbus Bechterew");

  const existing = await db.collection("trials").select("nctId").get();
  const existingIds = new Set(existing.docs.map((doc) => doc.data().nctId));

  const rawTrials = await fetchTrials(fetchFn);
  const newTrials = rawTrials.filter((trial) => {
    const nctId = trial.protocolSection?.identificationModule?.nctId;
    return typeof nctId === "string" && !existingIds.has(nctId);
  });

  if (newTrials.length === 0) {
    await logger.logComplete("Keine neuen Studien gefunden", 0);
    return { added: 0 };
  }

  let added = 0;
  for (const rawTrial of newTrials) {
    const section = rawTrial.protocolSection ?? {};
    const nctId = section.identificationModule?.nctId ?? "";
    const title = section.identificationModule?.briefTitle ?? "";
    const description = section.descriptionModule?.briefSummary ?? "";

    try {
      const summaryDe = await summarizeTrial(anthropic, title, description);
      const trial = mapStudyToTrial(rawTrial, summaryDe);
      await db.collection("trials").doc(nctId).set(trial);
      await logger.logEvent("step", "Klinische Studie gespeichert", nctId);
      added++;
    } catch (error) {
      await logger.logEvent("error", "Studie konnte nicht gespeichert werden", error instanceof Error ? error.message : String(error));
    }
    await sleep(400);
  }

  await logger.logComplete("Klinische Studien aktualisiert", added);
  return { added };
}

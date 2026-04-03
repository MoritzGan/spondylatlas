import { getFirestore, Timestamp } from "firebase-admin/firestore";

export type EventType = "start" | "step" | "complete" | "error" | "skip";
export type AgentName =
  | "paper-search"
  | "evidence-grader"
  | "summary-writer"
  | "trial-tracker"
  | "forum-moderator";

let _runId: string;
let _agent: AgentName;
let _db: ReturnType<typeof getFirestore>;

export function createLogger(
  agent: AgentName,
  db: Pick<ReturnType<typeof getFirestore>, "collection">,
  runId = `${agent}-${Date.now()}`
) {
  return {
    runId,
    async logEvent(
      type: EventType,
      message: string,
      detail?: string,
      meta?: Record<string, unknown>
    ) {
      await db.collection("agent_events").add({
        agent,
        runId,
        type,
        message,
        detail: detail ?? null,
        meta: meta ?? null,
        timestamp: Timestamp.now(),
      });
    },
    async logStart(detail?: string) {
      await db.collection("agent_runs").doc(runId).set({
        agent,
        runId,
        status: "running",
        startedAt: Timestamp.now(),
        completedAt: null,
        itemsProcessed: 0,
        summary: detail ?? "Gestartet",
      });
      await this.logEvent("start", `${agent} gestartet`, detail);
    },
    async logComplete(summary: string, itemsProcessed = 0) {
      await db.collection("agent_runs").doc(runId).update({
        status: "complete",
        completedAt: Timestamp.now(),
        itemsProcessed,
        summary,
      });
      await this.logEvent("complete", summary, `${itemsProcessed} Element(e) verarbeitet`);
    },
    async logError(error: string) {
      await db.collection("agent_runs").doc(runId).update({
        status: "error",
        completedAt: Timestamp.now(),
        summary: error,
      });
      await this.logEvent("error", `Fehler: ${error}`);
    },
  };
}

export function initLogger(agent: AgentName, runId?: string) {
  _agent = agent;
  _runId = runId ?? `${agent}-${Date.now()}`;
  _db = getFirestore();
  return _runId;
}

export async function logEvent(
  type: EventType,
  message: string,
  detail?: string,
  meta?: Record<string, unknown>
) {
  try {
    await createLogger(_agent, _db, _runId).logEvent(type, message, detail, meta);
  } catch (e) {
    console.warn("Logger write failed:", e);
  }
}

export async function logStart(detail?: string) {
  await createLogger(_agent, _db, _runId).logStart(detail);
}

export async function logComplete(summary: string, itemsProcessed = 0) {
  await createLogger(_agent, _db, _runId).logComplete(summary, itemsProcessed);
}

export async function logError(error: string) {
  await createLogger(_agent, _db, _runId).logError(error);
}

export function getRunId() {
  return _runId;
}

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
    await _db.collection("agent_events").add({
      agent: _agent,
      runId: _runId,
      type,
      message,
      detail: detail ?? null,
      meta: meta ?? null,
      timestamp: Timestamp.now(),
    });
  } catch (e) {
    console.warn("Logger write failed:", e);
  }
}

export async function logStart(detail?: string) {
  await _db.collection("agent_runs").doc(_runId).set({
    agent: _agent,
    runId: _runId,
    status: "running",
    startedAt: Timestamp.now(),
    completedAt: null,
    itemsProcessed: 0,
    summary: detail ?? "Gestartet",
  });
  await logEvent("start", `${_agent} gestartet`, detail);
}

export async function logComplete(summary: string, itemsProcessed = 0) {
  await _db.collection("agent_runs").doc(_runId).update({
    status: "complete",
    completedAt: Timestamp.now(),
    itemsProcessed,
    summary,
  });
  await logEvent("complete", summary, `${itemsProcessed} Element(e) verarbeitet`);
}

export async function logError(error: string) {
  await _db.collection("agent_runs").doc(_runId).update({
    status: "error",
    completedAt: Timestamp.now(),
    summary: error,
  });
  await logEvent("error", `Fehler: ${error}`);
}

export function getRunId() {
  return _runId;
}

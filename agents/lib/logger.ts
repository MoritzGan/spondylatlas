import { getFirestore, Timestamp } from "firebase-admin/firestore";

export type EventType = "start" | "step" | "complete" | "error" | "skip";
export type AgentName =
  | "paper-search"
  | "evidence-grader"
  | "summary-writer"
  | "trial-tracker"
  | "forum-moderator"
  | `external:${string}`;

let _runId: string;
let _agent: AgentName;
let _db: ReturnType<typeof getFirestore>;

function sanitizeText(value: string | undefined, maxLength: number) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  return normalized || null;
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
    await _db.collection("agent_events").add({
      agent: _agent,
      runId: _runId,
      type,
      message: sanitizeText(message, 160) ?? "Agent event",
      detail: sanitizeText(detail, 220),
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
    summary: sanitizeText(detail, 160) ?? "Gestartet",
  });
  await logEvent("start", `${_agent} gestartet`, detail);
}

export async function logComplete(summary: string, itemsProcessed = 0) {
  await _db.collection("agent_runs").doc(_runId).update({
    status: "complete",
    completedAt: Timestamp.now(),
    itemsProcessed,
    summary: sanitizeText(summary, 160) ?? "Agent run completed",
  });
  await logEvent("complete", summary, `${itemsProcessed} Element(e) verarbeitet`);
}

export async function logError(error: string) {
  await _db.collection("agent_runs").doc(_runId).update({
    status: "error",
    completedAt: Timestamp.now(),
    summary: "Agent run failed; inspect private runtime logs",
  });
  void error;
  await logEvent("error", "Agent run failed");
}

export function getRunId() {
  return _runId;
}

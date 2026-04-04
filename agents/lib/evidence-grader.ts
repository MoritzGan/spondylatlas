import { Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

export type EvidenceLevel = "1a" | "1b" | "2a" | "2b" | "3" | "4" | "5";

export interface EvidenceResult {
  level: EvidenceLevel;
  studyType: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  tags: string[];
}

export interface EvidenceLogger {
  logStart(detail?: string): Promise<void>;
  logEvent(type: "start" | "step" | "complete" | "error" | "skip", message: string, detail?: string): Promise<void>;
  logComplete(summary: string, itemsProcessed?: number): Promise<void>;
  logError(error: string): Promise<void>;
}

type PaperSnapshot = {
  id: string;
  data(): Record<string, unknown>;
  ref: {
    update(data: Record<string, unknown>): Promise<unknown>;
  };
};

type FirestoreLike = {
  collection(name: string): {
    orderBy(field: string, direction?: "asc" | "desc"): {
      limit(count: number): {
        get(): Promise<{ docs: PaperSnapshot[] }>;
      };
    };
  };
};

export function parseEvidenceResponse(text: string): EvidenceResult {
  return JSON.parse(text.trim()) as EvidenceResult;
}

export function mergeTags(existing: unknown, incoming: unknown): string[] {
  const current = Array.isArray(existing) ? existing.filter((tag): tag is string => typeof tag === "string") : [];
  const next = Array.isArray(incoming) ? incoming.filter((tag): tag is string => typeof tag === "string") : [];
  return [...new Set([...current, ...next])];
}

export function selectPapersToGrade(docs: PaperSnapshot[], maxItems = 20) {
  return docs.filter((doc) => !doc.data().evidenceLevel).slice(0, maxItems);
}

export async function gradeEvidence(client: Anthropic, title: string, abstract: string) {
  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Bewerte diese Studie zu Morbus Bechterew nach Oxford CEBM Evidence Levels:
1a=Sys.Review RCTs, 1b=Einzel-RCT, 2a=Sys.Review Kohorten, 2b=Kohortenstudie, 3=Fall-Kontroll, 4=Fallserie, 5=Expertenmeinung

Titel: ${title}
Abstract: ${abstract.substring(0, 600)}

Antworte NUR mit JSON:
{"level":"1b","studyType":"RCT","confidence":"high","rationale":"Kurz auf Deutsch max 80 Zeichen","tags":["biologics"]}`,
    }],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "";
  return parseEvidenceResponse(text);
}

export async function runEvidenceGrader({
  db,
  anthropic,
  logger,
  sleep = async () => {},
}: {
  db: FirestoreLike;
  anthropic: Anthropic;
  logger: EvidenceLogger;
  sleep?: (ms: number) => Promise<void>;
}) {
  await logger.logStart("Bewerte Evidenzqualität neuer Papers");

  const snapshot = await db.collection("papers").orderBy("createdAt", "desc").limit(100).get();
  const toGrade = selectPapersToGrade(snapshot.docs);

  if (toGrade.length === 0) {
    await logger.logComplete("Alle Papers bereits bewertet", 0);
    return { graded: 0, total: 0 };
  }

  await logger.logEvent("step", `${toGrade.length} Papers zu bewerten`);

  const MAX_CONSECUTIVE_FAILURES = 3;
  let graded = 0;
  let consecutiveFailures = 0;
  for (const paper of toGrade) {
    const data = paper.data();
    try {
      const result = await gradeEvidence(
        anthropic,
        typeof data.title === "string" ? data.title : "",
        typeof data.abstract === "string" ? data.abstract : ""
      );
      await paper.ref.update({
        evidenceLevel: result.level,
        studyType: result.studyType,
        evidenceConfidence: result.confidence,
        evidenceRationale: result.rationale,
        gradedAt: Timestamp.now(),
        tags: mergeTags(data.tags, result.tags),
      });
      await logger.logEvent("step", `[${result.level}] ${String(data.title).slice(0, 80)}`, result.rationale);
      graded++;
      consecutiveFailures = 0;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      consecutiveFailures++;
      await logger.logEvent("error", `Bewertung fehlgeschlagen`, msg.substring(0, 200));
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        await logger.logEvent("error", `Circuit Breaker: ${MAX_CONSECUTIVE_FAILURES} aufeinanderfolgende Fehler — Run abgebrochen`, msg.substring(0, 200));
        await logger.logComplete(`${graded}/${toGrade.length} Papers bewertet (abgebrochen)`, graded);
        return { graded, total: toGrade.length };
      }
    }
    await sleep(400);
  }

  await logger.logComplete(`${graded}/${toGrade.length} Papers bewertet`, graded);
  return { graded, total: toGrade.length };
}

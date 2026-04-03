import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "./lib/logger.js";
import { runEvidenceGrader } from "./lib/evidence-grader.js";
import { initAdminFirestore, sleep } from "./lib/runtime.js";

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }
  return new Anthropic({ apiKey });
}

export async function main() {
  const db = initAdminFirestore();
  const logger = createLogger("evidence-grader", db);
  return runEvidenceGrader({
    db,
    anthropic: createAnthropicClient(),
    logger,
    sleep,
  });
}

main().catch(async (error) => {
  const logger = createLogger("evidence-grader", initAdminFirestore());
  await logger.logError(error instanceof Error ? error.message : String(error));
  console.error(error);
  process.exit(1);
});

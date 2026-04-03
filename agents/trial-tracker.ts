import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "./lib/logger.js";
import { initAdminFirestore, sleep } from "./lib/runtime.js";
import { runTrialTracker } from "./lib/trial-tracker.js";

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }
  return new Anthropic({ apiKey });
}

export async function main() {
  const db = initAdminFirestore();
  const logger = createLogger("trial-tracker", db);
  return runTrialTracker({
    db,
    anthropic: createAnthropicClient(),
    logger,
    sleep,
  });
}

main().catch(async (error) => {
  const logger = createLogger("trial-tracker", initAdminFirestore());
  await logger.logError(error instanceof Error ? error.message : String(error));
  console.error(error);
  process.exit(1);
});

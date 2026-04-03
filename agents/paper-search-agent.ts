import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "./lib/logger.js";
import { runPaperSearch } from "./lib/paper-search.js";
import { initAdminFirestore } from "./lib/runtime.js";

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }
  return new Anthropic({ apiKey });
}

export async function main() {
  const db = initAdminFirestore();
  const logger = createLogger("paper-search", db);
  return runPaperSearch({
    db,
    anthropic: createAnthropicClient(),
    logger,
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

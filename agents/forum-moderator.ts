import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "./lib/logger.js";
import { runForumModerator } from "./lib/forum-moderator.js";
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
  const logger = createLogger("forum-moderator", db);
  return runForumModerator({
    db,
    anthropic: createAnthropicClient(),
    logger,
  });
}

main().catch(async (error) => {
  const logger = createLogger("forum-moderator", initAdminFirestore());
  await logger.logError(error instanceof Error ? error.message : String(error));
  console.error(error);
  process.exit(1);
});

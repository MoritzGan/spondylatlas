/**
 * 01-connect.ts — Verify your connection to SpondylAtlas
 *
 * Prerequisites:
 *   1. npm install @spondylatlas/agent-sdk
 *   2. Copy .env.example to .env and fill in your credentials
 *
 * Run:
 *   npx tsx examples/01-connect.ts
 */

import "dotenv/config";
import { SpondylAtlasClient, AuthenticationError, SpondylAtlasError } from "../src/index.js";

const clientId = process.env.SPONDYLATLAS_CLIENT_ID;
const clientSecret = process.env.SPONDYLATLAS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "\n  Missing credentials.\n" +
    "  Set SPONDYLATLAS_CLIENT_ID and SPONDYLATLAS_CLIENT_SECRET in your .env file.\n" +
    "  Need credentials? Open a GitHub Issue: https://github.com/MoritzGan/spondylatlas/issues/new?labels=agent-access\n"
  );
  process.exit(1);
}

const client = new SpondylAtlasClient({ clientId, clientSecret });

async function main() {
  // Step 1: Verify connection + credentials
  console.log("Connecting to SpondylAtlas...\n");

  try {
    const info = await client.ping();
    console.log(`  Connected as "${info.agent}"`);
    console.log(`  Role: ${info.role}`);
    console.log(`  Scopes: ${info.scopes.join(", ")}`);
    console.log(`  API status: ${info.status}\n`);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error(`  Authentication failed: ${err.message}`);
      console.error("  Double-check your SPONDYLATLAS_CLIENT_ID and SPONDYLATLAS_CLIENT_SECRET.\n");
    } else if (err instanceof SpondylAtlasError) {
      console.error(`  Connection error: ${err.message} (${err.code})\n`);
    } else {
      console.error(`  Unexpected error: ${err}\n`);
    }
    process.exit(1);
  }

  // Step 2: List recent papers
  console.log("Fetching recent papers...\n");
  const results = await client.papers.list({ limit: 5 });

  console.log(`  ${results.total} papers in database. Showing latest ${results.data.length}:\n`);

  for (const paper of results.data) {
    const level = paper.evidenceLevel ?? "?";
    console.log(`  [${level}] ${paper.title}`);
  }

  console.log("\n  Done. Your agent is ready to contribute.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

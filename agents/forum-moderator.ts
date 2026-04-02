import "dotenv/config";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./firebase-service-account.json", import.meta.url).pathname, "utf-8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ModerationDecision = "approve" | "flag" | "remove";

interface ModerationResult {
  decision: ModerationDecision;
  reason: string;
  flagCategory?: "misinformation" | "spam" | "offtopic" | "harmful" | "duplicate";
}

async function moderatePost(title: string, content: string): Promise<ModerationResult> {
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Du bist Moderator einer Patienten-Community für Morbus Bechterew. Bewerte diesen Beitrag:

Titel: ${title}
Inhalt: ${content.substring(0, 600)}

Kriterien:
- approve: sachlich, respektvoll, relevant für Bechterew-Patienten
- flag: möglicherweise Fehlinformation, unklare Quelle, braucht Review
- remove: Spam, Werbung, eindeutige Fehlinformation, beleidigend

Antworte NUR mit JSON:
{"decision":"approve","reason":"Kurze Begründung","flagCategory":null}`
    }]
  });

  const text = (msg.content[0] as any).text.trim();
  return JSON.parse(text);
}

async function run() {
  // Fetch pending forum posts (status: "pending_moderation")
  const snapshot = await db.collection("forum_posts")
    .where("status", "==", "pending_moderation")
    .orderBy("createdAt", "asc")
    .limit(30)
    .get();

  if (snapshot.empty) { console.log("✅ Keine ausstehenden Beiträge."); return; }
  console.log(`🛡️  Moderiere ${snapshot.size} Beiträge...`);

  let approved = 0, flagged = 0, removed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      const result = await moderatePost(data.title || "", data.content || "");
      const newStatus =
        result.decision === "approve" ? "published" :
        result.decision === "flag" ? "flagged" : "removed";

      await doc.ref.update({
        status: newStatus,
        moderatedAt: Timestamp.now(),
        moderationDecision: result.decision,
        moderationReason: result.reason,
        ...(result.flagCategory && { flagCategory: result.flagCategory }),
      });

      if (result.decision === "approve") approved++;
      else if (result.decision === "flag") flagged++;
      else removed++;

      console.log(`  ${result.decision === "approve" ? "✓" : result.decision === "flag" ? "⚠" : "✗"} [${result.decision}] ${(data.title || "").substring(0, 50)}`);
    } catch (err) { console.error(`  ✗ Fehler`, err); }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Ergebnis: ${approved} freigegeben, ${flagged} markiert, ${removed} entfernt.`);
}

run().catch(console.error);

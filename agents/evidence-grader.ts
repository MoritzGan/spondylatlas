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

type EvidenceLevel = "1a" | "1b" | "2a" | "2b" | "3" | "4" | "5";

async function gradeEvidence(title: string, abstract: string) {
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Bewerte diese Studie zu Morbus Bechterew nach Oxford CEBM Evidence Levels:
1a=Sys.Review RCTs, 1b=Einzel-RCT, 2a=Sys.Review Kohorten, 2b=Kohortenstudie, 3=Fall-Kontroll, 4=Fallserie, 5=Expertenmeinung

Titel: ${title}
Abstract: ${abstract.substring(0, 600)}

Antworte NUR mit JSON:
{"level":"1b","studyType":"RCT","confidence":"high","rationale":"Kurz auf Deutsch max 80 Zeichen","tags":["biologics"]}`
    }]
  });

  const text = (msg.content[0] as any).text.trim();
  return JSON.parse(text);
}

async function run() {
  const snapshot = await db.collection("papers").orderBy("createdAt", "desc").limit(100).get();
  const toGrade = snapshot.docs.filter(d => !d.data().evidenceLevel).slice(0, 20);

  if (toGrade.length === 0) { console.log("✅ Alle Papers bewertet."); return; }
  console.log(`📊 Bewerte ${toGrade.length} Papers...`);

  let graded = 0;
  for (const doc of toGrade) {
    const data = doc.data();
    try {
      const result = await gradeEvidence(data.title, data.abstract || "");
      await doc.ref.update({
        evidenceLevel: result.level,
        studyType: result.studyType,
        evidenceConfidence: result.confidence,
        evidenceRationale: result.rationale,
        gradedAt: Timestamp.now(),
        tags: [...new Set([...(data.tags || []), ...result.tags])],
      });
      graded++;
      console.log(`  ✓ [${result.level}] ${data.title.substring(0, 60)}`);
    } catch (err) { console.error(`  ✗ ${data.title.substring(0, 40)}`, err); }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\n✅ ${graded}/${toGrade.length} bewertet.`);
}

run().catch(console.error);

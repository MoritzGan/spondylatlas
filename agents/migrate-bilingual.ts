import { readFileSync } from "fs";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const FIELDS = ["title", "description", "rationale", "criticArgument"] as const;

async function migrate() {
  const snap = await db.collection("hypotheses").get();
  console.log(`Found ${snap.size} hypotheses`);

  let migrated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates: Record<string, { de: string; en: string }> = {};

    for (const field of FIELDS) {
      const val = data[field];
      if (typeof val === "string" && val.length > 0) {
        updates[field] = { de: val, en: "" };
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      const label = typeof data.title === "string" ? data.title : data.title?.de ?? doc.id;
      console.log("  ✓", label.slice(0, 60));
      migrated++;
    }
  }

  console.log(`\nDone. ${migrated}/${snap.size} hypotheses migrated.`);
}

migrate().catch((err) => { console.error(err); process.exit(1); });

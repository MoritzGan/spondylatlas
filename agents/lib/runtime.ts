import { readFileSync } from "fs";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function loadServiceAccount(): ServiceAccount {
  const raw =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
    readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./firebase-service-account.json", "utf8");
  return JSON.parse(raw) as ServiceAccount;
}

export function initAdminFirestore() {
  if (getApps().length === 0) {
    initializeApp({ credential: cert(loadServiceAccount()) });
  }
  return getFirestore();
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

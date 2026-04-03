import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { ROLE_SCOPES, type AgentCredential, type AgentRole } from "../types/index.js";

const COLLECTION = "agent_credentials";

function db() {
  return getFirestore();
}

export async function registerAgent(
  name: string,
  description: string,
  role: AgentRole,
  createdBy: string,
): Promise<{ agentId: string; clientId: string; clientSecret: string }> {
  const agentId = uuidv4();
  const clientId = uuidv4();
  const clientSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString("base64url");
  const clientSecretHash = await bcrypt.hash(clientSecret, 12);

  const rateLimits: Record<AgentRole, number> = {
    reviewer: 100,
    researcher: 200,
    admin: 500,
  };

  const doc: Omit<AgentCredential, "agentId"> = {
    name,
    description,
    clientId,
    clientSecretHash,
    role,
    scopes: ROLE_SCOPES[role],
    rateLimitPerHour: rateLimits[role],
    enabled: true,
    createdAt: Timestamp.now(),
    lastActiveAt: Timestamp.now(),
    createdBy,
  };

  await db().collection(COLLECTION).doc(agentId).set(doc);

  return { agentId, clientId, clientSecret };
}

export async function findByClientId(clientId: string): Promise<(AgentCredential & { agentId: string }) | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { agentId: doc.id, ...doc.data() } as AgentCredential & { agentId: string };
}

export async function findById(agentId: string): Promise<AgentCredential | null> {
  const doc = await db().collection(COLLECTION).doc(agentId).get();
  if (!doc.exists) return null;
  return { agentId: doc.id, ...doc.data() } as AgentCredential;
}

export async function verifySecret(agent: AgentCredential, clientSecret: string): Promise<boolean> {
  return bcrypt.compare(clientSecret, agent.clientSecretHash);
}

export async function touchLastActive(agentId: string): Promise<void> {
  await db().collection(COLLECTION).doc(agentId).update({
    lastActiveAt: FieldValue.serverTimestamp(),
  });
}

export async function listAgents(): Promise<AgentCredential[]> {
  const snap = await db().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ agentId: d.id, ...d.data() }) as AgentCredential);
}

export async function updateAgent(
  agentId: string,
  updates: Partial<Pick<AgentCredential, "name" | "description" | "role" | "enabled" | "rateLimitPerHour">>,
): Promise<void> {
  const data: Record<string, unknown> = { ...updates };

  if (updates.role) {
    data.scopes = ROLE_SCOPES[updates.role];
  }

  await db().collection(COLLECTION).doc(agentId).update(data);
}

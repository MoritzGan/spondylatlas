import type { Request } from "express";

export type AgentRole = "reviewer" | "researcher" | "admin";

export type Scope =
  | "papers:read"
  | "papers:write"
  | "papers:review"
  | "hypotheses:read"
  | "hypotheses:review"
  | "admin:agents";

export const ROLE_SCOPES: Record<AgentRole, Scope[]> = {
  reviewer: ["papers:read", "papers:review", "hypotheses:read", "hypotheses:review"],
  researcher: ["papers:read", "papers:write", "papers:review", "hypotheses:read", "hypotheses:review"],
  admin: ["papers:read", "papers:write", "papers:review", "hypotheses:read", "hypotheses:review", "admin:agents"],
};

export interface AgentCredential {
  agentId: string;
  name: string;
  description: string;
  clientId: string;
  clientSecretHash: string;
  role: AgentRole;
  scopes: Scope[];
  rateLimitPerHour: number;
  enabled: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
  createdBy: string;
  expiresAt?: FirebaseFirestore.Timestamp;
}

export interface JwtPayload {
  sub: string;
  iss: "spondylatlas";
  aud: "spondylatlas-api";
  role: AgentRole;
  scopes: Scope[];
  iat: number;
  exp: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: AgentRole;
  scopes: Scope[];
}

export interface AuthenticatedRequest extends Request {
  agent: AgentInfo;
}

export interface FirebaseUserInfo {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

export interface AuthenticatedFirebaseUserRequest extends Request {
  firebaseUser: FirebaseUserInfo;
}

/** Helper: extract agent from request (set by auth middleware) */
export function getAgent(req: Request): AgentInfo {
  return (req as AuthenticatedRequest).agent;
}

export function getFirebaseUser(req: Request): FirebaseUserInfo {
  return (req as AuthenticatedFirebaseUserRequest).firebaseUser;
}

/** Helper: extract single string param */
export function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

export interface PaperSubmission {
  title: string;
  abstract: string;
  authors: string[];
  url: string;
  doi?: string;
  pubmedId?: string;
  source: string;
}

export interface PaperReview {
  evidenceLevel: string;
  studyType: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  tags?: string[];
}

export interface HypothesisReview {
  verdict: "challenged" | "open" | "needs_research";
  argument: string;
  confidence: "high" | "medium" | "low";
  researchQuery?: string;
  referencePaperIds?: string[];
}

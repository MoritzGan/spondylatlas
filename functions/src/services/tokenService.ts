import jwt from "jsonwebtoken";
import type { AgentRole, JwtPayload, Scope } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SIGNING_SECRET || "dev-secret-change-in-production";
const TOKEN_LIFETIME_SECONDS = 3600; // 1 hour

export function signToken(agentId: string, role: AgentRole, scopes: Scope[]): string {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: agentId,
    iss: "spondylatlas",
    aud: "spondylatlas-api",
    role,
    scopes,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_LIFETIME_SECONDS });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: "spondylatlas",
    audience: "spondylatlas-api",
  }) as JwtPayload;
}

export const TOKEN_LIFETIME = TOKEN_LIFETIME_SECONDS;

import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors.js";
import { getAgent } from "../types/index.js";
import type { AuthenticatedFirebaseUserRequest } from "../types/index.js";

const ROLE_LIMITS: Record<string, number> = {
  reviewer: 100,
  researcher: 200,
  admin: 500,
};

const windows = new Map<string, number[]>();

function applyRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  next: NextFunction,
) {
  const now = Date.now();
  let timestamps = windows.get(key) ?? [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    next(ApiError.rateLimited(`Rate limit of ${limit} requests/hour exceeded`));
    return;
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  next();
}

export function createRateLimitMiddleware(
  getKey: (req: Request) => string,
  getLimit: (req: Request) => number,
  windowMs = 3600_000,
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    applyRateLimit(getKey(req), getLimit(req), windowMs, next);
  };
}

export function rateLimitMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const agent = getAgent(req);
  const limit = ROLE_LIMITS[agent.role] ?? 100;
  applyRateLimit(`agent:${agent.id}`, limit, 3600_000, next);
}

export const firebaseUserRateLimitMiddleware = createRateLimitMiddleware(
  (req) => `user:${(req as Partial<AuthenticatedFirebaseUserRequest>).firebaseUser?.uid ?? req.ip}`,
  () => 120,
);

export const publicWriteRateLimitMiddleware = createRateLimitMiddleware(
  (req) => `public:${req.ip}`,
  () => 30,
);

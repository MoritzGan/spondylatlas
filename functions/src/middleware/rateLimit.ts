import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors.js";
import { getAgent } from "../types/index.js";

const ROLE_LIMITS: Record<string, number> = {
  reviewer: 100,
  researcher: 200,
  admin: 500,
};

const windows = new Map<string, number[]>();

export function rateLimitMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const agent = getAgent(req);
  const now = Date.now();
  const windowMs = 3600_000; // 1 hour
  const limit = ROLE_LIMITS[agent.role] ?? 100;

  let timestamps = windows.get(agent.id) ?? [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    next(ApiError.rateLimited(`Rate limit of ${limit} requests/hour exceeded`));
    return;
  }

  timestamps.push(now);
  windows.set(agent.id, timestamps);
  next();
}

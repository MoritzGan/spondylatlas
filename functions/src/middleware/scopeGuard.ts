import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/errors.js";
import { getAgent } from "../types/index.js";
import type { Scope } from "../types/index.js";

export function scopeGuard(...requiredScopes: Scope[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const agent = getAgent(req);
    const missing = requiredScopes.filter((s) => !agent.scopes.includes(s));
    if (missing.length > 0) {
      next(ApiError.forbidden(`Missing scopes: ${missing.join(", ")}`));
      return;
    }
    next();
  };
}

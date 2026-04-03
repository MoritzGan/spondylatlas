import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/tokenService.js";
import { findById } from "../services/agentRegistry.js";
import { ApiError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "../types/index.js";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing Bearer token"));
    return;
  }

  const token = header.slice(7);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
    return;
  }

  findById(payload.sub)
    .then((agent) => {
      if (!agent || !agent.enabled) {
        next(ApiError.unauthorized("Agent is disabled or not found"));
        return;
      }

      (req as AuthenticatedRequest).agent = {
        id: payload.sub,
        name: agent.name,
        role: payload.role,
        scopes: payload.scopes,
      };

      next();
    })
    .catch(next);
}

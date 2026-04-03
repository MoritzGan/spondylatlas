import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors.js";

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      next(ApiError.validation(message));
      return;
    }
    req.body = result.data;
    next();
  };
}

// --- Validation schemas ---

export const tokenRequestSchema = z.object({
  grant_type: z.literal("client_credentials"),
  client_id: z.string().uuid(),
  client_secret: z.string().min(1),
});

export const paperSubmissionSchema = z.object({
  title: z.string().min(1).max(500),
  abstract: z.string().min(1).max(5000),
  authors: z.array(z.string().max(200)).min(1).max(50),
  url: z.string().url(),
  doi: z.string().max(100).optional(),
  pubmedId: z.string().max(50).optional(),
  source: z.string().max(100),
});

export const paperReviewSchema = z.object({
  evidenceLevel: z.enum(["1a", "1b", "2a", "2b", "3a", "3b", "4", "5"]),
  studyType: z.string().min(1).max(200),
  confidence: z.enum(["high", "medium", "low"]),
  rationale: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export const hypothesisReviewSchema = z.object({
  verdict: z.enum(["challenged", "open", "needs_research"]),
  argument: z.string().min(1).max(2000),
  confidence: z.enum(["high", "medium", "low"]),
  researchQuery: z.string().max(500).optional(),
  referencePaperIds: z.array(z.string()).max(20).optional(),
});

export const registerAgentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  role: z.enum(["reviewer", "researcher", "admin"]),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  role: z.enum(["reviewer", "researcher", "admin"]).optional(),
  enabled: z.boolean().optional(),
  rateLimitPerHour: z.number().int().min(1).max(10000).optional(),
});

export const paperSearchSchema = z.object({
  q: z.string().max(500).optional(),
  tags: z.string().max(500).optional(),
  evidenceLevel: z.string().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const hypothesisListSchema = z.object({
  status: z.enum(["pending_review", "open", "challenged", "needs_research"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

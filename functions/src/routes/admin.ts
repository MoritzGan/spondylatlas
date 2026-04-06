import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { scopeGuard } from "../middleware/scopeGuard.js";
import { validate, registerAgentSchema, updateAgentSchema } from "../middleware/validate.js";
import { registerAgent, listAgents, updateAgent, findById } from "../services/agentRegistry.js";
import { ApiError } from "../lib/errors.js";
import { getAgent, param } from "../types/index.js";

const router = Router();

function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  const agent = getAgent(req);
  if (agent.role !== "admin") {
    next(ApiError.forbidden("Admin role required"));
    return;
  }
  next();
}

router.post(
  "/agents",
  requireAdminRole,
  scopeGuard("admin:agents"),
  validate(registerAgentSchema),
  async (req, res, next) => {
    try {
      const agent = getAgent(req);
      const { name, description, role } = req.body;
      const result = await registerAgent(name, description, role, agent.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/agents", requireAdminRole, scopeGuard("admin:agents"), async (_req, res, next) => {
  try {
    const agents = await listAgents();
    // Strip sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = agents.map(({ clientSecretHash: _, ...rest }) => rest);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/agents/:id",
  requireAdminRole,
  scopeGuard("admin:agents"),
  validate(updateAgentSchema),
  async (req, res, next) => {
    try {
      const id = param(req, "id");
      const existing = await findById(id);
      if (!existing) throw ApiError.notFound("Agent not found");

      await updateAgent(id, req.body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

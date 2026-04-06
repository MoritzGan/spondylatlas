import { Router } from "express";
import { validate, tokenRequestSchema } from "../middleware/validate.js";
import { findByClientId, verifySecret, touchLastActive } from "../services/agentRegistry.js";
import { signToken, TOKEN_LIFETIME } from "../services/tokenService.js";
import { ApiError } from "../lib/errors.js";

const router = Router();

router.post("/token", validate(tokenRequestSchema), async (req, res, next) => {
  try {
    const { client_id, client_secret } = req.body;

    const agent = await findByClientId(client_id);
    if (!agent) {
      throw ApiError.unauthorized("Invalid client credentials");
    }

    if (!agent.enabled) {
      throw ApiError.unauthorized("Agent is disabled");
    }

    if (agent.expiresAt && agent.expiresAt.toMillis() < Date.now()) {
      throw ApiError.unauthorized("Agent credentials have expired");
    }

    const valid = await verifySecret(agent, client_secret);
    if (!valid) {
      throw ApiError.unauthorized("Invalid client credentials");
    }

    const token = signToken(agent.agentId, agent.role, agent.scopes);

    // Update last active timestamp (fire and forget)
    touchLastActive(agent.agentId).catch(() => {});

    res.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: TOKEN_LIFETIME,
      scopes: agent.scopes,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

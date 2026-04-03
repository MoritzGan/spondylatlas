import { Router } from "express";
import { scopeGuard } from "../middleware/scopeGuard.js";
import { validate, hypothesisReviewSchema, hypothesisListSchema } from "../middleware/validate.js";
import { listHypotheses, getHypothesis, reviewHypothesis } from "../services/hypothesisService.js";
import { getAgent, param } from "../types/index.js";

const router = Router();

router.get("/", scopeGuard("hypotheses:read"), async (req, res, next) => {
  try {
    const params = hypothesisListSchema.parse(req.query);
    const result = await listHypotheses(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", scopeGuard("hypotheses:read"), async (req, res, next) => {
  try {
    const hypothesis = await getHypothesis(param(req, "id"));
    res.json(hypothesis);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/review",
  scopeGuard("hypotheses:review"),
  validate(hypothesisReviewSchema),
  async (req, res, next) => {
    try {
      const agent = getAgent(req);
      const result = await reviewHypothesis(
        param(req, "id"),
        req.body,
        agent.id,
        agent.name,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

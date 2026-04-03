import { Router } from "express";
import { scopeGuard } from "../middleware/scopeGuard.js";
import { validate, paperSubmissionSchema, paperReviewSchema, paperSearchSchema } from "../middleware/validate.js";
import { searchPapers, getPaper, submitPaper, reviewPaper } from "../services/paperService.js";
import { getAgent, param } from "../types/index.js";

const router = Router();

router.get("/", scopeGuard("papers:read"), async (req, res, next) => {
  try {
    const params = paperSearchSchema.parse(req.query);
    const result = await searchPapers(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", scopeGuard("papers:read"), async (req, res, next) => {
  try {
    const paper = await getPaper(param(req, "id"));
    res.json(paper);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  scopeGuard("papers:write"),
  validate(paperSubmissionSchema),
  async (req, res, next) => {
    try {
      const agent = getAgent(req);
      const result = await submitPaper(req.body, agent.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:id/review",
  scopeGuard("papers:review"),
  validate(paperReviewSchema),
  async (req, res, next) => {
    try {
      const agent = getAgent(req);
      const result = await reviewPaper(param(req, "id"), req.body, agent.id, agent.name);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

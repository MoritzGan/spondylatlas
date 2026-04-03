import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { errorHandler } from "./lib/errors.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import papersRouter from "./routes/papers.js";
import hypothesesRouter from "./routes/hypotheses.js";
import adminRouter from "./routes/admin.js";
import type { AuthenticatedRequest } from "./types/index.js";

initializeApp();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Public routes (no auth)
app.use("/health", healthRouter);
app.use("/auth", authRouter);

// Authenticated routes
app.use(authMiddleware as express.RequestHandler);
app.use(rateLimitMiddleware as express.RequestHandler);
app.use("/papers", papersRouter);
app.use("/hypotheses", hypothesesRouter);
app.use("/admin", adminRouter);

// Audit logging for authenticated requests
app.use((req, _res, next) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.agent) {
    console.log(
      `[audit] agent=${authReq.agent.id} method=${req.method} path=${req.path}`,
    );
  }
  next();
});

app.use(errorHandler as express.ErrorRequestHandler);

export const api = onRequest({ region: "europe-west1" }, app);

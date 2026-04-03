import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import { authMiddleware } from "./middleware/auth.js";
import { requireFirebaseUserAuth } from "./middleware/firebaseUserAuth.js";
import {
  firebaseUserRateLimitMiddleware,
  publicWriteRateLimitMiddleware,
  rateLimitMiddleware,
} from "./middleware/rateLimit.js";
import { errorHandler } from "./lib/errors.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import papersRouter from "./routes/papers.js";
import hypothesesRouter from "./routes/hypotheses.js";
import adminRouter from "./routes/admin.js";
import communityRouter from "./routes/community.js";
import publicRouter from "./routes/public.js";
import type { AuthenticatedRequest } from "./types/index.js";

const jwtSecret = defineSecret("JWT_SIGNING_SECRET");

initializeApp();

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Public routes (no auth)
app.use("/health", healthRouter);
app.use("/auth", publicWriteRateLimitMiddleware as express.RequestHandler, authRouter);
app.use("/public", publicRouter);

// Browser-user routes
app.use(
  "/community",
  requireFirebaseUserAuth as express.RequestHandler,
  firebaseUserRateLimitMiddleware as express.RequestHandler,
  communityRouter,
);

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

export const api = onRequest(
  { region: "europe-west1", secrets: [jwtSecret] },
  app,
);
// force redeploy Fri Apr  3 06:48:18 PM CEST 2026

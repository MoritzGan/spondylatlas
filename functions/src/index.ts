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

// Mount all routes on a sub-router so we can serve them at both "/" and "/api"
// Firebase Hosting rewrites /api/** to this function WITHOUT stripping the prefix,
// while direct Cloud Run access uses paths without /api.
const routes = express.Router();

// Public routes (no auth)
routes.use("/health", healthRouter);
routes.use("/auth", publicWriteRateLimitMiddleware as express.RequestHandler, authRouter);
routes.use("/public", publicRouter);

// Browser-user routes
routes.use(
  "/community",
  requireFirebaseUserAuth as express.RequestHandler,
  firebaseUserRateLimitMiddleware as express.RequestHandler,
  communityRouter,
);

// Authenticated routes
routes.use(authMiddleware as express.RequestHandler);
routes.use(rateLimitMiddleware as express.RequestHandler);
routes.use("/papers", papersRouter);
routes.use("/hypotheses", hypothesesRouter);
routes.use("/admin", adminRouter);

// Audit logging for authenticated requests
routes.use((req, _res, next) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.agent) {
    console.log(
      `[audit] agent=${authReq.agent.id} method=${req.method} path=${req.path}`,
    );
  }
  next();
});

// Mount at root (direct Cloud Run / SDK access) and at /api (Firebase Hosting rewrite)
app.use("/", routes);
app.use("/api", routes);

app.use(errorHandler as express.ErrorRequestHandler);

export const api = onRequest(
  { region: "europe-west1", secrets: [jwtSecret] },
  app,
);

import type { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { ApiError } from "../lib/errors.js";
import type { FirebaseUserInfo } from "../types/index.js";

function extractBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
}

function toFirebaseUser(decodedToken: Awaited<ReturnType<ReturnType<typeof getAuth>["verifyIdToken"]>>): FirebaseUserInfo {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    emailVerified: decodedToken.email_verified === true,
    name: typeof decodedToken.name === "string" ? decodedToken.name : null,
  };
}

export async function verifyOptionalFirebaseUser(req: Request) {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return toFirebaseUser(decodedToken);
  } catch {
    throw ApiError.unauthorized("Invalid Firebase ID token");
  }
}

export async function requireFirebaseUserAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const firebaseUser = await verifyOptionalFirebaseUser(req);
    if (!firebaseUser) {
      next(ApiError.unauthorized("Missing Firebase ID token"));
      return;
    }

    (req as Request & { firebaseUser?: FirebaseUserInfo }).firebaseUser = firebaseUser;
    next();
  } catch (err) {
    next(err);
  }
}

import type { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static unauthorized(message = "Invalid or missing authentication") {
    return new ApiError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Insufficient permissions") {
    return new ApiError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found") {
    return new ApiError("NOT_FOUND", message, 404);
  }

  static conflict(message: string) {
    return new ApiError("CONFLICT", message, 409);
  }

  static validation(message: string) {
    return new ApiError("VALIDATION_ERROR", message, 400);
  }

  static rateLimited(message = "Rate limit exceeded") {
    return new ApiError("RATE_LIMITED", message, 429);
  }

  static internal(message = "Internal server error") {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, status: err.status },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error", status: 500 },
  });
}

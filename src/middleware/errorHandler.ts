import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: "Route not found."
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed.",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
  }

  logger.error(
    {
      error
    },
    "Unhandled application error"
  );

  return res.status(500).json({
    error: "Internal server error."
  });
}

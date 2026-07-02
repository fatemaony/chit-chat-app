import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/errors.js";
import { ZodError } from "zod/v3";
import { logger } from "../lib/logger.js";




export const errorHandler : ErrorRequestHandler = (err, req, res, _next) => {
  let status=500;
  let message='Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof HttpError) {
    message = err.message;
    status = err.status;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Invalid Request Data';
    details = err.issues.map(issue=>({
      path: issue.path,
      message: issue.message,
    }))
  }

  const errorStack = err instanceof Error ? err.stack : JSON.stringify(err);
  logger.error(`${req.method} ${req.url} ----> ${status}-${message}\n${errorStack}`);

  res.status(status).json({
    error: {
      message,
      status,
      details,
    }
  });
}




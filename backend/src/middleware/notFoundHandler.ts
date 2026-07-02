import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../lib/errors.js";




export function notFoundHandler( req: Request, _res: Response, next: NextFunction ) {
  next(new NotFoundError("Route not found"));
}
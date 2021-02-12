import { NextFunction, Request, Response } from "express";

export function endMiddleware(req: Request, res: Response, next: NextFunction): void
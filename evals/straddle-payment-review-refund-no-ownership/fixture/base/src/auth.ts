import type { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "./tokens.js";

export interface AuthedRequest extends Request {
  user: { id: string };
}

// Bearer-token auth: the browser sends Authorization, never a cookie.
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const user = verifySessionToken(header.replace(/^Bearer /, ""));
  if (!user) return res.status(401).json({ error: "sign in" });
  (req as AuthedRequest).user = user;
  next();
}

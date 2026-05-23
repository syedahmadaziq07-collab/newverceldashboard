import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminRequest extends Request {
  admin?: { role: string };
}

export function verifyAdminToken(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or malformed authorization header." });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ success: false, message: "Server misconfiguration: JWT_SECRET not set." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { role: string };
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env["JWT_SECRET"] || "jb-jewellery-secret-key-2024";
const JWT_EXPIRES = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as Request & { user: JwtPayload }).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  });
}

// Simple shared-token middleware for the new Supabase-backed admin endpoints.
// Browser admin panel sends VITE_ADMIN_PASSWORD in the `x-admin-token` header.
export function simpleAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers["x-admin-token"];
  const expected =
    process.env["ADMIN_PASSWORD"] || process.env["VITE_ADMIN_PASSWORD"];
  if (!expected) {
    res.status(500).json({ error: "Admin token not configured on server" });
    return;
  }
  if (typeof token !== "string" || token !== expected) {
    res.status(401).json({ error: "Unauthorized admin" });
    return;
  }
  next();
}

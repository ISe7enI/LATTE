import type { Request, Response, NextFunction } from "express";

export type AppRole = "user" | "coach";

export type AuthContext = {
  userId: string;
  role: AppRole;
};

function normalizeRole(value: string | undefined): AppRole | null {
  if (!value) return null;
  if (value === "user" || value === "coach") return value;
  return null;
}

export function parseAuth(req: Request): AuthContext | null {
  const userId = String(req.header("x-user-id") ?? "").trim();
  const role = normalizeRole(String(req.header("x-user-role") ?? "").trim());
  if (!userId || !role) return null;
  return { userId, role };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = parseAuth(req);
  if (!auth) {
    return res.status(401).json({ message: "Missing auth headers: x-user-id / x-user-role" });
  }
  (req as Request & { auth?: AuthContext }).auth = auth;
  return next();
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  const auth = parseAuth(req);
  if (!auth) {
    return res.status(401).json({ message: "Missing auth headers: x-user-id / x-user-role" });
  }
  if (auth.role !== "coach") {
    return res.status(403).json({ message: "Coach role required" });
  }
  (req as Request & { auth?: AuthContext }).auth = auth;
  return next();
}

export function isSelfOrCoach(auth: AuthContext, targetUserId: string) {
  return auth.role === "coach" || auth.userId === targetUserId;
}

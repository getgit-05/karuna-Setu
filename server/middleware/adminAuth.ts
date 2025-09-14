import { RequestHandler } from "express";
import { verifyAdminToken } from "../auth";

export const requireAdminKey: RequestHandler = (req, res, next) => {
  // First allow legacy x-admin-key for backwards compat
  const adminKey = process.env.ADMIN_API_KEY;
  const providedKey =
    (req.headers["x-admin-key"] as string | undefined) || undefined;
  if (adminKey && providedKey && adminKey === providedKey) return next();

  // Then check Authorization: Bearer <token>
  const auth = (req.headers["authorization"] as string | undefined) || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.replace("Bearer ", "");
  const verified = verifyAdminToken(token);
  if (!verified) return res.status(401).json({ error: "Unauthorized" });
  // attach admin info if needed
  (req as any).admin = verified;
  next();
};

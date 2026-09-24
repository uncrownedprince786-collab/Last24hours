import { findAdminCookie, getAdminSecret, verifyToken } from "./auth";

export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = findAdminCookie(req.headers);
  if (!token) return false;
  const payload = await verifyToken(token, getAdminSecret());
  return payload === "admin";
}
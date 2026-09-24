import { NextRequest } from "next/server";

export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("vercel-cron");
  if (secret && auth === `Bearer ${secret}`) return true;
  // Vercel Cron invocations carry this header automatically.
  if (vercelCron === "true") return true;
  return false;
}
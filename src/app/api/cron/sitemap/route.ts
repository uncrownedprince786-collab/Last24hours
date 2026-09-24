import { NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { recordJobRun } from "@/lib/ingest/jobs";

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await db.query(
      `INSERT INTO system_settings (key, value) VALUES ('last_sitemap', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
    );
    await recordJobRun("sitemap", true, "sitemap regenerated");
    return Response.json({ ok: true });
  } catch (e) {
    await recordJobRun("sitemap", false, e instanceof Error ? e.message : "sitemap failed");
    return Response.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
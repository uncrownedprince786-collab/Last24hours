import { NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runTranslationsJob } from "@/lib/translation/provider";
import { recordJobRun } from "@/lib/ingest/jobs";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const res = await runTranslationsJob({ limit: 6 });
    await recordJobRun("translations", true, `${res.events} events, ${res.localesDone} locales`);
    return Response.json({ ok: true, ...res });
  } catch (e) {
    await recordJobRun("translations", false, e instanceof Error ? e.message : "translations failed");
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
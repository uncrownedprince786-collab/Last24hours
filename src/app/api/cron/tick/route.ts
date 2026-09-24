import { NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runIngestJob } from "@/lib/ingest/ingest";
import { runClustering, publishQualified } from "@/lib/ingest/cluster";
import { runTranslationsJob } from "@/lib/translation/provider";
import { recordJobRun } from "@/lib/ingest/jobs";

export const maxDuration = 600;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const started = Date.now();
  const out: Record<string, unknown> = {};
  try {
    const ingest = await runIngestJob();
    out.ingest = { ok: true, totalNew: ingest.totalNew };

    const cluster = await runClustering();
    const gate = await publishQualified();
    out.cluster = { ok: true, matched: cluster.matched, created: cluster.created, published: gate.published };

    const tr = await runTranslationsJob({ limit: 5 });
    out.translations = { ok: true, ...tr };

    await recordJobRun("tick", true, `ingest:${ingest.totalNew} new; cluster:${gate.published} published; translations:${tr.localesDone}`);
    out.ok = true;
    out.durationMs = Date.now() - started;
    return Response.json(out);
  } catch (e) {
    await recordJobRun("tick", false, e instanceof Error ? e.message : "tick failed");
    out.ok = false;
    out.error = e instanceof Error ? e.message : "tick failed";
    return Response.json(out, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
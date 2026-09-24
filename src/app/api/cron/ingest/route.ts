import { NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runIngestJob } from "@/lib/ingest/ingest";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { results, totalNew } = await runIngestJob();
    return Response.json({
      ok: true,
      totalNew,
      feeds: results.map((r) => ({
        source: r.sourceName,
        fetched: r.fetchedItems,
        newItems: r.newItems,
        ok: r.ok,
        error: r.error ?? null,
        ms: r.responseMs,
      })),
    });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "ingest failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
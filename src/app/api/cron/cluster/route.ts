import { NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runClustering, publishQualified } from "@/lib/ingest/cluster";
import { recordJobRun } from "@/lib/ingest/jobs";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const cluster = await runClustering();
    const gate = await publishQualified();
    await recordJobRun(
      "cluster",
      true,
      `${cluster.matched} matched, ${cluster.created} created, ${gate.published} published`
    );
    return Response.json({
      ok: true,
      matched: cluster.matched,
      created: cluster.created,
      published: gate.published,
      pending: gate.pending,
      rejected: gate.rejected,
    });
  } catch (e) {
    await recordJobRun("cluster", false, e instanceof Error ? e.message : "cluster failed");
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "cluster failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
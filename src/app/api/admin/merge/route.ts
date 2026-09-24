import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { refreshEventContent } from "@/lib/ingest/cluster";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { fromId?: unknown; toId?: unknown } | null;
  const fromId = Number(body?.fromId);
  const toId = Number(body?.toId);
  if (!Number.isInteger(fromId) || !Number.isInteger(toId) || fromId === toId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    // move source reports + dependent rows from fromId into toId
    await db.query(
      `INSERT INTO event_sources (event_id, report_id, headline, summary, url, position)
       SELECT $2, es.report_id, es.headline, es.summary, es.url,
              (SELECT count(*) FROM event_sources WHERE event_id = $2) + es.position
       FROM event_sources es WHERE es.event_id = $1
       ON CONFLICT (event_id, report_id) DO NOTHING`,
      [fromId, toId]
    );
    await db.query(`UPDATE source_reports SET event_id = $2 WHERE event_id = $1`, [fromId, toId]);
    await db.query(
      `INSERT INTO claims (event_id, report_id, statement, attribution, certainty, position)
       SELECT $2, c.report_id, c.statement, c.attribution, c.certainty, c.position
       FROM claims c WHERE c.event_id = $1`,
      [fromId, toId]
    );
    await db.query(
      `INSERT INTO timeline_entries (event_id, occurred_at, label, detail, report_id, position)
       SELECT $2, t.occurred_at, t.label, t.detail, t.report_id, t.position
       FROM timeline_entries t WHERE t.event_id = $1`,
      [fromId, toId]
    );
    await db.query(`UPDATE events SET source_count = source_count + (SELECT count(*) FROM event_sources WHERE event_id=$1) WHERE id=$2`, [fromId, toId]);
    await db.query(`UPDATE events SET source_count = 0, status='hidden' WHERE id=$1`, [fromId]);
    await refreshEventContent(toId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
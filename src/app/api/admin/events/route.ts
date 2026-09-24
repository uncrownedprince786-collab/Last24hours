import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { refreshEventContent } from "@/lib/ingest/cluster";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    id?: unknown; action?: unknown;
    headline?: unknown; summary?: unknown; category?: unknown;
    background?: unknown; status?: unknown; slug?: unknown;
  } | null;
  if (!body) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const action = String(body?.action ?? "");

  try {
    switch (action) {
      case "publish":
        await db.query(`UPDATE events SET status='published', published_at = COALESCE(published_at, now()) WHERE id=$1`, [id]);
        break;
      case "hide":
        await db.query(`UPDATE events SET status='hidden' WHERE id=$1`, [id]);
        break;
      case "reject":
        await db.query(`UPDATE events SET status='rejected' WHERE id=$1`, [id]);
        break;
      case "pending":
        await db.query(`UPDATE events SET status='pending' WHERE id=$1`, [id]);
        break;
      case "edit": {
        const sets: string[] = [];
        const params: unknown[] = [id];
        const fields: { key: string; value: unknown }[] = [
          { key: "headline", value: body.headline },
          { key: "summary", value: body.summary },
          { key: "category", value: body.category },
          { key: "background", value: body.background },
        ];
        for (const f of fields) {
          if (typeof f.value === "string") {
            params.push(f.value);
            sets.push(`${f.key} = $${params.length}`);
          }
        }
        if (sets.length === 0) return NextResponse.json({ ok: true });
        await db.query(`UPDATE events SET ${sets.join(", ")}, last_updated = now() WHERE id=$1`, params);
        await refreshEventContent(id).catch(() => {});
        break;
      }
      case "set-slug": {
        if (typeof body.slug === "string" && body.slug) {
          await db.query(`UPDATE events SET slug = $2 WHERE id = $1`, [id, body.slug]);
        }
        break;
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
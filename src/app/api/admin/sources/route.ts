import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: unknown; enabled?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400 });
  await db.query(`UPDATE sources SET enabled = $2 WHERE id = $1`, [id, body.enabled]);
  return NextResponse.json({ ok: true });
}
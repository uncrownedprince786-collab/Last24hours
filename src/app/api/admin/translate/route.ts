import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { translateEvent } from "@/lib/translation/provider";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { eventId?: unknown } | null;
  const eventId = Number(body?.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const done = await translateEvent(eventId);
    return NextResponse.json({ ok: true, localesDone: done });
  } catch (e) {
    void db;
    return NextResponse.json({ error: e instanceof Error ? e.message : "translation failed" }, { status: 500 });
  }
}
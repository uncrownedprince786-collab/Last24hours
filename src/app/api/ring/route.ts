import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { eventId?: unknown; ref?: unknown } | null;
    const eventId = Number(body?.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) return new Response("bad request", { status: 400 });
    const ref = typeof body?.ref === "string" ? body.ref.slice(0, 255) : null;
    await query(
      `INSERT INTO page_views (event_id, viewed_at, referrer) VALUES ($1, now(), $2)`,
      [eventId, ref]
    ).catch(() => {});
    return new Response("ok", { status: 204 });
  } catch {
    return new Response("error", { status: 500 });
  }
}
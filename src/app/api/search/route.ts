import { query } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit")) || 6));
  if (q.length < 2) return Response.json({ suggestions: [] });

  const term = `%${q}%`;
  const { rows } = await query<{ slug: string; headline: string; category: string }>(
    `SELECT slug, headline, category FROM events
     WHERE status = 'published' AND (headline ILIKE $1 OR summary ILIKE $1 OR latest_development ILIKE $1)
     ORDER BY last_updated DESC LIMIT $2`,
    [term, limit]
  );

  const suggestions = rows.map((r) => {
    const cat = ["world","business","technology","science","politics","economy","sports","culture","pakistan","explainers"].includes(r.category ?? "")
      ? r.category!
      : "story";
    return { slug: r.slug, headline: r.headline, url: `/${cat}/${r.slug}` };
  });

  return Response.json({ suggestions });
}
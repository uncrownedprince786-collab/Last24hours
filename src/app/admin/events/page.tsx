import { db } from "@/lib/db";
import { EventRow } from "@/components/admin/event-row";

export const revalidate = 30;

export default async function AdminEventsPage() {
  const { rows } = await db.query<{
    id: number; slug: string; headline: string; category: string | null;
    status: string; sourceCount: number; lastUpdated: Date; summary: string | null;
  }>(
    `SELECT id, slug, headline, category, status, source_count AS "sourceCount",
            last_updated AS "lastUpdated", summary
     FROM events ORDER BY last_updated DESC LIMIT 250`
  );

  const filter = (status: string) =>
    rows.filter((r) => r.status === status).length;

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Events</h1>
      <p className="mb-6 text-sm text-muted">
        Published {filter("published")} · Pending {filter("pending")} · Hidden {filter("hidden")} · Rejected {filter("rejected")}
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <EventRow key={r.id} row={{
            id: r.id,
            slug: r.slug,
            headline: r.headline,
            category: r.category,
            status: r.status,
            sourceCount: r.sourceCount,
            lastUpdated: r.lastUpdated.toISOString(),
          }} summary={r.summary} />
        ))}
      </div>
    </div>
  );
}
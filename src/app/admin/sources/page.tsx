import { db } from "@/lib/db";
import { SourceToggle } from "@/components/admin/source-toggle";

export const revalidate = 60;

export default async function AdminSourcesPage() {
  const { rows } = await db.query<{
    id: number; name: string; domain: string; category: string | null;
    enabled: boolean; health: string; consecutiveFailures: number;
    lastSuccess: Date | null; lastFailure: Date | null; feedUrl: string | null;
  }>(
    `SELECT s.id, s.name, s.domain, s.category, s.enabled, s.health,
            s.consecutive_failures AS "consecutiveFailures",
            s.last_success AS "lastSuccess", s.last_failure AS "lastFailure",
            (SELECT string_agg(f.feed_url, ', ') FROM source_feeds f WHERE f.source_id = s.id) AS "feedUrl"
     FROM sources s ORDER BY s.name`
  );

  const healthDot = (h: string) =>
    h === "green" ? "bg-green-600" : h === "yellow" ? "bg-yellow-500" : "bg-red-600";

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Sources</h1>
      <p className="mb-6 text-sm text-muted">
        Public feeds · metadata (headline, summary, timestamp, thumbnail) only · always attributed and linked.
      </p>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-4 rounded-xl border border-line bg-card p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthDot(s.health)}`} />
                <p className="font-display font-semibold">{s.name}</p>
                <span className="text-xs text-muted">({s.domain})</span>
                <span className="rounded bg-paper-deep px-1.5 py-0.5 text-xs text-muted">{s.category ?? "—"}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted">{s.feedUrl}</p>
              <p className="mt-1 text-xs text-muted">
                {s.lastSuccess ? `OK ${s.lastSuccess.toLocaleString()}` : "never succeeded"} ·
                {s.lastFailure ? ` failed ${s.lastFailure.toLocaleString()}` : ""} ·
                {s.consecutiveFailures > 0 ? ` ${s.consecutiveFailures} consecutive` : ""}
              </p>
            </div>
            <SourceToggle id={s.id} enabled={s.enabled} />
          </div>
        ))}
      </div>
    </div>
  );
}
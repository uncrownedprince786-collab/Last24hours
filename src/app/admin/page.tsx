import Link from "next/link";
import { db } from "@/lib/db";

export const revalidate = 60;

export default async function AdminDashboard() {
  const [stats, health, recent, jobs] = await Promise.all([
    db.query<{ k: string; n: number }>(
      `SELECT status AS k, count(*)::int AS n FROM events GROUP BY status`
    ),
    db.query<{ status: string; n: number }>(
      `SELECT COALESCE(health,'green') AS status, count(*)::int AS n FROM sources GROUP BY health`
    ),
    db.query<{ id: number; headline: string; status: string; lastUpdated: Date }>(
      `SELECT id, headline, status, last_updated AS "lastUpdated" FROM events ORDER BY last_updated DESC LIMIT 10`
    ),
    db.query<{ name: string; lastRun: Date | null; lastStatus: string | null; lastDetail: string | null }>(
      `SELECT name, last_run AS "lastRun", last_status AS "lastStatus", last_detail AS "lastDetail"
       FROM jobs ORDER BY last_run DESC NULLS LAST`
    ),
  ]);

  const map: Record<string, number> = {};
  for (const r of stats.rows) map[r.k] = r.n;
  const hmap: Record<string, number> = {};
  for (const r of health.rows) hmap[r.status] = r.n;

  const statCards = [
    { label: "Published", value: map["published"] ?? 0 },
    { label: "Pending", value: map["pending"] ?? 0 },
    { label: "Hidden", value: map["hidden"] ?? 0 },
    { label: "Rejected", value: map["rejected"] ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="rounded-full border border-green-600/40 bg-green-600/5 px-3 py-1 text-sm">
          Sources healthy: {hmap["green"] ?? 0}
        </span>
        <span className="rounded-full border border-yellow-600/40 bg-yellow-600/5 px-3 py-1 text-sm">
          Degraded: {hmap["yellow"] ?? 0}
        </span>
        <span className="rounded-full border border-red-600/40 bg-red-600/5 px-3 py-1 text-sm">
          Failing: {hmap["red"] ?? 0}
        </span>
      </div>

      <section>
        <h2 className="mb-3 border-b border-line pb-1 font-display text-lg font-bold">Recent events</h2>
        <div className="space-y-2">
          {recent.rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded border border-line bg-card px-3 py-2">
              <span className="truncate text-sm">{r.headline}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span className="rounded bg-paper-deep px-2 py-0.5">{r.status}</span>
                {r.lastUpdated.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 border-b border-line pb-1 font-display text-lg font-bold">Jobs</h2>
        <div className="space-y-2">
          {jobs.rows.length === 0 && <p className="text-sm text-muted">No jobs have run yet.</p>}
          {jobs.rows.map((j) => (
            <div key={j.name} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold">{j.name}</span>
              <span className="text-xs text-muted">
                {j.lastRun ? j.lastRun.toLocaleString() : "never"} · {j.lastStatus ?? "—"} · {j.lastDetail ?? ""}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Trigger ingestion:
          <code className="ml-1 rounded bg-card px-1.5 py-0.5">curl -H "Authorization: Bearer $CRON_SECRET" https://last24hours.vercel.app/api/cron/ingest</code>
        </p>
      </section>

      <p>
        <Link href="/admin/events" className="text-sm text-accent underline">Moderate events →</Link>
      </p>
    </div>
  );
}
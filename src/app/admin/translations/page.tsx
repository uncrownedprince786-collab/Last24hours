import { db } from "@/lib/db";
import { TranslateButton } from "@/components/admin/translate-button";

export const revalidate = 60;

export default async function AdminTranslationsPage() {
  const { rows } = await db.query<{
    id: number; headline: string; status: string; t: string | null;
  }>(
    `SELECT e.id, e.headline, e.status,
            (SELECT string_agg(t.locale || ':' || t.status, ' ') FROM translations t WHERE t.event_id = e.id) AS t
     FROM events e
     WHERE e.status IN ('published','pending')
     ORDER BY e.last_updated DESC LIMIT 150`
  );

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Translations</h1>
      <p className="mb-6 text-sm text-muted">
        Free provider (best-effort, rate limited) or edit text. Target locales: ur, ar, es, de, fr.
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.headline}</p>
              <p className="text-xs text-muted">{r.t ?? "no translations"}</p>
            </div>
            <TranslateButton eventId={r.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
import { db } from "../db";
import { jaccard, headlineHash, tokenize, normalizeHeadline } from "../normalize";
import { slugify, ensureUniqueSlug } from "../slug";
import { buildSage, asSentence } from "./summarize";
import { recordJobRun, logJobRun } from "./jobs";

const CATEGORIES = new Set([
  "world", "business", "technology", "science", "politics", "economy",
  "sports", "culture", "pakistan", "explainers",
]);

const MATCH_THRESHOLD = 0.52;

type ReportRow = {
  id: bigint | string;
  url: string;
  headline: string;
  summary: string | null;
  excerpt: string | null;
  published_at: Date | null;
  category: string | null;
  lang: string | null;
  source_name: string | null;
  source_country: string | null;
  image_url: string | null;
  tokens: string[];
};

type EventRow = {
  id: number;
  slug: string;
  headline: string;
  category: string | null;
  country: string | null;
  status: string;
  tokens: string[];
  hash: string;
};

function normalizeSeverity(count: number): "red" | "yellow" | "green" {
  return count >= 3 ? "red" : count > 0 ? "yellow" : "green";
}

export async function runClustering(): Promise<{
  matched: number;
  created: number;
  published: number;
  pending: number;
  rejected: number;
}> {
  const started = Date.now();
  try {
    const reports = await db.query<ReportRow>(
      `SELECT r.id, r.url, r.headline, r.summary, r.excerpt, r.published_at, r.category, r.lang,
              s.name AS source_name, s.country AS source_country, r.image_url
       FROM source_reports r
       JOIN sources s ON s.id = r.source_id
       WHERE r.event_id IS NULL AND r.status = 'new'
       ORDER BY r.published_at DESC NULLS LAST
       LIMIT 500`
    );
    if (reports.rows.length === 0) {
      await recordJobRun("cluster", true, "0 pending reports");
      return { matched: 0, created: 0, published: 0, pending: 0, rejected: 0 };
    }

    const events = await db.query<EventRow>(
      `SELECT e.id, e.slug, e.headline, e.category, e.country, e.status
       FROM events e
       WHERE e.status IN ('published','pending') AND e.last_updated > now() - interval '45 days'
       LIMIT 1200`
    );
    const eventPool: (EventRow & { tokens: string[]; hash: string })[] = events.rows.map((e) => ({
      ...e,
      tokens: tokenize(normalizeHeadline(e.headline)),
      hash: headlineHash(e.headline),
    }));
    const usedSlugs = new Set(events.rows.map((e) => e.slug));

    const countries = await db.query<{ code: string; name: string }>(`SELECT code, name FROM countries`);
    const countryList = countries.rows.sort((a, b) => b.name.length - a.name.length);

    let matched = 0;
    let created = 0;
    const attached: { eventId: number; report: ReportRow }[] = [];

    for (const r of reports.rows) {
      const tokens = tokenize(normalizeHeadline(r.headline));
      r.tokens = tokens;

      let best: { id: number; score: number; slug: string } | null = null;
      const hash = headlineHash(r.headline);
      for (const ev of eventPool) {
        if (ev.hash === hash) {
          best = { id: ev.id, score: 1, slug: ev.slug };
          break;
        }
        const score = jaccard(tokens, ev.tokens);
        if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
          best = { id: ev.id, score, slug: ev.slug };
        }
      }

      if (best) {
        attached.push({ eventId: best.id, report: r });
        matched += 1;
      } else {
        // quality gate before creating a thin page
        if (r.headline.length < 25) continue;
        if ((r.summary ?? "").length < 30 && (r.excerpt ?? "").length < 30 && r.headline.length < 60) continue;
        const category = r.category && CATEGORIES.has(r.category) ? r.category : "world";
        const country = detectCountry(`${r.headline} ${r.summary ?? ""}`, countryList) ?? r.source_country ?? null;
        const baseSlug = slugify(r.headline);
        const slug = ensureUniqueSlug(baseSlug, usedSlugs);

        const ins = await db.query<{ id: number }>(
          `INSERT INTO events (slug, locale, category, country, status, headline, importance, last_updated, first_seen)
           VALUES ($1, $2, $3, $4, 'pending', $5, 4, now(), now())
           RETURNING id`,
          [slug, r.lang ?? "en", category, country, r.headline]
        );
        const eventId = ins.rows[0].id;
        eventPool.push({
          id: eventId, slug, headline: r.headline, category, country,
          status: "pending", tokens, hash,
        });
        usedSlugs.add(slug);
        attached.push({ eventId, report: r });
        created += 1;
      }
    }

    for (const a of attached) {
      await attachReportToEvent(a.eventId, a.report);
    }
    // refresh content for all touched events atomically-ish
    for (const a of attached) {
      await refreshEventContent(a.eventId);
    }

    const gate = await publishQualified();
    if (gate.rejected) {
      await db.query(
        `UPDATE events SET status = 'hidden' WHERE status = 'pending' AND source_count = 0`
      );
    }

    await recordJobRun("cluster", true, `${matched} matched, ${created} created, ${gate.published} published`);
    await logJobRun("cluster", matched + created > 0 ? "ok" : "ok", `${matched} matched; ${created} created; ${gate.published} published`, Date.now() - started);
    return { matched, created, published: gate.published, pending: gate.pending, rejected: gate.rejected };
  } catch (e) {
    await recordJobRun("cluster", false, e instanceof Error ? e.message : "cluster error");
    throw e;
  }
}

async function attachReportToEvent(eventId: number, r: ReportRow): Promise<void> {
  const pos = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM event_sources WHERE event_id = $1`, [eventId]
  );
  const existing = await db.query(
    `SELECT 1 FROM event_sources WHERE event_id = $1 AND report_id = $2`,
    [eventId, r.id]
  );
  if (existing.rows.length > 0) return;

  await db.query(
    `INSERT INTO event_sources (event_id, report_id, headline, summary, url, position)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [eventId, r.id, r.headline, asSentence(r.summary ?? ""), r.url, (pos.rows[0]?.n ?? 0) + 1]
  );
  await db.query(
    `UPDATE source_reports SET event_id = $1 WHERE id = $2`,
    [eventId, r.id]
  );
  const sentence = asSentence(r.summary ?? "");
  if (sentence) {
    await db.query(
      `INSERT INTO claims (event_id, report_id, statement, attribution, certainty, position)
       VALUES ($1,$2,$3,$4,'attributed',$5)`,
      [eventId, r.id, sentence, r.source_name, pos.rows[0]?.n ?? 0]
    );
  }
  if (r.published_at) {
    await db.query(
      `INSERT INTO timeline_entries (event_id, occurred_at, label, detail, report_id, position)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [eventId, r.published_at, r.headline, sentence || null, r.id, pos.rows[0]?.n ?? 0]
    );
  }
  await db.query(
    `UPDATE events SET source_count = source_count + 1, update_count = update_count + 1, last_updated = now()
     WHERE id = $1`,
    [eventId]
  );
}

export async function refreshEventContent(eventId: number): Promise<void> {
  const { rows } = await db.query<{
    report_id: string;
    summary: string | null;
    published_at: Date | null;
    name: string;
  }>(
    `SELECT es.report_id, es.summary, r.published_at, s.name
     FROM event_sources es
     JOIN source_reports r ON r.id = es.report_id
     JOIN sources s ON s.id = r.source_id
     WHERE es.event_id = $1
     ORDER BY r.published_at DESC NULLS LAST`,
    [eventId]
  );
  const event = await db.query<{ headline: string; id: number }>(
    `SELECT id, headline FROM events WHERE id = $1`, [eventId]
  );
  if (!event.rows[0]) return;
  const sage = buildSage(
    event.rows[0].headline,
    rows.map((r) => ({ name: r.name, summary: r.summary ?? "", published: r.published_at }))
  );

  const newest = rows[0];
  let latestDev: string | null = sage.latestDevelopment;
  if (newest?.summary) latestDev = asSentence(newest.summary, 200);

  const confirmed = sage.confirmed.length >= 1 ? sage.confirmed : rows.length >= 2 ? sage.keyFacts.slice(0, 2).map((f) => f.statement) : [];
  const developing = sage.developing.length >= 1 ? sage.developing : (latestDev ? [latestDev] : []);

  await db.query(
    `UPDATE events SET summary = $2, key_facts = $3::jsonb, confirmed = $4::jsonb, developing = $5::jsonb,
            latest_development = $6, importance = LEAST(8, GREATEST(2, 4 + source_count - 1))
     WHERE id = $1`,
    [eventId, sage.summary, JSON.stringify(sage.keyFacts), JSON.stringify(confirmed), JSON.stringify(developing), latestDev]
  );
}

function detectCountry(text: string, list: { code: string; name: string }[]): string | null {
  const lower = text.toLowerCase();
  for (const c of list) {
    if (c.name.length < 4) continue;
    if (lower.includes(c.name.toLowerCase())) return c.code;
  }
  return null;
}

export async function publishQualified(): Promise<{ published: number; pending: number; rejected: number }> {
  const qual = await db.query<{ id: number }>(
    `SELECT e.id FROM events e
     WHERE e.status = 'pending'
       AND e.source_count >= 1
       AND length(e.headline) >= 25
       AND (length(coalesce(e.summary,'')) >= 40)
     ORDER BY e.first_seen DESC`
  );
  for (const row of qual.rows) {
    await db.query(
      `UPDATE events SET status = 'published', published_at = COALESCE(published_at, now()) WHERE id = $1`,
      [row.id]
    );
  }
  const pending = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM events WHERE status = 'pending'`
  );
  const rejected = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM events WHERE status = 'hidden' AND source_count = 0`
  );
  return { published: qual.rows.length, pending: pending.rows[0]?.n ?? 0, rejected: rejected.rows[0]?.n ?? 0 };
}

export async function runClusterJob(): Promise<Awaited<ReturnType<typeof runClustering>>> {
  const prev = await Promise.resolve(null);
  void prev;
  // Published events can gain updates on every cluster run.
  const res = runClustering();
  const gate = publishQualified();
  const [r, g] = await Promise.all([res, gate]);
  void normalizeSeverity;
  return { ...r, published: g.published, pending: g.pending, rejected: g.rejected };
}
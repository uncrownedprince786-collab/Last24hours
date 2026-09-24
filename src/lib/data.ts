import { db } from "./db";
import { LOCALES, DEFAULT_LOCALE } from "./i18n/config";

export type CardEvent = {
  id: number;
  slug: string;
  headline: string;
  category: string | null;
  country: string | null;
  summary: string | null;
  latestDevelopment: string | null;
  lastUpdated: Date;
  publishedAt: Date | null;
  sourceCount: number;
  updateCount: number;
  importance: number;
  image: string | null;
  sourceNames: string[];
};

export type StoryEvent = CardEvent & {
  keyFacts: { statement: string; attribution: string; certainty: string }[];
  confirmed: string[];
  developing: string[];
  background: string | null;
  sourcesReports: {
    headline: string;
    summary: string;
    url: string;
    sourceName: string;
    sourceDomain: string;
    publishedAt: Date | null;
    position: number;
  }[];
  timeline: { occurredAt: Date | null; label: string; detail: string | null; position: number }[];
  chapter: string | null;
};

const CARD_SELECT = `
SELECT e.id, e.slug, e.headline, e.category, e.country, e.summary, e.latest_development,
       e.last_updated AS "lastUpdated", e.published_at AS "publishedAt",
       e.source_count AS "sourceCount", e.update_count AS "updateCount",
       e.importance, e.status,
       (SELECT r.image_url
          FROM event_sources es
          JOIN source_reports r ON r.id = es.report_id
         WHERE es.event_id = e.id AND r.image_url IS NOT NULL
         ORDER BY es.position LIMIT 1) AS image,
       (SELECT string_agg(DISTINCT s.name, ', ')
          FROM event_sources es2
          JOIN source_reports r2 ON r2.id = es2.report_id
          JOIN sources s ON s.id = r2.source_id
         WHERE es2.event_id = e.id) AS source_names
FROM events e
`;

function rowToCard(row: Record<string, unknown>): CardEvent {
  return {
    id: row.id as number,
    slug: row.slug as string,
    headline: row.headline as string,
    category: (row.category as string) ?? null,
    country: (row.country as string) ?? null,
    summary: (row.summary as string) ?? null,
    latestDevelopment: (row.latest_development as string) ?? null,
    lastUpdated: row.lastUpdated as Date,
    publishedAt: (row.publishedAt as Date) ?? null,
    sourceCount: row.sourceCount as number,
    updateCount: row.updateCount as number,
    importance: row.importance as number,
    image: (row.image as string) ?? null,
    sourceNames: ((row.source_names as string) ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

export async function homeSections(locale: string, limit = 10): Promise<{
  top: CardEvent[];
  breaking: CardEvent[];
  world: CardEvent[];
  businessEconomy: CardEvent[];
  technology: CardEvent[];
  science: CardEvent[];
  pakistan: CardEvent[];
  mostUpdated: CardEvent[];
  explained: CardEvent[];
}> {
  const q = async (where: string, extra: string, lmt: number): Promise<CardEvent[]> => {
    const { rows } = await db.query(
      `${CARD_SELECT} WHERE e.status = 'published' ${where} ORDER BY ${extra} LIMIT ${lmt}`
    );
    return rows.map(rowToCard);
  };
  const [top, breaking, world, be, tech, sci, pak, mostUpdated, explained] = await Promise.all([
    q("", "e.published_at DESC NULLS LAST", limit),
    q("AND e.importance >= 6", "e.last_updated DESC", 6),
    q("AND e.category = 'world'", "e.published_at DESC NULLS LAST", limit),
    q("AND e.category IN ('business','economy')", "e.published_at DESC NULLS LAST", 8),
    q("AND e.category = 'technology'", "e.published_at DESC NULLS LAST", 6),
    q("AND e.category = 'science'", "e.published_at DESC NULLS LAST", 6),
    q("AND e.category = 'pakistan'", "e.published_at DESC NULLS LAST", 8),
    q("", "e.update_count DESC, e.last_updated DESC", 8),
    q("AND e.category = 'explainers'", "e.published_at DESC NULLS LAST", 6),
  ]);
  void locale;
  return {
    top,
    breaking: breaking.slice(0, 6),
    world,
    businessEconomy: be,
    technology: tech,
    science: sci,
    pakistan: pak,
    mostUpdated,
    explained,
  };
}

export async function categoryEvents(locale: string, category: string, page = 1, perPage = 24): Promise<{ events: CardEvent[]; total: number; page: number; perPage: number }> {
  const offset = (page - 1) * perPage;
  const count = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM events WHERE status = 'published' AND category = $1`,
    [category]
  );
  const { rows } = await db.query(
    `${CARD_SELECT} WHERE e.status = 'published' AND e.category = $1
     ORDER BY e.published_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [category, perPage, offset]
  );
  void locale;
  return { events: rows.map(rowToCard), total: count.rows[0]?.n ?? 0, page, perPage };
}

export async function getStory(locale: string, category: string, slug: string): Promise<StoryEvent | null> {
  const { rows } = await db.query<Record<string, unknown>>(
    `${CARD_SELECT} WHERE e.status = 'published' AND e.slug = $1`,
    [slug]
  );
  if (!rows[0]) return null;
  const id = rows[0].id as number;
  const [sourcesRes, timelineRes, keyFacts] = await Promise.all([
    db.query<{
      headline: string;
      summary: string;
      url: string;
      sourceName: string;
      sourceDomain: string;
      publishedAt: Date | null;
      position: number;
    }>(
      `SELECT es.headline, es.summary, es.url, s.name AS "sourceName", s.domain AS "sourceDomain",
              r.published_at AS "publishedAt", es.position
       FROM event_sources es
       JOIN source_reports r ON r.id = es.report_id
       JOIN sources s ON s.id = r.source_id
       WHERE es.event_id = $1 ORDER BY es.position`,
      [id]
    ),
    db.query<{ occurredAt: Date | null; label: string; detail: string | null; position: number }>(
      `SELECT occurred_at AS "occurredAt", label, detail, position
       FROM timeline_entries WHERE event_id = $1 ORDER BY occurred_at DESC NULLS LAST, position`,
      [id]
    ),
    db.query<{ key_facts: unknown; confirmed: unknown; developing: unknown; background: string | null }>(
      `SELECT key_facts, confirmed, developing, background FROM events WHERE id = $1`,
      [id]
    ),
  ]);
  const kf = keyFacts.rows[0];
  const cat = (rows[0]?.category as string) ?? "world";
  void locale;
  void category;
  return {
    ...rowToCard(rows[0]),
    keyFacts: Array.isArray(kf?.key_facts) ? (kf!.key_facts as StoryEvent["keyFacts"]) : [],
    confirmed: Array.isArray(kf?.confirmed) ? (kf!.confirmed as string[]) : [],
    developing: Array.isArray(kf?.developing) ? (kf!.developing as string[]) : [],
    background: (kf?.background as string) ?? null,
    sourcesReports: sourcesRes.rows.map((r) => ({
      headline: r.headline,
      summary: r.summary,
      url: r.url,
      sourceName: r.sourceName,
      sourceDomain: r.sourceDomain,
      publishedAt: r.publishedAt,
      position: r.position,
    })),
    timeline: timelineRes.rows,
    chapter: cat,
  };
}

export async function searchEvents(locale: string, query: string, limit = 20): Promise<CardEvent[]> {
  const term = `%${query.trim()}%`;
  const { rows } = await db.query(
    `${CARD_SELECT}
     WHERE e.status = 'published'
       AND (e.headline ILIKE $1 OR e.summary ILIKE $1 OR e.latest_development ILIKE $1 OR e.country ILIKE $1)
     ORDER BY e.last_updated DESC NULLS LAST
     LIMIT ${limit}`,
    [term]
  );
  void locale;
  return rows.map(rowToCard);
}

export async function totalViewsRecent(hours = 24): Promise<number> {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM page_views WHERE viewed_at > now() - ($1::int * interval '1 hour')`,
    [hours]
  );
  return rows[0]?.n ?? 0;
}

export async function trendingEvents(locale: string, limit = 20): Promise<CardEvent[]> {
  const { rows } = await db.query(
    `${CARD_SELECT}
     WHERE e.status = 'published' AND e.last_updated > now() - interval '72 hours'
     ORDER BY
       (SELECT count(*) FROM page_views pv WHERE pv.event_id = e.id AND pv.viewed_at > now() - interval '24 hours') * 2
       + e.update_count + e.source_count + (CASE WHEN e.last_updated > now() - interval '6 hours' THEN 3 ELSE 0 END) DESC,
       e.last_updated DESC
     LIMIT ${limit}`
  );
  void locale;
  return rows.map(rowToCard);
}

export async function relatedEvents(locale: string, ev: StoryEvent, limit = 6): Promise<CardEvent[]> {
  const cat = ev.category ?? "world";
  const { rows } = await db.query(
    `${CARD_SELECT}
     WHERE e.status = 'published' AND e.id <> $1 AND e.category = $2
     ORDER BY e.published_at DESC NULLS LAST
     LIMIT ${limit}`,
    [ev.id, cat]
  );
  void locale;
  return rows.map(rowToCard);
}

export async function getTranslation(eventId: number, locale: string): Promise<{
  headline: string | null;
  summary: string | null;
  keyFacts: { statement: string; attribution: string; certainty: string }[] | null;
  latestDevelopment: string | null;
  background: string | null;
  status: string;
} | null> {
  const { rows } = await db.query(
    `SELECT headline, summary, key_facts, latest_development, background, status
     FROM translations WHERE event_id = $1 AND locale = $2`,
    [eventId, locale]
  );
  if (!rows[0]) return null;
  return {
    headline: rows[0].headline,
    summary: rows[0].summary,
    keyFacts: rows[0].key_facts,
    latestDevelopment: rows[0].latest_development,
    background: rows[0].background,
    status: rows[0].status,
  };
}

export async function upsertTranslation(
  eventId: number, locale: string,
  data: {
    headline?: string | null; summary?: string | null;
    keyFacts?: unknown; latestDevelopment?: string | null;
    background?: string | null; status?: string; provider?: string | null;
  }
): Promise<void> {
  await db.query(
    `INSERT INTO translations (event_id, locale, headline, summary, key_facts, latest_development, background, status, provider, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
     ON CONFLICT (event_id, locale) DO UPDATE SET
       headline = COALESCE(EXCLUDED.headline, translations.headline),
       summary = COALESCE(EXCLUDED.summary, translations.summary),
       key_facts = COALESCE(EXCLUDED.key_facts, translations.key_facts),
       latest_development = COALESCE(EXCLUDED.latest_development, translations.latest_development),
       background = COALESCE(EXCLUDED.background, translations.background),
       status = EXCLUDED.status,
       provider = COALESCE(EXCLUDED.provider, translations.provider),
       updated_at = now()`,
    [eventId, locale, data.headline ?? null, data.summary ?? null,
     data.keyFacts === undefined ? null : JSON.stringify(data.keyFacts as never),
     data.latestDevelopment ?? null, data.background ?? null,
     data.status ?? "done", data.provider ?? null]
  );
}

export async function listSources(): Promise<{
  id: number; name: string; domain: string; homeUrl: string; category: string | null;
  enabled: boolean; health: string; lastSuccess: Date | null; lastFailure: Date | null;
  consecutiveFailures: number; feedUrl: string;
}[]> {
  const { rows } = await db.query(
    `SELECT s.id, s.name, s.domain, s.home_url AS "homeUrl", s.category, s.enabled, s.health,
            s.last_success AS "lastSuccess", s.last_failure AS "lastFailure",
            s.consecutive_failures AS "consecutiveFailures",
            (SELECT string_agg(f.feed_url, ', ') FROM source_feeds f WHERE f.source_id = s.id) AS "feedUrl"
     FROM sources s ORDER BY s.name`
  );
  return rows as never;
}

export async function listTranslationsForAdmin(): Promise<
  { eventId: number; slug: string; headline: string; status: string; locales: string }[]
> {
  const { rows } = await db.query(
    `SELECT e.id AS "eventId", e.slug, e.headline, e.status,
            (SELECT string_agg(t.locale || ':' || t.status, ', ') FROM translations t WHERE t.event_id = e.id) AS locales
     FROM events e WHERE e.status IN ('published','pending')
     ORDER BY e.last_updated DESC LIMIT 300`
  );
  return rows as never;
}

export async function listEventsForAdmin(page: number, perPage = 40): Promise<{
  events: {
    id: number; slug: string; headline: string; category: string | null; status: string;
    sourceCount: number; lastUpdated: Date; publishedAt: Date | null;
  }[];
  total: number;
}> {
  const offset = (page - 1) * perPage;
  const total = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM events`);
  const { rows } = await db.query(
    `SELECT e.id, e.slug, e.headline, e.category, e.status,
            e.source_count AS "sourceCount", e.last_updated AS "lastUpdated", e.published_at AS "publishedAt"
     FROM events e ORDER BY e.last_updated DESC LIMIT $1 OFFSET $2`,
    [perPage, offset]
  );
  return { events: rows as never, total: total.rows[0]?.n ?? 0 };
}

export const VALID_CATEGORIES = [
  "world", "business", "technology", "science", "politics", "economy",
  "sports", "culture", "pakistan", "explainers",
];

export function storyPath(locale: string, category: string, slug: string): string {
  const cat = category && VALID_CATEGORIES.includes(category) ? category : "story";
  return `/${locale}/${cat}/${slug}`;
}

export function localizedHomePath(locale: string): string {
  return `/${locale}/`;
}

export function localizedCategoryPath(locale: string, category: string): string {
  return `/${locale}/${category}`;
}

export const HOME_CATEGORIES = [
  { slug: "world", icon: "world" },
  { slug: "business", icon: "briefcase" },
  { slug: "technology", icon: "chip" },
  { slug: "science", icon: "flask" },
  { slug: "politics", icon: "scale" },
  { slug: "economy", icon: "chart" },
  { slug: "sports", icon: "trophy" },
  { slug: "culture", icon: "landmark" },
  { slug: "pakistan", icon: "flag" },
];

export function hreflangUrls(locale: string, path: string): Record<string, string> {
  const base = process.env.SITE_URL ?? "https://last24hours.vercel.app";
  const urls: Record<string, string> = {};
  for (const l of LOCALES) {
    if (!l.enabled) continue;
    urls[l.code] = `${base}/${l.code}${path}`;
  }
  urls["x-default"] = `${base}/en${path}`;
  void locale;
  return urls;
}
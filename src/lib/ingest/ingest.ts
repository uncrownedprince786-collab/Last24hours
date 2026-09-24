import { db } from "../db";
import { fetchFeed } from "./fetcher";
import { headlineHash, sha1, normalizeHeadline, stripRssSuffix } from "../normalize";
import { recordJobRun, getJob, updateJobSettings } from "./jobs";

export type FeedIngestResult = {
  feedUrl: string;
  sourceName: string;
  fetchedItems: number;
  newItems: number;
  ok: boolean;
  error?: string;
  responseMs: number;
};

export async function ingestAllFeeds(opts: { minFeedGapMinutes?: number } = {}): Promise<{
  results: FeedIngestResult[];
  totalNew: number;
}> {
  const gapMinutes = opts.minFeedGapMinutes ?? 15;
  const feeds = await db.query<{
    id: number;
    feed_url: string;
    source_id: number;
    enabled: boolean;
    last_fetched: Date | null;
    etag: string | null;
    last_modified: string | null;
    name: string;
    category: string | null;
    lang: string;
  }>(
    `SELECT f.id, f.feed_url, f.source_id, f.enabled, f.last_fetched, f.etag, f.last_modified,
            s.name, s.category, f.lang
     FROM source_feeds f JOIN sources s ON s.id = f.source_id
     WHERE f.enabled = true AND s.enabled = true
     ORDER BY f.id`
  );

  const results: FeedIngestResult[] = [];
  let totalNew = 0;

  const healthCache = new Map<number, number>();
  const loadHealth = async (sourceId: number) => {
    if (!healthCache.has(sourceId)) {
      const { rows } = await db.query<{ n: number }>(
        `SELECT consecutive_failures::int AS n FROM source_health WHERE source_id = $1`,
        [sourceId]
      );
      healthCache.set(sourceId, rows[0]?.n ?? 0);
    }
    return healthCache.get(sourceId)!;
  };

  for (const feed of feeds.rows) {
    const gapOk =
      !feed.last_fetched ||
      Date.now() - new Date(feed.last_fetched).getTime() > gapMinutes * 60_000;
    if (!gapOk) {
      results.push({
        feedUrl: feed.feed_url,
        sourceName: feed.name,
        fetchedItems: 0,
        newItems: 0,
        ok: true,
        responseMs: 0,
      });
      continue;
    }

    const res = await fetchFeed(feed.feed_url);
    const feedRes: FeedIngestResult = {
      feedUrl: feed.feed_url,
      sourceName: feed.name,
      fetchedItems: res.items.length,
      newItems: 0,
      ok: !res.error && res.httpStatus >= 200 && res.httpStatus < 300,
      error: res.error ?? undefined,
      responseMs: res.responseMs,
    };

    let failures = 0;
    if (res.error || res.httpStatus === 0 || res.httpStatus >= 400) {
      failures = (await loadHealth(feed.source_id)) + 1;
      await db.query(
        `UPDATE source_health SET status = $1, http_status = $2, response_ms = $3, parse_ok = false, checked_at = now(), consecutive_failures = $4, last_error = $5
         WHERE source_id = $6`,
        [failures >= 3 ? "red" : "yellow", res.httpStatus || null, res.responseMs, failures, res.error ?? `HTTP ${res.httpStatus}`, feed.source_id]
      );
      await db.query(
        `UPDATE sources SET last_failure = now(), consecutive_failures = $1, health = $2 WHERE id = $3`,
        [failures, failures >= 3 ? "red" : "yellow", feed.source_id]
      );
    } else {
      failures = 0;
      // store items
      for (const item of res.items) {
        const cat = (feed.category ?? "world").toLowerCase();
        const headline = stripRssSuffix(item.headline);
        const norm = normalizeHeadline(headline);
        const rawHash = sha1(
          [
            item.url,
            headline.toLowerCase(),
            item.published ? item.published.toISOString() : "",
          ].join("|")
        );
        const ins = await db.query<{ id: number }>(
          `INSERT INTO source_reports
             (source_id, feed_id, url, headline, summary, excerpt, image_url, image_alt,
              published_at, fetched_at, lang, category, author, raw_hash, normalized_headline, headline_hash, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),$10,$11,$12,$13,$14,$15,'new')
           ON CONFLICT (url) DO NOTHING
           RETURNING id`,
          [
            feed.source_id,
            feed.id,
            item.url,
            headline,
            item.summary,
            item.excerpt,
            item.image,
            null,
            item.published,
            feed.lang,
            cat,
            item.author,
            rawHash,
            norm,
            headlineHash(headline),
          ]
        );
        if (ins.rows.length > 0) {
          feedRes.newItems += 1;
          totalNew += 1;
        }
      }
      await db.query(
        `UPDATE source_health SET status = 'green', http_status = $1, response_ms = $2, parse_ok = true, checked_at = now(), item_count = $3, consecutive_failures = 0, last_error = NULL
         WHERE source_id = $4`,
        [res.httpStatus, res.responseMs, res.items.length, feed.source_id]
      );
      await db.query(
        `UPDATE sources SET last_success = now(), last_item_count = $1, consecutive_failures = 0, health = 'green' WHERE id = $2`,
        [res.items.length, feed.source_id]
      );
    }

    await db.query(
      `UPDATE source_feeds SET etag = $1, last_modified = $2, last_fetched = now(), last_status = $3, item_count = $4 WHERE id = $5`,
      [res.etag, res.lastModified, res.httpStatus || null, res.items.length, feed.id]
    );

    results.push(feedRes);
  }

  results.sort((a, b) => b.newItems - a.newItems);
  return { results, totalNew };
}

export async function runIngestJob(): Promise<{ results: FeedIngestResult[]; totalNew: number }> {
  const prev = await getJob("ingest");
  const started = Date.now();
  const { results, totalNew } = await ingestAllFeeds({ minFeedGapMinutes: 10 });
  const ok = results.every((r) => r.ok);
  await recordJobRun("ingest", ok, `${results.length} feeds, ${totalNew} new`);
  await updateJobSettings();
  return { results, totalNew };
}
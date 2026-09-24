import { db } from "../db";
import { getTranslation, upsertTranslation } from "../data";

export const TRANSLATION_LOCALES = ["ur", "ar", "es", "de", "fr"] as const;

export interface TranslationProvider {
  readonly name: string;
  translate(text: string, targetLang: string): Promise<string>;
}

/**
 * Free translation provider (MyMemory public API).
 * Rate-limited (~5000 chars/day anonymous) and best-effort.
 * Swap for a licensed provider later without touching the pipeline.
 */
export class MyMemoryProvider implements TranslationProvider {
  readonly name = "mymemory";

  async translate(text: string, targetLang: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 3000))}&langpair=en|${targetLang}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`mymemory HTTP ${res.status}`);
    const data = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
    const out = data?.responseData?.translatedText;
    if (!out || String(data.responseStatus) !== "200") {
      throw new Error(`mymemory failed: ${data.responseStatus ?? "unknown"}`);
    }
    return out;
  }
}

export function getTranslationProvider(): TranslationProvider {
  const kind = process.env.TRANSLATION_PROVIDER ?? "mymemory";
  if (kind === "mymemory") return new MyMemoryProvider();
  throw new Error(`Unknown translation provider: ${kind}`);
}

const CACHE: Record<string, string> = {};

export async function translateText(provider: TranslationProvider, text: string, targetLang: string): Promise<string> {
  const key = `${targetLang}:${text.slice(0, 400)}`;
  if (CACHE[key]) return CACHE[key];
  const out = await provider.translate(text, targetLang);
  if (out && out !== text) CACHE[key] = out;
  return out;
}

export async function translateEvent(eventId: number): Promise<number> {
  const ev = await db.query<{
    headline: string;
    summary: string | null;
    key_facts: { statement: string; attribution: string; certainty: string }[] | null;
    latest_development: string | null;
    background: string | null;
  }>(`SELECT headline, summary, key_facts, latest_development, background FROM events WHERE id = $1`, [eventId]);
  if (!ev.rows[0]) return 0;

  const provider = getTranslationProvider();
  let done = 0;
  for (const locale of TRANSLATION_LOCALES) {
    try {
      const existing = await getTranslation(eventId, locale);
      if (existing?.status === "done" && existing.headline) continue;
      const headline = await translateText(provider, ev.rows[0].headline, locale);
      const summary = ev.rows[0].summary ? await translateText(provider, ev.rows[0].summary, locale) : null;
      const facts = ev.rows[0].key_facts ?? [];
      const translatedFacts: { statement: string; attribution: string; certainty: string }[] = [];
      for (const f of facts.slice(0, 4)) {
        const statement = await translateText(provider, f.statement, locale);
        translatedFacts.push({ statement, attribution: f.attribution, certainty: f.certainty });
      }
      const latestDev = ev.rows[0].latest_development
        ? await translateText(provider, ev.rows[0].latest_development, locale)
        : null;
      const background = ev.rows[0].background ? await translateText(provider, ev.rows[0].background, locale) : null;
      await upsertTranslation(eventId, locale, {
        headline, summary, latestDevelopment: latestDev, background,
        keyFacts: translatedFacts, status: "done", provider: provider.name,
      });
      done += 1;
    } catch {
      await upsertTranslation(eventId, locale, { status: "failed", provider: `${provider.name}:error` });
    }
  }
  return done;
}

export async function runTranslationsJob(opts: { limit?: number } = {}): Promise<{ events: number; localesDone: number }> {
  const limit = opts.limit ?? 8;
  const pending = await db.query<{ id: number }>(
    `SELECT e.id FROM events e
     WHERE e.status = 'published'
       AND NOT EXISTS (SELECT 1 FROM translations t WHERE t.event_id = e.id AND t.status = 'done')
     ORDER BY e.last_updated DESC
     LIMIT $1`,
    [limit]
  );
  let localesDone = 0;
  for (const row of pending.rows) {
    localesDone += await translateEvent(row.id);
  }
  return { events: pending.rows.length, localesDone };
}
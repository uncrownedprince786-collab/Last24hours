import { db } from "@/lib/db";
import { enabledLocales, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { VALID_CATEGORIES } from "@/lib/data";

export const revalidate = 3600;

function loc(prefix: boolean, path: string): string {
  const base = process.env.SITE_URL ?? "https://last24hours.vercel.app";
  return `${base}/${prefix ? `${DEFAULT_LOCALE}/` : ""}${path.replace(/^\//, "")}`;
}

export default async function sitemap() {
  const base = process.env.SITE_URL ?? "https://last24hours.vercel.app";
  const entries: {
    url: string;
    lastModified: string;
    changeFrequency: "hourly" | "daily" | "weekly";
    priority: number;
    alternates?: { languages: Record<string, string> };
  }[] = [];

  // Homes + categories for each enabled locale
  for (const l of enabledLocales) {
    entries.push({
      url: `${base}/${l.code}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: "hourly",
      priority: 1,
      alternates: { languages: Object.fromEntries(enabledLocales.map((x) => [x.code, `${base}/${x.code}/`])) },
    });
    for (const cat of VALID_CATEGORIES) {
      entries.push({
        url: `${base}/${l.code}/${cat}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "hourly",
        priority: 0.8,
      });
    }
  }

  // Stories: English for all published; localized only when a translation is complete
  const stories = await db.query<{
    slug: string;
    category: string | null;
    last_updated: Date;
    locale: string;
  }>(
    `SELECT DISTINCT e.slug, e.category, e.last_updated, COALESCE(t.locale, 'en') AS locale
     FROM events e
     LEFT JOIN translations t ON t.event_id = e.id AND t.status = 'done'
     WHERE e.status = 'published'
       AND (t.event_id IS NULL OR t.locale IS NOT NULL)`
  );

  const seen = new Set<string>();
  for (const s of stories.rows) {
    const cat = s.category && VALID_CATEGORIES.includes(s.category) ? s.category : "story";
    const ckey = `${s.locale}/${cat}/${s.slug}`;
    if (seen.has(ckey)) continue;
    seen.add(ckey);
    entries.push({
      url: `${base}/${s.locale}/${cat}/${s.slug}`,
      lastModified: new Date(s.last_updated).toISOString(),
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  return entries;
}
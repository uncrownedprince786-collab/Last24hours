import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { searchEvents } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { StoryCard } from "@/components/story-card";

import { query } from "@/lib/db";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: `/search`, title: getMessages(locale).search.title });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const q = (sp.q ?? "").trim();

  let results: Awaited<ReturnType<typeof searchEvents>> = [];
  if (q) {
    results = await searchEvents(locale, q, 24);
    if (results.length > 0) {
      await query(
        `INSERT INTO search_events (query, locale, results) VALUES ($1,$2,$3)`,
        [q.slice(0, 200), locale, results.length]
      ).catch(() => {});
    }
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-ink pb-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">{m.search.title}</h1>
      </div>

      {q ? (
        <p className="mb-6 text-muted">
          {results.length > 0 ? `${m.search.resultsFor} “${q}”` : `${m.search.noResults} “${q}”`}
        </p>
      ) : (
        <p className="mb-6 text-muted">{m.search.hint}</p>
      )}

      {results.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-8 text-center text-muted">
          {m.search.noResults} “{q}”
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((e) => (
            <StoryCard key={e.id} event={e} locale={locale} readMore={m.common.readMore} />
          ))}
        </div>
      )}
    </div>
  );
}
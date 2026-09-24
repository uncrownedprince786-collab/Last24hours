import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { categoryEvents, VALID_CATEGORIES, localizedCategoryPath } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { StoryCard } from "@/components/story-card";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isLocale(locale) || !VALID_CATEGORIES.includes(category)) return {};
  const m = getMessages(locale);
  const label = m.nav[category as keyof typeof m.nav] ?? category;
  return buildMetadata({
    locale,
    path: `/${category}`,
    title: label,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, category } = await params;
  const sp = await searchParams;
  if (!isLocale(locale) || !VALID_CATEGORIES.includes(category)) notFound();
  const m = getMessages(locale);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const data = await categoryEvents(locale, category, page, 24);
  const label = m.nav[category as keyof typeof m.nav] ?? category;
  const totalPages = Math.max(1, Math.ceil(data.total / data.perPage));

  return (
    <div>
      <div className="mb-6 border-b-2 border-ink pb-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{label}</h1>
        <p className="mt-1 text-sm text-muted">
          {m.brand.tagline} · {data.total} {data.total === 1 ? "story" : "stories"}
        </p>
      </div>

      {data.events.length === 0 ? (
        <p className="text-muted">{m.search.noResults}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.events.map((e) => (
            <StoryCard key={e.id} event={e} locale={locale} readMore={m.common.readMore} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
          {page > 1 && (
            <a
              href={`${localizedCategoryPath(locale, category)}?page=${page - 1}`}
              className="rounded border border-line px-3 py-1.5 text-sm hover:border-accent"
            >
              ‹
            </a>
          )}
          <span className="text-sm text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`${localizedCategoryPath(locale, category)}?page=${page + 1}`}
              className="rounded border border-line px-3 py-1.5 text-sm hover:border-accent"
            >
              ›
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
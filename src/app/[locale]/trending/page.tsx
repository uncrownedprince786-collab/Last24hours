import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages, timeAgoLabel } from "@/lib/i18n";
import { trendingEvents } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { StoryCard } from "@/components/story-card";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: `/trending`, title: getMessages(locale).brand.name });
}

export default async function TrendingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const events = await trendingEvents(locale, 30);

  return (
    <div>
      <div className="mb-2 border-b-2 border-ink pb-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{m.trendingPage.title}</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted">{m.trendingPage.methodology}</p>

      {events.length === 0 ? (
        <p className="text-muted">{m.sections.mostUpdated}</p>
      ) : (
        <ol className="space-y-4">
          {events.map((e, i) => (
            <li key={e.id} className="flex items-start gap-4 border-b border-line pb-4">
              <span className="pt-1 font-display text-3xl font-bold text-line" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <StoryCard event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                <p className="mt-1 text-xs text-muted">
                  {e.sourceCount} {e.sourceCount === 1 ? "source" : "sources"} · {e.updateCount} updates · updated {timeAgoLabel(locale, e.lastUpdated)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
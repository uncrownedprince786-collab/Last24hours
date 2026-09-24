import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { homeSections, trendingEvents, totalViewsRecent, localizedCategoryPath, localizedHomePath } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { StoryCard } from "@/components/story-card";
import { Section } from "@/components/section";
import { AdSlot } from "@/components/ad-slot";

export const revalidate = 90;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: "/" });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);

  const [sections, trending, totalViews] = await Promise.all([
    homeSections(locale, 10),
    trendingEvents(locale, 8),
    totalViewsRecent(24),
  ]);

  const useTrendingLabel = totalViews >= 20;

  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const top = sections.top[0];
  const sideStories = sections.top.slice(1, 5);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="lede-rule h-[3px] w-16 shrink-0" />
        <p className="font-display text-sm text-muted">{today}</p>
      </div>

      {sections.breaking.length > 0 && (
        <div className="mb-10 border-l-4 border-accent bg-accent-soft/60 py-3 ps-4">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">{m.sections.breaking}</p>
          <ul className="mt-2 space-y-1.5">
            {sections.breaking.map((e) => (
              <li key={e.id}>
                <StoryCard event={e} locale={locale} variant="row" readMore={m.common.readMore} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Section title={m.sections.topStories}>
            {top && (
              <div className="grid gap-8 md:grid-cols-2">
                <StoryCard event={top} locale={locale} variant="lead" readMore={m.common.readMore} />
                <div className="space-y-5 border-t border-line pt-5 md:border-t-0 md:pt-0">
                  {sideStories.map((e) => (
                    <StoryCard key={e.id} event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                  ))}
                </div>
              </div>
            )}
          </Section>

          <AdSlot name="home-inline-1" />

          <Section title={m.sections.aroundTheWorld} viewAllHref={localizedCategoryPath(locale, "world")}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sections.world.slice(0, 6).map((e) => (
                <StoryCard key={e.id} event={e} locale={locale} readMore={m.common.readMore} />
              ))}
            </div>
          </Section>

          <AdSlot name="home-inline-2" />

          <Section
            title={m.sections.businessEconomy}
            viewAllHref={localizedCategoryPath(locale, "business")}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sections.businessEconomy.slice(0, 4).map((e) => (
                <StoryCard key={e.id} event={e} locale={locale} readMore={m.common.readMore} />
              ))}
            </div>
          </Section>

          <div className="grid gap-10 lg:grid-cols-2">
            <Section title={m.sections.technology} viewAllHref={localizedCategoryPath(locale, "technology")}>
              <div className="space-y-4">
                {sections.technology.slice(0, 4).map((e) => (
                  <StoryCard key={e.id} event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                ))}
              </div>
            </Section>
            <Section title={m.sections.science} viewAllHref={localizedCategoryPath(locale, "science")}>
              <div className="space-y-4">
                {sections.science.slice(0, 4).map((e) => (
                  <StoryCard key={e.id} event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                ))}
              </div>
            </Section>
          </div>

          <Section title={m.sections.explained} viewAllHref={localizedCategoryPath(locale, "explainers")}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sections.explained.slice(0, 3).map((e) => (
                <StoryCard key={e.id} event={e} locale={locale} readMore={m.common.readMore} />
              ))}
            </div>
          </Section>
        </div>

        <aside>
          <Section title={m.sections.pakistan} viewAllHref={localizedCategoryPath(locale, "pakistan")}>
            <div className="space-y-4">
              {sections.pakistan.slice(0, 6).map((e) => (
                <StoryCard key={e.id} event={e} locale={locale} variant="row" readMore={m.common.readMore} />
              ))}
            </div>
          </Section>

          <Section title={useTrendingLabel ? m.sections.trending : m.sections.mostUpdated} viewAllHref={`${locale === "en" ? "" : `/${locale}`}/trending`}>
            <ol className="space-y-3">
              {(trending.length > 0 ? trending : sections.mostUpdated).slice(0, 7).map((e, i) => (
                <li key={e.id} className="flex gap-3 border-b border-line pb-3 last:border-0">
                  <span className="font-display text-2xl font-bold text-line" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <StoryCard event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                </li>
              ))}
            </ol>
          </Section>

          <AdSlot name="home-sidebar" />

          <div className="rounded-xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{m.nav.home}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.brand.tagline}. {m.meta.description}</p>
            <p className="mt-3 text-xs text-muted">{m.story.attribution}</p>
            <p className="mt-4">
              <a href={localizedHomePath(locale)} className="text-sm font-semibold text-accent underline">
                {m.brand.name}
              </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
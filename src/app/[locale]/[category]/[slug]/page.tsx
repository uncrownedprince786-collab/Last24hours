import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getMessages, timeAgoLabel } from "@/lib/i18n";
import { getStory, relatedEvents, getTranslation, VALID_CATEGORIES, storyPath, localizedCategoryPath } from "@/lib/data";
import { buildMetadata, categoryJsonLd } from "@/lib/seo";
import { StoryCard } from "@/components/story-card";
import { AdSlot } from "@/components/ad-slot";
import { ViewTracker } from "@/components/view-tracker";
import { LinkIcon } from "@/components/icons";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;
  if (!isLocale(locale) || !VALID_CATEGORIES.includes(category)) return {};
  const ev = await getStory(locale, category, slug);
  if (!ev) return {};
  const t = locale !== "en" ? await getTranslation(ev.id, locale) : null;
  const path = storyPath(locale, category, slug).replace(`/${locale}`, "");
  return buildMetadata({
    locale,
    path,
    title: t?.headline ?? ev.headline,
    description: t?.summary ?? ev.summary ?? ev.latestDevelopment ?? undefined,
    image: ev.image,
    type: "article",
    published: ev.publishedAt?.toISOString() ?? null,
    modified: ev.lastUpdated.toISOString(),
  });
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  if (!isLocale(locale) || !VALID_CATEGORIES.includes(category)) notFound();
  const m = getMessages(locale);
  const [ev, related] = await Promise.all([
    getStory(locale, category, slug),
    (async () => {
      const base = await getStory(locale, category, slug);
      return base ? relatedEvents(locale, base, 6) : [];
    })(),
  ]);
  if (!ev) notFound();

  const t = locale !== "en" ? await getTranslation(ev.id, locale) : null;
  const headline = (t?.headline ?? ev.headline) as string;
  const summary = t?.summary ?? ev.summary ?? "";
  const translatedKeyFacts = t && t.keyFacts && t.keyFacts.length > 0 ? t.keyFacts : null;
  const keyFacts = (translatedKeyFacts ?? ev.keyFacts) as {
    statement: string;
    attribution: string;
    certainty: string;
  }[];
  const latestDev = t?.latestDevelopment ?? ev.latestDevelopment ?? "";
  const background = t?.background ?? ev.background ?? "";

  const localizedLink = (path: string) => (locale === "en" ? path : `/${locale}${path}`);
  const canonicalStory = storyPath(locale, ev.category ?? "world", ev.slug);
  const jsonLd = categoryJsonLd({
    headline,
    summary: summary || undefined,
    image: ev.image,
    publishedAt: ev.publishedAt?.toISOString() ?? null,
    lastUpdated: ev.lastUpdated.toISOString(),
    url: `${process.env.SITE_URL ?? "https://last24hours.vercel.app"}${canonicalStory}`,
  });

  const confirmed = ev.confirmed as string[];
  const developing = ev.developing as string[];

  const utm = "utm_source=last24hours&utm_medium=referral";

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker eventId={ev.id} />

      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href={localizedLink("/")} className="hover:text-accent">{m.nav.home}</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={localizedCategoryPath(locale, ev.category ?? "world")} className="hover:text-accent">
              {m.nav[(ev.category ?? "world") as keyof typeof m.nav]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="line-clamp-1 text-ink-soft" aria-current="page">{headline}</li>
        </ol>
      </nav>

      <article>
        <header className="max-w-3xl">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted">
            <Link href={localizedCategoryPath(locale, ev.category ?? "world")} className="text-accent hover:opacity-80">
              {ev.category ?? "world"}
            </Link>
            <span className="h-1 w-1 rounded-full bg-line" aria-hidden="true" />
            <span>{timeAgoLabel(locale, ev.lastUpdated)}</span>
            <span className="h-1 w-1 rounded-full bg-line" aria-hidden="true" />
            <span>
              {m.story.updatedAt} {ev.lastUpdated.toLocaleString(locale)}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {headline}
          </h1>

          {ev.summary && (
            <p className="mt-6 font-display text-xl leading-relaxed text-ink-soft">{summary || ev.summary}</p>
          )}
        </header>

        {ev.image && (
          <figure className="mt-8 overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ev.image} alt={headline} loading="lazy" referrerPolicy="no-referrer" className="h-auto w-full" />
          </figure>
        )}

        <AdSlot name="story-1" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="max-w-2xl space-y-12">
            {keyFacts.length > 0 && (
              <section>
                <h2 className="border-b-2 border-ink pb-1 font-display text-xl font-bold">{m.story.keyFacts}</h2>
                <ol className="mt-4 space-y-3">
                  {keyFacts.map((f, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 font-display text-lg font-bold text-accent">{i + 1}</span>
                      <p className="text-[15px] leading-relaxed">
                        {f.statement}
                        <span className="mt-0.5 block text-xs text-muted">— {f.attribution}</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {latestDev ? (
              <section className="rounded-xl border border-accent/40 bg-accent-soft/50 p-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{m.story.latestDevelopment}</h2>
                <p className="mt-2 font-display text-lg leading-relaxed">{latestDev}</p>
              </section>
            ) : null}

            {ev.timeline.length > 0 && (
              <section>
                <h2 className="border-b-2 border-ink pb-1 font-display text-xl font-bold">{m.story.timeline}</h2>
                <ol className="mt-4 space-y-0 border-s-2 border-line ps-6">
                  {ev.timeline.map((tl, i) => (
                    <li key={i} className="relative pb-5">
                      <span className="absolute -start-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-paper" aria-hidden="true" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {m.story.updated} · {tl.occurredAt ? tl.occurredAt.toLocaleString(locale) : ""}
                      </p>
                      <p className="mt-1 font-display text-[15px] font-semibold">{tl.label}</p>
                      {tl.detail && <p className="mt-0.5 text-sm text-muted">{tl.detail}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {ev.sourcesReports.length > 0 && (
              <section>
                <h2 className="border-b-2 border-ink pb-1 font-display text-xl font-bold">{m.story.sources}</h2>
                <ul className="mt-4 space-y-4">
                  {ev.sourcesReports.map((s) => (
                    <li key={`${s.url}-${s.position}`} className="rounded-xl border border-line bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-accent">{s.sourceName}</p>
                        <a
                          href={`${s.url}${s.url.includes("utm_") ? "" : s.url.includes("?") ? `&${utm}` : `?${utm}`}`}
                          target="_blank"
                          rel="nofollow noopener sponsored"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                        >
                          {m.story.readOriginal} <LinkIcon className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <p className="mt-2 font-display text-[15px] leading-snug font-semibold">{s.headline}</p>
                      {s.summary && <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.summary}</p>}
                      {s.publishedAt && (
                        <p className="mt-2 text-xs text-muted">
                          {m.story.updatedAt} · {s.publishedAt.toLocaleString(locale)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(confirmed.length > 0 || developing.length > 0) && (
              <section className="space-y-5">
                {confirmed.length > 0 && (
                  <div className="rounded-xl border border-l-4 border-green-700/70 border-line p-5" style={{ borderInlineStartColor: "var(--accent)" }}>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{m.story.confirmed}</h2>
                    <ul className="mt-2 space-y-2">
                      {confirmed.map((c, i) => (
                        <li key={i} className="text-sm leading-relaxed">· {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {developing.length > 0 && (
                  <div className="rounded-xl border border-line bg-accent-soft/40 p-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{m.story.developing}</h2>
                    <ul className="mt-2 space-y-2">
                      {developing.map((c, i) => (
                        <li key={i} className="text-sm leading-relaxed">· {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {background ? (
              <section>
                <h2 className="border-b-2 border-ink pb-1 font-display text-xl font-bold">{m.story.background}</h2>
                <div className="prose-story mt-4">
                  <p>{background}</p>
                </div>
              </section>
            ) : null}

            <AdSlot name="story-2" />

            <footer className="rounded-xl bg-paper-deep p-5 text-sm text-muted">
              <p>{m.story.attribution}</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {ev.sourceNames.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            </footer>
          </div>

          <aside className="space-y-8 lg:border-s lg:border-line lg:ps-6">
            {related.length > 0 && (
              <div>
                <h2 className="border-b border-line pb-1 font-display text-lg font-bold">{m.story.relatedStories}</h2>
                <ul className="mt-3 space-y-3">
                  {related.map((e) => (
                    <li key={e.id}>
                      <StoryCard event={e} locale={locale} variant="row" readMore={m.common.readMore} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{m.story.source}</p>
              <p className="mt-1 text-sm text-ink-soft">{m.brand.name}</p>
              <p className="mt-3 text-xs text-muted">{m.story.updated}: 24 hours</p>
            </div>
            <AdSlot name="story-sidebar" />
          </aside>
        </div>
      </article>
    </div>
  );
}
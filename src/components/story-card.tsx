import Link from "next/link";
import type { CardEvent } from "@/lib/data";
import { storyPath } from "@/lib/data";
import { timeAgoLabel } from "@/lib/i18n";
import { ArrowRightIcon } from "./icons";

export function StoryCard({
  event,
  locale,
  variant = "default",
  readMore = "Read",
}: {
  event: CardEvent;
  locale: string;
  variant?: "lead" | "default" | "row";
  readMore?: string;
}) {
  const href = storyPath(locale, event.category ?? "world", event.slug);
  const cat = event.category ?? "world";

  if (variant === "lead") {
    return (
      <article className="group relative">
        <Link href={href} className="block" aria-label={event.headline}>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper-deep">
            {event.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.image}
                alt={event.headline}
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-paper-deep to-paper text-muted" style={{ fontFamily: "var(--font-display)" }}>
                {cat}
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="font-semibold text-accent">{cat}</span>
              <span>{timeAgoLabel(locale, event.lastUpdated)}</span>
            </div>
            <h2 className="mt-2 font-display text-2xl leading-snug font-bold tracking-tight group-hover:text-accent sm:text-3xl">
              {event.headline}
            </h2>
            <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{event.summary}</p>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="group">
        <Link href={href} className="flex items-start gap-4">
          {event.image && (
            <span className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-paper-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </span>
          )}
          <span>
            <span className="block text-xs uppercase tracking-wider text-muted">
              {cat} · {timeAgoLabel(locale, event.lastUpdated)}
            </span>
            <span className="mt-1 block font-display text-[15px] leading-snug font-semibold group-hover:text-accent">
              {event.headline}
            </span>
          </span>
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link href={href} className="block h-full rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent/40">
        <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted">
          <span className="font-semibold text-accent">{cat}</span>
          <span>{timeAgoLabel(locale, event.lastUpdated)}</span>
        </div>
        <h3 className="mt-2 font-display text-lg leading-snug font-bold tracking-tight group-hover:text-accent">
          {event.headline}
        </h3>
        {event.summary && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{event.summary}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span className="truncate">
            {event.sourceNames.slice(0, 3).join(", ")}
            {event.sourceNames.length > 3 ? ` +${event.sourceNames.length - 3}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-accent">
            {readMore}{" "}
            <ArrowRightIcon className="h-3.5 w-3.5 rtl-flip" />
          </span>
        </div>
      </Link>
    </article>
  );
}
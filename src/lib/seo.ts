import type { Metadata } from "next";
import { getMessages } from "./i18n";
import { DEFAULT_LOCALE, LOCALES } from "./i18n/config";

const baseUrl = () => process.env.SITE_URL ?? "https://last24hours.vercel.app";

export function siteUrl(path = ""): string {
  return `${baseUrl()}${path}`;
}

export function buildMetadata(opts: {
  locale: string;
  path: string;
  title?: string;
  description?: string;
  image?: string | null;
  type?: "website" | "article";
  published?: string | null;
  modified?: string | null;
  noIndex?: boolean;
}): Metadata {
  const m = getMessages(opts.locale);
  const title = opts.title
    ? `${opts.title} | ${m.brand.name}`
    : `${m.brand.name} — ${m.brand.tagline}`;
  const description = opts.description ?? m.meta.description;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    if (!l.enabled) continue;
    languages[l.code] = siteUrl(`/${l.code}${opts.path}`);
  }
  languages["x-default"] = siteUrl(`/en${opts.path}`);

  return {
    title,
    description,
    metadataBase: new URL(baseUrl()),
    alternates: { canonical: siteUrl(`/en${opts.path}`), languages },
    openGraph: {
      type: opts.type ?? "website",
      siteName: m.brand.name,
      title,
      description,
      url: siteUrl(opts.path),
      locale: opts.locale === "en" ? "en_US" : opts.locale,
      images: opts.image ? [{ url: opts.image, width: 1200, height: 630, alt: title }] : [],
      publishedTime: opts.published ?? undefined,
      modifiedTime: opts.modified ?? undefined,
    },
    twitter: {
      card: opts.image ? "summary_large_image" : "summary",
      title,
      description,
      images: opts.image ? [opts.image] : [],
    },
    robots: {
      index: !opts.noIndex,
      follow: !opts.noIndex,
      googleBot: { index: !opts.noIndex, follow: !opts.noIndex },
    },
  };
}

export function categoryJsonLd(event: {
  headline: string; summary?: string | null; image?: string | null;
  publishedAt?: string | null; lastUpdated?: string | null; url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: event.headline,
    description: event.summary ?? undefined,
    image: event.image ?? undefined,
    datePublished: event.publishedAt ?? undefined,
    dateModified: event.lastUpdated ?? undefined,
    url: event.url,
    publisher: { "@type": "Organization", name: "Last24hours" },
    isAccessibleForFree: true,
    mainEntityOfPage: event.url,
  };
}
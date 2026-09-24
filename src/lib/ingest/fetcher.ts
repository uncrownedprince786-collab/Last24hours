import Parser from "rss-parser";

export type FetchedItem = {
  url: string;
  headline: string;
  summary: string;
  excerpt: string;
  published: Date | null;
  image: string | null;
  author: string | null;
};

export type FetchResult = {
  items: FetchedItem[];
  httpStatus: number;
  etag: string | null;
  lastModified: string | null;
  error: string | null;
  responseMs: number;
};

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "dcCreator"],
    ],
  },
});

function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickImage(item: Record<string, unknown> & { enclosure?: unknown }): string | null {
  const media: unknown = item.mediaContent;
  if (Array.isArray(media)) {
    for (const m of media) {
      if (m && typeof m === "object" && "url" in m && typeof (m as { url: unknown }).url === "string") {
        const u = (m as { url: string }).url;
        if (u.startsWith("http")) return u;
      }
    }
  } else if (media && typeof media === "object" && "url" in media) {
    const u = (media as { url: unknown }).url;
    if (typeof u === "string" && u.startsWith("http")) return u;
  }
  const thumb = item.mediaThumbnail;
  if (Array.isArray(thumb)) {
    for (const t of thumb) {
      if (t && typeof t === "object" && "url" in t && typeof (t as { url: unknown }).url === "string") {
        const u = (t as { url: string }).url;
        if (u.startsWith("http")) return u;
      }
    }
  } else if (thumb && typeof thumb === "object" && "url" in thumb) {
    const u = (thumb as { url: unknown }).url;
    if (typeof u === "string" && u.startsWith("http")) return u;
  }
  const enc = item.enclosure;
  if (enc && typeof enc === "object" && "url" in enc && typeof (enc as { url: unknown }).url === "string") {
    const u = (enc as { url: string }).url;
    if ((enc as { type?: string }).type?.startsWith("image")) return u;
  }
  return null;
}

export async function fetchFeed(feedUrl: string): Promise<FetchResult> {
  const started = Date.now();
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "user-agent":
          "Last24hours/0.1 (news aggregation bot; +https://last24hours.vercel.app)",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      return {
        items: [],
        httpStatus: res.status,
        etag: null,
        lastModified: null,
        error: `HTTP ${res.status}`,
        responseMs: Date.now() - started,
      };
    }
    const xml = await res.text();
    const parsed = (await parser.parseString(xml)) as unknown as Parser.Output<Record<string, unknown>> & {
      link?: string | undefined;
    };
    if (!parsed || !Array.isArray(parsed.items)) {
      return {
        items: [],
        httpStatus: res.status,
        etag: null,
        lastModified: null,
        error: "Unparseable feed",
        responseMs: Date.now() - started,
      };
    }
    const items: FetchedItem[] = parsed.items.slice(0, 60).map((it) => {
      const rawUrl = typeof it.link === "string" ? it.link : "";
      const url = rawUrl ? new URL(rawUrl, feedUrl).toString() : "";
      const title = cleanText(it.title ?? "");
      let pub: Date | null = null;
      if (it.isoDate) pub = new Date(it.isoDate);
      else if (it.pubDate) pub = new Date(it.pubDate);
      if (pub && Number.isNaN(pub.getTime())) pub = null;
      const summary = cleanText(it.summary ?? it.description ?? "");
      const excerpt = cleanText(it.contentEncoded ?? "") || summary;
      const author = typeof it.creator === "string" ? it.creator : typeof it.dcCreator === "string" ? it.dcCreator : null;
      return {
        url,
        headline: title,
        summary,
        excerpt,
        published: pub,
        image: pickImage(it),
        author,
      };
    });
    return {
      items: items.filter((i) => i.url && i.headline),
      httpStatus: res.status,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
      error: null,
      responseMs: Date.now() - started,
    };
  } catch (e) {
    return {
      items: [],
      httpStatus: 0,
      etag: null,
      lastModified: null,
      error: e instanceof Error ? e.message : "Unknown fetch error",
      responseMs: Date.now() - started,
    };
  }
}
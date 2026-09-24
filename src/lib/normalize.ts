import { createHash } from "node:crypto";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "from", "that", "this",
  "has", "have", "had", "is", "are", "was", "were", "will", "would", "could",
  "should", "of", "in", "on", "at", "to", "by", "as", "after", "before", "over",
  "into", "its", "it's", "their", "his", "her", "our", "your", "my", "me", "we",
  "they", "them", "he", "she", "you", "who", "what", "when", "where", "why", "how",
  "say", "says", "said", "report", "reports", "reported", "news", "update",
  "bbc", "reuters", "guardian", "npr", "ap", "dw", "sky", "aljazeera", "cnn",
  "getty", "new", "latest", "breaking", "live", "watch", "video",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['"’`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export function normalizeHeadline(input: string): string {
  const cleaned = input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+-\s*(BBC|Reuters|Al Jazeera|The Guardian|NPR|AP|DW|Sky News|France 24|Dawn|NASA|The Economist|Hindustan Times|The Hindu)( News)?(\s*-\s*.*)?$/i, "")
    .trim();
  const tokens = tokenize(cleaned);
  return tokens.sort().join(" ");
}

export function headlineHash(text: string): string {
  return createHash("sha256").update(normalizeHeadline(text)).digest("hex");
}

export function sha1(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function cleanHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripRssSuffix(input: string): string {
  return input
    .replace(/-\s*(BBC News|Reuters|The Guardian|NPR|DW|France 24|Sky News|Dawn|Al Jazeera|Hindustan Times|The Hindu|The Economist|AP)\s*$/i, "")
    .trim();
}
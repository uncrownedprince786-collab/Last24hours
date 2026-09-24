import { tokenize, jaccard } from "../normalize";
import type { FetchedItem } from "./fetcher";

export type Sage = {
  headline: string;
  summary: string;
  keyFacts: Fact[];
  confirmed: string[];
  developing: string[];
  latestDevelopment: string | null;
};

export type Fact = {
  statement: string;
  attribution: string;
  certainty: "fact" | "attributed" | "unconfirmed" | "opinion" | "analysis";
};

export function asSentence(text: string, maxLen = 260): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const idx = t.search(/[.!?](?:\s|$)/);
  if (idx > -1) t = t.slice(0, idx + 1);
  if (t.length > maxLen) {
    const cut = t.slice(0, maxLen).replace(/\s+\S*$/, "");
    t = `${cut}…`;
  }
  return t;
}

export function buildSage(headline: string, reports: { name: string; summary: string; published: Date | null }[]): Sage {
  const sentences = reports
    .map((r) => ({ name: r.name, sentence: asSentence(r.summary), published: r.published }))
    .filter((r) => r.sentence.length > 30);

  const keyFacts: Fact[] = [];
  const seen: string[][] = [];
  for (const r of sentences) {
    const toks = tokenize(r.sentence);
    const dup = seen.some((s) => jaccard(s, toks) > 0.62);
    if (dup) continue;
    seen.push(toks);
    keyFacts.push({
      statement: r.sentence,
      attribution: r.name,
      certainty: "attributed",
    });
    if (keyFacts.length >= 6) break;
  }

  const confirmed: string[] = [];
  const developing: string[] = [];
  for (let i = 0; i < sentences.length; i += 1) {
    const a = tokenize(sentences[i].sentence);
    let support = 1;
    for (let j = 0; j < sentences.length; j += 1) {
      if (i === j) continue;
      if (jaccard(a, tokenize(sentences[j].sentence)) > 0.45) support += 1;
    }
    if (support >= 2) confirmed.push(sentences[i].sentence);
    else developing.push(sentences[i].sentence);
  }
  const confirmedUniq = [...new Set(confirmed)].slice(0, 4);
  const developingUniq = [...new Set(developing)].filter(
    (d) => !confirmedUniq.some((c) => jaccard(tokenize(c), tokenize(d)) > 0.5)
  ).slice(0, 4);

  const newest = [...reports].sort((a, b) => (a.published?.getTime() ?? 0) - (b.published?.getTime() ?? 0)).pop();
  const latestDevelopment = newest ? asSentence(newest.summary, 200) : null;

  const sample = sentences[0];
  let summary: string;
  if (sample) {
    const n = reports.length;
    summary = `${headline}. ${n === 1 ? "One outlet" : `At least ${n} outlets`} ${n === 1 ? "is" : "are"} reporting on this as of the last 24 hours. ${sample.sentence} ${latestDevelopment && sample.sentence !== latestDevelopment ? `The latest reports add: ${latestDevelopment}` : ""}`;
  } else {
    summary = `${headline}. Reporting is developing across the sources listed below.`;
  }

  return {
    headline,
    summary: summary.slice(0, 600),
    keyFacts,
    confirmed: confirmedUniq,
    developing: developingUniq,
    latestDevelopment,
  };
}
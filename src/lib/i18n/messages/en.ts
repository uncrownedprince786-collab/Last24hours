export const en: {
  brand: Record<string, string>;
  nav: Record<string, string>;
  sections: Record<string, string>;
  story: Record<string, string>;
  common: Record<string, string>;
  search: Record<string, string>;
  trendingPage: Record<string, string>;
  about: Record<string, string>;
  meta: Record<string, string>;
  footer: Record<string, string>;
} = {
  brand: {
    name: "Last24hours",
    tagline: "What happened in the last 24 hours",
  },
  nav: {
    home: "Home",
    world: "World",
    business: "Business",
    technology: "Technology",
    science: "Science",
    politics: "Politics",
    economy: "Economy",
    sports: "Sports",
    culture: "Culture",
    pakistan: "Pakistan",
    explainers: "Explainers",
    trending: "Trending",
    search: "Search",
  },
  sections: {
    breaking: "Breaking",
    topStories: "Top Stories",
    aroundTheWorld: "Around the World",
    businessEconomy: "Business & Economy",
    technology: "Technology",
    science: "Science & Environment",
    pakistan: "Pakistan",
    explained: "Explained",
    mostUpdated: "Most Updated",
    trending: "Trending",
  },
  story: {
    updatedAt: "Updated",
    summary: "Summary",
    keyFacts: "Key facts",
    latestDevelopment: "Latest development",
    timeline: "Timeline",
    sources: "What different sources report",
    confirmed: "Confirmed",
    developing: "Developing / Unconfirmed",
    background: "Background",
    context: "Why it matters",
    relatedStories: "Related stories",
    readOriginal: "Read original",
    source: "Source",
    attribution: "Reporting aggregated and attributed to the original publishers below.",
    updated: "Updated",
  },
  common: {
    now: "now",
    readMore: "Read more",
    back: "Back",
    allRightsReserved: "All rights reserved to their respective owners.",
  },
  search: {
    title: "Search",
    placeholder: "Search stories, topics, countries…",
    noResults: "No results found for",
    resultsFor: "Results for",
    hint: "Search stories by keyword, country, person or topic.",
    trending: "Most viewed stories",
  },
  trendingPage: {
    title: "Trending",
    subtitle: "Stories readers are following right now, ranked by recent engagement and reporting activity.",
    methodology: "Trending is ranked by recent page views and update frequency over the last 24 hours.",
  },
  about: {
    title: "About",
    body: "Last24hours captures what happened in the last 24 hours by aggregating reporting from established public sources, grouping reports on the same events, and presenting original briefings with transparent attribution.",
  },
  meta: {
    description:
      "Understand the story, not just the headline. Aggregated, attributed and verified news briefings from the last 24 hours — searchable in multiple languages.",
  },
  footer: {
    about: "About",
    trending: "Trending",
    explainers: "Explainers",
    privacy: "Privacy",
    sources: "Sources",
  },
};

export type Messages = typeof en;
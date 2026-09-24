import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const LICENSE_NOTE =
  "Public RSS feed for syndication. Only headline, summary, excerpt, timestamp and feed-provided thumbnail metadata are used. Full articles remain at the publisher and every item links back to and attributes the original publisher.";

const SOURCES = [
  { name: "BBC News", domain: "bbc.co.uk", home: "https://www.bbc.com/news", category: "world", country: "GB", feeds: [
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", kind: "rss", cat: "world" },
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml", kind: "rss", cat: "economy" },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", kind: "rss", cat: "technology" },
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", kind: "rss", cat: "science" },
    { url: "https://feeds.bbci.co.uk/news/politics/rss.xml", kind: "rss", cat: "politics" },
    { url: "https://feeds.bbci.co.uk/news/uk/rss.xml", kind: "rss", cat: "world" },
  ]},
  { name: "Al Jazeera", domain: "aljazeera.com", home: "https://www.aljazeera.com", category: "world", country: "QA", feeds: [
    { url: "https://www.aljazeera.com/xml/rss/all.xml", kind: "rss", cat: "world" },
  ]},
  { name: "The Guardian", domain: "theguardian.com", home: "https://www.theguardian.com", category: "world", country: "GB", feeds: [
    { url: "https://www.theguardian.com/world/rss", kind: "rss", cat: "world" },
    { url: "https://www.theguardian.com/business/rss", kind: "rss", cat: "economy" },
    { url: "https://www.theguardian.com/technology/rss", kind: "rss", cat: "technology" },
    { url: "https://www.theguardian.com/science/rss", kind: "rss", cat: "science" },
  ]},
  { name: "Deutsche Welle", domain: "dw.com", home: "https://www.dw.com", category: "world", country: "DE", feeds: [
    { url: "https://rss.dw.com/rdf/rss-en-world", kind: "rss", cat: "world" },
  ]},
  { name: "NPR", domain: "npr.org", home: "https://www.npr.org", category: "world", country: "US", feeds: [
    { url: "https://feeds.npr.org/1004/rss.xml", kind: "rss", cat: "world" },
  ]},
  { name: "France 24", domain: "france24.com", home: "https://www.france24.com", category: "world", country: "FR", feeds: [
    { url: "https://www.france24.com/en/rss", kind: "rss", cat: "world" },
  ]},
  { name: "Sky News", domain: "skynews.com", home: "https://news.sky.com", category: "world", country: "GB", feeds: [
    { url: "https://feeds.skynews.com/feeds/rss/world.xml", kind: "rss", cat: "world" },
  ]},
  { name: "Dawn", domain: "dawn.com", home: "https://www.dawn.com", category: "pakistan", country: "PK", feeds: [
    { url: "https://www.dawn.com/feeds/home", kind: "rss", cat: "pakistan" },
  ]},
  { name: "Hindustan Times", domain: "hindustantimes.com", home: "https://www.hindustantimes.com", category: "world", country: "IN", feeds: [
    { url: "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml", kind: "rss", cat: "world" },
  ]},
  { name: "The Hindu", domain: "thehindu.com", home: "https://www.thehindu.com", category: "world", country: "IN", feeds: [
    { url: "https://www.thehindu.com/news/international/feeder/default.rss", kind: "rss", cat: "world" },
  ]},
  { name: "NASA", domain: "nasa.gov", home: "https://www.nasa.gov", category: "science", country: "US", feeds: [
    { url: "https://www.nasa.gov/news-release/feed/", kind: "rss", cat: "science" },
  ]},
  { name: "The Economist", domain: "economist.com", home: "https://www.economist.com", category: "economy", country: "GB", feeds: [
    { url: "https://www.economist.com/the-world-this-week/rss.xml", kind: "rss", cat: "world" },
  ]},
];

const CATEGORIES = [
  ["world", "World"], ["business", "Business"], ["technology", "Technology"],
  ["science", "Science"], ["politics", "Politics"], ["economy", "Economy"],
  ["sports", "Sports"], ["culture", "Culture"], ["pakistan", "Pakistan"],
  ["explainers", "Explainers"],
];

const COUNTRIES = [
  ["US","United States"],["GB","United Kingdom"],["PK","Pakistan"],["IN","India"],["CN","China"],
  ["RU","Russia"],["UA","Ukraine"],["FR","France"],["DE","Germany"],["JP","Japan"],
  ["KR","South Korea"],["SA","Saudi Arabia"],["AE","United Arab Emirates"],["QA","Qatar"],
  ["EG","Egypt"],["IR","Iran"],["IL","Israel"],["TR","Turkey"],["SY","Syria"],["AF","Afghanistan"],
  ["BD","Bangladesh"],["BR","Brazil"],["MX","Mexico"],["CA","Canada"],["AU","Australia"],
  ["NZ","New Zealand"],["ES","Spain"],["IT","Italy"],["NL","Netherlands"],["SE","Sweden"],
  ["NO","Norway"],["CH","Switzerland"],["AT","Austria"],["BE","Belgium"],["PT","Portugal"],
  ["GR","Greece"],["PL","Poland"],["CZ","Czechia"],["HU","Hungary"],["RO","Romania"],
  ["UA2","Ukraine"],["BY","Belarus"],["KZ","Kazakhstan"],["UZ","Uzbekistan"],["MN","Mongolia"],
  ["TH","Thailand"],["VN","Vietnam"],["MY","Malaysia"],["SG","Singapore"],["ID","Indonesia"],
  ["PH","Philippines"],["NP","Nepal"],["LK","Sri Lanka"],["MM","Myanmar"],["KH","Cambodia"],
  ["NG","Nigeria"],["KE","Kenya"],["ET","Ethiopia"],["ZA","South Africa"],["DZ","Algeria"],
  ["MA","Morocco"],["TN","Tunisia"],["LY","Libya"],["SD","Sudan"],["YE","Yemen"],
  ["JO","Jordan"],["LB","Lebanon"],["KW","Kuwait"],["OM","Oman"],["BH","Bahrain"],
  ["IQ","Iraq"],["SE2","Somalia"],["CF","Central African Republic"],["CD","DR Congo"],
  ["GM","Gambia"],["ML","Mali"],["NE","Niger"],["BF","Burkina Faso"],["AR","Argentina"],
  ["CL","Chile"],["CO","Colombia"],["PE","Peru"],["VE","Venezuela"],["CU","Cuba"],
  ["IS","Iceland"],["IE","Ireland"],["DK","Denmark"],["FI","Finland"],["LT","Lithuania"],
  ["LV","Latvia"],["EE","Estonia"],["BG","Bulgaria"],["HR","Croatia"],["RS","Serbia"],
  ["GE","Georgia"],["AM","Armenia"],["AZ","Azerbaijan"],["AL","Albania"],["MK","North Macedonia"],
  ["SN","Senegal"],["GH","Ghana"],["CI","Ivory Coast"],["UG","Uganda"],["TZ","Tanzania"],
  ["ZM","Zambia"],["ZW","Zimbabwe"],["BW","Botswana"],["NA","Namibia"],["AO","Angola"],
  ["MZ","Mozambique"],["MG","Madagascar"],["EC","Ecuador"],["BO","Bolivia"],["UY","Uruguay"],
  ["PY","Paraguay"],["GT","Guatemala"],["HN","Honduras"],["NI","Nicaragua"],["SV","El Salvador"],
  ["CR","Costa Rica"],["PA","Panama"],["DO","Dominican Republic"],["HT","Haiti"],["JM","Jamaica"],
];

async function main() {
  await client.connect();
  console.log("Seeding categories...");
  for (const [slug, name] of CATEGORIES) {
    await client.query(
      `INSERT INTO categories (slug, name, locale) VALUES ($1,$2,'en') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
      [slug, name]
    );
  }
  console.log("Seeding countries...");
  for (const [code, name] of COUNTRIES) {
    if (code.length === 2) {
      await client.query(
        `INSERT INTO countries (code, name, locale) VALUES ($1,$2,'en') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
        [code, name]
      );
    }
  }
  console.log("Seeding sources & feeds...");
  for (const s of SOURCES) {
    const { rows } = await client.query(
      `INSERT INTO sources (name, domain, home_url, category, language, country, license_notes, attribution_required, enabled, health)
       VALUES ($1,$2,$3,$4,'en',$5,$6,true,$7,'green')
       ON CONFLICT (domain) DO UPDATE SET name=EXCLUDED.name, home_url=EXCLUDED.home_url, category=EXCLUDED.category, country=EXCLUDED.country, license_notes=EXCLUDED.license_notes, enabled=true
       RETURNING id`,
      [s.name, s.domain, s.home, s.category, s.country, LICENSE_NOTE, true]
    );
    const sourceId = rows[0].id;
    for (const f of s.feeds) {
      await client.query(
        `INSERT INTO source_feeds (source_id, feed_url, kind, lang, enabled, item_count)
         VALUES ($1,$2,$3,'en',true,0)
         ON CONFLICT (feed_url) DO UPDATE SET source_id=EXCLUDED.source_id, enabled=true`,
        [sourceId, f.url, f.kind]
      );
      await client.query(
        `INSERT INTO source_health (source_id, status, checked_at, consecutive_failures)
         VALUES ($1,'green',now(),0) ON CONFLICT (source_id) DO NOTHING`,
        [sourceId]
      );
    }
  }
  await client.query(
    `INSERT INTO system_settings (key, value) VALUES
      ('site_name','Last24hours'),
      ('tagline','What happened in the last 24 hours'),
      ('last_ingest', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
      ('last_cluster', '')
     ON CONFLICT (key) DO UPDATE SET value = system_settings.value`
  );
  console.log("Seed complete.");
  await client.end();
}

main().catch((e) => { console.error("Seed failed:", e); process.exit(1); });
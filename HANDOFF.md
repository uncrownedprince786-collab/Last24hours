# Last24hours — Handoff / Project Brief (for the next engineer)

> Repo: https://github.com/uncrownedprince786-collab/Last24hours (public, branch `main`)
> Live target: https://last24hours.vercel.app (NOT deployed yet — see Deployment section)
> Product spec (authoritative): `C:\Users\NEW TECH\Downloads\global-news-intelligence-master-build-brief.md` (the "brief")

---

## 1. What this project is

**Last24hours — "What happened in the last 24 hours"** is a multilingual global news
aggregation / intelligence platform. It continuously ingests RSS feeds from credible
editorial sources, clusters related reports into single "events" (stories), publishes them
with generated summaries, and serves them as a fast, SEO-friendly, translated news site in
**English, Urdu, Arabic, Spanish, German, French** (RTL fully supported for ur/ar).

Core principles (from the brief):
- **Metadata-only aggregation.** We store headlines, timestamps, thumbnails, and short
  excerpts. Full articles are never copied. Every story links out to the original publisher
  with clear attribution (`rel="nofollow noopener sponsored"`).
- **Intelligence-style event page.** Each story shows: headline, generated summary,
  "Key facts" (ver-attributed sentences), "Latest development", timeline, per-source
  comparison table, confirmed vs. developing info, background, related stories, JSON-LD.
- **Honesty features.** "Trending" is only shown when a story has legitimate traffic
  (>= 20 views in 24h); otherwise the section is labeled "Most Updated" organized by
  update count / recency. No fabricated content. Admin can hide/reject/edit/merge.
- **Privacy.** No raw IPs are stored. Page views are reported via `navigator.sendBeacon`
  to `/api/ring` with only `event_id` + referrer host.

---

## 2. Stack & key versions

| Layer | Choice |
|---|---|
| Framework | Next.js **16.3.5** (App Router, Turbopack for dev/build) |
| UI | React 19.2.8, Tailwind CSS **v4** (`@import "tailwindcss"` + CSS variables = design tokens; dark mode via `.dark` class) |
| Language | TypeScript (strict) |
| DB | **Neon** serverless Postgres (see §4) via `pg` (Pool) |
| RSS parsing | `rss-parser` |
| Tests | `vitest` installed, **no test files written yet** |
| Deploy | Vercel (target `last24hours.vercel.app`) |
| Runtime env | Node v24, npm 11 |

Local env facts: git 2.55, Vercel CLI 54.18.7 logged in as `uncrownedprince786-6663`,
Node v24.12.0, npm 11.6.2.

---

## 3. Repository layout (src/ tree)

```
src/
  middleware.ts            # locale resolution + redirects (@deprecated name in Next 16, see Known issues)
  lib/
    db.ts                  # pg Pool singleton; requires DATABASE_URL env (NO hardcoded password)
    data.ts                # ALL page queries + URL helpers (storyPath, localizedCategoryPath, hreflang)
    slug.ts, normalize.ts  # slugify(ensureUniqueSlug), tokenize/normalizeHeadline/jaccard/headlineHash
    seo.ts                 # buildMetadata (canonical, hreflang, OG/Twitter, JSON-LD)
    auth.ts                # HMAC sign/verify (Edge-safe subtle crypto), cookie name, getAdminSecret (fail-closed)
    admin-auth.ts          # cookie→session verification for /admin layouts
    cron-auth.ts           # Bearer CRON_SECRET or "vercel-cron: true" header guard
    i18n/
      config.ts            # LOCALES (en ur ar es de fr; enabled flags), DEFAULT_LOCALE
      resolve.ts           # cookie L24_LOCALE → Accept-Language → Vercel-IP-country → en
      index.ts             # getMessages(), getTranslator()
      messages/{en,ur,ar,es,de,fr}.ts   # UI string dictionaries
    ingest/
      fetcher.ts           # RSS fetch with ETag/Last-Modified, dedupe by URL + headline hash
      ingest.ts            # runIngestJob() → inserts source_reports (metadata only)
      cluster.ts           # event clustering (jaccard >= 0.52 or hash match), quality gate, auto-publish,
                           #   attachReportToEvent, refreshEventContent (buildSage), publishQualified
      summarize.ts         # buildSage: summaries / keyFacts / confirmed / developing / latestDev (attributed)
      jobs.ts              # jobs + job_runs bookkeeping
    translation/
      provider.ts          # TranslationProvider interface + MyMemory free provider (rate-limited),
                           #   translateEvent, runTranslationsJob
  app/
    [locale]/              # page (home), [category]/page, [category]/[slug]/page,
                           #   search, trending, about, not-found, layout (sets <html lang/dir>)
    api/
      ring/                # POST page-view beacon (event_id, referrer host only)
      search/              # GET /api/search?q=&locale= (ILIKE over events)
      admin/{login,logout,events,merge,sources,translate}/
      cron/{tick,ingest,cluster,sitemap,translations}/
    admin/                 # admin UI (layout guards session; events/sources/translations pages)
    sitemap.ts, robots.ts, layout.tsx (reads x-locale header), globals.css, favicon.ico
  components/              # SiteHeader, Footer, MobileNav, LocaleSwitcher, ThemeToggle, SearchBox,
                           #   Section, StoryCard, ViewTracker, AdSlot, admin/* (client comps), icons
migrations/schema.sql      # full schema (below)
scripts/migrate.mjs        # applies schema.sql   → node --env-file=.env.local scripts/migrate.mjs
scripts/seed.mjs           # seeds categories (~10), countries (~100), sources+feeds (12/17), settings
vercel.json                # hourly cron "0 * * * *" → /api/cron/tick; (built with gitignore: .env*, .vercel)
```

### Database schema (migrations/schema.sql)
`sources`, `source_feeds`, `source_reports`, `events`, `event_sources`,
`claims`, `timeline_entries`, `event_updates`, `translations`, `entities`,
`event_entities`, `categories`, `countries`, `tags`, `event_tags`,
`page_views`, `search_events`, `jobs`, `job_runs`, `source_health`, `system_settings`.

Event lifecycle: `pending` → `published` / `hidden` (admin) / `rejected`.
Publish gate: `status='pending' AND source_count>=1 AND length(headline)>=25 AND length(coalesce(summary,''))>=40`.

---

## 4. Database (Neon Postgres)

- Host: `ep-damp-river-b5ang4iq-pooler.c-7.us-east-2.aws.neon.tech`, database `neondb`, `sslmode=require`.
- **Connection string (with password) lives ONLY in `.env.local` → `DATABASE_URL`.**
  Never commit it. It is intentionally NOT in any tracked file.
- Current data state:
  - **546** `source_reports` ingested (from 17 feeds), `jobs.ingest` detail "20 feeds, 546 new".
  - **371** events `published`, all with generated summaries (>= 40 chars) and >= 1 attached report each.
  - **~50 reports still unclustered** (`event_id IS NULL, status='new'`) — next cluster run attaches them.
  - **~497 of 546 reports have empty `summary` AND `excerpt`** (those feeds only provide headline+URL) →
    those stories render a fallback summary (see Known issues).
  - `jobs`: `ingest` last_status currently `failed` (see Known issues #3), `cluster` `ok`.
  - `job_runs` holds two cluster runs (overlapped once — see Known issues #2).

---

## 5. Environment variables (`.env.local` — gitignored)

| Var | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | (real Neon URL, incl. password) | Required. pg Pool connection |
| `ADMIN_PASSWORD` | (secret) | Admin login. Code **fails closed** if unset |
| `CRON_SECRET` | (secret) | Bearer token for /api/cron/* |
| `SITE_URL` | `https://last24hours.vercel.app` | Canonical base for SEO/sitemap |
| `ADS_ENABLED` | optional `"true"` | Renders AdSlot (otherwise nothing) |
| `TRANSLATION_PROVIDER` | optional `"mymemory"` | Translation backend |

`.env.example` documents these with placeholders. **No real secret is committed to GitHub.**

---

## 6. GitHub

- Repo: https://github.com/uncrownedprince786-collab/Last24hours (owned org
  `uncrownedprince786-collab`), **public**, branch `main`.
- First commit `77c2ace` "feat: initial launch of Last24hours news intelligence platform"
  (92 files, ~13,800 lines), pushed to `origin/main`.
- Local clone: `C:\Users\NEW TECH\Documents\Default Project\Last24hours`.
  Parent dir `C:\Users\NEW TECH\Documents\Default Project` is NOT a repo (ignore its
  `.vercel/project.json` — that belongs to an unrelated "acethepmp" project).
- If a future deploy fails on secrets, the org may prefer a **private** repo; not changed yet.

---

## 7. Vercel — NOT DEPLOYED YET (pending)

- CLI is authenticated as **`uncrownedprince786-6663`** (org/project scope `uncrownedprince786-6663`);
  a Vercel project named **`Last24hours`** + domain **`last24hours.vercel.app`** were mentioned in the brief.
- Local `.vercel/` is gitignored and currently links to the unrelated "acethepmp" project — for
  Last24hours you must **`vercel link` anew from the repo dir**.
- To deploy (next engineer):
  1. `vercel link` (project `Last24hours`, scope `uncrownedprince786-6663`).
  2. Add env vars in prod (and preview): `DATABASE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`,
     `SITE_URL=https://last24hours.vercel.app` — e.g. `vercel env add DATABASE_URL production`.
  3. `vercel --prod`.
  4. Verify `https://last24hours.vercel.app`, `/sitemap.xml`, `/robots.txt`, a story URL in every locale.
  5. Confirm the hourly cron (`vercel.json`: `0 * * * *` → `/api/cron/tick`) fires and that
     `CRON_SECRET` matches the `vercel: true` header guard (route also accepts `Authorization: Bearer <CRON_SECRET>`).
- Production db is the SAME Neon instance as local (shared), so deployed apps share data immediately.

---

## 8. What is DONE

- Full App-Router site: home with sections (Top/Breaking/World/Business+Economy/Tech/Science/
  Pakistan/Most Updated|Trending/Explained), category pages with pagination, story pages with all
  intelligence blocks, search page + `/api/search`, trending page, about, not-found, robots, sitemap.
- Locale-prefixed routing for ALL enabled locales incl. English (`/en/world/slug`, `/ur/world/slug`);
  middleware resolves locale from cookie `L24_LOCALE` → Accept-Language → Vercel country → `en`,
  and redirects bare `/world/...` → `/{locale}/world/...`. RTL (`dir=rtl`) for ur/ar.
- i18n UI dictionaries for en/ur/ar/es/de/fr; `getMessages`/`getTranslator`; hreflang linkset builder.
- Ingestion pipeline proven end-to-end: RSS fetch (ETag/Last-Modified), URL+hash dedupe,
  546 reports ingested from BBC, Al Jazeera, Guardian, DW, NPR, France 24, Sky News, Dawn,
  Hindustan Times, The Hindu, NASA, The Economist.
- Clustering proven: 371 events published with generated summaries; jaccard ≥ 0.52 or hash match;
  auto-publish gate; `refreshEventContent` regenerates Key facts / Confirmed / Developing / Latest dev.
- Admin: `/admin` login (HMAC cookie `l24_admin`), events list, sources enable/disable,
  translations overview + manual Translate button (calls `/api/admin/translate`), merge endpoint.
- Cron scaffolding: `vercel.json` hourly tick → ingest → cluster → translations (chained in
  `/api/cron/tick`), plus standalone `/sitemap` (regenerates sitemap for completed translations).
- SEO: per-locale canonical (`/en/...`), hreflang (all enabled locales + x-default), OG/Twitter,
  JSON-LD NewsArticle, dynamic sitemap (static route, 1h ISR), robots allow + sitemap ref.
- Privacy: no raw IP stored; `/api/ring` beacon (event_id + referrer host); `robots` no-store safe.
- `npm run build` ✓ (all pages dynamic ƒ except sitemap/robots static), `npx tsc --noEmit` ✓.
- Hardened secrets in repo: admin default password removed (fails closed), `.env*` gitignored,
  `.env.example` committed, no `npg_*`/URL/password strings in tracked files.
- README/AGENTS.md/CLAUDE.md exist (README is still create-next-app boilerplate — update it).

## 9. What is PENDING / NEXT (ordered)

1. **Restart local dev server on a NEW port (e.g. 3100).** Port 3000 is currently taken by an
   unrelated app (`Desktop\Antigravitity\New folder\survive` = `next start`). Start ours with
   `npm run dev -- --port 3100` and re-verify `/en` renders published stories.
2. **Harden cluster/ingest against overlap** (recommended before production):
   add a Postgres **advisory lock** (`pg_advisory_lock`) around `runIngestJob`/`runClustering`
   and **batch the per-event UPDATEs** in `refreshEventContent`/attach loops (currently one update
   per report → runs take ~5–13 min and two overlapping runs produce inconsistent publishes, which
   happened during testing).
3. **Exercise the full chain** `/api/cron/tick` (ingest→cluster→translations) and verify
   translations land for ur/ar/es/de/fr (MyMemory provider is free + rate-limited; check
   `/api/cron/translations` response and `translations` rows, then `/sitemap`).
4. **Thin-content decision.** ~497/546 reports have no description text from the feeds, so summaries
   fall back to "…Reporting is developing across the sources listed below." Decide: keep (per brief's
   metadata-only rule) or enrich later. Also consider title-cased multi-source fallback.
5. **Sort out `jobs.ingest` "failed" label.** `jobs` shows `ingest = failed` with detail
   "20 feeds, 546 new" even though 546 items were ingested — the status flip is mis-tagged;
   audit `runIngestJob` recordJobRun/status handling.
6. **Write tests (vitest).** None exist yet despite vitest + `npm test`/`test:watch` scripts.
   Start with: slugify/ensureUniqueSlug, tokenize/normalizeHeadline, jaccard/headlineHash,
   buildSage/asSentence, publish gate logic, locale resolver, timeAgoLabel.
7. **Docs:** create `brain.md` (required by the brief) summarizing architecture/sources/env/cron/
   editorial rules; replace README boilerplate with a real project README (badges, setup, env, deploy).
8. **Deploy & verify (see §7).** Then run a **PRODUCTION REGRESSION REPORT** per brief §49 and hand back.
9. **Cosmetic/dev-hygiene, optional:** migrate `middleware` → `proxy` file convention
   (`npx @next/codemod@canary middleware-to-proxy .`); silence pg sslmode alias warning by using
   `sslmode=verify-full` explicitly; verify homepage `<title>` no longer duplicates brand
   (template removed from root layout).

## 10. Known issues & quirks

1. **Port 3000 collision** — another local project (survive) binds 3000. Use 3100 for ours.
2. **Cluster concurrency + slowness** — no lock; overlapping runs OK for demo but must be fixed
   before trusting hourly cron. Two test runs overlapped (job_runs 13:51→14:05 & 13:59→14:05).
3. **`jobs.ingest` mislabeled `failed`** while actually inserting 546 items — audit status writing.
4. **Thin reports** — most feeds have empty summary/excerpt; pages lean on headline + fallback summary.
5. **Next 16 deprecation warning:** "middleware file convention is deprecated, use proxy" — harmless,
   still works; migrate if desired.
6. **pg SSL warning:** `sslmode=require` is treated as alias for `verify-full` by current `pg` —
   cosmetic; connectivity verified working.
7. **`x-global-intel-agent` / `engineering-intelligence` dirs exist in the parent folder** — likely a
   parallel agent workspace; distinct from this project (Last24hours IS the repo being worked here).

## 11. How to run locally

```bash
cd <repo>                          # C:\Users\NEW TECH\Documents\Default Project\Last24hours
npm install
copy .env.example .env.local      # then fill DATABASE_URL, ADMIN_PASSWORD, CRON_SECRET, SITE_URL
node --env-file=.env.local scripts/migrate.mjs      # schema (idempotent)
node --env-file=.env.local scripts/seed.mjs         # categories/countries/sources/feeds (idempotent-ish)
npm run dev -- --port 3100        # http://localhost:3100/en
```

Manual pipeline (for testing without cron):
```bash
# Bearer = CRON_SECRET
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3100/api/cron/ingest
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3100/api/cron/cluster
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3100/api/cron/translations
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3100/api/cron/sitemap
# Or the real chain: /api/cron/tick
```

Admin: visit `/admin`, log in with `ADMIN_PASSWORD`. Review/hide/merge events, toggle sources,
trigger translations per event.

---

*This handoff was generated after the initial commit (`77c2ace`). Verify leading "facts" that are
time-sensitive (DB counts, job statuses) against the live Neon DB before relying on them.*
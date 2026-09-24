-- Last24hours core schema
-- PostgreSQL

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  home_url TEXT NOT NULL,
  category TEXT,
  language TEXT DEFAULT 'en',
  country TEXT,
  license_notes TEXT,
  attribution_required BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  last_success TIMESTAMPTZ,
  last_failure TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  last_item_count INT DEFAULT 0,
  health TEXT DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_feeds (
  id SERIAL PRIMARY KEY,
  source_id INT REFERENCES sources(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL UNIQUE,
  kind TEXT DEFAULT 'rss',
  lang TEXT DEFAULT 'en',
  enabled BOOLEAN DEFAULT true,
  etag TEXT,
  last_modified TEXT,
  last_fetched TIMESTAMPTZ,
  last_status INT,
  item_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS source_reports (
  id BIGSERIAL PRIMARY KEY,
  source_id INT REFERENCES sources(id),
  feed_id INT REFERENCES source_feeds(id),
  url TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  summary TEXT,
  excerpt TEXT,
  image_url TEXT,
  image_alt TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  lang TEXT DEFAULT 'en',
  category TEXT,
  author TEXT,
  raw_hash TEXT,
  normalized_headline TEXT,
  headline_hash TEXT,
  event_id INT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_event ON source_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_hash ON source_reports(headline_hash);
CREATE INDEX IF NOT EXISTS idx_reports_pub ON source_reports(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_url ON source_reports(url);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  category TEXT,
  country TEXT,
  status TEXT DEFAULT 'pending',
  headline TEXT NOT NULL,
  summary TEXT,
  key_facts JSONB DEFAULT '[]'::jsonb,
  latest_development TEXT,
  background TEXT,
  confirmed JSONB DEFAULT '[]'::jsonb,
  developing JSONB DEFAULT '[]'::jsonb,
  importance INT DEFAULT 5,
  source_count INT DEFAULT 0,
  update_count INT DEFAULT 0,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(slug, locale)
);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_pub ON events(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_cat ON events(category);

CREATE TABLE IF NOT EXISTS event_sources (
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  report_id BIGINT REFERENCES source_reports(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  url TEXT,
  position INT,
  PRIMARY KEY(event_id, report_id)
);
CREATE INDEX IF NOT EXISTS idx_es_event ON event_sources(event_id);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  report_id BIGINT REFERENCES source_reports(id),
  statement TEXT NOT NULL,
  attribution TEXT,
  certainty TEXT DEFAULT 'attributed',
  position INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_claims_event ON claims(event_id);

CREATE TABLE IF NOT EXISTS timeline_entries (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ,
  label TEXT NOT NULL,
  detail TEXT,
  report_id BIGINT REFERENCES source_reports(id),
  position INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tl_event ON timeline_entries(event_id);

CREATE TABLE IF NOT EXISTS event_updates (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  report_id BIGINT REFERENCES source_reports(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  summary TEXT
);
CREATE INDEX IF NOT EXISTS idx_updates_event ON event_updates(event_id);

CREATE TABLE IF NOT EXISTS translations (
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  headline TEXT,
  summary TEXT,
  key_facts JSONB,
  latest_development TEXT,
  background TEXT,
  status TEXT DEFAULT 'pending',
  provider TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(event_id, locale)
);

CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  locale TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS event_entities (
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  entity_id INT REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY(event_id, entity_id)
);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS countries (
  code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_tags (
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(event_id, tag_id)
);

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT
);
CREATE INDEX IF NOT EXISTS idx_views_time ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_views_event ON page_views(event_id);

CREATE TABLE IF NOT EXISTS search_events (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  locale TEXT DEFAULT 'en',
  results INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  name TEXT PRIMARY KEY,
  last_run TIMESTAMPTZ,
  last_status TEXT,
  last_duration_ms INT,
  last_detail TEXT
);

CREATE TABLE IF NOT EXISTS job_runs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT,
  detail TEXT,
  duration_ms INT
);

CREATE TABLE IF NOT EXISTS source_health (
  source_id INT PRIMARY KEY REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'green',
  checked_at TIMESTAMPTZ,
  http_status INT,
  response_ms INT,
  parse_ok BOOLEAN,
  item_count INT,
  consecutive_failures INT DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
# AfroConflict — Africa Conflict Intelligence Dashboard
## Complete Claude Code Build Prompt

> **Read this entire document before writing a single line of code.**
> Build everything described. Do not skip sections. Do not simplify.
> This is a flagship tool for AfroTools — build it to the highest standard.

---

## 1. WHAT WE ARE BUILDING

**AfroConflict** is a live intelligence dashboard tracking armed conflicts across Africa
(and global conflicts with direct Africa impact). It shows:

- Active internal and external conflicts with full detail cards
- Real conflict event data (ACLED API when key available, seed data always)
- Displacement tracking (UNHCR API)
- Economic impact and military spending (World Bank + manual)
- Conflict economy & actor networks (who benefits, relational model)
- Scenario-based outlooks (base / optimistic / worst case)
- Admin interface to add/edit/delete any conflict, actor, event, or data point

**Why it matters:** Africa has more active conflicts than any other region yet fewer
intelligence dashboards built by Africans for Africans. This fills that gap.

**Primary URL:** `https://afrotools.africa/tools/africa-conflict/`
**Tool ID:** `africa-conflict`
**Tool prefix:** `acd-` (for CSS classes)
**DB table prefix:** `ac_` (avoids collision with existing Supabase tables)

---

## 2. STACK & RULES

- **Frontend:** Plain HTML + CSS + JavaScript ONLY. No React. No Vue. No frameworks.
- **Maps:** Leaflet.js (CDN) with CartoDB Dark Matter tiles
- **Charts:** Apache ECharts (CDN)
- **Database:** Supabase — use the DATA instance: `jbmhfpkzbgyeodsqhprx.supabase.co`
  - Use `window.AfroAuth.getSupabase()` from `supabase-auth.js` where available
  - For Netlify functions use `process.env.SUPABASE_URL` + `process.env.SUPABASE_SERVICE_KEY`
- **Functions:** Netlify Functions in `/netlify/functions/`
- **Scheduling:** Netlify scheduled functions (cron syntax in function exports)
- **Design:** AfroTools brand tokens from `assets/css/tokens.min.css` — with a dark
  intelligence aesthetic overlay (see Section 9 for full design spec)
- **Components:** Use `<afro-navbar>` and `<afro-footer>` web components on all pages
- **CSS prefix:** All tool-specific classes prefixed with `acd-`
- **JS:** `var` not `let` for cross-script globals (project convention)
- **No inline CSS blocks over 20 lines** — put in external stylesheet

---

## 3. FILE STRUCTURE TO CREATE

```
tools/africa-conflict/
├── index.html            ← Main dashboard (KPIs + map + top conflicts)
├── map.html              ← Full-screen interactive map
├── conflicts.html        ← Filterable conflict list/cards
├── detail.html           ← Individual conflict detail (?id=slug)
├── economy.html          ← Economic impact & military spending
├── displacement.html     ← Displacement tracker
├── actors.html           ← Conflict economy & actor networks
├── forecasts.html        ← Scenario outlooks per conflict
├── methodology.html      ← Data sources, uncertainty disclaimers
└── style.css             ← All tool-specific styles

admin/
└── conflict.html         ← Admin CRUD interface (new page, link from dashboard)

engines/
└── africa-conflict-engine.js  ← IIFE module, all client-side data logic

netlify/functions/
├── conflict-data.js      ← Public read API (GET conflicts, events, displacement)
├── conflict-admin.js     ← Admin CRUD (POST/PUT/DELETE, protected by ADMIN_SECRET)
├── conflict-acled.js     ← ACLED API proxy + normalize (graceful fail if no key)
├── conflict-unhcr.js     ← UNHCR API proxy + normalize
├── conflict-worldbank.js ← World Bank API proxy + normalize
└── conflict-sync.js      ← Scheduled ETL: fetch → normalize → upsert to Supabase

supabase/
└── africa-conflict-seed.sql  ← Complete schema + all seed data
```

---

## 4. COMPLETE DATABASE SCHEMA

Run this SQL in the DATA Supabase instance (`jbmhfpkzbgyeodsqhprx`).
Create all tables with proper RLS (public read, service_role write).

```sql
-- ============================================================
-- AFRICA CONFLICT INTELLIGENCE — DATABASE SCHEMA
-- Instance: jbmhfpkzbgyeodsqhprx (AfroTools Data DB)
-- ============================================================

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLE: ac_conflicts (master conflict records)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_conflicts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,           -- e.g. "sudan-civil-war"
  name                  TEXT NOT NULL,                  -- e.g. "Sudan Civil War"
  short_name            TEXT,                           -- e.g. "Sudan"

  -- Classification
  conflict_type         TEXT NOT NULL CHECK (conflict_type IN (
    'civil_war', 'insurgency', 'interstate', 'proxy_war',
    'coup', 'communal', 'separatist', 'foreign_intervention',
    'hybrid', 'frozen', 'criminal_violence'
  )),
  is_african            BOOLEAN DEFAULT true,           -- false for global conflicts with Africa impact
  africa_impact_reason  TEXT,                           -- if not African, why it matters to Africa

  -- Geography
  primary_country       TEXT NOT NULL,                  -- ISO 3166-1 alpha-2
  countries_involved    TEXT[] DEFAULT '{}',            -- array of ISO codes
  regions               TEXT[] DEFAULT '{}',            -- e.g. ['east-africa', 'horn-of-africa']
  lat                   DECIMAL(10,7),                  -- for map marker
  lng                   DECIMAL(10,7),
  affected_area_km2     BIGINT,

  -- Status & Timeline
  status                TEXT NOT NULL CHECK (status IN (
    'emerging', 'active', 'escalating', 'stalemated',
    'de-escalating', 'frozen', 'negotiation', 'post-conflict'
  )),
  start_date            DATE NOT NULL,
  end_date              DATE,                           -- null if ongoing
  duration_days         INT GENERATED ALWAYS AS (
    COALESCE(end_date, CURRENT_DATE) - start_date
  ) STORED,

  -- Fatalities
  fatalities_min        BIGINT DEFAULT 0,
  fatalities_max        BIGINT DEFAULT 0,
  fatalities_source     TEXT,
  fatalities_date       DATE,                           -- when estimate was last updated

  -- Displacement
  idps_count            BIGINT DEFAULT 0,               -- internally displaced
  refugees_count        BIGINT DEFAULT 0,
  returnees_count       BIGINT DEFAULT 0,
  displacement_source   TEXT,
  displacement_date     DATE,

  -- Military & Economic
  military_spend_usd_m  DECIMAL(12,2),                  -- USD millions/year
  military_spend_source TEXT,
  economic_loss_min_usd_b DECIMAL(12,3),                -- USD billions
  economic_loss_max_usd_b DECIMAL(12,3),
  gdp_drag_pct          DECIMAL(5,2),                   -- % GDP drag
  economic_source       TEXT,

  -- Narrative fields (markdown supported)
  summary               TEXT,                           -- 2-3 paragraph overview
  why_persists          TEXT,                           -- "Why this conflict continues"
  key_triggers          TEXT[],                         -- e.g. ['resource competition', 'ethnic tension']
  resource_links        TEXT[],                         -- e.g. ['gold', 'oil', 'coltan']
  peace_efforts         TEXT,                           -- AU/UN/bilateral peace process notes

  -- Risk & Escalation
  escalation_risk       TEXT CHECK (escalation_risk IN ('critical','high','medium','low','minimal')),
  spillover_risk        TEXT CHECK (spillover_risk IN ('critical','high','medium','low','minimal')),
  spillover_countries   TEXT[],                         -- countries at risk of spillover
  food_insecurity_link  BOOLEAN DEFAULT false,
  election_link         BOOLEAN DEFAULT false,
  climate_link          BOOLEAN DEFAULT false,

  -- Conflict Stage (based on UCDP framework)
  conflict_stage        INT CHECK (conflict_stage BETWEEN 1 AND 6),
  -- 1=Emerging, 2=Active Escalation, 3=Stalemated High, 4=Frozen,
  -- 5=Negotiation, 6=Post-conflict

  -- Data provenance
  data_source           TEXT DEFAULT 'manual',          -- 'acled','ucdp','unhcr','manual','mixed'
  acled_id              TEXT,                           -- ACLED conflict ID for sync
  last_api_sync         TIMESTAMPTZ,
  manually_overridden   BOOLEAN DEFAULT false,          -- true = admin edited over API data
  override_note         TEXT,

  -- Meta
  is_featured           BOOLEAN DEFAULT false,
  is_published          BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_by            TEXT DEFAULT 'admin'
);

CREATE INDEX idx_ac_conflicts_status ON ac_conflicts(status);
CREATE INDEX idx_ac_conflicts_country ON ac_conflicts(primary_country);
CREATE INDEX idx_ac_conflicts_type ON ac_conflicts(conflict_type);
CREATE INDEX idx_ac_conflicts_published ON ac_conflicts(is_published);
CREATE INDEX idx_ac_conflicts_african ON ac_conflicts(is_african);

-- ============================================================
-- TABLE: ac_actors (all entities involved in conflicts)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_actors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  short_name    TEXT,
  actor_type    TEXT NOT NULL CHECK (actor_type IN (
    'state_military', 'rebel_group', 'militia', 'jihadist',
    'foreign_state', 'un_body', 'au_body', 'ngo', 'corporation',
    'arms_dealer', 'mercenary', 'political_party', 'criminal_network',
    'ethnic_group', 'clan', 'other'
  )),
  country       TEXT,                                   -- ISO code of origin
  is_sanctioned BOOLEAN DEFAULT false,
  sanction_body TEXT[],                                 -- e.g. ['UN', 'US OFAC', 'EU']
  description   TEXT,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: ac_conflict_actors (junction: conflicts ↔ actors)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_conflict_actors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id   UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES ac_actors(id) ON DELETE CASCADE,
  role          TEXT CHECK (role IN (
    'primary_belligerent', 'secondary_belligerent', 'support_state',
    'mediator', 'monitor', 'arms_supplier', 'financier',
    'proxy_operator', 'peacekeeping', 'opposition_political'
  )),
  side          TEXT,                                   -- e.g. "Government" or "RSF"
  start_date    DATE,
  end_date      DATE,
  notes         TEXT,
  UNIQUE(conflict_id, actor_id, role)
);

-- ============================================================
-- TABLE: ac_events (conflict events from ACLED or manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id     UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  event_date      DATE NOT NULL,
  event_type      TEXT CHECK (event_type IN (
    'battle', 'airstrike', 'explosion_remote', 'protest',
    'riot', 'violence_against_civilians', 'strategic_development',
    'agreement', 'ceasefire_violation', 'displacement_event'
  )),
  sub_event_type  TEXT,
  location        TEXT,
  country         TEXT,
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  actor1          TEXT,
  actor2          TEXT,
  fatalities      INT DEFAULT 0,
  notes           TEXT,
  source          TEXT,
  acled_event_id  TEXT UNIQUE,                          -- for dedup on sync
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ac_events_conflict ON ac_events(conflict_id);
CREATE INDEX idx_ac_events_date ON ac_events(event_date DESC);

-- ============================================================
-- TABLE: ac_displacement (UNHCR displacement records)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_displacement (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id         UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  record_date         DATE NOT NULL,
  country_origin      TEXT,
  country_asylum      TEXT,
  idps                BIGINT DEFAULT 0,
  refugees            BIGINT DEFAULT 0,
  asylum_seekers      BIGINT DEFAULT 0,
  returnees           BIGINT DEFAULT 0,
  stateless           BIGINT DEFAULT 0,
  source              TEXT DEFAULT 'UNHCR',
  unhcr_id            TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, record_date, country_origin, country_asylum)
);

-- ============================================================
-- TABLE: ac_economic_impact
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_economic_impact (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id           UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  year                  INT NOT NULL,
  gdp_loss_usd_b        DECIMAL(12,3),                  -- USD billions
  gdp_loss_pct          DECIMAL(5,2),
  trade_disruption_usd_b DECIMAL(12,3),
  agriculture_impact_usd_b DECIMAL(12,3),
  infrastructure_loss_usd_b DECIMAL(12,3),
  reconstruction_cost_usd_b DECIMAL(12,3),
  military_spend_usd_b  DECIMAL(12,3),
  humanitarian_aid_usd_b DECIMAL(12,3),
  host_country_burden_usd_b DECIMAL(12,3),              -- cost to countries receiving refugees
  commodity             TEXT[],                          -- disrupted commodities
  trade_routes          TEXT[],                          -- disrupted trade routes
  source                TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, year)
);

-- ============================================================
-- TABLE: ac_economy_actors (conflict economy & beneficiaries)
-- This is the "who profits / conflict economy" relational layer
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_economy_actors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id       UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  actor_id          UUID REFERENCES ac_actors(id),      -- optional link to actor
  entity_name       TEXT NOT NULL,
  entity_type       TEXT NOT NULL CHECK (entity_type IN (
    'arms_supplier', 'resource_extractor', 'smuggling_network',
    'foreign_state_backer', 'reconstruction_contractor',
    'mercenary_firm', 'humanitarian_diversion', 'political_elite',
    'border_racket', 'illicit_financier', 'security_contractor',
    'media_sponsor', 'logistics_intermediary', 'other'
  )),
  alleged_role      TEXT NOT NULL,                       -- plain English description
  interest_type     TEXT[],                              -- e.g. ['gold', 'oil', 'arms', 'territory']
  country_of_origin TEXT,
  evidence_level    TEXT CHECK (evidence_level IN (
    'confirmed', 'alleged', 'suspected', 'disputed', 'historical'
  )) DEFAULT 'alleged',
  confidence_score  INT CHECK (confidence_score BETWEEN 0 AND 100),
  source_count      INT DEFAULT 1,
  sources           JSONB DEFAULT '[]',                  -- [{url, title, date, publisher}]
  sanctions_status  TEXT CHECK (sanctions_status IN (
    'sanctioned', 'under_investigation', 'none', 'unknown'
  )) DEFAULT 'unknown',
  sanction_details  TEXT,
  estimated_value_usd_m DECIMAL(12,2),                  -- estimated value of interest
  is_active         BOOLEAN DEFAULT true,
  last_verified     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ac_economy_conflict ON ac_economy_actors(conflict_id);
CREATE INDEX idx_ac_economy_type ON ac_economy_actors(entity_type);

-- ============================================================
-- TABLE: ac_forecasts (scenario outlooks)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_forecasts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id           UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  forecast_date         DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Base case
  base_duration_months  INT,                             -- additional months estimated
  base_outcome          TEXT,
  base_confidence       INT CHECK (base_confidence BETWEEN 0 AND 100),

  -- Optimistic case
  opt_duration_months   INT,
  opt_outcome           TEXT,
  opt_trigger           TEXT,                            -- what would cause this
  opt_confidence        INT CHECK (opt_confidence BETWEEN 0 AND 100),

  -- Worst case
  worst_duration_months INT,
  worst_outcome         TEXT,
  worst_trigger         TEXT,
  worst_confidence      INT CHECK (worst_confidence BETWEEN 0 AND 100),

  -- Leading indicators being watched
  indicators            JSONB DEFAULT '[]',
  -- e.g. [{"name": "ceasefire violations", "trend": "increasing", "weight": 0.3}]

  key_assumptions       TEXT[],
  analyst_notes         TEXT,
  model_version         TEXT DEFAULT 'manual-v1',
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, forecast_date)
);

-- ============================================================
-- TABLE: ac_timeline (key events / milestones per conflict)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id   UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  event_date    DATE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  significance  TEXT CHECK (significance IN (
    'critical', 'major', 'moderate', 'minor'
  )) DEFAULT 'moderate',
  category      TEXT CHECK (category IN (
    'outbreak', 'escalation', 'ceasefire', 'agreement',
    'violation', 'humanitarian', 'political', 'military',
    'economic', 'international', 'other'
  )),
  source_url    TEXT,
  source_name   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ac_timeline_conflict ON ac_timeline(conflict_id);
CREATE INDEX idx_ac_timeline_date ON ac_timeline(event_date DESC);

-- ============================================================
-- TABLE: ac_monthly_stats (aggregated monthly event data)
-- Populated by scheduled sync job
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_monthly_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id     UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  year            INT NOT NULL,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  event_count     INT DEFAULT 0,
  fatalities      INT DEFAULT 0,
  battles         INT DEFAULT 0,
  airstrikes      INT DEFAULT 0,
  civilian_violence INT DEFAULT 0,
  source          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, year, month)
);

-- ============================================================
-- RLS POLICIES — Public READ, Service role WRITE
-- ============================================================

ALTER TABLE ac_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_conflict_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_displacement ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_economic_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_economy_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Public read on all published conflicts and related data
CREATE POLICY "public_read_conflicts" ON ac_conflicts FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_actors" ON ac_actors FOR SELECT USING (true);
CREATE POLICY "public_read_conflict_actors" ON ac_conflict_actors FOR SELECT USING (true);
CREATE POLICY "public_read_events" ON ac_events FOR SELECT USING (true);
CREATE POLICY "public_read_displacement" ON ac_displacement FOR SELECT USING (true);
CREATE POLICY "public_read_economic" ON ac_economic_impact FOR SELECT USING (true);
CREATE POLICY "public_read_economy_actors" ON ac_economy_actors FOR SELECT USING (true);
CREATE POLICY "public_read_forecasts" ON ac_forecasts FOR SELECT USING (true);
CREATE POLICY "public_read_timeline" ON ac_timeline FOR SELECT USING (true);
CREATE POLICY "public_read_monthly" ON ac_monthly_stats FOR SELECT USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ac_conflicts_updated_at
  BEFORE UPDATE ON ac_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. SEED DATA (20 CONFLICTS)

Insert this after creating the schema. These are real conflicts with sourced estimates.
All figures should be labelled with their source in the UI.

```sql
-- ============================================================
-- SEED: ac_conflicts
-- ============================================================
INSERT INTO ac_conflicts (
  slug, name, short_name, conflict_type, is_african,
  primary_country, countries_involved, regions,
  lat, lng, status, start_date,
  fatalities_min, fatalities_max, fatalities_source, fatalities_date,
  idps_count, refugees_count, displacement_source, displacement_date,
  military_spend_usd_m, economic_loss_min_usd_b, economic_loss_max_usd_b,
  gdp_drag_pct, escalation_risk, spillover_risk, spillover_countries,
  summary, why_persists, key_triggers, resource_links,
  conflict_stage, data_source, is_featured, is_published
) VALUES

-- 1. SUDAN CIVIL WAR
(
  'sudan-civil-war', 'Sudan Civil War (SAF vs RSF)', 'Sudan',
  'civil_war', true, 'SD', ARRAY['SD','SS','EG','LY','CF','TD'],
  ARRAY['east-africa','north-africa'],
  15.5527, 32.5324, 'escalating', '2023-04-15',
  150000, 300000, 'ACLED/UCDP estimates', '2024-12-01',
  10500000, 2100000, 'UNHCR/IDMC', '2024-12-01',
  2800, 15.0, 30.0, 12.5, 'critical', 'critical',
  ARRAY['SS','TD','CF','ET','EG'],
  'The Sudan Civil War began on April 15, 2023 between the Sudanese Armed Forces (SAF) and the Rapid Support Forces (RSF), a paramilitary group led by Mohamed Hamdan Dagalo (Hemedti). What began as a power struggle following the 2021 coup has escalated into one of the worst humanitarian crises in the world, with widespread atrocities, mass displacement, and famine conditions across Darfur and Khartoum.',
  'The conflict persists because both the SAF and RSF have entrenched resource interests — the RSF controls significant gold mining operations in Darfur and Jebel Amer, while SAF-aligned elites control state revenues. Neither side has sufficient military advantage to force a decisive outcome, and foreign sponsors (UAE backing RSF, Egypt and others backing SAF) have no interest in quick resolution.',
  ARRAY['power_struggle','gold_revenues','ethnic_mobilization','foreign_backing','post_coup_instability'],
  ARRAY['gold','livestock','agricultural_land'],
  2, 'mixed', true, true
),

-- 2. DRC — EASTERN DRC / M23
(
  'drc-eastern-conflict', 'Eastern DRC — M23/FDLR Insurgency', 'DRC East',
  'proxy_war', true, 'CD', ARRAY['CD','RW','UG','BI'],
  ARRAY['central-africa','great-lakes'],
  -1.6596, 29.2206, 'escalating', '2021-11-01',
  8000, 20000, 'UCDP/UN Panel of Experts', '2024-12-01',
  6900000, 800000, 'UNHCR/OCHA', '2024-12-01',
  680, 8.0, 20.0, 6.8, 'critical', 'high',
  ARRAY['RW','BI','UG','TZ'],
  'Eastern DRC has experienced near-continuous conflict since the 1990s. The latest cycle, driven by the M23 rebel group backed by Rwanda, escalated sharply in 2021-2024, with M23 capturing Goma in January 2025. The region sits atop the world''s largest reserves of coltan, cobalt, gold, cassiterite, and wolframite — minerals critical to global electronics and EV battery supply chains.',
  'The conflict is sustained by mineral wealth exploitation, ethnic Tutsi-Hutu dynamics imported from the 1994 Rwandan genocide, weak Congolese state capacity, Rwandan strategic interests in eastern DRC buffer zones, and the inability of MONUSCO peacekeepers to establish effective control.',
  ARRAY['mineral_wealth','ethnic_rwandan_dynamics','state_weakness','regional_proxy','land_tenure'],
  ARRAY['coltan','cobalt','gold','cassiterite','wolframite'],
  2, 'mixed', true, true
),

-- 3. ETHIOPIA — AMHARA CONFLICT
(
  'ethiopia-amhara', 'Ethiopia — Amhara Conflict (Fano)', 'Ethiopia-Amhara',
  'civil_war', true, 'ET', ARRAY['ET'],
  ARRAY['east-africa','horn-of-africa'],
  11.0, 38.5, 'active', '2023-04-01',
  5000, 15000, 'ACLED estimates', '2024-12-01',
  1400000, 120000, 'IDMC/UNHCR', '2024-12-01',
  500, 2.0, 5.0, 2.2, 'high', 'medium',
  ARRAY['ER','SD'],
  'Following the Tigray peace agreement of November 2022, a new conflict erupted in the Amhara region between government forces and Fano militia groups. The conflict intensified after the government moved to disarm regional forces in April 2023, triggering a Fano insurgency across Amhara and Oromia. Ethiopia''s internal fragmentation continues to strain Africa''s second most populous nation.',
  'The conflict persists due to Amhara political grievances over loss of territory (Welkait/Raya), distrust of federal government intentions after the Tigray war, and the strength of decentralised Fano militia networks that have deep community roots.',
  ARRAY['regional_autonomy','land_rights','disarmament_resistance','ethnic_federalism','state_overreach'],
  ARRAY[],
  2, 'manual', false, true
),

-- 4. SOMALIA — AL-SHABAAB INSURGENCY
(
  'somalia-al-shabaab', 'Somalia — Al-Shabaab Insurgency', 'Somalia',
  'insurgency', true, 'SO', ARRAY['SO','KE','ET','DJ'],
  ARRAY['east-africa','horn-of-africa'],
  5.1521, 46.1996, 'active', '2006-01-01',
  25000, 60000, 'UCDP battle-deaths + ACLED', '2024-12-01',
  3600000, 1200000, 'UNHCR/IDMC', '2024-12-01',
  840, 3.0, 8.0, 4.1, 'high', 'high',
  ARRAY['KE','ET'],
  'Al-Shabaab has waged an insurgency against the Somali Federal Government and AMISOM/ATMIS peacekeeping forces since 2006. Despite military setbacks, the group controls significant rural territory, runs parallel taxation systems, and conducts regular terrorist attacks in Mogadishu, Nairobi, and Addis Ababa. It is the largest active jihadist organization in sub-Saharan Africa by territorial control.',
  'Al-Shabaab persists through clan-based recruitment in regions where the federal government provides no services, control of taxation on trade routes and agricultural land, ideological appeal in areas of extreme poverty, and governance failures that make the group the de facto authority in parts of Lower and Middle Shabelle.',
  ARRAY['state_failure','clan_politics','ideology','taxation_economy','governance_vacuum'],
  ARRAY['charcoal','sugar_smuggling','taxation','ransom'],
  3, 'mixed', true, true
),

-- 5. NIGERIA — BOKO HARAM / ISWAP
(
  'nigeria-boko-haram', 'Nigeria — Boko Haram / ISWAP Insurgency', 'Nigeria NE',
  'insurgency', true, 'NG', ARRAY['NG','NE','TD','CM'],
  ARRAY['west-africa','sahel'],
  11.8469, 13.1571, 'active', '2009-07-01',
  35000, 60000, 'UCDP/UN estimates', '2024-12-01',
  2100000, 330000, 'IDMC/UNHCR', '2024-12-01',
  2300, 4.0, 10.0, 1.8, 'high', 'high',
  ARRAY['NE','TD','CM'],
  'The Boko Haram insurgency, now split between ISWAP (Islamic State West Africa Province) and Jamā''at Ahl as-Sunnah lid-Da''wah wa''l-Jihād factions, has devastated northeast Nigeria for 15+ years. ISWAP has emerged as the dominant faction and controls rural Lake Chad Basin territory, while conducting regular attacks on military outposts and civilian communities.',
  'The insurgency persists due to extreme poverty and unemployment in northeast Nigeria, perception of government corruption and abuse by security forces, ISWAP''s superior governance model (providing basic services in controlled areas), Lake Chad Basin geography enabling cross-border movement, and difficulty coordinating a multinational military response.',
  ARRAY['poverty','governance_failure','ideology','border_geography','lake_chad_basin'],
  ARRAY['cattle','fish','smuggling'],
  3, 'mixed', false, true
),

-- 6. MOZAMBIQUE — CABO DELGADO
(
  'mozambique-cabo-delgado', 'Mozambique — Cabo Delgado Insurgency', 'Cabo Delgado',
  'insurgency', true, 'MZ', ARRAY['MZ','TZ'],
  ARRAY['east-africa','southern-africa'],
  -12.3500, 40.5200, 'active', '2017-10-05',
  5000, 8000, 'ACLED/UNHCR', '2024-12-01',
  1100000, 58000, 'UNHCR/IDMC', '2024-12-01',
  350, 2.0, 5.0, 3.2, 'high', 'medium',
  ARRAY['TZ'],
  'Ansar al-Sunna (locally known as Al-Shabaab, distinct from Somali group) has waged an insurgency in Mozambique''s northernmost province of Cabo Delgado since 2017. The province sits above the world''s largest natural gas discoveries — Rovuma Basin LNG projects worth USD 60bn+. RWANDESE and SADC forces have helped push insurgents from major towns but rural areas remain contested.',
  'The conflict persists due to extreme economic exclusion of local communities from LNG wealth, historical marginalization of the Muslim north by the Frelimo government in Maputo, Islamic radicalization channelled through Tanzanian networks, and the strategic resource interest that makes full military resolution difficult without addressing underlying inequality.',
  ARRAY['resource_exclusion','marginalization','ideology','lng_proximity','governance_failure'],
  ARRAY['natural_gas','rubies','timber'],
  2, 'mixed', false, true
),

-- 7. MALI — SAHEL INSURGENCY
(
  'mali-sahel', 'Mali — Sahel Jihadist Insurgency', 'Mali-Sahel',
  'insurgency', true, 'ML', ARRAY['ML','NE','BF','MR','SN'],
  ARRAY['west-africa','sahel'],
  17.5707, -3.9962, 'escalating', '2012-01-16',
  10000, 25000, 'ACLED/UCDP', '2024-12-01',
  375000, 180000, 'UNHCR/IDMC', '2024-12-01',
  1200, 3.0, 8.0, 5.6, 'critical', 'critical',
  ARRAY['NE','BF','SN','GN','CI'],
  'The Mali conflict began with the 2012 Tuareg uprising and subsequent jihadist takeover of northern Mali. French Barkhane operation (2014-2022) failed to defeat JNIM and ISGS. Following the 2021 coup, Mali''s military junta expelled French forces and brought in Wagner Group. Violence has spread dramatically into central Mali and across the Sahel belt. In 2023 Mali, Niger, and Burkina Faso formed the Alliance of Sahel States (AES) after leaving ECOWAS.',
  'The conflict persists due to the structural failure of the Sahel state system, marginalization of Tuareg/Fulani/pastoral communities, jihadist organizations'' superior local intelligence networks, gold and smuggling revenues funding JNIM, and the geopolitical vacuum left by French withdrawal now partly filled by Russian Wagner forces who have not improved security outcomes.',
  ARRAY['state_failure','tuareg_grievance','fulani_marginalization','gold_revenues','foreign_military'],
  ARRAY['gold','cocaine_transit','arms_smuggling'],
  2, 'mixed', true, true
),

-- 8. BURKINA FASO
(
  'burkina-faso-insurgency', 'Burkina Faso — Jihadist Insurgency', 'Burkina Faso',
  'insurgency', true, 'BF', ARRAY['BF','ML','NE','GH','CI','TG','BJ'],
  ARRAY['west-africa','sahel'],
  12.3647, -1.5353, 'escalating', '2015-04-01',
  12000, 20000, 'ACLED estimates', '2024-12-01',
  2100000, 60000, 'IDMC/UNHCR', '2024-12-01',
  560, 2.5, 6.0, 5.1, 'critical', 'critical',
  ARRAY['ML','NE','GH','CI','TG'],
  'Burkina Faso has experienced rapid conflict deterioration since 2015, accelerating after two coups in 2022. JNIM and ISGS control an estimated 40% of the territory. The government, now led by Captain Ibrahim Traoré, has expelled French forces, closed French media, and aligned with Russia/Wagner. Burkina Faso now has one of the worst food insecurity crises in Africa.',
  'The insurgency is sustained by spill-over from Mali, deep governance failures across the Sahel, Wagner Group''s inability to improve security despite replacing French forces, gold mining regions providing conflict financing, and inter-community violence that jihadists exploit to recruit.',
  ARRAY['spillover','gold_revenues','governance_collapse','coup_instability','food_insecurity'],
  ARRAY['gold'],
  2, 'manual', true, true
),

-- 9. CAR — CENTRAL AFRICAN REPUBLIC
(
  'car-civil-war', 'Central African Republic Civil War', 'CAR',
  'civil_war', true, 'CF', ARRAY['CF','CM','TD','CD','SS'],
  ARRAY['central-africa'],
  7.0000, 21.0000, 'stalemated', '2012-12-01',
  20000, 50000, 'UCDP/UN', '2024-12-01',
  730000, 740000, 'UNHCR/IDMC', '2024-12-01',
  400, 1.5, 4.0, 8.2, 'high', 'medium',
  ARRAY['CM','TD','CD'],
  'The CAR civil war pits the government (supported by Wagner Group mercenaries since 2018) against a coalition of rebel groups under the Coalition des Patriotes pour le Changement (CPC). CAR is one of the world''s most resource-rich and governance-poor countries, with diamonds, gold, and uranium beneath the conflict zones. Wagner forces control significant mining operations.',
  'The conflict persists because diamond and gold revenues sustain both government-aligned Wagner forces and rebel groups simultaneously. No party has incentive to fully end a war that funds extraction operations. UN peacekeepers (MINUSCA) lack the mandate to address political-economic drivers.',
  ARRAY['diamond_revenues','gold_revenues','wagner_interests','governance_collapse','religious_divide'],
  ARRAY['diamonds','gold','uranium','timber'],
  3, 'manual', false, true
),

-- 10. SOUTH SUDAN
(
  'south-sudan-conflict', 'South Sudan — Persistent Conflict', 'South Sudan',
  'civil_war', true, 'SS', ARRAY['SS','SD','UG','ET'],
  ARRAY['east-africa'],
  6.8770, 31.3070, 'active', '2013-12-15',
  190000, 400000, 'UCDP/LSE estimates', '2024-12-01',
  2200000, 2200000, 'UNHCR', '2024-12-01',
  1100, 3.0, 8.0, 10.4, 'high', 'high',
  ARRAY['SD','UG','ET'],
  'South Sudan''s civil war, beginning in 2013 between forces loyal to President Salva Kiir and Vice President Riek Machar, has created one of Africa''s worst protracted crises. Despite a 2018 peace agreement, violence continues. South Sudan has Africa''s largest oil reserves south of Sudan, which are central to the conflict''s political economy.',
  'The conflict persists because oil revenues — approximately USD 1.5bn/year — are captured by Kiir and Machar factions through parallel oil ministry structures, creating no incentive for genuine peace. Ethnic Dinka-Nuer rivalry provides mobilization framework, and regional neighbors use South Sudan as a proxy space.',
  ARRAY['oil_revenues','ethnic_rivalry','elite_capture','regional_proxy','state_collapse'],
  ARRAY['oil'],
  3, 'manual', false, true
),

-- 11. CAMEROON — ANGLOPHONE CRISIS
(
  'cameroon-anglophone', 'Cameroon — Anglophone Crisis', 'Ambazonia',
  'separatist', true, 'CM', ARRAY['CM'],
  ARRAY['central-africa','west-africa'],
  5.9631, 10.1591, 'stalemated', '2016-10-01',
  4000, 8000, 'Crisis Group / ACLED', '2024-12-01',
  700000, 60000, 'IDMC/UNHCR', '2024-12-01',
  300, 1.2, 3.0, 2.8, 'medium', 'low',
  ARRAY[],
  'Cameroon''s Anglophone crisis began as a lawyers'' and teachers'' strike against the imposition of French language in courts and schools in the English-speaking Northwest and Southwest regions. By 2017, armed separatist groups (Ambazonia Defense Forces) declared independence as "Ambazonia." The conflict remains stalemated with high civilian cost but limited territorial change.',
  'The conflict persists because Yaoundé refuses to entertain any federalism discussion, seeing it as existential threat; armed factions are fragmented with no unified peace interlocutor; and ghost towns (forced school and business closures) have become a conflict tool that keeps communities paralyzed.',
  ARRAY['linguistic_exclusion','colonial_federation_legacy','federal_demand_refusal','separatist_fragmentation'],
  ARRAY[],
  3, 'manual', false, true
),

-- 12. LIBYA
(
  'libya-conflict', 'Libya — Ongoing Political-Military Fracture', 'Libya',
  'civil_war', true, 'LY', ARRAY['LY','TN','DZ','EG','SD','ML','NE','MT'],
  ARRAY['north-africa'],
  26.3351, 17.2283, 'frozen', '2011-02-17',
  15000, 30000, 'UCDP historical', '2024-12-01',
  135000, 220000, 'UNHCR/IOM', '2024-12-01',
  3800, 2.0, 5.0, 3.5, 'medium', 'high',
  ARRAY['TN','DZ','EG','ML','NE'],
  'Libya fractured after the NATO-backed fall of Gaddafi in 2011 and has never reconsolidated. Two rival administrations — Government of National Unity (Tripoli) and Government of National Stability (Benghazi/east) — control a divided country. Libya is a critical migration hub, arms proliferation source into the Sahel, and an oil producer whose revenues fund both factions.',
  'The conflict persists because oil revenues (USD 2-3bn/year) are split between east and west with no agreed formula, and because Turkey (supporting Tripoli), Russia/UAE/Egypt (supporting east) have contrasting strategic interests and no urgency to force resolution.',
  ARRAY['oil_revenues','external_sponsors','migration_economy','arms_proliferation','governance_split'],
  ARRAY['oil','natural_gas','arms_transit'],
  4, 'manual', false, true
),

-- 13. NIGER — POST-COUP INSTABILITY
(
  'niger-post-coup', 'Niger — Post-Coup Instability & Jihadist Pressure', 'Niger',
  'coup', true, 'NE', ARRAY['NE','ML','BF','NG','DZ','LY'],
  ARRAY['west-africa','sahel'],
  17.6078, 8.0817, 'active', '2023-07-26',
  3000, 8000, 'ACLED', '2024-12-01',
  310000, 290000, 'UNHCR/IDMC', '2024-12-01',
  280, 0.8, 2.5, 4.3, 'high', 'high',
  ARRAY['NG','ML','BF'],
  'The July 2023 coup by General Abdourahamane Tchiani toppled elected President Mohamed Bazoum, triggering an ECOWAS standoff and the departure of US/French forces. Niger''s military government joined Mali and Burkina Faso in forming the Alliance of Sahel States. Jihadist violence from JNIM and ISGS continues to escalate particularly in Tillabéri and Tahoua regions.',
  'Post-coup instability weakens counter-insurgency capacity just as jihadist pressure increases. Expulsion of Western partners creates security vacuum. Niger''s uranium wealth (6% of global supply, critical for EU energy) creates external interest that complicates leverage.',
  ARRAY['coup_instability','jihadist_spillover','uranium_geopolitics','ecowas_tension','western_expulsion'],
  ARRAY['uranium','gold'],
  2, 'manual', false, true
),

-- 14. WESTERN SAHARA
(
  'western-sahara', 'Western Sahara — Frozen Conflict', 'Western Sahara',
  'separatist', true, 'EH', ARRAY['EH','MA','DZ','MR'],
  ARRAY['north-africa'],
  24.2155, -12.8858, 'frozen', '1975-11-06',
  2500, 5000, 'UCDP historical', '2024-12-01',
  173000, 173000, 'UNHCR (Tindouf camps)', '2024-12-01',
  210, 0.5, 1.5, 2.1, 'low', 'medium',
  ARRAY['DZ','MR','MA'],
  'Western Sahara has been a frozen conflict since the 1991 UN ceasefire between Morocco (which controls ~80% of the territory) and the Polisario Front (backed by Algeria). The 2020 US recognition of Moroccan sovereignty in exchange for Israel normalization has reinvigorated Polisario military activity. 173,000 Sahrawi refugees remain in Tindouf camps in Algeria.',
  'The conflict remains frozen because Morocco''s economic investment in the territory (phosphates, fisheries, green hydrogen) makes full withdrawal unthinkable, Algeria finds the conflict useful as strategic leverage against Morocco, and the UN process has been deadlocked since James Baker''s resignation in 2004.',
  ARRAY['phosphate_wealth','fisheries','green_hydrogen','algeria_morocco_rivalry','un_deadlock'],
  ARRAY['phosphates','fisheries','green_hydrogen_potential'],
  4, 'manual', false, true
),

-- 15. KENYA — COMMUNAL VIOLENCE
(
  'kenya-communal-violence', 'Kenya — Pastoral Communal Violence', 'Kenya North',
  'communal', true, 'KE', ARRAY['KE','ET','SS'],
  ARRAY['east-africa'],
  3.0000, 37.5000, 'active', '2000-01-01',
  500, 2000, 'ACLED/Kenya Red Cross', '2024-12-01',
  180000, 15000, 'IDMC', '2024-12-01',
  45, 0.3, 0.8, 0.4, 'medium', 'low',
  ARRAY['ET'],
  'Recurrent cattle-raiding and communal clashes between Turkana, Pokot, Samburu, Borana and other pastoralist communities in Kenya''s north has escalated with climate change-driven drought, illegal arms proliferation from South Sudan and Somalia, and weakened traditional conflict resolution mechanisms.',
  'Violence persists due to competition over shrinking water and pasture resources accelerated by climate change, ready availability of AK-47s from regional conflict zones, impunity for raiders, and underinvestment in northern Kenya by successive governments.',
  ARRAY['climate_change','resource_competition','arms_proliferation','state_neglect'],
  ARRAY['cattle','water','pasture'],
  2, 'manual', false, true
),

-- 16. GAZA / PALESTINE (Africa impact: diaspora, Muslim solidarity, trade, Red Sea)
(
  'gaza-conflict', 'Gaza — Israel-Hamas War', 'Gaza/Palestine',
  'interstate', false, 'PS', ARRAY['PS','IL','LE','YE','IR','EG','JO'],
  ARRAY['north-africa'],
  31.5000, 34.4667, 'escalating', '2023-10-07',
  46000, 50000, 'Gaza Health Ministry / UNOCHA', '2025-03-01',
  1900000, 84000, 'UNRWA/UNHCR', '2025-03-01',
  18500, 50.0, 100.0, NULL,
  'critical', 'critical', ARRAY['EG','LB','YE','JO'],
  'The October 7, 2023 Hamas attack on Israel and the subsequent Israeli military operation in Gaza has killed over 46,000 Palestinians and displaced 90%+ of Gaza''s population. Africa impact: Houthi Red Sea attacks disrupted Suez Canal shipping critical to East Africa trade; Muslim-majority African nations face political pressure; North Africa has significant Palestinian solidarity movements; humanitarian diversion risk to African aid budgets.',
  'The conflict persists because Netanyahu government''s political survival depends on continued military operation; Hamas leadership calculates civilian suffering increases international pressure; US unconditional support removes Israeli incentive for ceasefire; Iran uses the conflict to project regional power through Hezbollah and Houthis.',
  ARRAY['occupation','hamas_governance','us_backing_israel','iran_proxy_axis','political_survival'],
  ARRAY['natural_gas_offshore','port_revenues'],
  2, 'mixed', true, true
),

-- 17. UKRAINE-RUSSIA (Africa impact: grain, fertilizer, food prices, arms, mercenaries)
(
  'ukraine-russia', 'Russia-Ukraine War', 'Ukraine',
  'interstate', false, 'UA', ARRAY['UA','RU','BY','PL'],
  ARRAY[],
  49.0000, 32.0000, 'active', '2022-02-24',
  200000, 500000, 'UCDP/NATO estimates', '2025-03-01',
  3700000, 6500000, 'UNHCR', '2025-03-01',
  300000, 200.0, 500.0, NULL,
  'high', 'medium', ARRAY['MD','GE','AM'],
  'Russia''s full-scale invasion of Ukraine on February 24, 2022. Africa impact: Ukraine and Russia together supply 40%+ of Africa''s wheat imports; Black Sea Grain Initiative collapse in 2023 caused food price spikes across African countries; Russian Wagner Group operations in Africa (Mali, CAR, Libya, Sudan) directly linked to war economy; African nations divided at UN votes; Russian disinformation operations shape African public opinion.',
  'The war persists because Putin cannot accept Ukrainian NATO membership or loss of seized territories without domestic political collapse; Ukraine cannot accept territorial concessions without legitimacy collapse; US/EU weapons supply keeps Ukraine capable of resistance but not decisive victory.',
  ARRAY['nato_expansion','territorial_sovereignty','russian_imperialism','energy_revenues','war_economy'],
  ARRAY['wheat','sunflower_oil','fertilizer_transit','arms'],
  2, 'manual', true, true
),

-- 18. US-IRAN CONFLICT (escalated 2025)
(
  'us-iran-conflict', 'US–Iran Military Conflict', 'US-Iran',
  'interstate', false, 'IR', ARRAY['IR','US','YE','IQ','SY','LE','IL'],
  ARRAY[],
  32.4279, 53.6880, 'active', '2025-01-01',
  500, 3000, 'Reported estimates — verify with current sources', '2025-03-01',
  800000, 120000, 'Estimated — update from UNHCR', '2025-03-01',
  NULL, 5.0, 50.0, NULL,
  'critical', 'critical', ARRAY['SA','IQ','YE','LE','BH'],
  'ADMIN NOTE: This conflict began/escalated in 2025 — after this system''s initial training data. All figures marked as preliminary estimates. Admin must update with current sourced data. Africa impact: Strait of Hormuz disruption affects oil supply to African nations; Suez/Red Sea shipping further disrupted; oil price volatility affects African oil importers and exporters differently; Iranian-backed Houthi attacks continue in Red Sea; African diaspora in Gulf states affected.',
  'PENDING — Admin to complete this section with current sourced analysis.',
  ARRAY['nuclear_program','regional_hegemony','us_israel_alliance','proxy_networks','oil_revenues'],
  ARRAY['oil','natural_gas','strait_of_hormuz'],
  2, 'manual', true, true
),

-- 19. ETHIOPIA-ERITREA (Tigray aftermath / latent)
(
  'ethiopia-eritrea-tigray', 'Horn of Africa — Post-Tigray Instability', 'Horn-Tigray',
  'hybrid', true, 'ET', ARRAY['ET','ER','SD'],
  ARRAY['east-africa','horn-of-africa'],
  14.1153, 38.7220, 'de-escalating', '2020-11-04',
  300000, 600000, 'Ghent University / UCDP', '2024-06-01',
  1500000, 60000, 'UNHCR', '2024-06-01',
  1400, 10.0, 25.0, 5.8, 'medium', 'medium',
  ARRAY['SD','DJ','ER'],
  'The Tigray War (2020-2022) between Ethiopian federal forces (with Eritrean alliance) and TPLF was among the deadliest conflicts globally in the 21st century. The November 2022 Pretoria Peace Agreement formally ended hostilities but justice mechanisms are absent, reconstruction has not begun, Tigray remains blockaded, and Eritrean forces have not fully withdrawn.',
  'Latent instability remains because Eritrean forces still occupy parts of western Tigray, the peace deal has no accountability mechanism, displaced Tigrayans have not returned, and Abiy Ahmed faces additional internal conflicts in Amhara and Oromia simultaneously.',
  ARRAY['ethnic_federalism','tplf_tigray_grievance','eritrean_interests','reconstruction_failure','impunity'],
  ARRAY[],
  5, 'manual', false, true
),

-- 20. SAHEL REGIONAL CRISIS (cross-cutting)
(
  'sahel-regional', 'Sahel Regional Security Crisis', 'Sahel Belt',
  'insurgency', true, 'ML', ARRAY['ML','BF','NE','TD','MR','SN','GN','CI','GH','TG','BJ','NG'],
  ARRAY['west-africa','sahel'],
  15.0000, 2.0000, 'escalating', '2012-01-01',
  40000, 80000, 'ACLED Sahel aggregate', '2024-12-01',
  3500000, 700000, 'UNHCR/IDMC', '2024-12-01',
  2800, 15.0, 35.0, 4.2, 'critical', 'critical',
  ARRAY['SN','GN','CI','GH','TG','BJ'],
  'The Sahel crisis is a regional phenomenon rather than a single conflict — a belt of intersecting jihadist insurgencies, military coups, governance failures, and humanitarian emergencies stretching from Mauritania to Chad. JNIM and ISGS operate across borders. Three coup states (Mali, Burkina Faso, Niger) have formed the Alliance of Sahel States and expelled Western forces. The entire coastal West Africa region (Ghana, Togo, Benin, Côte d''Ivoire, Senegal) faces active spillover risk.',
  'The regional crisis is self-reinforcing: each country''s instability exports insurgents and refugees to neighbors; governance failures are structural across the region; climate change reduces agricultural livelihoods; and the expulsion of French/Western forces has not been replaced with equivalent capability.',
  ARRAY['structural_governance_failure','climate_change','jihadist_networks','coup_contagion','poverty'],
  ARRAY['gold','uranium','smuggling','arms'],
  2, 'mixed', true, true
);
```

---

## 6. NETLIFY FUNCTIONS

### `netlify/functions/conflict-data.js`
Public read API — all GET operations. No auth required.

```javascript
// Endpoints:
// GET /api/conflicts                    → list all published conflicts
// GET /api/conflicts/:slug              → single conflict full detail
// GET /api/conflicts/:slug/events       → ACLED events for conflict
// GET /api/conflicts/:slug/displacement → displacement timeseries
// GET /api/conflicts/:slug/economy      → economic impact data
// GET /api/conflicts/:slug/actors       → conflict actors + economy actors
// GET /api/conflicts/:slug/forecast     → scenario forecasts
// GET /api/conflicts/:slug/timeline     → milestone timeline
// GET /api/stats                        → global KPIs for dashboard
// GET /api/events/recent                → last 30 days events across all conflicts

// Uses SUPABASE_URL + SUPABASE_ANON_KEY (public client, RLS enforced)
// Cache headers: max-age=300 (5 min) for event data, max-age=3600 for conflict details
// Returns JSON with { data, meta: { source, last_updated, count } }
```

### `netlify/functions/conflict-admin.js`
Protected CRUD API. Requires `Authorization: Bearer ${ADMIN_SECRET}` header.

```javascript
// Endpoints:
// POST   /api/admin/conflicts            → create new conflict
// PUT    /api/admin/conflicts/:id        → update conflict
// DELETE /api/admin/conflicts/:id        → soft delete (set is_published=false)
// POST   /api/admin/conflicts/:id/actors → add actor to conflict
// POST   /api/admin/timeline            → add timeline event
// POST   /api/admin/economy-actors      → add economy/profiteer actor
// POST   /api/admin/forecasts           → upsert forecast scenario
// POST   /api/admin/economic-impact     → add economic data point
// POST   /api/admin/displacement        → add displacement record
// POST   /api/admin/sync-trigger        → manually trigger ACLED/UNHCR sync

// Uses SUPABASE_URL + SUPABASE_SERVICE_KEY (bypasses RLS)
// Validates ADMIN_SECRET on every request
// Logs all mutations to console (Netlify function logs)
// Returns { success, data, error }
```

### `netlify/functions/conflict-acled.js`
ACLED API proxy. Gracefully degrades if key not set.

```javascript
// ACLED API: https://api.acleddata.com/acled/read
// Auth: ?key=${ACLED_API_KEY}&email=${ACLED_EMAIL}
// Fetches: last 90 days events for African conflicts
// Normalizes to ac_events schema
// Returns 503 with clear message if ACLED_API_KEY not set or === 'PENDING'
// Called by conflict-sync.js

const ACLED_COUNTRIES = 'AFG,DZA,AGO,BEN,BWA,BFA,BDI,CMR,CPV,CAF,TCD,COM,COD,COG,DJI,EGY,GNQ,ERI,ETH,GAB,GMB,GHA,GIN,GNB,CIV,KEN,LSO,LBR,LBY,MDG,MWI,MLI,MRT,MUS,MAR,MOZ,NAM,NER,NGA,RWA,STP,SEN,SLE,SOM,ZAF,SSD,SDN,SWZ,TZA,TGO,TUN,UGA,ZMB,ZWE';
```

### `netlify/functions/conflict-unhcr.js`
UNHCR Refugee Data Finder API. No key required.

```javascript
// UNHCR API: https://api.unhcr.org/population/v1/
// Endpoints used:
//   /population/ → aggregate displacement by year/country
//   /idps/       → internal displacement
// Maps to ac_displacement schema
// Called by conflict-sync.js
```

### `netlify/functions/conflict-worldbank.js`
World Bank API. No key required.

```javascript
// World Bank API: https://api.worldbank.org/v2/
// Data fetched:
//   GDP growth rate per conflict country
//   Military expenditure % GDP (from SIPRI via WB)
//   Poverty headcount
//   Food insecurity indicators
// Maps to ac_economic_impact table (gdp_loss_pct field)
```

### `netlify/functions/conflict-sync.js`
Scheduled ETL — runs daily. Calls all three API proxies.

```javascript
// Schedule: every day at 03:00 UTC
export const config = { schedule: '0 3 * * *' };

// Flow:
// 1. Fetch ACLED events for last 7 days → upsert ac_events (dedup on acled_event_id)
// 2. Fetch UNHCR displacement data → upsert ac_displacement
// 3. Fetch World Bank GDP data → upsert ac_economic_impact
// 4. Recalculate ac_monthly_stats aggregates
// 5. Update ac_conflicts.last_api_sync timestamp
// 6. DO NOT overwrite manually_overridden=true fields
// 7. Log sync summary to Netlify function logs

// Graceful: if ACLED key not set, skip step 1, log warning, continue
```

---

## 7. PAGES — DETAILED SPECIFICATION

### 7.1 `tools/africa-conflict/index.html` — MAIN DASHBOARD

**Layout:** Dark intelligence dashboard. Three sections:
1. **Hero band** — Tool name + one-line description + last updated timestamp
2. **KPI Cards row** — 8 cards with live numbers
3. **Split layout:** Left = Africa map (60% width), Right = Top Conflicts list (40%)
4. **Bottom strip:** Recent events feed + Quick filters

**KPI Cards (pull from `/api/stats`):**

| Card | Value | Source label |
|------|-------|--------------|
| Active Conflicts | count of status=active/escalating | ACLED/Manual |
| Total Displaced | sum IDPs + refugees | UNHCR |
| Estimated Fatalities | sum of fatalities_min-max ranges | UCDP/ACLED |
| Military Spend/yr | sum military_spend_usd_m | SIPRI/Manual |
| Economic Loss | sum economic_loss range | WB/Manual |
| Critical Risk | count escalation_risk=critical | AfroConflict |
| Spillover Threats | countries in spillover_countries arrays | AfroConflict |
| New Escalations (30d) | conflicts updated to escalating in last 30d | ACLED |

**Map (Leaflet.js):**
- Tile layer: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Attribution: `© OpenStreetMap contributors © CARTO`
- Default center: Africa [2.0, 20.0], zoom 3
- Choropleth layer: countries shaded by escalation_risk (CSS color scale)
  - critical: #dc2626 (red-600)
  - high: #ea580c (orange-600)
  - medium: #ca8a04 (yellow-600)
  - low: #65a30d (lime-600)
  - minimal: #16a34a (green-600)
  - no data: #1e293b (slate-800)
- Conflict markers: pulsing circles at lat/lng, sized by fatalities_max
- Click marker → popup with: name, status badge, fatalities estimate, displaced,
  "View Full Intelligence →" link to detail.html?id={slug}
- Layer toggle buttons: Conflict Density | Displacement | Spillover Risk | All
- Countries GeoJSON: load from CDN or bundle Africa-only GeoJSON

**Top Conflicts sidebar:**
- List of top 6 by escalation_risk DESC, then fatalities_max DESC
- Each item: status color dot, conflict name, primary country flag emoji,
  fatalities estimate, displaced count, escalation badge
- "View All →" link to conflicts.html

**Recent events feed (bottom):**
- Last 20 events from ac_events ORDER BY event_date DESC
- Each: date, event_type icon, location, conflict name, fatalities
- Auto-refreshes every 5 minutes if tab visible

---

### 7.2 `tools/africa-conflict/conflicts.html` — CONFLICT LIST

**Layout:** Filter sidebar (left 280px) + conflict cards grid (right)

**Filter sidebar:**
- Region: East Africa | West Africa | North Africa | Central Africa | Southern Africa | Global Impact
- Status: Emerging | Active | Escalating | Stalemated | Frozen | Negotiating | Post-Conflict
- Type: Civil War | Insurgency | Interstate | Proxy | Separatist | Coup | Communal
- Risk level: Critical | High | Medium | Low
- Toggle: African conflicts only / Include Global
- Toggle: Resource-linked conflicts
- Toggle: Climate-linked
- Toggle: Foreign intervention present
- Sort: Escalation Risk | Fatalities | Displaced | Duration | Name
- Results count: "Showing 18 of 20 conflicts"

**Conflict cards:**
Each card contains:
- Top bar: Status badge (color-coded) + Conflict type tag + Country flag(s)
- Conflict name (large)
- Key stats row: ☠️ Fatalities | 🏕️ Displaced | 📅 Duration | 💰 Economic Loss
- Risk indicators: Escalation Risk pill + Spillover Risk pill
- Resource links (if any): small tags — 🪨 Gold, 🛢️ Oil, etc.
- External actors flag if foreign_intervention present
- "View Intelligence →" button → detail.html?id={slug}
- Card border-left: color-coded by escalation_risk

---

### 7.3 `tools/africa-conflict/detail.html` — CONFLICT DETAIL

Query param: `?id={slug}`

**Layout:** Sticky header with conflict name + status + quick stats.
Then tabbed sections:

**Tab 1: Overview**
- Summary paragraphs
- Key stats grid (all conflict fields displayed clearly)
- "Why this conflict persists" box (dark highlighted)
- Key triggers tags
- Resource links tags
- Peace efforts box
- Conflict stage indicator (visual 1-6 scale)

**Tab 2: Timeline**
- Vertical timeline from start_date to now
- Events from ac_timeline, sorted by event_date
- Color-coded by significance (critical=red, major=orange, moderate=yellow, minor=gray)
- Category icons

**Tab 3: Actors**
- Split: Primary actors (main belligerents) + External actors
- Each actor card: name, type, role, side, country flag, sanctions badge if applicable
- Sourced from ac_conflict_actors JOIN ac_actors

**Tab 4: Conflict Economy**
- Header: "Who benefits from this conflict continuing?"
- Disclaimer box: "All entries represent reported interests and allegations. Evidence levels are explicitly stated. This is not a legal determination."
- Cards per economy actor:
  - Entity name + type badge
  - Alleged role (paragraph)
  - Interest type tags
  - Evidence level meter (confirmed/alleged/suspected/disputed/historical) with color
  - Confidence score bar (0-100)
  - Sanctions status badge
  - Source count + links
  - Estimated value if available

**Tab 5: Economic Impact**
- ECharts bar chart: GDP loss by year
- Military spending trend line
- Trade disruption breakdown
- Commodity impact list
- Host country burden
- Reconstruction liability estimate

**Tab 6: Displacement**
- ECharts area chart: IDPs + Refugees trend over time
- Top destination countries map
- Shelter pressure indicator
- UNHCR data attribution

**Tab 7: Events Feed**
- ACLED events for this conflict
- Paginated, 20 per page
- Filters: event type, date range
- Each: date, type icon, location, actors, fatalities, source

**Tab 8: Forecast**
- Header disclaimer: "Model estimates — not predictions. Conflict duration is inherently uncertain."
- Three scenario cards:
  - 🟢 Optimistic: duration, outcome, trigger needed, confidence %
  - 🟡 Base Case: duration, outcome, confidence %
  - 🔴 Worst Case: duration, outcome, trigger risk, confidence %
- Leading indicators being watched (from JSON field)
- Key assumptions list
- Forecast date + model version
- Analyst notes

---

### 7.4 `tools/africa-conflict/economy.html` — ECONOMIC IMPACT

Global economic impact across all conflicts.

**Sections:**
1. Total estimated economic cost banner (sum of all ranges)
2. ECharts stacked bar: Top 10 conflicts by economic_loss_max
3. Military spend breakdown table (by country, sorted by spend)
4. Trade routes disrupted (list with map overlay)
5. Commodity disruption tracker (which commodities, which conflicts)
6. Food insecurity overlay (conflicts with food_insecurity_link=true)
7. Host country burden table

---

### 7.5 `tools/africa-conflict/displacement.html` — DISPLACEMENT

1. Hero KPIs: Total IDPs | Total Refugees | Newly Displaced (30d) | Top Host Country
2. ECharts area chart: displacement trend 2018-present
3. Choropleth map: displacement concentration by country
4. Top 10 conflicts by displacement table
5. Host country burden ranking
6. Return and recovery tracker (returnees)
7. UNHCR data attribution + links to source portals

---

### 7.6 `tools/africa-conflict/actors.html` — ACTORS NETWORK

Global view of all actors across all conflicts.

1. Actor type filter tabs
2. Actor cards grid: name, type, conflicts involved (count), sanctions badge
3. Search actors by name
4. Foreign state involvement table: country → conflicts they back → role
5. Arms supplier network (ac_economy_actors WHERE entity_type=arms_supplier)
6. Sanctioned entities list

---

### 7.7 `tools/africa-conflict/forecasts.html` — FORECASTS

1. Methodology disclaimer banner (prominent)
2. Conflict dropdown to select conflict
3. Scenario cards (same as detail tab)
4. Comparative table: all conflicts, base case duration, confidence
5. Leading indicators panel

---

### 7.8 `tools/africa-conflict/methodology.html` — METHODOLOGY

Required for credibility. Full page with:

1. **Data Sources table:**

| Source | What we use it for | Access type |
|--------|-------------------|-------------|
| ACLED (Armed Conflict Location & Event Data Project) | Conflict events, fatalities, actor data, trend analysis | API (registered) |
| UCDP (Uppsala Conflict Data Program) | Conflict classification, battle-death estimates | Public database |
| UNHCR Refugee Data Finder | Displacement, refugee, IDP figures | Public API |
| IDMC (Internal Displacement Monitoring Centre) | IDP-specific data and cost estimates | Public reports |
| SIPRI (Stockholm International Peace Research Institute) | Military expenditure data | Public database |
| World Bank Open Data | GDP, poverty, fragility indicators | Public API |
| UN OCHA | Humanitarian situation reports | Public |
| Crisis Group | Conflict analysis and risk assessments | Public reports |
| Manual Research | Conflict economy actors, sourced from journalism and academic literature | Admin-entered |

2. **Uncertainty Disclaimer (full text)**
3. **Conflict Economy Methodology** — how we categorize and score actors
4. **Forecast Methodology** — stage model, leading indicators, scenario construction
5. **Update Frequency** — API sync (daily), manual data (ad hoc), forecasts (monthly)
6. **Contact / Corrections** — email for errors

---

## 8. ADMIN PAGE: `admin/conflict.html`

This is a new admin page that follows the same pattern as `admin/fuel.html`,
`admin/wages.html`, etc. Link it from `admin/dashboard.html`.

**The admin page has tabbed sections:**

### Tab 1: Conflicts List
- Table of all conflicts (including unpublished)
- Columns: name, status, primary_country, is_published, last_updated, actions
- Actions: Edit | Publish/Unpublish | Delete
- "Add New Conflict" button → opens full form modal

### Tab 2: Add / Edit Conflict (Full Form)
A comprehensive form to add or edit a conflict. Groups:

**Basic Information:**
- Conflict Name* (text)
- Short Name (text)
- Slug* (auto-generated from name, editable)
- Conflict Type* (select dropdown)
- Is African conflict? (toggle — if No, show "Africa Impact Reason" field)
- Status* (select)
- Start Date* (date picker)
- End Date (date picker, optional)

**Geography:**
- Primary Country* (select from ISO list)
- Additional Countries Involved (multi-select)
- Regions (multi-select)
- Latitude (number)
- Longitude (number)
- Affected Area km² (number)

**Casualties & Displacement:**
- Fatalities Min / Max (number)
- Fatalities Source (text)
- Fatalities Date (date)
- IDPs Count (number)
- Refugees Count (number)
- Displacement Source (text)
- Displacement Date (date)

**Economic:**
- Military Spend USD millions/yr (number)
- Military Spend Source (text)
- Economic Loss Min USD billions (number)
- Economic Loss Max USD billions (number)
- GDP Drag % (number)
- Economic Source (text)

**Narrative:**
- Summary (textarea, markdown)
- Why It Persists (textarea, markdown)
- Key Triggers (tag input)
- Resource Links (tag input)
- Peace Efforts (textarea)

**Risk:**
- Escalation Risk (select)
- Spillover Risk (select)
- Spillover Countries (multi-select)
- Food Insecurity Link (toggle)
- Election Link (toggle)
- Climate Link (toggle)

**Classification:**
- Conflict Stage 1-6 (select with descriptions)
- Data Source (select)
- ACLED ID (text)
- Manually Overridden (toggle)
- Override Note (text)

**Display:**
- Is Featured (toggle)
- Is Published (toggle)

**Save button** → PUT to `/api/admin/conflicts/:id` or POST to create

### Tab 3: Add Timeline Event
- Select Conflict (searchable dropdown)
- Date, Title, Description, Significance, Category, Source URL, Source Name
- Save → POST to `/api/admin/timeline`

### Tab 4: Add Economy Actor
- Select Conflict* (searchable dropdown)
- Entity Name*, Entity Type*, Alleged Role*
- Interest Types (multi-select), Country of Origin
- Evidence Level* (select), Confidence Score (0-100 slider)
- Sources (add multiple: URL + Title + Date + Publisher)
- Sanctions Status, Sanctions Details
- Estimated Value USD millions (optional)
- Save → POST to `/api/admin/economy-actors`

### Tab 5: Add Forecast
- Select Conflict*
- Forecast Date
- Base Case: Duration (months), Outcome, Confidence %
- Optimistic: Duration, Outcome, Trigger needed, Confidence %
- Worst Case: Duration, Outcome, Trigger risk, Confidence %
- Key Assumptions (tag input)
- Analyst Notes (textarea)
- Save → POST to `/api/admin/forecasts`

### Tab 6: Manual Sync Trigger
- Button: "Sync ACLED Events" → POST to `/api/admin/sync-trigger?source=acled`
- Button: "Sync UNHCR Displacement" → POST to `/api/admin/sync-trigger?source=unhcr`
- Button: "Sync World Bank Data" → POST to `/api/admin/sync-trigger?source=worldbank`
- Last sync timestamps displayed
- Sync log output (last 10 lines from function logs)

**Auth:** The admin page checks `localStorage.getItem('acd_admin_token')` and
prompts for the ADMIN_SECRET if not set. Sends it as Bearer token on all API calls.
Do not hardcode the secret in the HTML — store in localStorage session only.

---

## 9. ENGINE: `engines/africa-conflict-engine.js`

IIFE module pattern (same as afrokitchen-engine.js).

```javascript
var AfroConflict = (function() {
  // Configuration
  var CONFIG = {
    apiBase: '/.netlify/functions/conflict-data',
    mapCenter: [2.0, 20.0],
    mapZoom: 3,
    refreshInterval: 300000, // 5 minutes
    riskColors: {
      critical: '#dc2626',
      high:     '#ea580c',
      medium:   '#ca8a04',
      low:      '#65a30d',
      minimal:  '#16a34a',
    },
    statusColors: {
      emerging:       '#8b5cf6',
      active:         '#ea580c',
      escalating:     '#dc2626',
      stalemated:     '#d97706',
      'de-escalating': '#65a30d',
      frozen:         '#6b7280',
      negotiation:    '#3b82f6',
      'post-conflict': '#16a34a',
    },
    conflictTypeLabels: {
      civil_war:             'Civil War',
      insurgency:            'Insurgency',
      interstate:            'Interstate',
      proxy_war:             'Proxy War',
      coup:                  'Coup/Post-Coup',
      communal:              'Communal Violence',
      separatist:            'Separatist',
      foreign_intervention:  'Foreign Intervention',
      hybrid:                'Hybrid',
      frozen:                'Frozen Conflict',
      criminal_violence:     'Criminal Violence',
    },
  };

  // Public API — expose these methods
  return {
    init,
    getConflicts,
    getConflict,
    getStats,
    getEvents,
    renderMap,
    renderConflictCard,
    renderKPICard,
    formatNumber,     // 1500000 → "1.5M"
    formatCurrency,   // 15000 → "USD 15B"
    formatDuration,   // 847 days → "2 yrs 4 mo"
    riskBadge,        // returns HTML string for a risk badge
    statusBadge,      // returns HTML string for status badge
    evidenceBadge,    // for economy actors
    flagEmoji,        // ISO → flag emoji (e.g. 'NG' → '🇳🇬')
  };
})();
```

---

## 10. DESIGN SPECIFICATION

### Color system (extend tokens.min.css — do NOT override, only add)

```css
/* In tools/africa-conflict/style.css */

/* Base intelligence theme — dark */
:root {
  --acd-bg:            #0a0f1e;   /* near-black navy */
  --acd-bg-card:       #0f172a;   /* dark card */
  --acd-bg-card-hover: #1e293b;   /* hover */
  --acd-border:        #1e293b;   /* subtle border */
  --acd-border-glow:   rgba(220, 38, 38, 0.3); /* red glow for critical */
  --acd-text:          #f1f5f9;   /* near-white */
  --acd-text-muted:    #94a3b8;   /* slate-400 */
  --acd-text-dim:      #475569;   /* slate-600 */

  /* Risk colors */
  --acd-critical:      #dc2626;
  --acd-high:          #ea580c;
  --acd-medium:        #ca8a04;
  --acd-low:           #65a30d;
  --acd-minimal:       #16a34a;
  --acd-unknown:       #6b7280;

  /* Status colors */
  --acd-escalating:    #dc2626;
  --acd-active:        #ea580c;
  --acd-stalemated:    #d97706;
  --acd-frozen:        #6b7280;
  --acd-negotiation:   #3b82f6;
  --acd-deescalating:  #65a30d;
  --acd-postconcflict: #16a34a;

  /* Evidence levels */
  --acd-confirmed:     #16a34a;
  --acd-alleged:       #d97706;
  --acd-suspected:     #ea580c;
  --acd-disputed:      #6b7280;
  --acd-historical:    #475569;
}
```

### Typography
- All pages: `DM Sans` for body (from AfroTools global)
- Dashboard headings: `Instrument Serif` (from AfroTools global)
- KPI numbers: `DM Sans` weight 700, size large
- Data labels: `DM Mono` or monospace for numbers/codes

### Map styling
- Background tile: CartoDB Dark Matter (dark navy/charcoal base)
- Choropleth opacity: 0.75 on countries
- Conflict markers: pulsing animation for escalating status only
- Popups: dark theme, `--acd-bg-card` background, `--acd-text` color

### Cards
- `background: var(--acd-bg-card)`
- `border: 1px solid var(--acd-border)`
- `border-radius: 12px`
- `border-left: 4px solid {risk-color}` (the visual escalation indicator)
- `box-shadow: 0 1px 3px rgba(0,0,0,0.4)`
- Hover: `background: var(--acd-bg-card-hover)`, lift effect

### Status badges
- Pill shape, small text, uppercase, letter-spacing
- Background: 15% opacity of status color, text: status color

### KPI cards
- Large number (animated count-up on load)
- Source label below in small muted text
- Subtle top border in accent color

---

## 11. NAVBAR REGISTRATION

In `assets/js/components/navbar.js`, add to the `african` category's `tools` array:

```javascript
{
  label: 'AfroConflict',
  href: '/tools/africa-conflict/',
  emoji: '⚔️',
  badge: 'LIVE'
}
```

Also register in `assets/js/components/tool-registry.js` `AFRO_TOOLS` array:

```javascript
{
  id: 'africa-conflict',
  name: 'AfroConflict',
  description: 'Live Africa Conflict Intelligence Dashboard — tracking armed conflicts, displacement, economic impact, and conflict economy actors across Africa',
  category: 'african',
  phase: 'LIVE',
  path: '/tools/africa-conflict/',
  emoji: '⚔️',
  tags: ['conflict', 'war', 'security', 'displacement', 'africa', 'intelligence'],
  countries: [],  // All Africa
  launched: '2026-03'
}
```

---

## 12. _redirects ADDITIONS

Add to the `_redirects` file:

```
# AfroConflict API routes
/api/conflicts                    /.netlify/functions/conflict-data   200
/api/conflicts/*                  /.netlify/functions/conflict-data   200
/api/stats                        /.netlify/functions/conflict-data   200
/api/events/*                     /.netlify/functions/conflict-data   200
/api/admin/conflicts              /.netlify/functions/conflict-admin  200
/api/admin/conflicts/*            /.netlify/functions/conflict-admin  200
/api/admin/timeline               /.netlify/functions/conflict-admin  200
/api/admin/economy-actors         /.netlify/functions/conflict-admin  200
/api/admin/forecasts              /.netlify/functions/conflict-admin  200
/api/admin/sync-trigger           /.netlify/functions/conflict-admin  200

# SEO-friendly conflict URLs
/tools/africa-conflict/detail/:slug   /tools/africa-conflict/detail.html?id=:slug  200
```

---

## 13. BUILD ORDER

Build in this exact sequence:

1. **Database** — Run `supabase/africa-conflict-seed.sql` in full. Verify all tables created and seed data inserted.

2. **Netlify Functions** — Build all 5 functions. Start with `conflict-data.js` (read API) and `conflict-admin.js` (write API). ACLED function should fail gracefully.

3. **Engine** — Build `engines/africa-conflict-engine.js`. Test formatNumber, formatDuration, flagEmoji utilities first.

4. **Admin page** — Build `admin/conflict.html`. This is critical because admin needs to be able to add/edit conflicts immediately. Test with the US-Iran conflict entry (update fields that are marked PENDING).

5. **Main Dashboard** (`index.html`) — Build with map + KPI cards + top conflicts. This is the first public-facing page.

6. **Conflict List** (`conflicts.html`) — Filter sidebar + cards grid.

7. **Detail page** (`detail.html`) — All 8 tabs. Most complex page.

8. **Supporting pages** — economy.html, displacement.html, actors.html, forecasts.html, methodology.html

9. **Navbar + Registry** — Register in navbar.js and tool-registry.js

10. **Redirects** — Add all redirect rules to `_redirects`

11. **Link from admin dashboard** — Add "AfroConflict Management" link to `/admin/dashboard.html` in the "Live Data Management" section

---

## 14. ENVIRONMENT VARIABLES NEEDED

Add these to Netlify environment variables (Site Settings → Environment Variables):

```
ACLED_API_KEY=PENDING          # Update when approved
ACLED_EMAIL=your@email.com     # Email used for ACLED registration
# All other vars (SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_SECRET) already exist
```

---

## 15. CRITICAL RULES

1. **Every data point shown must have a source label.** No orphaned numbers.

2. **Conflict economy actors must ALWAYS show evidence level.** Never display allegations as facts.

3. **Forecasts must show "Model Estimate" label prominently.** Not predictions.

4. **The US-Iran conflict entry has placeholder data.** The admin must update it immediately after build using current sourced information from reliable news/analyst sources.

5. **mobile-first CSS.** The dashboard must work on mobile — Africans access on phones.

6. **No looping animations** (per AfroTools convention) except the single-pulse on escalating conflict markers.

7. **The `manually_overridden` flag must be respected** in the sync function — never overwrite admin-entered data with API data.

8. **All pages use `<afro-navbar>` and `<afro-footer>` web components.**

9. **Dark theme is tool-local only.** Do not apply dark theme globally — only within `.acd-page` wrapper, so the AfroTools navbar (which is light-mode) remains unaffected.

10. **Admin page is not indexed.** Add `<meta name="robots" content="noindex, nofollow">` to `admin/conflict.html`.

---

## 16. DATA DISCLAIMER (Use verbatim on methodology page)

> AfroConflict aggregates data from ACLED, UCDP, UNHCR, IDMC, SIPRI, the World Bank,
> UN agencies, and curated research literature. Fatality and displacement figures are
> estimates with inherent uncertainty ranges — we present minimum and maximum bounds
> rather than false precision. Conflict duration forecasts are scenario models, not
> predictions. Conflict economy actor listings reflect reported interests and documented
> allegations with explicit evidence level ratings; they are not legal determinations.
> AfroConflict is built by AfroTools, an African-built data platform. We are committed
> to accuracy, transparency, and African agency in how African conflicts are understood
> and communicated. Corrections and additional sourcing are welcome at
> hello@afrotools.africa.

---

*Prompt version: 1.0 — March 2026*
*Built for AfroTools by AfroTools*

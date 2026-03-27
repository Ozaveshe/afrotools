# Africa Conflict Intelligence Dashboard — Full Build Prompt

> Copy this entire file into a fresh Claude Code session to build the dashboard end-to-end.

---

## PROJECT OVERVIEW

Build the **Africa Conflict Intelligence Dashboard** — a live, data-rich dashboard tracking armed conflicts across Africa and global conflicts with major African impact. This is a high-quality, serious intelligence product, not a news toy. It lives within the existing AfroTools website at `/conflict/` and `/admin/conflict-data.html`.

The dashboard must answer: Where are conflicts happening? Who is fighting and who is funding them? How many people are displaced? What is the economic damage? How long has it gone on and what are the scenarios? Who benefits from it continuing?

This is one of AfroTools' most important tools. Build it to that standard.

---

## STACK & CONSTRAINTS

- **Plain HTML + CSS + JS only** — no React, Vue, or build tools. Same as all AfroTools tools
- **Supabase** — use the existing data instance at `jbmhfpkzbgyeodsqhprx.supabase.co` for all data storage. Tables prefixed `conflict_`
- **Netlify Functions** — for all API proxies, ETL jobs, and admin write endpoints
- **Leaflet.js** (CDN) — for interactive maps
- **Apache ECharts** (CDN) — for all charts and data visualizations
- **Fonts**: `DM Sans` + `Instrument Serif` (already loaded site-wide)
- **Web components**: `<afro-navbar>` and `<afro-footer>` on all public pages
- **Design tokens**: import `/assets/css/tokens.min.css` on all pages
- **Brand blue**: `#007AFF` primary, `#0063D1` dark, `#0A1628` dark backgrounds
- All admin pages at `/admin/` follow existing admin page patterns exactly (see `/admin/commodity-prices.html` for reference — same inline styles, same header/badge, same toast pattern)

---

## SCOPE: WHAT TO COVER

**Primary**: Active armed conflicts taking place on African soil

**Secondary**: Global conflicts with significant measurable impact on Africa — specifically:
- US-Iran War (February 28 2026 – ongoing): Oil price shock, Red Sea/Suez shipping disruption, energy costs, diaspora impact
- Israel-Gaza (October 2023 – ongoing): African diaspora, food aid diversion, diplomatic splits

Every conflict record must clearly show its category:

```
africa-internal | africa-cross-border | africa-proxy | global-africa-impact
```

---

## DATABASE SCHEMA

Create all tables in the existing Supabase data instance (`jbmhfpkzbgyeodsqhprx.supabase.co`). Prefix all tables with `conflict_`. Save this as `supabase/conflict-schema.sql`.

```sql
-- Core conflicts table
CREATE TABLE conflict_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_name text,
  category text NOT NULL CHECK (category IN ('africa-internal','africa-cross-border','africa-proxy','global-africa-impact')),
  conflict_type text NOT NULL,
  -- 'insurgency','civil-war','interstate','coup','communal','proxy','separatist','external-intervention'
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('emerging','active','escalating','stalemated','frozen','negotiation','post-conflict')),
  stage text NOT NULL DEFAULT '2', -- '1' through '6' per conflict stage model

  -- Geography
  primary_country text NOT NULL,         -- ISO2 code
  countries_involved text[],             -- array of ISO2 codes
  regions text[],
  -- 'west-africa','east-africa','north-africa','central-africa','southern-africa','middle-east'
  lat numeric,
  lng numeric,

  -- Timeline
  start_date date NOT NULL,
  duration_days integer GENERATED ALWAYS AS (CURRENT_DATE - start_date) STORED,

  -- Fatalities
  fatalities_low integer DEFAULT 0,
  fatalities_high integer DEFAULT 0,
  fatalities_source text,
  fatalities_updated date,

  -- Displacement
  idps_count bigint DEFAULT 0,
  refugees_count bigint DEFAULT 0,
  displacement_source text,
  displacement_updated date,

  -- Economic impact
  gdp_loss_pct_low numeric,
  gdp_loss_pct_high numeric,
  economic_loss_usd_low bigint,
  economic_loss_usd_high bigint,
  trade_disruption_usd bigint,
  infrastructure_damage_usd bigint,

  -- Military spending
  military_spend_usd_annual bigint,
  military_spend_source text,

  -- Forecast / scenario
  scenario_base_months_low integer,
  scenario_base_months_high integer,
  scenario_optimistic_months integer,
  scenario_worst_months integer,
  scenario_confidence text CHECK (scenario_confidence IN ('low','medium','high')),
  scenario_key_assumptions text[],

  -- Narrative fields
  why_it_persists text,
  conflict_economy_summary text,
  africa_impact_summary text,  -- for global-africa-impact category

  -- Risk & scores
  escalation_risk text CHECK (escalation_risk IN ('low','medium','high','critical')),
  spillover_risk text CHECK (spillover_risk IN ('low','medium','high','critical')),
  food_insecurity_linked boolean DEFAULT false,
  resource_linked boolean DEFAULT false,
  election_linked boolean DEFAULT false,
  foreign_intervention boolean DEFAULT false,

  -- Data provenance
  primary_source text,
  last_verified date,
  acled_id text,
  ucdp_id text,
  data_quality text CHECK (data_quality IN ('verified','estimated','preliminary','contested')),

  -- Admin
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Actors linked to conflicts
CREATE TABLE conflict_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id uuid REFERENCES conflict_conflicts(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text,
  actor_type text NOT NULL CHECK (actor_type IN (
    'state-military','rebel-group','militia','terrorist-org',
    'foreign-state','foreign-military','proxy-force','political-party',
    'criminal-network','pmsc','peacekeeping','international-org','other'
  )),
  side text,
  -- 'government','opposition','neutral','foreign-backer-gov','foreign-backer-opp'
  country_origin text,       -- ISO2
  strength_estimate text,    -- 'unknown','hundreds','thousands','tens-of-thousands'
  funding_sources text[],
  external_backer text,      -- ISO2 country if state-backed
  ideology text,
  un_sanctioned boolean DEFAULT false,
  us_designated_terrorist boolean DEFAULT false,
  eu_sanctioned boolean DEFAULT false,
  notes text,
  source text,
  confidence text CHECK (confidence IN ('confirmed','alleged','suspected','disputed')),
  created_at timestamptz DEFAULT now()
);

-- Conflict economy / beneficiary network
CREATE TABLE conflict_economy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id uuid REFERENCES conflict_conflicts(id) ON DELETE CASCADE,
  entity_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN (
    'foreign-state','arms-supplier','extractive-company','smuggling-network',
    'security-contractor','political-elite','armed-group-finance',
    'reconstruction-contractor','illicit-taxation','diaspora-network',
    'financial-institution','logistics-intermediary','other'
  )),
  alleged_role text NOT NULL,
  interest_sector text,
  -- 'oil','gold','coltan','timber','arms','narcotics','land','political-power','other'
  evidence_level text NOT NULL CHECK (evidence_level IN ('confirmed','alleged','suspected','disputed')),
  source_count integer DEFAULT 1,
  source_urls text[],
  source_names text[],
  un_panel_cited boolean DEFAULT false,
  sanctioned boolean DEFAULT false,
  sanctions_detail text,
  confidence_score integer CHECK (confidence_score BETWEEN 1 AND 10),
  last_verified_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Displacement data
CREATE TABLE conflict_displacement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id uuid REFERENCES conflict_conflicts(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  idps_total bigint,
  refugees_total bigint,
  returnees_total bigint,
  new_displacement_30d bigint,
  host_countries text[],     -- ISO2 array
  children_pct numeric,
  women_pct numeric,
  shelter_severity text CHECK (shelter_severity IN ('low','medium','high','critical')),
  source text NOT NULL,
  source_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Timeline events
CREATE TABLE conflict_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id uuid REFERENCES conflict_conflicts(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'battle','airstrike','massacre','protest','coup','ceasefire',
    'peace-talks','election','sanctions','foreign-intervention',
    'humanitarian-crisis','escalation','de-escalation','other'
  )),
  title text NOT NULL,
  description text,
  location text,
  fatalities_reported integer,
  source text,
  source_url text,
  acled_event_id text,
  significance text CHECK (significance IN ('low','medium','high','critical')),
  created_at timestamptz DEFAULT now()
);

-- Country-level aggregate data
CREATE TABLE conflict_country_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso2 text NOT NULL,
  country_name text NOT NULL,
  active_conflicts integer DEFAULT 0,
  total_fatalities_estimate bigint DEFAULT 0,
  total_idps bigint DEFAULT 0,
  total_refugees bigint DEFAULT 0,
  fragility_score numeric,
  military_spend_gdp_pct numeric,
  conflict_gdp_drag_pct numeric,
  food_insecurity_pct numeric,
  peace_index_score numeric,
  last_updated date,
  source text
);

-- Data sync log
CREATE TABLE conflict_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,   -- 'acled','unhcr','worldbank','manual'
  status text NOT NULL CHECK (status IN ('success','partial','failed')),
  records_processed integer,
  records_updated integer,
  error_message text,
  synced_at timestamptz DEFAULT now()
);

-- Manual overrides (admin input beats API data)
CREATE TABLE conflict_manual_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id uuid REFERENCES conflict_conflicts(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  override_value text NOT NULL,
  reason text,
  overridden_by text DEFAULT 'admin',
  overridden_at timestamptz DEFAULT now()
);
```

---

## FILE STRUCTURE

```
/conflict/
  index.html               ← Main dashboard overview (KPIs, map, top conflicts)
  conflicts.html           ← Full conflict list with filters
  conflict.html            ← Individual conflict detail page (?id=slug)
  map.html                 ← Full-screen interactive map
  economy.html             ← Economic impact tab
  displacement.html        ← Displacement tracker
  actors.html              ← Conflict economy / actors network
  forecasts.html           ← Scenario forecasts
  methodology.html         ← Data sources, uncertainty disclaimers

/engines/
  conflict-engine.js       ← Main data engine (IIFE)
  conflict-map-engine.js   ← Leaflet map logic
  conflict-charts-engine.js ← ECharts configurations

/assets/css/
  conflict.css             ← All conflict dashboard styles

/netlify/functions/
  conflict-data.js         ← GET — serves conflict data from Supabase
  conflict-acled.js        ← ACLED API proxy + normalization
  conflict-unhcr.js        ← UNHCR Refugee API proxy
  conflict-worldbank.js    ← World Bank API proxy
  conflict-update.js       ← POST — admin writes to Supabase
  conflict-sync.js         ← Scheduled ETL (runs daily)

/admin/
  conflict-data.html       ← Full admin CRUD for all conflict data

/supabase/
  conflict-schema.sql      ← All CREATE TABLE statements (above)
  conflict-seed.sql        ← 20 conflicts with full related data
```

---

## DESIGN SYSTEM

The conflict dashboard uses a **dark intelligence aesthetic** — different from other AfroTools tools which are light — because it is a serious data product. AfroTools brand blue remains the primary accent.

```css
/* Conflict dashboard palette — define in conflict.css */
--cd-bg: #0A1628;
--cd-bg-card: #111D2E;
--cd-bg-elevated: #162032;
--cd-border: rgba(255,255,255,0.08);
--cd-border-accent: rgba(0,122,255,0.3);
--cd-text: #E2EAF4;
--cd-text-muted: #7B93B5;
--cd-text-dim: #4A6080;
--cd-blue: #007AFF;
--cd-blue-light: #4DA3FF;
--cd-blue-glow: rgba(0,122,255,0.15);

/* Status colors */
--cd-red: #EF4444;      /* active / escalating */
--cd-orange: #F97316;   /* high risk */
--cd-yellow: #EAB308;   /* medium risk / stalemated */
--cd-green: #22C55E;    /* de-escalating / post-conflict */
--cd-purple: #A855F7;   /* frozen */
--cd-teal: #14B8A6;     /* negotiation */

/* Evidence level colors */
--cd-confirmed: #22C55E;
--cd-alleged: #EAB308;
--cd-suspected: #F97316;
--cd-disputed: #94A3B8;
```

**Typography**: `DM Sans` for all UI. `Instrument Serif` for large headline numbers and the dashboard title only.

**Status badges**: pill-shaped, color-coded by conflict status. Always visible on conflict cards.

**Conflict stage indicator**: horizontal 6-step progress bar with current stage highlighted.

**Evidence level badges**: always shown on actor and conflict economy rows. Never hide uncertainty.

---

## PAGE SPECIFICATIONS

### `/conflict/index.html` — Main Dashboard

**Hero**: "Africa Conflict Intelligence" title + live timestamp of last data sync + total active conflicts count badge.

**KPI strip** — 8 cards in a horizontally scrollable row:
1. Active Conflicts in Africa
2. Escalating This Month
3. Total Fatalities (estimated range)
4. People Displaced (IDPs + Refugees)
5. Countries Affected
6. Estimated Economic Loss (USD range)
7. At Critical Risk (count)
8. Global Conflicts with Africa Impact

**Main content — 2-column layout**

Left (60%):
- Africa Leaflet map (420px height). **CartoDB Dark Matter tile layer.** Loads with choropleth layer (escalation risk) + conflict point markers both active by default. Click a marker → popup with quick stats. Layer toggle: [ Conflict Index ] [ Markers ] [ Displacement ] — compact pill buttons above the map. "View full map →" link opens `/conflict/map.html`
- Below map: "Recently Escalated" — 3 horizontal cards for most recently escalated conflicts

Right (40%):
- "Active Conflicts" scrollable list — 10 items with status badge, name, country flag emoji, fatality estimate, displaced count
- Filter pills: All | Escalating | High Risk | Resource-Linked | Displacement Crisis

**Bottom — 3-column data panels**:
1. Fatalities trend (ECharts bar, last 12 months, grouped by region)
2. Displacement trend (ECharts area chart, IDPs vs Refugees)
3. Top conflicts by economic impact (ECharts horizontal bar)

**Data source bar at bottom** (every public page must have this):
> "Data: ACLED · UNHCR · World Bank · SIPRI · UCDP · Manual curation. Updated: [timestamp]. All estimates carry uncertainty — see Methodology."

---

### `/conflict/conflicts.html` — Conflict List

**Filter panel** (collapsible on mobile):
- Text search (name / country)
- Region: All / West Africa / East Africa / North Africa / Central Africa / Southern Africa / Middle East
- Category: All / Africa Internal / Cross-Border / Proxy / Global-Africa Impact
- Status: All / Active / Escalating / Frozen / Negotiation / Post-Conflict
- Type: All / Civil War / Insurgency / Interstate / Coup / Communal / Separatist
- Special flags: Resource-Linked / High Displacement / Election-Linked / Foreign Intervention
- Duration: Any / Under 1yr / 1–5yrs / 5–10yrs / Over 10yrs

**Sort**: Most Fatalities / Most Displaced / Longest Running / Recently Updated / Escalation Risk

**Conflict card contents**:
- Status badge (top right, color-coded pill)
- Country flag emoji(s) (up to 3)
- Conflict name + type tag
- Duration: "X years, Y months"
- Fatality range
- Displaced total
- Escalation risk bar (color gradient)
- "View Details →" link

**Result count**: "Showing X of Y conflicts. Last sync: [timestamp]"

---

### `/conflict/conflict.html?id=[slug]` — Conflict Detail

The most important page. Must be comprehensive and data-dense.

**Header**: Conflict name + status badge + category tag + country flags + start date + live day counter

**Tab nav**: Overview | Timeline | Actors | Conflict Economy | Displacement | Economic Impact | Scenarios

#### Overview tab
- Conflict summary paragraph (`why_it_persists` field)
- Stage 1–6 visual indicator with current stage highlighted
- 6 metric cards: Fatalities / Displaced / Duration / Economic Loss / Military Spend / Escalation Risk
- Mini Leaflet map (300px) showing conflict geography
- External links: ACLED page, UCDP entry, UN OCHA, Wikipedia

#### Timeline tab
- Vertical timeline, newest first
- Each event: date pill, type badge, title, description, source link, fatalities if any
- Filter by event type
- Events sourced from `conflict_events` table + ACLED sync

#### Actors tab
- Grouped sections: Government Forces | Opposition/Rebels | Foreign Backers | International
- Each actor card: name, type, origin flag, strength estimate, funding sources, sanctions badges, evidence level, notes
- ECharts network/graph visualization showing actor relationships

#### Conflict Economy tab
- **Header disclaimer** (required, always visible):
  > "This section documents economic interests and incentive structures that may contribute to conflict continuation. Evidence levels are clearly marked. This does not constitute a legal finding."
- Table: Entity | Type | Alleged Role | Sector | Evidence Level | Sources | Sanctions | Confidence Score
- Filter by evidence level: All / Confirmed / Alleged / Suspected
- Each row: source count badge, expandable source links
- **Footer disclaimer** linking to methodology page

#### Displacement tab
- Total displaced headline
- ECharts donut: IDPs vs Refugees breakdown
- Host countries bar chart
- Monthly displacement trend line chart
- Shelter severity rating
- Source attribution: UNHCR + IDMC

#### Economic Impact tab
- GDP drag estimate range with confidence band
- Trade disruption (if applicable)
- Sectoral impact: Agriculture / Energy / Infrastructure / Tourism / Investment
- Regional spillover costs
- Military expenditure trend
- Reconstruction liability estimate
- For `global-africa-impact` conflicts: Africa-specific metrics (oil price shock, shipping cost increase, food price impact)

#### Scenarios tab
- **Header** (required):
  > "These are probabilistic scenarios based on historical conflict patterns from UCDP, ACLED trend analysis, and expert assessment. They are not predictions."
- Three scenario cards:
  - **Base Case**: X–Y months duration estimate + key assumptions
  - **Optimistic**: X months + conditions required
  - **Worst Case**: X months + risk factors
- Confidence level badge with explanation
- "Leading indicators to watch" — 5–7 specific metrics per conflict
- Conflict stage model explanation with source citations

---

### `/conflict/map.html` — Full Map

Full-screen intelligence map. This is the showpiece page.

- Full-screen Leaflet map (100vh minus navbar height)
- **Tile layer: CartoDB Dark Matter** — deep dark base, white country borders, no clutter
- All 4 layers available: Choropleth / Conflict Markers / Displacement Bubbles / Spillover Risk
- Top-right overlay: layer toggle button group (styled dark pill buttons)
- Bottom-left overlay: quick-zoom buttons (All Africa / West / East / North / Central / Southern / Global)
- Collapsible left side panel (300px wide, slides in/out):
  - Search input
  - Filtered conflict list — click any item → map flies to that conflict's coordinates with a smooth animation (`flyTo` with zoom 6)
  - Shows live count of visible conflicts
- Legend overlay (bottom-right):
  - Status color key
  - Circle size = fatality scale
  - Current metric label if choropleth is active
- On "Global" zoom: show the 3 global conflicts (US-Iran, Gaza, Ukraine) with dashed blue arc lines connecting to Africa labelled "Oil impact" / "Food aid impact" / "Grain impact"
- Map loads with a subtle fade-in animation after tiles render
- Mobile: side panel becomes a bottom sheet, layer toggles collapse into a single "Layers" button

---

### `/conflict/economy.html` — Economic Impact

- Headline: total estimated economic loss across all active African conflicts (range)
- GDP impact by country — ECharts horizontal bar, ranked by % GDP drag
- Trade corridor disruption — Leaflet overlay showing blocked/disrupted routes
- Sector breakdown across all conflicts (Agriculture / Energy / Infrastructure / Mining)
- Military expenditure vs social spending — dual-axis ECharts chart
- Refugee host cost: burden on host countries table
- Global impacts panel: shipping costs, commodity prices, investment flight
- Sortable data table: country-by-country breakdown

---

### `/conflict/displacement.html` — Displacement Tracker

- Headline: "X million people displaced across Africa by active conflicts"
- KPI row: Total IDPs / Total Refugees / New this month / Returnees
- Displacement choropleth + bubble hybrid map
- Top 10 conflicts by displacement — ECharts bar
- Host country burden table
- 24-month trend line chart
- Children/women vulnerability indicators (where data available)
- Source: UNHCR + IDMC with direct links

---

### `/conflict/actors.html` — Conflict Economy & Actors Network

- Intro paragraph:
  > "Mapping actors, incentive structures, and economic interests in African conflicts. Evidence levels are shown explicitly on all entries."
- Global actor network: ECharts network graph (nodes = actors/entities, edges = relationships, click node → detail panel)
- Filters: by conflict / actor type / evidence level / sector
- Full actor table with all fields, sortable
- Conflict economy table with evidence levels
- Sanctions tracker: total count + full list with details
- Foreign involvement overview: which external states are involved and how

---

### `/conflict/forecasts.html` — Scenario Forecasts

- Prominent disclaimer at top
- Conflict stage model: 6-stage diagram with historical average durations from UCDP
- Per-conflict scenario cards: base / optimistic / worst case
- Escalation risk ranking: ordered list by risk score
- Leading indicators dashboard: for each high-risk conflict, metrics being monitored
- Early warning panel: conflicts showing 2+ leading indicators triggering

---

### `/conflict/methodology.html` — Methodology

Full written explanation of:
- Each data source and what it covers (ACLED, UCDP, UNHCR, IDMC, SIPRI, World Bank)
- Why all estimates are ranges, not point figures
- Evidence levels used in the conflict economy section
- Conflict stage model (Stage 1–6) with citations
- How scenarios are constructed and what confidence means
- Update frequency per source
- Known limitations and data gaps
- How to report an error (email link)

---

## NETLIFY FUNCTIONS

### `conflict-data.js` (GET)

Query params: `?type=conflicts|events|actors|displacement|economy&conflict_id=&region=&status=&limit=&offset=`

Returns JSON from Supabase with appropriate filtering. Add header: `Cache-Control: public, max-age=300`.

### `conflict-acled.js` (GET)

Proxies ACLED API. API key from env var `ACLED_API_KEY`.

- Base URL: `https://api.acleddata.com/acled/read`
- Key params: `region=1,2,3,4,5` (all Africa), `fields=event_id_cnty,event_date,event_type,country,admin1,fatalities,actor1,actor2,notes,source`
- Fetches last 90 days of events
- Normalizes to `conflict_events` schema
- Returns normalized JSON (does NOT write to DB — `conflict-sync.js` handles that)

### `conflict-unhcr.js` (GET)

Proxies UNHCR Population Statistics API.

- Base: `https://api.unhcr.org/population/v1/`
- Fetches displacement data for African countries
- Normalizes to `conflict_displacement` schema

### `conflict-worldbank.js` (GET)

Proxies World Bank API (free, no key required).

- Base: `https://api.worldbank.org/v2/`
- Fetches: GDP per capita, military expenditure % GDP, fragility/conflict/violence index

### `conflict-update.js` (POST)

Admin-only write endpoint.

- Checks `Authorization: Bearer [ADMIN_TOKEN]` header (env var `CONFLICT_ADMIN_TOKEN`)
- Accepts body: `{ table, action: 'upsert' | 'delete', data }`
- Validates table name against whitelist of `conflict_*` tables
- Writes to Supabase using service role key (env var `SUPABASE_SERVICE_KEY`)
- Returns `{ success, id, message }`

### `conflict-sync.js` (Scheduled — daily)

Netlify scheduled function running every 24 hours.

1. Fetch fresh ACLED data for last 7 days
2. Fetch UNHCR displacement data
3. Normalize and upsert to Supabase tables
4. Log sync result to `conflict_sync_log`
5. Do NOT overwrite fields that have entries in `conflict_manual_overrides`

---

## ENGINE ARCHITECTURE

### `engines/conflict-engine.js`

IIFE module. Exports `window.ConflictEngine`.

```javascript
window.ConflictEngine = (function() {
  let _conflicts = [];
  let _filters = { region: '', status: '', category: '', type: '' };

  return {
    init(options),            // fetch data, set up page
    load(params),             // fetch from /.netlify/functions/conflict-data
    filter(filters),          // apply filters, re-render
    getConflict(slug),        // single conflict lookup
    renderCards(data, el),    // render conflict cards into element
    renderKPIs(data, el),     // render KPI strip
    renderMap(data),          // initialize map with data
    formatDuration(days),     // returns "3 years, 2 months"
    formatRange(low, high),   // returns "12,000–18,000"
  };
})();
```

### `engines/conflict-charts-engine.js`

IIFE module. Exports `window.ConflictCharts`. Wraps ECharts with pre-configured chart types:
- Fatalities trend bar chart
- Displacement trend area chart
- GDP impact horizontal bar
- Actor network graph
- Conflict stage gauge/progress

### `engines/conflict-map-engine.js`

IIFE module. Exports `window.ConflictMap`. Wraps Leaflet.

- Default viewport: Africa (lat 0, lng 20, zoom 3)
- Handles marker rendering, layer switching, popups, choropleth
- **Tile layer: CartoDB Dark Matter** — use `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` with attribution `© OpenStreetMap contributors © CARTO`. This is the required tile layer — do not use OpenStreetMap or any other provider. The dark base map is essential to the dashboard aesthetic.

**Map layers (user can toggle between, or stack):**

**Layer 1 — Choropleth** (default, like a conflict index map):
- Load Africa GeoJSON country boundaries
- Shade each country light → dark red based on the selected metric (default: escalation risk score)
- Metric toggle: Escalation Risk / Active Conflicts Count / Fatalities Estimate / Displacement Total
- Color scale: `#FEE5D9` (low) → `#FC9272` → `#DE2D26` → `#67000D` (critical)
- Countries with no conflicts: `#1a2a3a` (near-invisible dark, not white)
- Hover state: lighten slightly + show tooltip with country name + metric value

**Layer 2 — Conflict point markers** (stacked on top of choropleth):
- Circle markers positioned at conflict `lat`/`lng`
- Radius: proportional to fatality estimate (min 8px, max 40px)
- Fill color by status: `#EF4444` escalating, `#F97316` active, `#EAB308` stalemated, `#A855F7` frozen, `#14B8A6` negotiation, `#22C55E` post-conflict
- Border: 2px white at 40% opacity
- Click → popup with: conflict name, status badge, fatalities range, displaced count, duration, "View Full Details →" link styled in `--cd-blue`

**Layer 3 — Displacement bubbles**:
- Semi-transparent teal circles at conflict origin points
- Radius proportional to total displaced (IDPs + refugees)
- Tooltip shows exact displacement figures and host countries

**Layer 4 — Spillover risk**:
- Highlight border regions of countries adjacent to escalating conflicts
- Use a dashed orange polygon overlay on at-risk border zones
- Tooltip explains the spillover risk factors

**Layer toggle buttons** — positioned top-right of map as a styled control:
```
[ Conflict Index ] [ Active Conflicts ] [ Displacement ] [ Spillover Risk ]
```
All four can be active simultaneously. Toggle buttons styled with `--cd-bg-card` background, `--cd-blue` active state.

**Quick-zoom buttons** — positioned bottom-left:
```
[ All Africa ] [ West ] [ East ] [ North ] [ Central ] [ Southern ] [ Global ]
```
"Global" zooms out to show US-Iran, Gaza, Ukraine with thin blue lines connecting them to Africa showing impact links.

---

## ADMIN PAGE: `/admin/conflict-data.html`

Follow the **exact pattern** of `/admin/commodity-prices.html`:
- Same inline CSS
- Same header style with yellow "Admin" badge
- Same toast notification system (`showToast(msg, type)`)
- Same `noindex, nofollow` robots meta
- Same back link → `/admin/dashboard.html`

Also add a link card in `/admin/dashboard.html` pointing to `/admin/conflict-data.html` in the "Manage Data" section.

### Admin page tabs (use same tab pill pattern as commodity-prices.html):

**Tab 1: Conflicts**
- Table of all conflicts (published + unpublished) with Edit / Delete buttons
- "Add New Conflict" expands an inline form with ALL `conflict_conflicts` fields
- Inline cell editing: click a cell → becomes input, Save button appears
- Status dropdown editable in-line
- Publish / Unpublish toggle per row
- Bulk actions: Select → Publish / Unpublish / Delete

**Tab 2: Events**
- Dropdown to filter by conflict
- Add event form: conflict, date, type, title, description, location, fatalities, source URL, significance
- Events table sortable by date, editable inline

**Tab 3: Actors**
- Filter by conflict dropdown
- Add / edit actor form with all fields including sanctions checkboxes
- Evidence level selector (color-coded options)

**Tab 4: Conflict Economy**
- Add / edit conflict economy entries
- Evidence level field highlighted prominently (required)
- Up to 3 source URL fields
- Confidence score input (1–10)

**Tab 5: Displacement**
- Add displacement snapshot: pick conflict + date + all displacement fields
- Shows historical snapshots per conflict in a small table

**Tab 6: Sync Status**
- Table showing last 20 rows from `conflict_sync_log`
- "Trigger Manual Sync" button → calls `conflict-sync.js`
- Per-source last-sync timestamps
- Error badge if latest sync failed

**Auth**: Admin token stored in `localStorage` key `conflict_admin_token`. On page load, if not present, show a password prompt modal. Token is sent as `Authorization: Bearer [token]` on all `conflict-update.js` calls.

---

## CSS FILE: `/assets/css/conflict.css`

Standalone CSS file imported on all conflict pages alongside `tokens.min.css`. Define all `--cd-*` variables and all component classes:

- `.cd-card` — dark card base with border and hover state
- `.cd-kpi-strip` — horizontally scrollable KPI row
- `.cd-kpi-card` — individual KPI with value + label
- `.cd-status-badge` — color-coded pill per status
- `.cd-stage-bar` — 6-step stage progress indicator
- `.cd-evidence-badge` — confirmed / alleged / suspected / disputed pill
- `.cd-tab-nav` — tab navigation strip
- `.cd-filter-panel` — collapsible filter sidebar
- `.cd-conflict-card` — conflict list card
- `.cd-actor-card` — actor entry card
- `.cd-economy-row` — conflict economy table row
- `.cd-timeline-item` — vertical timeline event
- `.cd-scenario-card` — base / optimistic / worst case forecast card
- `.cd-map-container` — Leaflet wrapper (set height explicitly)
- `.cd-chart-container` — ECharts wrapper
- `.cd-disclaimer` — styled disclaimer box (yellow-tinted border)
- `.cd-source-bar` — bottom data source attribution bar

Mobile responsive: cards stack to single column, map goes full-width, tab nav scrolls horizontally, filter panel collapses to toggle button.

---

## SEED DATA: `supabase/conflict-seed.sql`

Provide complete seed data for 20 conflicts with all related records. Every conflict must have `is_published = true`.

### African conflicts (17)

| # | Slug | Name | Category | Type | Status |
|---|------|------|----------|------|--------|
| 1 | `sudan-civil-war-2023` | Sudan Civil War | africa-internal | civil-war | escalating |
| 2 | `ethiopia-amhara-2023` | Ethiopia – Amhara Conflict | africa-internal | insurgency | active |
| 3 | `drc-m23-conflict` | DR Congo – M23/FDLR | africa-proxy | insurgency | escalating |
| 4 | `somalia-al-shabaab` | Somalia – Al-Shabaab Insurgency | africa-internal | insurgency | stalemated |
| 5 | `mozambique-cabo-delgado` | Mozambique – Cabo Delgado | africa-internal | insurgency | active |
| 6 | `nigeria-boko-haram-iswap` | Nigeria – Boko Haram/ISWAP | africa-internal | insurgency | active |
| 7 | `mali-jihadist-conflict` | Mali – Sahel Jihadist Conflict | africa-proxy | insurgency | escalating |
| 8 | `cameroon-anglophone` | Cameroon – Anglophone Crisis | africa-internal | separatist | stalemated |
| 9 | `car-wagner-conflict` | Central African Republic | africa-proxy | civil-war | active |
| 10 | `libya-factions` | Libya – Faction Conflict | africa-proxy | interstate | frozen |
| 11 | `south-sudan-instability` | South Sudan – Chronic Instability | africa-internal | civil-war | active |
| 12 | `burkina-faso-insurgency` | Burkina Faso – Sahel Insurgency | africa-internal | insurgency | escalating |
| 13 | `niger-post-coup` | Niger – Post-Coup Instability | africa-internal | coup | active |
| 14 | `egypt-sinai` | Egypt – Sinai Insurgency | africa-internal | insurgency | stalemated |
| 15 | `western-sahara` | Western Sahara | africa-cross-border | separatist | frozen |
| 16 | `kenya-communal-conflicts` | Kenya – Communal Violence | africa-internal | communal | active |
| 17 | `chad-instability` | Chad – Post-Coup Instability | africa-internal | coup | active |

### Global conflicts with Africa impact (3)

| # | Slug | Name | Category | africa_impact_summary |
|---|------|------|----------|-----------------------|
| 18 | `us-iran-war-2026` | US-Iran War | global-africa-impact | Oil price shock +28%, Red Sea/Suez shipping disrupted, East Africa shipping costs +40%, energy price spike across continent |
| 19 | `israel-gaza-2023` | Israel-Gaza War | global-africa-impact | Food aid diversion, UN funding squeeze, diplomatic splits within AU, humanitarian corridor disputes |
| 20 | `russia-ukraine-2022` | Russia-Ukraine War | global-africa-impact | Wheat/grain price shock, fertilizer shortage, energy cost increases, African grain import crisis |

For each conflict include in seed data:
- 3–5 actors in `conflict_actors`
- 2–3 entries in `conflict_economy`
- 1 displacement snapshot in `conflict_displacement`
- 4–6 timeline events in `conflict_events`
- Full scenario data (base/optimistic/worst months, confidence, key assumptions)
- `why_it_persists` paragraph (2–3 sentences)
- All numeric estimates (fatalities range, displaced, economic loss range)

For the **US-Iran War** specifically:
- Start date: `2026-02-28`
- Status: `escalating`
- Stage: `2`
- Escalation risk: `critical`
- Africa impact: Oil +28%, Suez/Red Sea blocked, Kenya/Tanzania/Ethiopia shipping +40%, fuel price cascades
- Scenario base: 6–12 months, optimistic: 3 months (negotiated ceasefire), worst: 24+ months
- Key actors: US Military (CENTCOM), Israeli IDF, Iranian IRGC, Iranian Navy, Houthi-aligned forces
- Conflict economy: Gulf state oil beneficiaries, US defense contractors, Iranian oil black market

---

## NAVBAR REGISTRATION

In `/assets/js/components/navbar.js`, add to the most appropriate category (or create "Intelligence" category):

```javascript
{
  name: 'Africa Conflict Intelligence',
  url: '/conflict/',
  description: 'Live dashboard tracking conflicts, displacement, economic impact, and conflict actors across Africa',
  icon: '🌍',
  tags: ['conflict', 'war', 'displacement', 'security', 'intelligence', 'africa']
}
```

---

## ENVIRONMENT VARIABLES REQUIRED

Add to Netlify environment variables:

```
ACLED_API_KEY=           # Register at acleddata.com
CONFLICT_ADMIN_TOKEN=    # Choose a strong random string
SUPABASE_URL=            # jbmhfpkzbgyeodsqhprx.supabase.co
SUPABASE_SERVICE_KEY=    # Supabase service role key (already in use)
```

---

## BUILD ORDER

Build strictly in this sequence — each phase must be functional before the next begins:

1. `supabase/conflict-schema.sql` — all CREATE TABLE statements
2. `supabase/conflict-seed.sql` — 20 conflicts + all related data, run against Supabase
3. `assets/css/conflict.css` — full stylesheet with all component classes
4. `netlify/functions/conflict-data.js` — core read endpoint
5. `engines/conflict-engine.js` — data fetching and rendering engine
6. `/conflict/index.html` — main dashboard (KPIs + map + lists)
7. `/conflict/conflicts.html` — full conflict list with filters
8. `/conflict/conflict.html` — detail page with all 7 tabs
9. `engines/conflict-map-engine.js` + `/conflict/map.html`
10. `/conflict/economy.html` + `/conflict/displacement.html`
11. `engines/conflict-charts-engine.js` + `/conflict/actors.html`
12. `/conflict/forecasts.html`
13. `/conflict/methodology.html`
14. `netlify/functions/conflict-update.js` + `/admin/conflict-data.html`
15. Link admin page from `/admin/dashboard.html`
16. `netlify/functions/conflict-acled.js` + `conflict-unhcr.js` + `conflict-worldbank.js`
17. `netlify/functions/conflict-sync.js` — scheduled ETL
18. Register in navbar in `/assets/js/components/navbar.js`

---

## HARD RULES — DO NOT VIOLATE

- Every numeric estimate shows as a **range** (low–high), never a single number
- Every data point shows its **source name** and **last verified date**
- Every public page has the **data source bar** at the bottom
- The methodology page is linked from every data display section
- The conflict economy tab always shows the **legal disclaimer** above the table
- Scenario forecasts always carry the **"model estimate" label** — never presented as fact
- `is_published = false` conflicts **never appear** on public pages
- No FOUC — use the `.skeleton` loading pattern already in `global.css`
- The dashboard aesthetic is **authoritative and serious**, never alarmist or sensationalist
- Admin pages carry `<meta name="robots" content="noindex, nofollow">`
- All Supabase writes go through `conflict-update.js` Netlify function, never direct from client

---

*Generated for AfroTools — Africa Conflict Intelligence Dashboard — March 2026*

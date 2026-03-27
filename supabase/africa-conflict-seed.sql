-- ============================================================
-- AFRICA CONFLICT INTELLIGENCE — DATABASE SCHEMA + SEED DATA
-- Instance: jbmhfpkzbgyeodsqhprx (AfroTools Data DB)
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLE: ac_conflicts (master conflict records)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_conflicts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  short_name            TEXT,
  conflict_type         TEXT NOT NULL CHECK (conflict_type IN (
    'civil_war', 'insurgency', 'interstate', 'proxy_war',
    'coup', 'communal', 'separatist', 'foreign_intervention',
    'hybrid', 'frozen', 'criminal_violence'
  )),
  is_african            BOOLEAN DEFAULT true,
  africa_impact_reason  TEXT,
  primary_country       TEXT NOT NULL,
  countries_involved    TEXT[] DEFAULT '{}',
  regions               TEXT[] DEFAULT '{}',
  lat                   DECIMAL(10,7),
  lng                   DECIMAL(10,7),
  affected_area_km2     BIGINT,
  status                TEXT NOT NULL CHECK (status IN (
    'emerging', 'active', 'escalating', 'stalemated',
    'de-escalating', 'frozen', 'negotiation', 'post-conflict'
  )),
  start_date            DATE NOT NULL,
  end_date              DATE,
  duration_days         INT GENERATED ALWAYS AS (
    CASE WHEN end_date IS NOT NULL THEN end_date - start_date ELSE NULL END
  ) STORED,
  fatalities_min        BIGINT DEFAULT 0,
  fatalities_max        BIGINT DEFAULT 0,
  fatalities_source     TEXT,
  fatalities_date       DATE,
  idps_count            BIGINT DEFAULT 0,
  refugees_count        BIGINT DEFAULT 0,
  returnees_count       BIGINT DEFAULT 0,
  displacement_source   TEXT,
  displacement_date     DATE,
  military_spend_usd_m  DECIMAL(12,2),
  military_spend_source TEXT,
  economic_loss_min_usd_b DECIMAL(12,3),
  economic_loss_max_usd_b DECIMAL(12,3),
  gdp_drag_pct          DECIMAL(5,2),
  economic_source       TEXT,
  summary               TEXT,
  why_persists          TEXT,
  key_triggers          TEXT[],
  resource_links        TEXT[],
  peace_efforts         TEXT,
  escalation_risk       TEXT CHECK (escalation_risk IN ('critical','high','medium','low','minimal')),
  spillover_risk        TEXT CHECK (spillover_risk IN ('critical','high','medium','low','minimal')),
  spillover_countries   TEXT[],
  food_insecurity_link  BOOLEAN DEFAULT false,
  election_link         BOOLEAN DEFAULT false,
  climate_link          BOOLEAN DEFAULT false,
  conflict_stage        INT CHECK (conflict_stage BETWEEN 1 AND 6),
  data_source           TEXT DEFAULT 'manual',
  acled_id              TEXT,
  last_api_sync         TIMESTAMPTZ,
  manually_overridden   BOOLEAN DEFAULT false,
  override_note         TEXT,
  is_featured           BOOLEAN DEFAULT false,
  is_published          BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_by            TEXT DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_ac_conflicts_status ON ac_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_ac_conflicts_country ON ac_conflicts(primary_country);
CREATE INDEX IF NOT EXISTS idx_ac_conflicts_type ON ac_conflicts(conflict_type);
CREATE INDEX IF NOT EXISTS idx_ac_conflicts_published ON ac_conflicts(is_published);
CREATE INDEX IF NOT EXISTS idx_ac_conflicts_african ON ac_conflicts(is_african);

-- ============================================================
-- TABLE: ac_actors
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
  country       TEXT,
  is_sanctioned BOOLEAN DEFAULT false,
  sanction_body TEXT[],
  description   TEXT,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: ac_conflict_actors (junction)
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
  side          TEXT,
  start_date    DATE,
  end_date      DATE,
  notes         TEXT,
  UNIQUE(conflict_id, actor_id, role)
);

-- ============================================================
-- TABLE: ac_events
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
  acled_event_id  TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ac_events_conflict ON ac_events(conflict_id);
CREATE INDEX IF NOT EXISTS idx_ac_events_date ON ac_events(event_date DESC);

-- ============================================================
-- TABLE: ac_displacement
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
  gdp_loss_usd_b        DECIMAL(12,3),
  gdp_loss_pct          DECIMAL(5,2),
  trade_disruption_usd_b DECIMAL(12,3),
  agriculture_impact_usd_b DECIMAL(12,3),
  infrastructure_loss_usd_b DECIMAL(12,3),
  reconstruction_cost_usd_b DECIMAL(12,3),
  military_spend_usd_b  DECIMAL(12,3),
  humanitarian_aid_usd_b DECIMAL(12,3),
  host_country_burden_usd_b DECIMAL(12,3),
  commodity             TEXT[],
  trade_routes          TEXT[],
  source                TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, year)
);

-- ============================================================
-- TABLE: ac_economy_actors (conflict economy / who profits)
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_economy_actors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id       UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  actor_id          UUID REFERENCES ac_actors(id),
  entity_name       TEXT NOT NULL,
  entity_type       TEXT NOT NULL CHECK (entity_type IN (
    'arms_supplier', 'resource_extractor', 'smuggling_network',
    'foreign_state_backer', 'reconstruction_contractor',
    'mercenary_firm', 'humanitarian_diversion', 'political_elite',
    'border_racket', 'illicit_financier', 'security_contractor',
    'media_sponsor', 'logistics_intermediary', 'other'
  )),
  alleged_role      TEXT NOT NULL,
  interest_type     TEXT[],
  country_of_origin TEXT,
  evidence_level    TEXT CHECK (evidence_level IN (
    'confirmed', 'alleged', 'suspected', 'disputed', 'historical'
  )) DEFAULT 'alleged',
  confidence_score  INT CHECK (confidence_score BETWEEN 0 AND 100),
  source_count      INT DEFAULT 1,
  sources           JSONB DEFAULT '[]',
  sanctions_status  TEXT CHECK (sanctions_status IN (
    'sanctioned', 'under_investigation', 'none', 'unknown'
  )) DEFAULT 'unknown',
  sanction_details  TEXT,
  estimated_value_usd_m DECIMAL(12,2),
  is_active         BOOLEAN DEFAULT true,
  last_verified     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ac_economy_conflict ON ac_economy_actors(conflict_id);
CREATE INDEX IF NOT EXISTS idx_ac_economy_type ON ac_economy_actors(entity_type);

-- ============================================================
-- TABLE: ac_forecasts
-- ============================================================
CREATE TABLE IF NOT EXISTS ac_forecasts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id           UUID REFERENCES ac_conflicts(id) ON DELETE CASCADE,
  forecast_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  base_duration_months  INT,
  base_outcome          TEXT,
  base_confidence       INT CHECK (base_confidence BETWEEN 0 AND 100),
  opt_duration_months   INT,
  opt_outcome           TEXT,
  opt_trigger           TEXT,
  opt_confidence        INT CHECK (opt_confidence BETWEEN 0 AND 100),
  worst_duration_months INT,
  worst_outcome         TEXT,
  worst_trigger         TEXT,
  worst_confidence      INT CHECK (worst_confidence BETWEEN 0 AND 100),
  indicators            JSONB DEFAULT '[]',
  key_assumptions       TEXT[],
  analyst_notes         TEXT,
  model_version         TEXT DEFAULT 'manual-v1',
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conflict_id, forecast_date)
);

-- ============================================================
-- TABLE: ac_timeline
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

CREATE INDEX IF NOT EXISTS idx_ac_timeline_conflict ON ac_timeline(conflict_id);
CREATE INDEX IF NOT EXISTS idx_ac_timeline_date ON ac_timeline(event_date DESC);

-- ============================================================
-- TABLE: ac_monthly_stats
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
-- RLS POLICIES
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

DROP POLICY IF EXISTS "public_read_conflicts" ON ac_conflicts;
DROP POLICY IF EXISTS "public_read_actors" ON ac_actors;
DROP POLICY IF EXISTS "public_read_conflict_actors" ON ac_conflict_actors;
DROP POLICY IF EXISTS "public_read_events" ON ac_events;
DROP POLICY IF EXISTS "public_read_displacement" ON ac_displacement;
DROP POLICY IF EXISTS "public_read_economic" ON ac_economic_impact;
DROP POLICY IF EXISTS "public_read_economy_actors" ON ac_economy_actors;
DROP POLICY IF EXISTS "public_read_forecasts" ON ac_forecasts;
DROP POLICY IF EXISTS "public_read_timeline" ON ac_timeline;
DROP POLICY IF EXISTS "public_read_monthly" ON ac_monthly_stats;

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

DROP TRIGGER IF EXISTS ac_conflicts_updated_at ON ac_conflicts;
CREATE TRIGGER ac_conflicts_updated_at
  BEFORE UPDATE ON ac_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: 20 CONFLICTS
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

('sudan-civil-war', 'Sudan Civil War (SAF vs RSF)', 'Sudan',
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
  2, 'mixed', true, true),

('drc-eastern-conflict', 'Eastern DRC — M23/FDLR Insurgency', 'DRC East',
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
  2, 'mixed', true, true),

('ethiopia-amhara', 'Ethiopia — Amhara Conflict (Fano)', 'Ethiopia-Amhara',
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
  ARRAY[]::TEXT[],
  2, 'manual', false, true),

('somalia-al-shabaab', 'Somalia — Al-Shabaab Insurgency', 'Somalia',
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
  3, 'mixed', true, true),

('nigeria-boko-haram', 'Nigeria — Boko Haram / ISWAP Insurgency', 'Nigeria NE',
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
  3, 'mixed', false, true),

('mozambique-cabo-delgado', 'Mozambique — Cabo Delgado Insurgency', 'Cabo Delgado',
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
  2, 'mixed', false, true),

('mali-sahel', 'Mali — Sahel Jihadist Insurgency', 'Mali-Sahel',
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
  2, 'mixed', true, true),

('burkina-faso-insurgency', 'Burkina Faso — Jihadist Insurgency', 'Burkina Faso',
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
  2, 'manual', true, true),

('car-civil-war', 'Central African Republic Civil War', 'CAR',
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
  3, 'manual', false, true),

('south-sudan-conflict', 'South Sudan — Persistent Conflict', 'South Sudan',
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
  3, 'manual', false, true),

('cameroon-anglophone', 'Cameroon — Anglophone Crisis', 'Ambazonia',
  'separatist', true, 'CM', ARRAY['CM'],
  ARRAY['central-africa','west-africa'],
  5.9631, 10.1591, 'stalemated', '2016-10-01',
  4000, 8000, 'Crisis Group / ACLED', '2024-12-01',
  700000, 60000, 'IDMC/UNHCR', '2024-12-01',
  300, 1.2, 3.0, 2.8, 'medium', 'low',
  ARRAY[]::TEXT[],
  'Cameroon''s Anglophone crisis began as a lawyers'' and teachers'' strike against the imposition of French language in courts and schools in the English-speaking Northwest and Southwest regions. By 2017, armed separatist groups (Ambazonia Defense Forces) declared independence as "Ambazonia." The conflict remains stalemated with high civilian cost but limited territorial change.',
  'The conflict persists because Yaoundé refuses to entertain any federalism discussion, seeing it as existential threat; armed factions are fragmented with no unified peace interlocutor; and ghost towns (forced school and business closures) have become a conflict tool that keeps communities paralyzed.',
  ARRAY['linguistic_exclusion','colonial_federation_legacy','federal_demand_refusal','separatist_fragmentation'],
  ARRAY[]::TEXT[],
  3, 'manual', false, true),

('libya-conflict', 'Libya — Ongoing Political-Military Fracture', 'Libya',
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
  4, 'manual', false, true),

('niger-post-coup', 'Niger — Post-Coup Instability & Jihadist Pressure', 'Niger',
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
  2, 'manual', false, true),

('western-sahara', 'Western Sahara — Frozen Conflict', 'Western Sahara',
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
  4, 'manual', false, true),

('kenya-communal-violence', 'Kenya — Pastoral Communal Violence', 'Kenya North',
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
  2, 'manual', false, true),

('gaza-conflict', 'Gaza — Israel-Hamas War', 'Gaza/Palestine',
  'interstate', false, 'PS', ARRAY['PS','IL','LE','YE','IR','EG','JO'],
  ARRAY['north-africa'],
  31.5000, 34.4667, 'escalating', '2023-10-07',
  46000, 50000, 'Gaza Health Ministry / UNOCHA', '2025-03-01',
  1900000, 84000, 'UNRWA/UNHCR', '2025-03-01',
  18500, 50.0, 100.0, NULL, 'critical', 'critical', ARRAY['EG','LB','YE','JO'],
  'The October 7, 2023 Hamas attack on Israel and the subsequent Israeli military operation in Gaza has killed over 46,000 Palestinians and displaced 90%+ of Gaza''s population. Africa impact: Houthi Red Sea attacks disrupted Suez Canal shipping critical to East Africa trade; Muslim-majority African nations face political pressure; North Africa has significant Palestinian solidarity movements; humanitarian diversion risk to African aid budgets.',
  'The conflict persists because Netanyahu government''s political survival depends on continued military operation; Hamas leadership calculates civilian suffering increases international pressure; US unconditional support removes Israeli incentive for ceasefire; Iran uses the conflict to project regional power through Hezbollah and Houthis.',
  ARRAY['occupation','hamas_governance','us_backing_israel','iran_proxy_axis','political_survival'],
  ARRAY['natural_gas_offshore','port_revenues'],
  2, 'mixed', true, true),

('ukraine-russia', 'Russia-Ukraine War', 'Ukraine',
  'interstate', false, 'UA', ARRAY['UA','RU','BY','PL'],
  ARRAY[]::TEXT[],
  49.0000, 32.0000, 'active', '2022-02-24',
  200000, 500000, 'UCDP/NATO estimates', '2025-03-01',
  3700000, 6500000, 'UNHCR', '2025-03-01',
  300000, 200.0, 500.0, NULL, 'high', 'medium', ARRAY['MD','GE','AM'],
  'Russia''s full-scale invasion of Ukraine on February 24, 2022. Africa impact: Ukraine and Russia together supply 40%+ of Africa''s wheat imports; Black Sea Grain Initiative collapse in 2023 caused food price spikes across African countries; Russian Wagner Group operations in Africa (Mali, CAR, Libya, Sudan) directly linked to war economy; African nations divided at UN votes; Russian disinformation operations shape African public opinion.',
  'The war persists because Putin cannot accept Ukrainian NATO membership or loss of seized territories without domestic political collapse; Ukraine cannot accept territorial concessions without legitimacy collapse; US/EU weapons supply keeps Ukraine capable of resistance but not decisive victory.',
  ARRAY['nato_expansion','territorial_sovereignty','russian_imperialism','energy_revenues','war_economy'],
  ARRAY['wheat','sunflower_oil','fertilizer_transit','arms'],
  2, 'manual', true, true),

('us-iran-conflict', 'US–Iran Military Conflict', 'US-Iran',
  'interstate', false, 'IR', ARRAY['IR','US','YE','IQ','SY','LE','IL'],
  ARRAY[]::TEXT[],
  32.4279, 53.6880, 'active', '2025-01-01',
  500, 3000, 'Reported estimates — verify with current sources', '2025-03-01',
  800000, 120000, 'Estimated — update from UNHCR', '2025-03-01',
  NULL, 5.0, 50.0, NULL, 'critical', 'critical', ARRAY['SA','IQ','YE','LE','BH'],
  'ADMIN NOTE: This conflict began/escalated in 2025 — all figures marked as preliminary estimates. Admin must update with current sourced data. Africa impact: Strait of Hormuz disruption affects oil supply to African nations; Suez/Red Sea shipping further disrupted; oil price volatility affects African oil importers and exporters differently; Iranian-backed Houthi attacks continue in Red Sea; African diaspora in Gulf states affected.',
  'PENDING — Admin to complete this section with current sourced analysis.',
  ARRAY['nuclear_program','regional_hegemony','us_israel_alliance','proxy_networks','oil_revenues'],
  ARRAY['oil','natural_gas','strait_of_hormuz'],
  2, 'manual', true, true),

('ethiopia-eritrea-tigray', 'Horn of Africa — Post-Tigray Instability', 'Horn-Tigray',
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
  ARRAY[]::TEXT[],
  5, 'manual', false, true),

('sahel-regional', 'Sahel Regional Security Crisis', 'Sahel Belt',
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
  2, 'mixed', true, true)

ON CONFLICT (slug) DO NOTHING;

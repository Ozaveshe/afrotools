const assert = require('assert');
const fs = require('fs');
const path = require('path');

const platform = require(path.join(__dirname, '..', 'netlify/functions/_shared/scholarship-platform.js'));

const legacy = platform.buildLegacyScholarship({
  id: 'sch-1',
  slug: 'sample-scholarship',
  title: 'Sample Scholarship',
  provider: 'Sample University',
  source_url: 'https://example.edu/source',
  official_url: 'https://example.edu/apply',
  source_type: 'official',
  destination_countries: ['Canada'],
  eligible_origins: ['Africa'],
  eligible_countries: ['Nigeria', 'Ghana'],
  study_levels: ['masters'],
  fields: ['stem'],
  funding_type: 'fully_funded',
  award_value_amount: 10000,
  award_value_currency: 'CAD',
  award_value_usd: 7300,
  local_value_amount: 11900000,
  local_value_currency: 'NGN',
  award_components: [{ label: 'Tuition' }],
  deadline_date: '2026-08-01',
  deadline_status: 'dated',
  status: 'open',
  confidence_mode: 'live',
  proof_level: 'official_link',
  summary: 'A source-backed test scholarship.',
  details: {
    overview: 'Detailed official overview.',
    sections: [
      { heading: 'Eligibility', items: ['African applicants.'] }
    ]
  },
  source_confidence: 95,
  freshness_score: 98,
  review_status: 'approved',
  published_at: '2026-05-23T00:00:00Z',
  verified_at: '2026-05-23T00:00:00Z',
  last_checked_at: '2026-05-23T00:00:00Z',
  last_seen_at: '2026-05-23T00:00:00Z',
  last_verified_at: '2026-05-23T00:00:00Z',
  raw_snapshot: {}
});

assert.strictEqual(legacy.details.overview, 'Detailed official overview.', 'API legacy shape should expose scholarship details payload');
assert.strictEqual(legacy.local_value_currency, 'NGN', 'detail view should receive local value fields');
assert.strictEqual(legacy.award_components.length, 1, 'detail view should receive source award components');
assert.strictEqual(legacy.source_confidence, 95, 'detail view should receive source confidence');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/051-scholarship-details-payload.sql'), 'utf8');
assert(migration.includes('add column if not exists details jsonb'), 'migration should add the details JSONB column');
assert(migration.includes('Application checklist'), 'migration should backfill a useful application checklist section');

const detailJs = fs.readFileSync(path.join(__dirname, '..', 'tools/scholarship-finder/scholarship-detail-view.js'), 'utf8');
const detailCss = fs.readFileSync(path.join(__dirname, '..', 'tools/scholarship-finder/scholarship-detail-view.css'), 'utf8');

assert(detailJs.includes('data-sch-key'), 'detail view should open from scholarship cards');
assert(/textContent\s*=\s*["']View details["']/.test(detailJs), 'card CTA should point to the in-product detail view');
assert(detailJs.includes('Open official application page'), 'detail view should keep the official provider CTA');
assert(/searchParams\.set\(["']scholarship["']/.test(detailJs), 'detail view should support shareable scholarship URLs');
assert(!/border-left|border-l|left:\s*0/.test(detailCss), 'detail view styling must not add left accent rails');

console.log('Scholarship detail view contract verified.');

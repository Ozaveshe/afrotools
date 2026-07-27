const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const sports = require('../assets/js/sports-toolkit.js');

const EXPECTED = {
  'betting-odds': ['Positive value', 'NGN 7,500'],
  'afcon-predictor': ['Morocco title model', '8.0%'],
  'fantasy-football': ['Gameweek points', '10 pts'],
  'betting-tax': ['Net betting profit after modeled tax', 'NGN 7,125'],
  'streaming-royalties': ['Estimated artist net', 'USD 250.74'],
  'nollywood-box-office': ['Producer-side profit estimate', 'NGN 75,870,000'],
  'dj-booking-rate': ['Recommended DJ quote', 'NGN 564,750'],
  'concert-budget': ['Event net profit', 'NGN -14,200,240'],
  'gym-roi-business': ['Monthly operating profit', 'NGN 6,260,000'],
  'event-ticket-revenue': ['Net ticket revenue', 'NGN 13,213,400'],
  'match-tickets': ['Estimated match-day ticket cost', 'NGN 30,060'],
  'sports-scholarship': ['Scholarship readiness', '89/100'],
  'athlete-earnings': ['Projected career net', 'NGN 99,676,248'],
  'gaming-pc-build': ['Recommended build tier', '1080p balanced'],
  'photo-video-pricing': ['Recommended creative quote', 'NGN 1,260,896'],
};

for (const [id, expected] of Object.entries(EXPECTED)) {
  test(`${id} has a stable primary result and complete route contract`, () => {
    const config = sports.tools[id];
    const input = {};
    for (const field of config.fields) {
      if (field.type !== 'heading') input[field.id] = field.value;
    }
    const result = sports.calculate(id, input);
    const html = fs.readFileSync(path.join(ROOT, 'tools', id, 'index.html'), 'utf8');
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const description = (html.match(/<meta name="description" content="([^"]+)"/i) || [])[1] || '';
    const schemas = Array.from(
      html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
      (match) => JSON.parse(match[1])
    );

    assert.equal(result.heroLabel, expected[0]);
    assert.equal(result.heroValue, expected[1]);
    assert.ok(result.rows.length > 0);
    assert.ok(result.insights.length > 0);
    assert.ok(title.length > 10 && title.length <= 75);
    assert.ok(description.length >= 80 && description.length <= 180);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com/tools/${id}/">`));
    assert.ok(schemas.some((schema) => schema['@type'] === 'WebApplication'));
    assert.match(html, /\/assets\/js\/pages\/day9-sports-safety\.js/);
  });
}

test('Sports safety layer removes calculation-time lead capture and preserves local exports', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'assets/js/pages/day9-sports-safety.js'),
    'utf8'
  );
  assert.match(source, /Print or copy this result in your browser without an email/);
  assert.match(source, /never chase losses/);
  assert.match(source, /leadForm\.remove\(\)/);
  assert.match(source, /data-copy-local-report/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|capture-lead|supabase/i);
});

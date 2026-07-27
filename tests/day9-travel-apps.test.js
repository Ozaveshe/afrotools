const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const IDS = [
  'africa-flight',
  'airbnb-vs-hotel',
  'airport-transfer',
  'beach-holiday-budget',
  'festival-travel-budget',
  'hotel-star-guide',
  'safari-cost',
  'travel-packing-list',
  'travel-vaccination-cost'
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('all nine canonical travel tools carry the maintained planning boundary', () => {
  for (const id of IDS) {
    const html = read(`tools/${id}/index.html`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com/tools/${id}/"`), `${id} canonical`);
    assert.match(html, /<title>[^<]+<\/title>/, `${id} title`);
    assert.match(html, /<meta name="description" content="[^"]+"/, `${id} description`);
    assert.match(html, /"@type": "WebApplication"|"@type":"WebApplication"/, `${id} WebApplication schema`);
    assert.match(html, /\/assets\/js\/pages\/day9-travel-boundaries\.js/, `${id} boundary helper`);
  }
});

test('travel helper is local-only, adds reset and labels static assumptions', () => {
  const helper = read('assets/js/pages/day9-travel-boundaries.js');
  assert.match(helper, /data-day9-travel-boundary/);
  assert.match(helper, /They are not live prices, availability, entry rules, safety advice, or guarantees/);
  assert.match(helper, /data-day9-reset/);
  assert.doesNotMatch(helper, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});

test('travel-health primary workflow is a clinician brief, not static medical advice', () => {
  const html = read('tools/travel-vaccination-cost/index.html');
  const helper = read('assets/js/pages/day9-travel-boundaries.js');
  assert.match(html, /<title>Travel Health Appointment Planner \| AfroTools<\/title>/);
  assert.match(html, /This tool does not decide medical requirements or provide live clinic prices/);
  assert.match(html, /Create appointment brief/);
  assert.match(helper, /Clinician review needed/);
  assert.match(helper, /who\.int\/travel-advice\/vaccines/);
  assert.match(helper, /iata\.org\/en\/travel-centre/);
  assert.match(helper, /Days and travellers must both be at least 1/);
});

test('flight workflow is described as a static planning range', () => {
  const html = read('tools/africa-flight/index.html');
  assert.match(html, /Africa Domestic Flight Planning Range/);
  assert.match(html, /This is not a live fare search/);
  assert.match(html, /Replace with a current carrier quote/);
});

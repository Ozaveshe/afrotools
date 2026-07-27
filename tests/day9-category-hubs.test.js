const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const HUBS = [
  { category: 'creative', file: 'creative/index.html', route: '/creative/', count: 46 },
  { category: 'sports', file: 'sports/index.html', route: '/sports/', count: 15 },
  { category: 'travel-tourism', file: 'travel/index.html', route: '/travel/', count: 9 },
];

function registryRows(category) {
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(REGISTRY, 'utf8'), sandbox);
  return sandbox.AFRO_TOOLS.filter((tool) => (
    (tool.lang || 'en') === 'en'
    && tool.category === category
    && ['live', 'new'].includes(tool.status)
  ));
}

for (const hub of HUBS) {
  test(`${hub.category} hub matches its canonical English live/new inventory`, () => {
    const rows = registryRows(hub.category);
    const hrefs = rows.map((tool) => tool.href.replace(/\/$/, ''));
    const html = fs.readFileSync(path.join(ROOT, hub.file), 'utf8');

    assert.equal(rows.length, hub.count);
    assert.equal(new Set(hrefs).size, hub.count);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://afrotools\\.com${hub.route}">`)
    );

    if (hub.category !== 'creative') {
      const linked = new Set(
        Array.from(html.matchAll(/href=["']([^"']+)["']/g), (match) => match[1].replace(/\/$/, ''))
      );
      assert.equal(hrefs.filter((href) => !linked.has(href)).length, 0);
    } else {
      assert.match(html, /id="bucket-sections"/);
      assert.match(html, /JavaScript is needed for the grouped catalog/);
    }
  });
}

test('Sports hub is planning-first and does not encourage gambling or invent live data', () => {
  const html = fs.readFileSync(path.join(ROOT, 'sports/index.html'), 'utf8');

  assert.match(html, /Odds literacy path/);
  assert.match(html, /Adults only; never chase losses/);
  assert.match(html, /do not fetch live scores, odds, entrants/i);
  assert.doesNotMatch(html, /Betting decision path/);
  assert.doesNotMatch(html, /unlock the PDF-ready report|enter an email/i);
});

test('Travel hub distinguishes editable assumptions from live and official facts', () => {
  const html = fs.readFileSync(path.join(ROOT, 'travel/index.html'), 'utf8');

  assert.match(html, /not live quotes, visa rules, health advice or availability guarantees/i);
  assert.match(html, /verify the current fare, baggage rules and availability with the airline/i);
  assert.match(html, /qualified travel-health visit/i);
  assert.match(html, /<span class="en-hero-stat-num">9<\/span>/);
});

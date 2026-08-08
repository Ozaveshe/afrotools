const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const rows = [
  ['planting-calendar', 'ha/noma/kalandar-shuka/index.html', '/ha/noma/kalandar-shuka/'],
  ['fish-farming-nigeria', 'ha/kayan-aiki/ribar-kiwon-kifi/index.html', '/ha/kayan-aiki/ribar-kiwon-kifi/'],
  ['cassava-processing-nigeria', 'ha/kayan-aiki/sarrafa-rogo/index.html', '/ha/kayan-aiki/sarrafa-rogo/'],
  ['crop-yield-nigeria', 'ha/noma/amfanin-gona-najeriya/index.html', '/ha/noma/amfanin-gona-najeriya/'],
  ['fertilizer-nigeria', 'ha/noma/taki-najeriya/index.html', '/ha/noma/taki-najeriya/'],
  ['irrigation-nigeria', 'ha/noma/ban-ruwa-najeriya/index.html', '/ha/noma/ban-ruwa-najeriya/'],
  ['farm-profit-nigeria', 'ha/kayan-aiki/ribar-gona/index.html', '/ha/kayan-aiki/ribar-gona/'],
  ['seed-rate-ng', 'ha/noma/yawan-iri-najeriya/index.html', '/ha/noma/yawan-iri-najeriya/'],
  ['livestock-feed-nigeria', 'ha/kayan-aiki/abincin-dabbobi/index.html', '/ha/kayan-aiki/abincin-dabbobi/'],
  ['commodity-prices', 'ha/kayan-aiki/farashin-kayayyakin-gona/index.html', '/ha/kayan-aiki/farashin-kayayyakin-gona/'],
  ['drought-risk', 'ha/noma/hadarin-fari/index.html', '/ha/noma/hadarin-fari/']
];

test('HA-04 denominator is exact and every route is a native Hausa app', () => {
  assert.equal(rows.length, 11);
  for (const [sourceId, file, route] of rows) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<html[^>]+lang="ha"/i, sourceId);
    assert.match(html, new RegExp('<link rel="canonical" href="https://afrotools\\.com' + route.replaceAll('/', '\\/') + '">'), sourceId);
    assert.match(html, /hreflang="ha"/i, sourceId);
    assert.match(html, /property="og:url"/i, sourceId);
    assert.match(html, /"inLanguage"\s*:\s*"ha"/i, sourceId);
    assert.match(html, /name="geo\.region"/i, sourceId);
    assert.match(html, /name="afrotools-ai-summary"/i, sourceId);
    assert.match(html, /Tushe|Tushen/i, sourceId);
    assert.match(html, /tabbaci/i, sourceId);
    assert.match(html, /iyaka/i, sourceId);
    assert.doesNotMatch(html, /<iframe|window\.location\s*=|Bude cikakken kayan aiki|Shafin Turanci/i, sourceId);
  }
});

test('HA-04 route code uses source-owner engines and exposes local JSON proof', () => {
  const all = rows.map(([, file]) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  for (const engine of ['planting-calendar-engine.js', 'aquaculture-roi-engine.js', 'cassava-processing-engine.js', 'crop-yield-engine.js', 'fertilizer-engine.js', 'irrigation-engine.js', 'farm-profit-engine.js', 'seed-rate-engine.js', 'livestock-feed-engine.js', 'commodity-price-engine.js', 'climate-tools.js']) assert.ok(all.includes(engine), engine);
  for (const route of rows.map(row => row[2])) {
    const hubs = fs.readFileSync(path.join(root, route.includes('/kayan-aiki/') ? 'ha/kayan-aiki/index.html' : 'ha/noma/index.html'), 'utf8');
    assert.ok(hubs.includes('href="' + route + '"'), route);
  }
});

test('HA-04 shared route-local runtime has no network, analytics or URL writes', () => {
  const files = ['ha/assets/ha-04-app-core.js', 'ha/assets/ha-04-parity-decorator.js', 'ha/noma/kalandar-shuka/app.js', 'ha/kayan-aiki/ribar-kiwon-kifi/app.js', 'ha/kayan-aiki/abincin-dabbobi/app.js', 'ha/kayan-aiki/farashin-kayayyakin-gona/app.js', 'ha/noma/hadarin-fari/app.js'];
  const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|gtag\s*\(|dataLayer\.push|history\.(pushState|replaceState)|location\.(assign|replace)|console\.(log|info|error)/);
});

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const apps = [
  ['ride-fare', 'sw/zana/nauli-za-ride-hailing/index.html', 'rideFare'],
  ['boda-income', 'sw/zana/mapato-ya-boda-boda/index.html', 'bodaIncome'],
  ['matatu-fare', 'sw/zana/nauli-za-matatu-danfo-trotro/index.html', 'matatuFare'],
  ['delivery-cost', 'sw/zana/gharama-ya-delivery/index.html', 'deliveryCost'],
  ['car-loan-vs-cash', 'sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/index.html', 'loanVsCash'],
  ['vehicle-registration', 'sw/zana/usajili-na-nyaraka-za-gari/index.html', 'vehicleRegistration'],
  ['roadworthiness', 'sw/zana/ukaguzi-wa-roadworthiness/index.html', 'roadworthiness'],
  ['vehicle-depreciation', 'sw/zana/kushuka-thamani-ya-gari/index.html', 'vehicleDepreciation'],
  ['last-mile-delivery', 'sw/zana/gharama-last-mile-delivery/index.html', 'lastMileDelivery'],
  ['parking-fee', 'sw/zana/ada-za-maegesho/index.html', 'parkingFee'],
  ['route-cost', 'sw/zana/gharama-njia-za-logistics/index.html', 'routeCost'],
  ['toll-calc', 'sw/zana/ada-za-toll/index.html', 'tollCalc'],
  ['vehicle-tracker-roi', 'sw/zana/faida-ya-tracker-ya-gari/index.html', 'trackerRoi']
];

for (const [id, relative, kind] of apps) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const route = `/${relative.replace(/index\.html$/, '')}`;
  assert.match(html, /<html\b[^>]*\blang="sw"/i, `${id}: Swahili owner`);
  assert.match(html, new RegExp(`data-sw-transport-owner="${id}"`), `${id}: exact owner`);
  assert.match(html, new RegExp(`data-sw-transport-kind="${kind}"`), `${id}: exact engine kind`);
  assert.match(html, /assets\/js\/engines\/sw-transport-planning-engine\.js/, `${id}: pure engine`);
  assert.match(html, /assets\/js\/pages\/sw-transport-remaining-controller\.js/, `${id}: scoped controller`);
  assert.doesNotMatch(html, /var SWT_SYMBOLS|function\s+swtCalc/, `${id}: copied inline formula retired`);
  assert.match(html, new RegExp(`rel="canonical" href="https://afrotools\\.com${route}"`), `${id}: canonical`);
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com/tools/${id}/"`), `${id}: English peer`);
  assert.match(html, new RegExp(`assets/img/tools/${id}\\.webp`), `${id}: dedicated artwork`);
  assert.doesNotMatch(html, /assets\/img\/og-default\.png/, `${id}: no generic social artwork`);
  assert.doesNotMatch(html, />(?:Vehicle class|Trips per month|Return multiplier|Base fee|Distance \(km\)|Maintenance allocation|Base nauli|Hours kwa siku)</, `${id}: form labels are native Swahili`);
  assert.ok(fs.existsSync(path.join(root, `assets/img/tools/${id}.webp`)), `${id}: artwork file exists`);
  assert.doesNotMatch(html, /<iframe\b/i, `${id}: no wrapper iframe`);
}

const controller = fs.readFileSync(path.join(root, 'assets/js/pages/sw-transport-remaining-controller.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/, 'local controller has no network or persistence');
assert.match(controller, /aria-live/, 'controller exposes result status');
assert.match(controller, /clear\(outcome\.error\)/, 'invalid inputs clear stale results');

const importHtml = fs.readFileSync(path.join(root, 'sw/zana/gharama-kuagiza-gari/index.html'), 'utf8');
const importRuntime = fs.readFileSync(path.join(root, 'assets/js/pages/swahili-car-import-cost.js'), 'utf8');
assert.match(importHtml, /data-sw-transport-parity="car-import-cost"/);
assert.match(importHtml, /assets\/js\/lib\/car-import-cost-engine\.js/);
assert.match(importHtml, /assets\/js\/pages\/swahili-car-import-cost\.js/);
assert.match(importHtml, /assets\/img\/tools\/car-import-cost\.webp/);
assert.match(importRuntime, /noGate:\s*true/, 'Swahili PDF stays ungated and local');
assert.match(importRuntime, /afrotools-gharama-kuagiza-gari\.pdf/, 'Swahili PDF has a stable local filename');

assert.ok(fs.existsSync(path.join(root, 'assets/js/lib/car-price-intelligence.js')), 'English price intelligence engine exists');
assert.ok(fs.existsSync(path.join(root, 'sw/zana/bei-na-akili-ya-gari/index.html')), 'review-gated Swahili price-intelligence owner exists');

console.log('sw-transport-remaining-parity.test.js passed');

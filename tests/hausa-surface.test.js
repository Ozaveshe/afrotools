#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HA_ROOT = path.join(ROOT, 'ha');
const localeCoverage = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json'), 'utf8'));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const pages = walk(HA_ROOT);
const expectedPages = localeCoverage.records.filter((record) => record.locale === 'ha').length;
assert.ok(expectedPages > 0, 'Hausa coverage registry must contain routes');
assert.strictEqual(pages.length, expectedPages, 'Hausa route inventory must match generated locale coverage');

for (const file of pages) {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(/<html\b[^>]*\blang=["']ha["']/i.test(html), `${relative} must declare Hausa`);
  const isFallbackBridge = html.includes('data-ha-coverage-state="english-fallback"');
  if (isFallbackBridge) {
    assert.ok(html.includes('name="afrotools-locale-coverage" content="english-fallback"'), `${relative} must label its fallback state`);
    assert.ok(/<meta name="robots" content="noindex, follow">/.test(html), `${relative} fallback bridge must stay out of search indexes`);
  } else {
    const hasSharedHausaSurface =
      (html.match(/\/ha\/assets\/ha-improvements\.css/g) || []).length === 1 &&
      (html.match(/\/ha\/assets\/ha-surface\.js/g) || []).length === 1;
    const hasNativeToolSurface =
      /\/assets\/css\/[^"'?]+(?:vip|planner)[^"'?]*\.css/i.test(html) &&
      /\/assets\/js\/pages\/[^"'?]+\.js/i.test(html);
    assert.ok(hasSharedHausaSurface || hasNativeToolSurface, `${relative} must load either the shared Hausa surface or a native localized tool surface`);
  }
  const main = html.match(/<main\b[^>]*\bid=["']([^"']+)["']/i);
  assert.ok(main, `${relative} must expose an addressable main region`);
  assert.ok(new RegExp(`href=["']#${main[1]}["']`, 'i').test(html), `${relative} must expose a skip link to its main region`);
  assert.ok(!html.includes('<div id="navbar-container"></div>'), `${relative} must not retain an inert navbar placeholder`);
  assert.ok(!html.includes('<div id="footer-container"></div>'), `${relative} must not retain an inert footer placeholder`);
}

const runtime = source('ha/assets/ha-surface.js');
[
  '/ha/kayan-aiki/dawo-da-jari/',
  '/ha/kayan-aiki/tazarar-riba/',
  '/ha/kayan-aiki/kalkuletan-paystack/',
  '/ha/kayan-aiki/gwajin-ussd/',
  '/ha/kayan-aiki/waya-ko-banki/',
  '/ha/kayan-aiki/kwatanta-kunshin-intanet/',
  '/ha/noma/kalandar-shuka/',
  '/ha/noma/hadarin-fari/',
  '/ha/kayan-aiki/takardar-albashi/',
  '/ha/kayan-aiki/cajin-banki/'
].forEach((route) => assert.ok(runtime.includes(route), `${route} must have a working Hausa runtime`));
assert.match(runtime, /\["cvUpload","haPdfProbe"\]/, 'local-only file metadata controls must be wired');
assert.ok(runtime.includes('data-ha-copy') && runtime.includes('navigator.clipboard'), 'known inert copy controls must be repaired centrally');

const cookie = source('assets/js/components/cookie-consent.js');
assert.ok(cookie.includes('Izinin kukis') && cookie.includes('Manufar sirri'), 'cookie consent must have Hausa UI copy');

const assistant = source('assets/js/components/site-assistant.js');
assert.ok(assistant.includes('UI_COPY_HA'), 'site assistant must expose Hausa UI copy');
assert.ok(assistant.includes("t.lang === 'ha'") && assistant.includes("startsWith('/ha/')"), 'Hausa assistant directory must prioritize real Hausa routes');

const navbar = source('assets/js/components/navbar.js') + source('assets/js/components/navbar-data.json');
assert.ok(navbar.includes('/ha/noma/kalandar-shuka/'), 'navbar must expose the Hausa planting calendar');
assert.ok(navbar.includes('/ha/kayan-aiki/gwajin-ussd/'), 'navbar must expose the Hausa USSD simulator');

const footer = source('assets/js/components/footer.js');
assert.ok(footer.includes("hrefHa: '/ha/sadarwa/'") && footer.includes("hrefHa: '/ha/lafiya/'") && footer.includes("hrefHa: '/ha/noma/'"), 'Hausa footer must expose telecom, health and agriculture hubs');

const related = source('assets/js/components/related-tools.js');
assert.ok(related.includes('HA_RELATED_FALLBACK') && related.includes('Wata kila za ka kuma so'), 'related tools must stay on localized Hausa routes and copy');

const jambHub = source('ha/jamb/index.html');
assert.ok(!/Jerin routes|Batch na gaba|JAMB pages da ya kamata su biyo baya/.test(jambHub), 'the public JAMB hub must not expose internal localization planning copy');

execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'audit-hausa-visible-copy.js')], { cwd: ROOT, stdio: 'pipe' });
const ledger = JSON.parse(source('reports/hausa-visible-copy-ledger.json'));
assert.strictEqual(ledger.counts.blockers, 0, 'Hausa visible-copy audit must have zero confirmed blockers');

console.log(`Hausa surface validated across ${pages.length} routes with zero confirmed visible-English blockers.`);

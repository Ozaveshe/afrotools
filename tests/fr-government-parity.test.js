'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'government', 'fr-parity-apps.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'government', 'official-sources.json'), 'utf8'));
const localeCoverage = JSON.parse(fs.readFileSync(path.join(root, 'data', 'registry', 'locale-page-coverage.json'), 'utf8'));
const routeMap = require('../assets/js/ai/french-route-map.generated');

const registrySource = fs.readFileSync(path.join(root, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');
const context = {};
vm.runInNewContext(`${registrySource}\nthis.__tools = AFRO_TOOLS;`, context);
const tools = Array.from(context.__tools);
const english = tools.filter((tool) => tool.category === 'government' && (!tool.lang || tool.lang === 'en'));
const englishIds = english.map((tool) => tool.id).sort();
const expectedIds = manifest.apps.map((app) => app.id).sort();

assert.equal(manifest.apps.length, 15, 'manifest denominator must stay exactly 15');
assert.equal(new Set(expectedIds).size, 15, 'manifest ids must be unique');
assert.deepEqual(englishIds, expectedIds, 'French denominator must equal the canonical English Government registry');

const frenchGovernment = tools.filter((tool) => tool.category === 'government' && tool.lang === 'fr');
const ownedSources = new Set(frenchGovernment.map((tool) => tool.sourceId).filter(Boolean));
expectedIds.forEach((id) => assert.ok(ownedSources.has(id), `${id}: missing French Government registry owner`));

manifest.apps.forEach((app) => {
  const routeFile = path.join(root, app.route.replace(/^\/|\/$/g, ''), 'index.html');
  assert.ok(fs.existsSync(routeFile), `${app.id}: French route missing`);
  const html = fs.readFileSync(routeFile, 'utf8');
  const english = sourceManifest.tools.find((tool) => tool.id === app.id);
  assert.ok(english, `${app.id}: official source contract missing`);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${english.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools\\.com${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /hreflang="x-default"/);
  assert.match(html, /property="og:locale" content="fr_FR"/);
  assert.match(html, /"inLanguage":"fr"/);
  assert.match(html, new RegExp(`/assets/img/tools/${app.id}\\.webp`));
  assert.match(html, /id="fg-export-json"/);
  assert.match(html, /id="fg-export-txt"/);
  assert.match(html, /id="fg-import"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aucune IA ni API de calcul externe/i);
  assert.doesNotMatch(html, /localStorage|sessionStorage/);
  assert.equal(routeMap.routes[english.route], app.route, `${app.id}: French AI route mismatch`);
});

const hub = fs.readFileSync(path.join(root, 'fr', 'gouvernement', 'index.html'), 'utf8');
assert.equal((hub.match(/data-government-app=/g) || []).length, 15, 'hub must expose exactly 15 cards');
assert.match(hub, /"numberOfItems":15/);
assert.match(hub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/gouvernement\/"/);
assert.match(hub, /hreflang="x-default" href="https:\/\/afrotools\.com\/government\/"/);
assert.ok(fs.existsSync(path.join(root, 'assets', 'img', 'og-home.png')), 'hub OG artwork must exist');
assert.equal(routeMap.routes['/tools/work-permit-cost/'], '/fr/tools/cout-permis-travail/');
const permitCoverage = localeCoverage.records.find((record) => record.route === '/fr/tools/cout-permis-travail/');
assert.ok(permitCoverage, 'canonical French Work Permit route requires locale coverage ownership');
assert.equal(permitCoverage.state, 'native');
assert.equal(permitCoverage.sourceOwner, 'data/government/fr-parity-apps.json');
assert.equal(permitCoverage.equivalentRoute, '/tools/work-permit-cost/');
assert.equal(permitCoverage.indexableEligible, true);
assert.match(routeMap.source, /data\/registry\/locale-page-coverage\.json/);
assert.equal(routeMap.report.overrideRoutes, undefined);
assert.ok(!fs.existsSync(path.join(root, 'data', 'ai', 'french-route-overrides.json')), 'one-route AI override architecture must not exist');

const controller = fs.readFileSync(path.join(root, 'assets', 'js', 'pages', 'fr-government-parity-controller.js'), 'utf8');
const routeMapBuilder = fs.readFileSync(path.join(root, 'scripts', 'lib', 'french-ai-route-map.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'css', 'fr-government-parity.css'), 'utf8');
const fetchTargets = Array.from(controller.matchAll(/fetch\('([^']+)'/g), (match) => match[1]);
assert.ok(fetchTargets.length >= 3);
fetchTargets.forEach((target) => assert.ok(target.startsWith('/data/'), `external fetch forbidden: ${target}`));
assert.doesNotMatch(controller, /localStorage|sessionStorage|console\./);
assert.match(controller, /evaluateSourceFreshness/);
assert.match(controller, /evaluateElectionFreshness/);
assert.doesNotMatch(routeMapBuilder, /OVERRIDES_PATH|overrideRoutes/);
assert.match(styles, /data-theme="dark"/);
assert.match(styles, /prefers-reduced-motion/);

console.log('French Government parity contract verified: exact 15/15 canonical apps.');

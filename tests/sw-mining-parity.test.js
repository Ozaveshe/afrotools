'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const manifest = require('../data/localization/sw-mining-parity-manifest.json');
const engine = require('../assets/js/engines/fr-mining-parity');

const ROOT = path.resolve(__dirname, '..');
const IDS = ['diamond-valuation','oil-well-production','oil-gas-revenue','mining-license-fee','mining-royalty','artisanal-mining-income'];
const byId = Object.fromEntries(manifest.apps.map((app) => [app.id, app]));

function read(route) { return fs.readFileSync(path.join(ROOT, route.replace(/^\//,''), 'index.html'),'utf8'); }
function close(actual, expected, label) { assert.ok(Number.isFinite(actual), `${label}: finite`); assert.ok(Math.abs(actual-expected) <= Math.max(1e-8,Math.abs(expected)*1e-10), `${label}: ${actual} ≈ ${expected}`); }
function alternates(html) { return Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m)=>[m[1],m[2]])); }

test('manifest freezes exactly the six Mining owners and no other category', () => {
  assert.equal(manifest.coordinatorBase,'8354e321ff34caf60a33a3393cd0dcddfb00c023');
  assert.deepEqual(manifest.apps.map((app)=>app.id),IDS);
  assert.equal(new Set(manifest.apps.map((app)=>app.swRoute)).size,6);
  for (const app of manifest.apps) {
    assert.equal(app.sourceOwner,`tools/${app.id}/index.html`);
    assert.ok(fs.existsSync(path.join(ROOT,app.sourceOwner)));
    assert.ok(app.currencyBoundary && app.units.length);
  }
});

test('shared DOM-free engine reproduces every English-owner oracle with finite values', () => {
  for (const app of manifest.apps) {
    let result;
    if (app.id === 'mining-license-fee') {
      const data = require('../data/mining/mining-fees.js');
      const country = data.countries[app.oracle.inputs.country];
      result = engine.licence(app.oracle.inputs,country,country.licences[app.oracle.inputs.licence]);
    } else if (app.id === 'mining-royalty') {
      const data = require('../data/mining/mining-royalties.js');
      result = engine.royalty(app.oracle.inputs,data.countries[app.oracle.inputs.country]);
    } else result = engine[app.engineMethod](app.oracle.inputs);
    assert.equal(result.ok,true,app.id);
    for (const [key,expected] of Object.entries(app.oracle.expected)) close(result[key],expected,`${app.id}.${key}`);
    assert.doesNotMatch(JSON.stringify(result),/NaN|Infinity|undefined/);
  }
});

test('route-specific invalid and boundary states fail closed', () => {
  assert.deepEqual(engine.diamond({...byId['diamond-valuation'].oracle.inputs,base:0}),{ok:false,field:'base',code:'source_price'});
  assert.deepEqual(engine.oilWell({...byId['oil-well-production'].oracle.inputs,pe:2000,pwf:2000}),{ok:false,field:'pe',code:'pressure_order'});
  assert.deepEqual(engine.oilGas({vol:null,price:null,gross:null,roy:10,costs:0,ceiling:60,conshare:40,tax:30}),{ok:false,field:'gross',code:'gross_or_volume_price'});
  const fees = require('../data/mining/mining-fees.js');
  assert.deepEqual(engine.licence({...byId['mining-license-fee'].oracle.inputs,annual:null},fees.countries.NG,fees.countries.NG.licences.exploration),{ok:false,field:'annual',code:'missing_fee'});
  const royalties = require('../data/mining/mining-royalties.js');
  assert.deepEqual(engine.royalty({gross:1000000,rate:null},royalties.countries.TZ),{ok:false,field:'rate',code:'missing_rate'});
  assert.deepEqual(engine.artisanal({...byId['artisanal-mining-income'].oracle.inputs,team:0}),{ok:false,field:'team',code:'team'});
  assert.equal(engine.oilGas({...byId['oil-gas-revenue'].oracle.inputs,roy:100}).ok,true,'100% boundary is explicit and finite');
});

test('six generated routes have native metadata, reciprocal hreflang, artwork, schema and product fields', () => {
  for (const app of manifest.apps) {
    const html = read(app.swRoute);
    assert.match(html,/<html\b[^>]*\blang="sw"[^>]*>/);
    assert.match(html,new RegExp(`<body[^>]+data-mining-tool="${app.id}"`));
    assert.match(html,new RegExp(`https://afrotools.com/assets/img/tools/${app.imageId}\\.webp`));
    assert.ok(fs.statSync(path.join(ROOT,'assets/img/tools',`${app.imageId}.webp`)).size > 50000);
    assert.match(html,/"@type":"WebApplication"/); assert.match(html,/"@type":"FAQPage"/); assert.match(html,/"inLanguage":"sw"/);
    assert.deepEqual(alternates(html),{sw:`https://afrotools.com${app.swRoute}`,en:`https://afrotools.com${app.englishRoute}`,fr:`https://afrotools.com${app.frenchRoute}`,'x-default':`https://afrotools.com${app.englishRoute}`});
    for (const route of [app.englishRoute,app.frenchRoute]) assert.equal(alternates(read(route)).sw,`https://afrotools.com${app.swRoute}`,`${route} reciprocal sw`);
    assert.match(html,/Chanzo, tarehe na uhakika/); assert.match(html,/Makadirio ya kupanga tu/); assert.match(html,/hakuna bei hai|Hakuna bei hai|bei hai/);
  }
});

test('maintained source registry exposes exactly these six Mining routes', () => {
  const registry = fs.readFileSync(path.join(ROOT,'assets/js/components/tool-registry.js'),'utf8');
  for (const app of manifest.apps) {
    assert.equal((registry.match(new RegExp(app.swRoute.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,`${app.id}: source registry once`);
  }
});

test('controller freezes exports, keeps work local and owns the control contrast contract', () => {
  const source = fs.readFileSync(path.join(ROOT,'assets/js/pages/sw-mining-parity.js'),'utf8');
  const css = fs.readFileSync(path.join(ROOT,'assets/css/sw-mining-parity.css'),'utf8');
  const browser = fs.readFileSync(path.join(ROOT,'tests/e2e/sw-mining-parity.spec.js'),'utf8');
  assert.match(source,/clearResult\('Maingizo yamebadilika/);
  assert.match(source,/lastReport = null/); assert.match(source,/button\.disabled = true/);
  assert.match(source,/Object\.freeze/); assert.match(source,/form\.requestSubmit\(\)/);
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon/);
  assert.match(source,/aria-disabled/); assert.match(source,/ai-consent/);
  for (const id of ['export-json','export-csv','export-pdf','import-json']) assert.match(source,new RegExp(id));
  assert.match(css,/--sw-control-border:#64748b/); assert.match(css,/--sw-control-focus:#2563eb/);
  assert.match(css,/input,.+select,.+textarea\{[^}]*border:2px solid var\(--sw-control-border\)!important/);
  assert.match(css,/html\[data-theme=dark\] body\.sw-mining-page .sw-mining-field input/);
  assert.match(browser,/assertControlContrast/); assert.match(browser,/normal\.boundary/); assert.match(browser,/focused\.focus/);
  assert.match(browser,/toBeGreaterThanOrEqual\(3\)/); assert.match(browser,/toBeGreaterThanOrEqual\(4\.5\)/);
});

test('maintained generators are current', () => {
  for (const script of ['scripts/generate-sw-mining-parity.js','scripts/generate-fr-mining-parity.js']) {
    const run = spawnSync(process.execPath,[script,'--check'],{cwd:ROOT,encoding:'utf8'});
    assert.equal(run.status,0,run.stderr||run.stdout);
  }
});

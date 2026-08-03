'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const pdfParse = require('pdf-parse');
const pdfJs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');
const { jsPDF } = require('../assets/vendor/jspdf/jspdf.umd.min.js');
const engine = require('../assets/js/engines/property-assumption');
const manifest = require('../data/registry/sw-property-construction-planning.json');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const acceptance = require('../data/audits/swahili-free-app-acceptance.json');

const ROOT = path.resolve(__dirname, '..');
const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const hub = fs.readFileSync(path.join(ROOT, 'sw/nyumba-na-ardhi/index.html'), 'utf8');
const routeFile = (route) => path.join(ROOT, route.replace(/^\//, ''), 'index.html');
const html = (row) => fs.readFileSync(routeFile(row.swahiliRoute), 'utf8');
const inputTag = (document, name) => document.match(new RegExp(`<input[^>]+name=["']${name}["'][^>]*>`, 'i'))?.[0] || '';
function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}(?:=["']([^"']*)["'])?(?=\\s|>|/)`, 'i'));
  return match ? (match[1] ?? true) : null;
}

test('scope reconciles to the current central ledger without counting unaccepted sibling candidates', () => {
  const denominator = inventory.rows.filter((row) => row.category === 'Mortgage & Property').length;
  const accepted = acceptance.entries.filter((row) => row.categoryKey === 'legal' && row.status === 'accepted');
  const acceptedIds = new Set(accepted.map((row) => row.englishId));
  assert.equal(denominator, 66);
  assert.equal(accepted.length, 15);
  assert.equal(acceptedIds.has('building-materials'), true);
  assert.equal(acceptedIds.has('construction-budget'), true);
  assert.equal(denominator - accepted.length, 51);
});

test('source owner has exactly the two non-overlapping construction-planning apps', () => {
  assert.equal(manifest.owner, 'scripts/build-sw-property-construction-planning-parity.js');
  assert.equal(manifest.count, 2);
  assert.deepEqual(manifest.rows.map((row) => row.englishId), ['building-materials', 'construction-budget']);
});

test('all English min, max, step, required and default attributes are exact in the DOM', () => {
  for (const row of manifest.rows) {
    const owner = fs.readFileSync(routeFile(row.englishRoute), 'utf8');
    const target = html(row);
    for (const field of row.fields) {
      const sourceTag = inputTag(owner, field.name);
      const targetTag = inputTag(target, field.name);
      assert.ok(sourceTag && targetTag, `${row.englishId}:${field.name}`);
      assert.equal(attr(targetTag, 'type'), attr(sourceTag, 'type') || 'text');
      for (const name of ['min', 'max', 'step', 'required']) {
        assert.equal(attr(targetTag, name), attr(sourceTag, name), `${row.englishId}:${field.name}:${name}`);
      }
      if (field.type === 'number') {
        assert.equal(attr(sourceTag, 'value') || '', '', `${row.englishId}:${field.name}:English blank`);
        assert.equal(attr(targetTag, 'value') || '', '', `${row.englishId}:${field.name}:Swahili blank`);
      } else {
        assert.equal(attr(sourceTag, 'value'), field.sourceDefault);
        assert.equal(attr(targetTag, 'value'), field.initialValue);
      }
    }
  }
});

test('unchanged shared English engine returns the exact fixture for both routes', () => {
  for (const row of manifest.rows) {
    const result = engine.calculate(row.englishId, row.fixture);
    assert.equal(result.ok, true);
    assert.equal(result.total, 1155);
    assert.equal(result.total, row.expected.total);
  }
});

test('shared engine fails closed at the exact input boundaries', () => {
  for (const id of ['building-materials', 'construction-budget']) {
    assert.equal(engine.calculate(id, { quantity: 0, unitCost: 100, fixed: 50, contingency: 10 }).ok, false);
    assert.equal(engine.calculate(id, { quantity: 10, unitCost: 0, fixed: 50, contingency: 10 }).ok, false);
    assert.equal(engine.calculate(id, { quantity: 10, unitCost: 100, fixed: -1, contingency: 10 }).ok, false);
    assert.equal(engine.calculate(id, { quantity: 10, unitCost: 100, fixed: 50, contingency: 101 }).ok, false);
  }
});

test('accessible official Stats SA source is South-Africa context only and supplies no unit prices', () => {
  for (const row of manifest.rows) {
    assert.equal(row.source.url, 'https://www.statssa.gov.za/?page_id=2528');
    assert.equal(row.source.availability, 'available');
    assert.equal(row.source.checkedAt, '2026-08-02');
    assert.equal(row.source.role, 'official-south-africa-index-context-only');
    assert.equal(row.source.suppliesUnitPrices, false);
    assert.match(row.source.jurisdiction, /Afrika Kusini pekee/);
    assert.match(html(row), /Stats SA haitoi bei ya kipimo, kiasi, BOQ, nukuu, sarafu au matokeo ya zana hii/);
    assert.match(html(row), /makisio ya kupanga, si BOQ rasmi, nukuu, zabuni au ushauri wa kitaalamu/);
  }
});

test('both routes are native Swahili products with exactly five local exports', () => {
  for (const row of manifest.rows) {
    const page = html(row);
    assert.match(page, /<html\b[^>]*\blang="sw"[^>]*>/);
    assert.match(page, /data-sw-property-construction-app/);
    assert.doesNotMatch(page, /iframe|English fallback|translated shell/i);
    for (const action of ['copy', 'txt', 'json', 'pdf', 'print']) {
      assert.equal((page.match(new RegExp(`data-action="${action}"`, 'g')) || []).length, 1);
    }
  }
});

test('owned runtime is local-only without storage, AI or network mutations', () => {
  const runtime = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-property-construction-planning.js'), 'utf8');
  assert.doesNotMatch(runtime, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|WebSocket/);
  for (const row of manifest.rows) {
    const page = html(row);
    assert.match(page, /Hakuna akaunti, barua pepe, AI au hifadhi ya kivinjari/i);
    assert.match(page, /assets\/js\/supabase\.min\.js/);
  }
});

test('registry and property hub discover each exact Swahili route once', () => {
  for (const row of manifest.rows) {
    assert.equal((registry.match(new RegExp(`href: ["']${row.swahiliRoute}["']`, 'g')) || []).length, 1);
    assert.match(registry, new RegExp(`sourceId: ["']${row.englishId}["']`));
    assert.equal((hub.match(new RegExp(`href="${row.swahiliRoute}"`, 'g')) || []).length, 1);
  }
});

test('canonical, OG, artwork and reciprocal EN/FR hreflang are exact', () => {
  for (const row of manifest.rows) {
    const page = html(row);
    const canonical = `https://afrotools.com${row.swahiliRoute}`;
    assert.match(page, new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.match(page, new RegExp(`<meta property="og:url" content="${canonical}">`));
    const artwork = path.join(ROOT, `assets/img/tools/${row.englishId}.webp`);
    assert.ok(fs.statSync(artwork).size > 1000);
    for (const counterpart of [row.englishRoute, row.frenchRoute]) {
      assert.match(fs.readFileSync(routeFile(counterpart), 'utf8'), new RegExp(`hreflang="sw" href="${canonical}"`));
    }
  }
});

test('canonical AI catalog covers both English owners without generated Swahili mutation', () => {
  const catalog = fs.readFileSync(path.join(ROOT, 'data/ai/tool-catalog-pack.json'), 'utf8');
  for (const row of manifest.rows) {
    assert.match(catalog, new RegExp(`"id": "${row.englishId}"`));
    assert.match(catalog, new RegExp(`"route": "${row.englishRoute}"`));
  }
});

test('repo-proven jsPDF output parses and wrapped text stays within page bounds', async () => {
  const document = new jsPDF({ unit: 'pt', format: [595, 842], compress: false });
  let y = 52;
  const line = manifest.rows[0].source.jurisdiction.repeat(6).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const wrapped of document.splitTextToSize(line, 490)) { document.text(wrapped, 48, y); y += 14; }
  const bytes = new Uint8Array(document.output('arraybuffer'));
  const parsed = await pdfParse(new Uint8Array(bytes));
  assert.equal(parsed.numpages, 1);
  const reopened = await pdfJs.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await reopened.getPage(1);
  const viewport = page.getViewport(1);
  const content = await page.getTextContent();
  assert.ok(content.items.length > 3);
  for (const item of content.items) {
    assert.ok(item.transform[4] >= 48);
    assert.ok(item.transform[4] + item.width <= viewport.width - 48 + 0.01);
    assert.ok(item.transform[5] >= 48 && item.transform[5] <= viewport.height - 48);
  }
  if (reopened.destroy) await reopened.destroy();
});

test('source generator is idempotent with exact two-route ownership', () => {
  const output = execFileSync(process.execPath, ['scripts/build-sw-property-construction-planning-parity.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(output, /2\/2; 0 changed outputs/);
  for (const row of manifest.rows) assert.match(html(row), /Generated by scripts\/build-sw-property-construction-planning-parity\.js/);
});

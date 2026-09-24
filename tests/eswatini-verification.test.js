const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildRegistry } = require('../scripts/build-source-registry');

const root = path.resolve(__dirname, '..');
const owner = fs.readFileSync(path.join(root, 'scripts/apply-tool-verification.js'), 'utf8');
const context = { require, __dirname: path.join(root, 'scripts'), process: { argv: [] }, console, module: { exports: {} } };
vm.createContext(context);
vm.runInContext(owner, context);
vm.runInContext('this.api = { applyEswatiniPayeEvidence, buildPanel };', context);

test('reviewed Eswatini evidence replaces stale records and survives repeated application', () => {
  const entry = JSON.parse(fs.readFileSync(path.join(root, 'data/tool-verification.json'), 'utf8')).tools['sz-paye'];
  entry.source_urls = ['https://www.era.org.sz'];
  entry.source_titles = ['old authority'];
  entry.law_or_version = 'Last verified: July 2025 · Source: ERS (ers';
  const manifest = { tools: { 'sz-paye': entry, untouched: { marker: 'preserve' } } };
  context.api.applyEswatiniPayeEvidence(manifest);
  const first = JSON.stringify(manifest);
  context.api.applyEswatiniPayeEvidence(manifest);
  assert.equal(JSON.stringify(manifest), first);
  assert.equal(manifest.tools.untouched.marker, 'preserve');
  assert.equal(entry.source_urls[0], 'https://ers.org.sz/IncomeTax/RatesandThres');
  assert.ok(entry.source_urls.includes('https://ers.org.sz/IncomeForms'));
  assert.ok(!entry.source_urls.some(url => url.includes('era.org.sz')));
  const en = context.api.buildPanel(entry, 'en');
  const fr = context.api.buildPanel(entry, 'fr');
  assert.match(en, /additional E2,700/);
  assert.match(en, /part-year employment/);
  assert.match(fr, /supplémentaire de 2 700 E/);
  assert.match(fr, /une partie de l’année/);
  assert.match(fr, /classeur officiel de calcul/);
  assert.doesNotMatch(fr, /The current estimate|The ERS payroll workbook|reviewed 16 September/);
});

test('compact source badge distinguishes reviewed evidence from unresolved formula review', () => {
  const built = buildRegistry('2026-09-16');
  const source = built.registry.sources.find(item => item.id === 'paye-sz-source');
  assert.equal(source.sourceUrl, 'https://ers.org.sz/IncomeTax/RatesandThres');
  assert.equal(source.lastReviewedAt, '2026-09-16');
  assert.match(source.notes, /does not certify the calculation engine/);
  assert.match(source.notes, /Formula status: review-required/);
  assert.match(source.displayDisclaimer, /general rebate only/);
});

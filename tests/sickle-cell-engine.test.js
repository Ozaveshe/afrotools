const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require(path.join(ROOT, 'tools', 'sickle-cell', 'sickle-cell-engine.js'));
const HTML = fs.readFileSync(path.join(ROOT, 'tools', 'sickle-cell', 'index.html'), 'utf8');
const CONTEXT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ai', 'tool-context', 'sickle-cell.json'), 'utf8'));

test('AS x AS preserves the exact independent per-pregnancy Punnett distribution', () => {
  const result = engine.calculate('AS', 'AS');
  assert.equal(result.ok, true);
  assert.deepEqual(result.cells, ['AA', 'AS', 'AS', 'SS']);
  assert.deepEqual(result.outcomes.map(({ genotype, probability }) => ({ genotype, probability })), [
    { genotype: 'AA', probability: 25 },
    { genotype: 'AS', probability: 50 },
    { genotype: 'SS', probability: 25 }
  ]);
  assert.equal(result.totalProbability, 100);
});

test('selection order does not change inheritance outcomes', () => {
  const left = engine.calculate('AS', 'AC');
  const right = engine.calculate('AC', 'AS');
  assert.deepEqual(left.outcomes, right.outcomes);
  assert.deepEqual(left.outcomes.map(item => item.genotype), ['AA', 'AS', 'AC', 'SC']);
});

test('SS x CC and SC x SC retain correct canonical allele ordering', () => {
  assert.deepEqual(engine.calculate('SS', 'CC').outcomes.map(item => [item.genotype, item.probability]), [['SC', 100]]);
  assert.deepEqual(engine.calculate('SC', 'SC').outcomes.map(item => [item.genotype, item.probability]), [
    ['SS', 25], ['SC', 50], ['CC', 25]
  ]);
});

test('all supported pairs total 100 percent and unsupported notation fails closed', () => {
  for (const first of engine.validGenotypes) {
    for (const second of engine.validGenotypes) {
      assert.equal(engine.calculate(first, second).totalProbability, 100, `${first} x ${second}`);
    }
  }
  assert.equal(engine.calculate('', 'AS').ok, false);
  assert.equal(engine.calculate('SA', 'AS').ok, false);
  assert.equal(engine.calculate('Sβ', 'AS').ok, false);
});

test('labels distinguish trait, sickle cell disease, and haemoglobin C disease', () => {
  assert.equal(engine.labels.AS, 'Sickle cell trait');
  assert.match(engine.categories.SS, /Sickle cell disease/);
  assert.match(engine.categories.SC, /Sickle cell disease/);
  assert.equal(engine.labels.CC, 'HbCC disease');
  assert.doesNotMatch(engine.categories.CC, /sickle cell disease/i);
});

test('page removes verdict, relationship, stale burden, price and treatment claims', () => {
  assert.doesNotMatch(HTML, /Check Compatibility|compat-badge|Compatible|Proceed with Caution|High Risk|EXTREME RISK|strongly advised against/i);
  assert.doesNotMatch(HTML, /before marriage|avoid marriage|serious relationship|premarital|pre-marital/i);
  assert.doesNotMatch(HTML, /75%|25-30% of population|NGN 1,500|150,000 babies|bone marrow transplant|hydroxyurea|gene therapy/i);
  assert.doesNotMatch(HTML, /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|chart\.js|health-workflow\.js|email-gated/i);
  assert.match(HTML, /do not diagnose anyone, predict one child, or direct relationship or reproductive decisions/i);
});

test('page exposes testing, newborn screening, counselling, privacy and local export boundaries', () => {
  assert.match(HTML, /laboratory results confirmed or interpreted by a qualified clinician/i);
  assert.match(HTML, /A screen can identify a baby/i);
  assert.match(HTML, /confirmatory testing and clinical follow-up/i);
  assert.match(HTML, /genetic counsellor/i);
  assert.match(HTML, /does not store the selected genotypes/i);
  assert.match(HTML, /Print \/ Save PDF/);
  assert.match(HTML, /Download text summary/);
  assert.match(HTML, /Sources checked 26 July 2026/);
});

test('SEO, JSON-LD and AI context are truthful and route-correct', () => {
  assert.equal((HTML.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.equal((HTML.match(/<\/main>/g) || []).length, 1);
  assert.match(HTML, /<title>Sickle Cell Inheritance Explorer \| AfroTools<\/title>/);
  assert.match(HTML, /<link rel="canonical" href="https:\/\/afrotools\.com\/tools\/sickle-cell\/">/);
  assert.match(HTML, /<meta property="article:modified_time" content="2026-07-26">/);
  const blocks = Array.from(HTML.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), match => JSON.parse(match[1]));
  assert.deepEqual(blocks.map(block => block['@type']), ['WebApplication', 'BreadcrumbList', 'FAQPage']);
  assert.equal(CONTEXT.toolKey, 'sickle-cell');
  assert.match(CONTEXT.staticText, /must not label people or relationships compatible, safe, dangerous/i);
});

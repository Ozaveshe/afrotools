'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('the English/French polish registry preserves the accepted release boundary', () => {
  const registry = JSON.parse(read('data/audits/en-fr-ui-polish-pattern-registry.json'));

  assert.equal(registry.programme, 'english-french-final-design-polish');
  assert.equal(registry.status, 'release-candidate');
  assert.equal(registry.implementationGate, 'swahili-parity-accepted');
  assert.equal(registry.baseline.commit, '14ebe624b4d77ac8fa847c48d1083452bfb290cc');
  assert.deepEqual(registry.locales, ['en', 'fr']);

  const patterns = new Map(registry.patterns.map(pattern => [pattern.id, pattern]));
  for (const id of [
    'decorative-accent-rail',
    'gradient-or-glow-decoration',
    'badge-or-pill-overuse',
    'decorative-emoji-flag-or-icon',
    'fake-affordance'
  ]) {
    assert.ok(patterns.has(id), `missing design-contract pattern: ${id}`);
  }
  assert.equal(patterns.get('fake-affordance').allowedContexts.length, 0);
  assert.ok(patterns.get('gradient-or-glow-decoration').allowedContexts.includes('data-visualization'));
});

test('shared CSS ends with a calm, accessible task-first override contract', () => {
  for (const relativePath of ['assets/css/global.css', 'assets/css/design-system.css']) {
    const css = read(relativePath);
    const marker = css.lastIndexOf('Shared task-first controls and surfaces');
    assert.notEqual(marker, -1, `${relativePath} is missing the shared polish contract`);

    const contract = css.slice(marker);
    assert.match(contract, /min-height:\s*var\(--control-height,\s*44px\)/);
    assert.match(contract, /background:\s*var\(--color-primary\)/);
    assert.match(contract, /box-shadow:\s*none/);
    assert.match(contract, /border:\s*1px solid var\(--color-border\)/);
    assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  }
});

test('Kenya stamp-duty styling uses repository typography and no decorative rails or gradients', () => {
  const css = read('assets/css/ke-stamp-duty-vip.css');

  assert.match(css, /var\(--font-body,\s*["']DM Sans["']/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial)-gradient\s*\(/i);
  assert.doesNotMatch(css, /border-(?:inline-start|left|top)\s*:\s*(?:[2-9]|\d{2,})px/i);
  assert.doesNotMatch(css, /text-transform\s*:\s*uppercase/i);
});

test('related-tools is locale-aware and uses calm metadata with a text fallback', () => {
  const source = read('assets/js/components/related-tools.js');

  assert.match(source, /const isFrench = pageLanguage\.startsWith\('fr'\)/);
  assert.match(source, /Ces outils peuvent aussi vous aider/);
  assert.match(source, /Ouvrir l[’']outil/);
  assert.match(source, /Voir tous les outils/);
  assert.match(source, /class="card-monogram"/);
  assert.match(source, /class="category-meta"/);
  assert.match(source, /font-family:\s*'DM Sans',\s*system-ui/);
  assert.match(source, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(source, /class="card-emoji"/);
  assert.doesNotMatch(source, /background:\s*\$\{cs\.gradient\}/);
});

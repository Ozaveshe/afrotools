'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { refreshNigeriaRestore } = require('../scripts/lib/localized-paye-save-readiness');
const { apps, normalizeHubHtml, injectParityRuntime } = require('../scripts/build-swahili-document-pdf-parity');

const root = path.resolve(__dirname, '..');
const english = '<script>function invalidateSavedScenarioResult(){ return "fresh"; }</script>';
const legacyHausa = `<html lang="ha"><head></head><body><script>
var replacements = {
    'Load': 'Loda',
    'Delete': 'Goge'
};
function localizeText(node) {
  if (!node) return;
  if (node.nodeType === 3) {
    var value = node.nodeValue;
    Object.keys(replacements).forEach(function(key){
      if (value.indexOf(key) !== -1) value = value.split(key).join(replacements[key]);
    });
    if (value !== node.nodeValue) node.nodeValue = value;
    return;
  }
}
function setCalcMode() {}
</script></body></html>`;

test('Hausa regeneration translates saved status without replacing partial words', () => {
  const repaired = refreshNigeriaRestore(legacyHausa, english);
  const context = vm.createContext({});
  vm.runInContext(repaired.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  for (const [input, expected] of [
    ['Loaded saved scenario.', 'An loda lissafin da aka ajiye.'],
    ['  Loaded saved scenario.  ', '  An loda lissafin da aka ajiye.  '],
    ['Load', 'Loda'],
    ['Delete', 'Goge'],
    ['Loading saved scenario.', 'Loading saved scenario.'],
    ['Please Load a scenario', 'Please Load a scenario'],
    ['toString', 'toString']
  ]) {
    const node = { nodeType: 3, nodeValue: input };
    context.localizeText(node);
    assert.equal(node.nodeValue, expected);
  }
  assert.equal(refreshNigeriaRestore(repaired, english), repaired);
});

test('Hausa refresh rejects ambiguous or unexpected localization owners', () => {
  const repaired = refreshNigeriaRestore(legacyHausa, english);
  assert.throws(() => refreshNigeriaRestore(repaired.replace('An loda lissafin da aka ajiye.', 'Unreviewed text'), english), /Unexpected Hausa saved-status/);
  assert.throws(() => refreshNigeriaRestore(legacyHausa.replace('Object.keys(replacements).forEach', 'Object.values(replacements).forEach'), english), /Unexpected Hausa text translation guard/);
  assert.throws(() => refreshNigeriaRestore(legacyHausa.replace('</body>', "<script>var replacements={'Load':'Loda'};</script></body>"), english), /Expected one Hausa/);
});

test('French restore remains independent of the Hausa translation map', () => {
  const french = '<html lang="fr"><script>function setCalcMode() {}</script></html>';
  const repaired = refreshNigeriaRestore(french, english);
  assert.ok(repaired.includes('function invalidateSavedScenarioResult()'));
  assert.ok(!repaired.includes('An loda'));
  assert.equal(refreshNigeriaRestore(repaired, english), repaired);
});

const styleCount = html => (html.match(/<link\b[^>]*\bhref=["']\/assets\/css\/sw-document-pdf-a11y\.css(?:[?#][^"']*)?["'][^>]*>/gi) || []).length;

test('Swahili hub regeneration removes duplicate versioned styles and preserves unrelated assets', () => {
  const source = fs.readFileSync(path.join(root, 'sw/hati-na-pdf/index.html'), 'utf8');
  const unowned = '<link rel="stylesheet" href="/assets/css/unrelated-owner.css?v=1234">';
  const duplicate = "<link data-test='owned' href='/assets/css/sw-document-pdf-a11y.css?v=1234#cache' rel='stylesheet'>";
  const damaged = source.replace('</head>', duplicate + duplicate + unowned + '</head>');
  const repaired = normalizeHubHtml(damaged);
  assert.equal(styleCount(repaired), 1);
  assert.ok(repaired.includes(unowned));
  assert.equal(normalizeHubHtml(repaired), repaired);
  const stamped = repaired.replace('href="/assets/css/sw-document-pdf-a11y.css"', 'href="/assets/css/sw-document-pdf-a11y.css?v=abcdef"');
  assert.equal(normalizeHubHtml(stamped), repaired);
});

test('Swahili document runtime injection stays idempotent across all owned routes and cache stamps', () => {
  for (const app of apps) {
    const before = fs.readFileSync(path.join(root, app.swahiliFile), 'utf8');
    const first = injectParityRuntime(before, app);
    assert.equal(styleCount(first), 1, app.id);
    assert.equal(injectParityRuntime(first, app), first, app.id);
    const stamped = first.replace(/((?:src|href)="\/assets\/(?:js\/pages\/sw-document-pdf-[^"?]+\.js|css\/sw-document-pdf-a11y\.css))"/g, '$1?v=abc123"');
    assert.equal(injectParityRuntime(stamped, app), first, app.id + ' cache stamp');
    for (const name of ['lexicon', 'localizer', 'integrity']) {
      assert.equal((first.match(new RegExp('/assets/js/pages/sw-document-pdf-' + name + '\\.js', 'g')) || []).length, 1, app.id + ' ' + name);
    }
  }
});

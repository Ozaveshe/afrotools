const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/pages/sw-document-pdf-localizer.js'), 'utf8');
const lexicon = fs.readFileSync(path.join(__dirname, '../assets/js/pages/sw-document-pdf-lexicon.js'), 'utf8');
function load(phrases, fullLexicon = false) {
  const context = vm.createContext({ module: { exports: {} }, AfroTools: { SwahiliDocumentPdfPhrases: phrases || {} } });
  if (fullLexicon) vm.runInContext(lexicon, context);
  vm.runInContext(source, context);
  return context.module.exports;
}

test('real lexicon literal Page $1 never turns partial Page 2 into a terminal object', () => {
  const api = load(null, true);
  assert.equal(api.translate('Page 2'), 'Page 2');
  assert.equal(api.translate('Page 1'), api.phrases['Page 1']);
  assert.equal(api.translate('prefix Page $1 suffix'), 'prefix ' + api.phrases['Page $1'] + ' suffix');
});
for (const reversed of [false, true]) {
  test(`terminal phrase and literal dollar continuation preserve both values, reversed=${reversed}`, () => {
    let rows = [['Example', 'Msingi'], ['Example$1', 'Nyongeza']];
    if (reversed) rows = rows.reverse();
    const api = load(Object.fromEntries(rows));
    assert.equal(api.translate('x Example y'), 'x Msingi y');
    assert.equal(api.translate('x Example$1 y'), 'x Nyongeza y');
    assert.equal(api.translate('x Example$2 y'), 'x Msingi$2 y');
  });
  test(`spaced and adjacent dollar keys remain literal, reversed=${reversed}`, () => {
    let rows = [['Example', 'Msingi'], ['Example $1', 'Moja'], ['Example $1$2', 'Mbili']];
    if (reversed) rows = rows.reverse();
    const api = load(Object.fromEntries(rows));
    assert.equal(api.translate('x Example $1 y'), 'x Moja y');
    assert.equal(api.translate('x Example $1$2 y'), 'x Mbili y');
    assert.equal(api.translate('x Example $1$3 y'), 'x Moja$3 y');
    assert.equal(api.translate('x Example $9 y'), 'x Msingi $9 y');
  });
}
test('ordinary longest matching phrases stay deterministic', () => {
  const api = load({ Example: 'Msingi', 'Example long': 'Ndefu', 'Example longer': 'Ndefu zaidi' });
  assert.equal(api.translate('x Example longer! Example long! Example!'), 'x Ndefu zaidi! Ndefu! Msingi!');
});
test('exact dictionary mapping and unknown strings retain existing semantics', () => {
  const api = load({ 'Example $1': 'Alama $1', 'Exact phrase': 'Sahihi' });
  assert.equal(api.translate('Example $1'), 'Alama $1');
  assert.equal(api.translate('  Exact phrase  '), '  Sahihi  ');
  assert.equal(api.translate('filename-$9.pdf'), 'filename-$9.pdf');
});

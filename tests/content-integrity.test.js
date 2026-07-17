'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const api = require('../scripts/lib/content-integrity');

const FIXTURES = path.join(__dirname, 'fixtures/content-integrity');
const read = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8');
const rules = (rows) => new Set(rows.map((row) => row.ruleId));

let findings = api.auditMarkdown(read('raw-css.md'), { file: 'content/articles/raw-css.md' });
assert.ok(rules(findings).has('RAW_CSS_VISIBLE'));
assert.strictEqual(findings[0].editableSource, 'content/articles/raw-css.md');

findings = api.auditJsonValue(JSON.parse(read('internal-note.json')), { file: 'data/content/articles.json' });
assert.ok(rules(findings).has('INTERNAL_IMPLEMENTATION_NOTE'));
assert.strictEqual(findings[0].editableSource, 'data/content/articles.json');
assert.strictEqual(findings[0].block, 'description');

findings = api.auditHtml(read('french-english-block.html'), { file: 'fr/blog/fixture/index.html', route: '/fr/blog/fixture/', locale: 'fr', state: 'native', catalogValues: new Set() });
assert.ok(rules(findings).has('LANGUAGE_BLOCK_CONTAMINATION'));
assert.ok(findings.find((row) => row.ruleId === 'LANGUAGE_BLOCK_CONTAMINATION').block.startsWith('p['));

const labelledFallback = api.labelForeignLanguageBlocks(read('french-english-block.html'), 'fr', 'en', new Set());
assert.strictEqual(labelledFallback.count, 1);
const explicitFallback = labelledFallback.html
  .replace('</head>', '<meta name="afrotools-language-fallback" content="en"></head>')
  .replace('<body>', '<body><p data-language-fallback-notice>Le passage suivant reste en anglais et est clairement signalé.</p>');
findings = api.auditHtml(explicitFallback, { file: 'fr/blog/fallback/index.html', route: '/fr/blog/fallback/', locale: 'fr', state: 'localized-shell', catalogValues: new Set() });
assert.ok(!rules(findings).has('LANGUAGE_BLOCK_CONTAMINATION'));

findings = api.auditHtml(labelledFallback.html, { file: 'fr/blog/silent/index.html', route: '/fr/blog/silent/', locale: 'fr', state: 'localized-shell', catalogValues: new Set() });
assert.ok(rules(findings).has('LANGUAGE_BLOCK_CONTAMINATION'));

findings = api.auditHtml(read('duplicate-h1.html'), { file: 'tools/fixture/index.html' });
assert.ok(rules(findings).has('DUPLICATE_PRIMARY_HEADING'));

findings = api.auditHtml(read('unresolved-token.html'), { file: 'tools/token/index.html' });
assert.ok(rules(findings).has('UNRESOLVED_TEMPLATE'));

findings = api.auditHtml(read('french-implementation-note.html'), { file: 'fr/tools/implementation/index.html', locale: 'fr', state: 'native' });
assert.ok(rules(findings).has('INTERNAL_IMPLEMENTATION_NOTE'));

const inertDuplicate = read('duplicate-h1.html').replace('<h1>Mobile title</h1>', '<h1 hidden inert aria-hidden="true">Mobile title</h1>');
findings = api.auditHtml(inertDuplicate, { file: 'tools/inert/index.html' });
assert.ok(!rules(findings).has('DUPLICATE_PRIMARY_HEADING'));

const technicalFrench = '<!doctype html><html lang="fr"><body><main><h1>API AfroTools</h1><p>API JSON, PDF, OAuth, PAYE, TVA et FIRS sont des noms techniques acceptés dans cette documentation française.</p></main></body></html>';
findings = api.auditHtml(technicalFrench, { file: 'fr/tools/api/index.html', locale: 'fr', state: 'native', catalogValues: new Set() });
assert.ok(!rules(findings).has('LANGUAGE_BLOCK_CONTAMINATION'));

const invalidExceptions = api.validateExceptions({ schemaVersion: 1, exceptions: [{ id: 'bad' }] });
assert.ok(invalidExceptions.length >= 1);

const repeatedParagraph = 'This paragraph is deliberately long enough to represent a meaningful repeated content block in a generated page and should only be rendered once.';
const repeatedHtml = `<!doctype html><html lang="en"><body><main><p>${repeatedParagraph}</p><details><summary>Repeated answer</summary><p>${repeatedParagraph}</p></details></main></body></html>`;
const deduped = api.dedupeRepeatedParagraphs(repeatedHtml);
assert.strictEqual(deduped.count, 1);
assert.ok(!deduped.html.includes('<summary>Repeated answer</summary>'));
assert.strictEqual((deduped.html.match(new RegExp(repeatedParagraph, 'g')) || []).length, 1);

console.log('Content integrity malformed-fixture tests passed');

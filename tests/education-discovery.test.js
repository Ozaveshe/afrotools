'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const taxonomy = require('../assets/js/components/education-taxonomy.js');
const rows = vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8') + ';AFRO_TOOLS', { console });
const audit = taxonomy.auditTaxonomy(rows);
assert.ok(audit.registryCount > 0);
assert.deepEqual(audit.duplicateIds, []);
assert.deepEqual(audit.missingIds, []);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const hub = read('education/index.html');
assert.match(hub, /<h1>What do you need to do for your studies\?<\/h1>/);
assert.match(hub, /<title>Education Tools for African Students \| AfroTools<\/title>/);
assert.equal((hub.match(/class="edu-task-icon"/g) || []).length, 5);
assert.equal((hub.match(/<details class="edu-directory-group"/g) || []).length, taxonomy.getBuckets(rows).length);
assert.match(hub, /href="\/tools\/ssce-practice\/"/);
assert.match(hub, /href="\/tools\/education-hub\/"/);
assert.match(hub, /href="\/jamb\/english\/2025\/"/);
for (const locale of ['fr', 'sw', 'ha']) assert.ok(hub.includes('hreflang="' + locale + '"'), 'hub ' + locale + ' hreflang');
for (const label of ['Practise for an exam', 'Check results and admissions', 'Pay for education', 'Plan study abroad', 'Study and coursework']) {
  assert.ok(hub.includes(label), label);
}
for (const alias of ['JAMB aggregate', 'WASSCE', 'GPA', 'citations']) assert.ok(hub.includes(alias), alias);
const directory = hub.split('<div class="edu-directory">')[1].split('</div>\n  <p id="education-no-results"')[0];
assert.equal((directory.match(/<a href="[^"]+" data-education-tool/g) || []).length, audit.registryCount);
for (const tool of taxonomy.getRegistryTools(rows)) {
  assert.ok(directory.includes('href="' + tool.href + '"'), tool.id);
}
for (const slug of ['fees', 'loans', 'scholarships', 'study-abroad']) {
  const html = read('education/' + slug + '/index.html');
  const expected = taxonomy.getSubhub(slug, rows);
  assert.ok(html.includes('href="https://afrotools.com/education/' + slug + '/"'), slug + ' canonical');
  assert.ok(!html.includes('>0</div>'), slug + ' zero shell');
  assert.ok(html.includes('href="' + expected.tools[0].href + '"'), slug + ' first action');
  assert.equal((html.match(/class="edu-step-number"/g) || []).length, 3, slug + ' practical path');
  for (const tool of expected.tools) assert.ok(html.includes('href="' + tool.href + '"'), slug + ': ' + tool.id);
  for (const link of expected.relatedLinks) assert.ok(html.includes('href="' + link.href + '"'), slug + ': ' + link.href);
}
const extraRoutes = [
  '/education/', '/education/afrostudy/', '/ai/education/', '/jamb/',
  ...['cbt', 'tutor', 'past-questions', 'patterns', 'flashcards', 'study-plan',
    'score-predictor', 'universities', 'cram', 'exam-day-kit', 'history', 'daily']
    .map((slug) => '/jamb/' + slug + '/')
];
for (const route of [...taxonomy.getRegistryTools(rows).map((tool) => tool.href), ...extraRoutes]) {
  const file = route.replace(/^\//, '') + 'index.html';
  assert.ok(fs.existsSync(path.join(root, file)), 'missing route ' + route);
  const html = read(file);
  assert.doesNotMatch(html, /<meta\s+name=["']robots["'][^>]*noindex/i, route + ' noindex');
  assert.ok(html.includes('href="https://afrotools.com' + route + '"'), route + ' canonical');
}
for (const tool of taxonomy.getRegistryTools(rows)) {
  const html = read(tool.href.replace(/^\//, '') + 'index.html');
  assert.equal((html.match(/<!-- education-tool-journey:start -->/g) || []).length, 1, tool.id + ' journey');
  assert.ok(html.includes('/assets/css/education-tool-journey.css'), tool.id + ' journey CSS');
  assert.ok(html.includes('Browse all Education tools'), tool.id + ' category return');
}
console.log('Education discovery static routes match the registry.');

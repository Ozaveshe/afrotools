'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { existingRoutes, renderYear, validatePage, atomicWrite, jsonScript } = require('../scripts/build-jamb-reviewed-pages');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');
const routeBaseline = require('./fixtures/jamb-route-baseline.json');

test('unreviewed question text and answer schemas never enter a review page', () => {
  const page = renderYear('commerce', 1997, [{ id: 'unapproved', subject: 'commerce', year: 1997, question: 'DO_NOT_PUBLISH_THIS', answer: 'B' }], { questions: {}, sources: {} });
  assert.equal(page.html.includes('DO_NOT_PUBLISH_THIS'), false);
  assert.equal(page.html.includes('acceptedAnswer'), false);
  assert.ok(page.html.includes('content="noindex, follow"'));
  assert.ok(page.html.includes('This paper is under review'));
  assert.doesNotThrow(() => validatePage(page.html, [], page.canonical));
});

test('a truncated render cannot replace the last complete page', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'jamb-render-'));
  const file = path.join(directory, 'index.html');
  const page = renderYear('mathematics', 1987, [], { questions: {}, sources: {} });
  const validate = html => validatePage(html, [], page.canonical);
  try {
    assert.equal(atomicWrite(file, page.html, validate), true);
    assert.throws(() => atomicWrite(file, page.html.slice(0, -80), validate), /Incomplete|Truncated/);
    assert.equal(fs.readFileSync(file, 'utf8'), page.html);
    assert.equal(atomicWrite(file, page.html, validate), false);
    assert.deepEqual(fs.readdirSync(directory), ['index.html']);
  } finally {
    fs.unlinkSync(file); fs.rmdirSync(directory);
  }
});

test('JSON-LD string content cannot terminate its script element', () => {
  const value = { text: '</script><script>alert(1)</script>' };
  const encoded = jsonScript(value);
  assert.equal(encoded.includes('<'), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test('only the reviewed content version appears in both cards and answer schemas', () => {
  const q = { id: 'synthetic-reviewed', subject: 'mathematics', year: 1987, num: 1, question: 'Which comparison is correct?',
    options: { A: '5 < 6', B: '5 > 6', C: '5 = 6', D: '5 = 7' }, answer: 'A', format: 4, has_diagram: false,
    explanation: 'Five is smaller than six.', passage: 'Quantity — Frequency\n5 — 3\n6 — 4' };
  const evidence = { status: 'accepted', reviewer: 'synthetic fixture', reviewed_at: '2026-09-10', evidence: 'synthetic fixture only' };
  const ledger = { sources: { fixture: { permission: { status: 'permitted', basis: 'original-work', evidence: 'synthetic fixture', reviewed_by: 'test', reviewed_at: '2026-09-10' } } },
    questions: { [q.id]: { content_sha256: questionFingerprint(q), source_id: 'fixture', question_review: evidence, answer_review: evidence, explanation_review: evidence } } };
  const page = renderYear('mathematics', 1987, [q, { ...q, id: 'unreviewed-copy' }], ledger);
  assert.deepEqual(page.approvedIds, [q.id]);
  assert.ok(page.html.includes('5 &lt; 6'));
  assert.ok(page.html.includes('Answer and explanation'));
  assert.ok(page.html.includes('acceptedAnswer'));
  const schemas = [...page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.equal(schemas.find(schema => schema['@type'] === 'Question').text, q.passage + '\n\n' + q.question);
  assert.ok(page.html.includes('<blockquote style="white-space:pre-wrap;">'));
  assert.equal(page.html.includes('unreviewed-copy'), false);
  const subjectPage = renderYear('mathematics', null, [q], ledger, ['1987']);
  assert.deepEqual(subjectPage.approvedIds, [q.id]);
  assert.ok(subjectPage.html.includes('href="/jamb/mathematics/1987/"'));
  const stale = renderYear('mathematics', 1987, [{ ...q, answer: 'B' }], ledger);
  assert.equal(stale.approvedIds.length, 0);
  const duplicatedElsewhere = renderYear('mathematics', 1987, [q, { ...q, year: 1988 }], ledger);
  assert.equal(duplicatedElsewhere.approvedIds.length, 0, 'duplicate IDs across years must agree with public-pool quarantine');
});


test('all existing subject and year routes are preserved even with an empty approved pool', () => {
  const root = path.resolve(__dirname, '..');
  const routes = existingRoutes(root);
  const privatePath = path.join(root, 'ops/jamb/source-pool.json');
  const pool = JSON.parse(fs.readFileSync(fs.existsSync(privatePath) ? privatePath : path.join(root, 'data/jamb/pools/practice-pool.json'), 'utf8'));
  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/jamb/review-ledger.json'), 'utf8'));
  // Pin the original files instead of forbidding legitimate new paper years.
  // An equal total could hide a deleted route replaced by an unrelated route.
  for (const file of routeBaseline.files) assert.ok(fs.existsSync(path.join(root,file)), 'Original route disappeared: '+file);
  const publicBank = JSON.parse(fs.readFileSync(path.join(root,'data/jamb/pools/practice-pool.json'),'utf8'));
  for (const q of publicBank.questions) {
    assert.ok(routes.includes(q.subject), 'Missing reviewed subject route: '+q.subject);
    assert.ok(routes.includes(q.subject+'/'+q.year), 'Missing reviewed paper route: '+q.subject+'/'+q.year);
  }
  for (const route of routes) {
    const [subject, year] = route.split('/');
    const years = routes.filter(item => item.startsWith(subject + '/')).map(item => item.split('/')[1]);
    const page = renderYear(subject, year || null, [], {questions:{},sources:{}}, years);
    const current = fs.readFileSync(path.join(root, 'jamb', route, 'index.html'), 'utf8');
    const actual = renderYear(subject, year || null, pool.questions, ledger, years);
    validatePage(current, actual.approvedIds, page.canonical);
    assert.ok(current.includes('Plan your study week'));
    if (!year) assert.ok(current.includes('Browse by year'));
  }
});

test('all JAMB documents retain complete structure and original routes after regeneration', () => {
  const root = path.resolve(__dirname, '../jamb');
  let total = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) {
        total++;
        const html = fs.readFileSync(file, 'utf8');
        for (const tag of ['html','head','body']) {
          assert.equal((html.match(new RegExp('<'+tag+'(?:\\s|>)','gi'))||[]).length,1,file+' opening '+tag);
          assert.equal((html.match(new RegExp('</'+tag+'\\s*>','gi'))||[]).length,1,file+' closing '+tag);
        }
        assert.equal((html.match(/<article\b/g)||[]).length,(html.match(/<\/article>/g)||[]).length,file+' cards');
      }
    }
  }
  walk(root);
  assert.ok(total >= routeBaseline.files.length);
  for (const file of routeBaseline.files) assert.ok(fs.existsSync(path.resolve(root,'..',file)), 'Original route disappeared: '+file);
});

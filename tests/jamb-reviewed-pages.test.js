'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { renderYear, validatePage, atomicWrite, jsonScript } = require('../scripts/build-jamb-reviewed-pages');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');

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
    explanation: 'Five is smaller than six.' };
  const evidence = { status: 'accepted', reviewer: 'synthetic fixture', reviewed_at: '2026-09-10', evidence: 'synthetic fixture only' };
  const ledger = { sources: { fixture: { permission: { status: 'permitted', basis: 'original-work', evidence: 'synthetic fixture', reviewed_by: 'test', reviewed_at: '2026-09-10' } } },
    questions: { [q.id]: { content_sha256: questionFingerprint(q), source_id: 'fixture', question_review: evidence, answer_review: evidence, explanation_review: evidence } } };
  const page = renderYear('mathematics', 1987, [q, { ...q, id: 'unreviewed-copy' }], ledger);
  assert.deepEqual(page.approvedIds, [q.id]);
  assert.ok(page.html.includes('5 &lt; 6'));
  assert.ok(page.html.includes('Answer and explanation'));
  assert.ok(page.html.includes('acceptedAnswer'));
  assert.equal(page.html.includes('unreviewed-copy'), false);
  const stale = renderYear('mathematics', 1987, [{ ...q, answer: 'B' }], ledger);
  assert.equal(stale.approvedIds.length, 0);
});

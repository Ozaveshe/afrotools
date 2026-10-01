'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/pages/jamb-reviewed-page-practice.js'), 'utf8');

function fixture(consent = 'accepted', subject = 'english') {
  const storage = new Map([['afrotools_cookie_consent', consent]]);
  const calls = [];
  let onClick;
  const details = Array.from({ length: 2 }, () => {
    const item = { open: false, hidden: false, summary: {} };
    item.summary.parentElement = item;
    return item;
  });
  const paper = {
    getAttribute(name) { assert.equal(name, 'data-jamb-subject'); return subject; },
    addEventListener(name, handler) { assert.equal(name, 'click'); onClick = handler; }
  };
  const window = {
    localStorage: { getItem(key) { return storage.get(key) || null; } },
    AfroTools: { analytics: { trackEducationPractice() { calls.push([...arguments]); return true; } } }
  };
  const document = { querySelector(selector) {
    assert.equal(selector, '.jamb-reviewed-paper[data-jamb-subject]');
    return paper;
  } };
  vm.runInNewContext(source, { window, document, Array });
  return { window, storage, details, calls, click(index, onAnswer = true) {
    onClick({ target: { closest(selector) {
      assert.equal(selector, '.qcard details > summary');
      return onAnswer ? details[index].summary : null;
    } } });
  } };
}

test('only a consented first answer reveal enters the JAMB cohort with coarse subject metadata', () => {
  const visit = fixture();
  visit.click(0, false);
  visit.details[0].open = true;
  visit.click(0);
  assert.equal(visit.calls.length, 0, 'closing an answer is not a new practice action');
  visit.details[0].open = false;
  visit.click(0);
  visit.click(1);
  assert.deepEqual(visit.calls, [['jamb', 'english', 'start']]);
});

test('declined consent, hidden answers, and a missing analytics wrapper do not count practice', () => {
  const visit = fixture('declined', 'mathematics');
  visit.click(0);
  assert.equal(visit.calls.length, 0);
  visit.storage.set('afrotools_cookie_consent', 'accepted');
  visit.details[0].hidden = true;
  visit.click(0);
  assert.equal(visit.calls.length, 0);
  visit.details[0].hidden = false;
  visit.window.AfroTools.analytics = null;
  visit.click(0);
  assert.equal(visit.calls.length, 0);
  visit.window.AfroTools.analytics = { trackEducationPractice() { visit.calls.push([...arguments]); } };
  visit.click(0);
  assert.deepEqual(visit.calls, [['jamb', 'mathematics', 'start']]);
});

test('reviewed JAMB pages load the consent wrapper before the answer-reveal hook', () => {
  const question = { id: 'synthetic-reviewed', subject: 'english', year: 2024, num: null,
    question: 'Which word means clear?', options: { A: 'Opaque', B: 'Plain', C: 'Hidden', D: 'Blurred' },
    answer: 'B', format: 4, has_diagram: false, explanation: 'Plain can mean clear.',
    source_provenance: { publisher: 'Example', url: 'https://example.com/collection', year_basis: 'publisher-collection' } };
  const review = { status: 'accepted', reviewer: 'synthetic fixture', reviewed_at: '2026-09-26', evidence: 'synthetic fixture only' };
  const hash = 'a'.repeat(64);
  const ledger = { sources: { fixture: { source_file: 'synthetic fixture', content_sha256: hash,
    source_url: 'https://example.com/collection', publisher: 'Example', year_basis: 'publisher-collection', collection_year: 2024,
    reuse_authorization: { status: 'authorized-by-owner', basis: 'owner-directed-public-source', scope: 'AfroTools past-question practice',
      material_sha256: hash, authorized_by: 'test', authorized_at: '2026-09-26', instruction_ref: 'synthetic fixture' } } },
    questions: { [question.id]: { content_sha256: questionFingerprint(question), source_id: 'fixture',
      question_review: review, answer_review: review, explanation_review: review } } };
  const page = renderYear('english', 2024, [question], ledger);
  assert.deepEqual(page.approvedIds, [question.id]);
  assert.ok(page.html.includes('data-jamb-subject="english"'));
  assert.ok(page.html.indexOf('id="afro-analytics-js"') < page.html.indexOf('jamb-reviewed-page-practice.js'));
  assert.ok(page.html.includes('original UTME sitting and question numbers are unconfirmed'));
  const empty = renderYear('english', 2024, [], { sources: {}, questions: {} });
  assert.ok(!empty.html.includes('jamb-reviewed-page-practice.js'));
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { auditHtml, dedupeRepeatedParagraphs } = require('../scripts/lib/content-integrity');
const paragraph = '<p>A repeated exam question can legitimately appear in multiple years, and each occurrence needs its complete wording and answer explanation for students to practise.</p>';
const card = (id, content = paragraph) => `<article class="qcard" id="q-${id}" data-reviewed-question="${id}">${content}</article>`;
const repeated = html => auditHtml(html).some(row => row.ruleId === 'REPEATED_CONTENT_BLOCK');
test('independent reviewed questions keep repeated wording and answer disclosures', () => {
  const html = card('year-one', `<details>${paragraph}</details>`) + card('year-two', `<details>${paragraph}</details>`);
  assert.equal(dedupeRepeatedParagraphs(html).html, html);
  assert.equal(repeated(html), false);
});
test('duplicates within a question, repeated question IDs and ordinary prose remain detected', () => {
  for (const html of [card('same', paragraph + paragraph), card('same') + card('same'), paragraph + paragraph,
    `<article data-reviewed-question="fake-one">${paragraph}</article><article data-reviewed-question="fake-two">${paragraph}</article>`]) {
    assert.equal(repeated(html), true);
    assert.equal(dedupeRepeatedParagraphs(html).count, 1);
  }
});
test('question scope does not suppress other content quality checks', () => {
  assert.ok(auditHtml(card('unsafe', '<p>TODO replace this placeholder copy.</p>')).some(row => row.ruleId === 'PLACEHOLDER_COPY'));
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const article = fs.readFileSync(path.join(root, 'blog/waec-grading-system-aggregate/index.html'), 'utf8');
const planner = fs.readFileSync(path.join(root, 'tools/waec-calculator/index.html'), 'utf8');
const text = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').trim();

test('the article offers a direct grade-entry action before the grading table', () => {
  const intro = article.slice(article.indexOf('<div class="article-body">'), article.indexOf('<h2>The WAEC Grading Scale</h2>'));
  assert.match(intro, /<a href="\/tools\/waec-calculator\/">Enter my grades and count credits/);
  assert.match(planner, /id="examSystem"/);
  assert.match(planner, /Nigeria/);
  assert.match(planner, /Ghana/);
});

test('the useful A1–F9 grade mapping remains available', () => {
  const rows = [...article.matchAll(/<tr><td><strong>(A1|B2|B3|C4|C5|C6|D7|E8|F9)<\/strong><\/td><td>([1-9])<\/td>/g)];
  assert.deepEqual(rows.map(m => [m[1], Number(m[2])]), ['A1','B2','B3','C4','C5','C6','D7','E8','F9'].map((g,i) => [g,i+1]));
});

test('country-specific planning is actionable without universal course cut-offs', () => {
  assert.match(article, /Nigeria: count credits and inspect the best-five planning index/);
  assert.match(article, /Ghana: select the programme core and electives/);
  assert.match(article, /English, Core Mathematics, your selected programme core and three electives/);
  assert.match(article, /index of <strong>11<\/strong>/);
  assert.match(article, /not a nationwide post-UTME formula or an admission score/);
  assert.doesNotMatch(article, /Most Nigerian universities use the best of 5|Competitive for any course|JAMB 280\+|typically require aggregates of 12 or lower|estimate your admission chances/);
});

test('official programme checking is separate from our planner and Ghana context', () => {
  assert.match(article, /href="https:\/\/eligibility\.jamb\.gov\.ng\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(article, /entry mode, institution and programme/);
  assert.match(article, /Nigeria IBASS link is not a Ghana eligibility service/);
  assert.match(article, /current policy before combining results/);
});

test('visible FAQ answers and structured answers agree and retain useful next actions', () => {
  const schemas = [...article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const faq = schemas.find(s => s['@type'] === 'FAQPage');
  assert.ok(faq);
  const visible = [...article.matchAll(/<details class="faq-item"><summary>([^<]+)<\/summary><div class="faq-answer"><p>([\s\S]*?)<\/p><\/div><\/details>/g)];
  assert.equal(visible.length, 5);
  assert.deepEqual(visible.map(m => [text(m[1]), text(m[2])]), faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]));
  assert.match(article, /href="\/blog\/waec-result-guide-2026\/"/);
  assert.match(article, /planner’s verification pack/);
  assert.ok(schemas.find(s => s['@type'] === 'Article').description.includes('programme requirements'));
});

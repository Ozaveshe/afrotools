#!/usr/bin/env node
/**
 * Mining hub — FAQPage JSON-LD parity test.
 *
 * Google requires FAQPage structured data to match the FAQ that is actually
 * visible on the page. A drifted answer is an invisible SEO defect: the page
 * still renders, the schema still validates, and nobody notices until the rich
 * result is dropped. This test pins the two together for every mining surface.
 *
 * It also asserts the honesty invariants the mining hub was rebuilt around
 * (see .claude/rules/mining.md):
 *   - the hub must have NO dead `/mining/` self-links (it shipped as a facade
 *     with 10 of them, all badged LIVE);
 *   - every tool card that links out must resolve to a real file on disk;
 *   - every live tool page must carry canonical + FAQPage + WebApplication.
 *
 *   node tests/mining-faq-parity.test.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  { file: 'mining/index.html', faqSelector: 'en-faq' },
  { file: 'tools/mining-royalty/index.html', faqSelector: 'mr-faq' },
  { file: 'tools/diamond-valuation/index.html', faqSelector: 'mr-faq' },
  { file: 'tools/oil-well-production/index.html', faqSelector: 'mr-faq' },
  { file: 'tools/oil-gas-revenue/index.html', faqSelector: 'mr-faq' },
  { file: 'tools/artisanal-mining-income/index.html', faqSelector: 'mr-faq' },
  { file: 'tools/mining-license-fee/index.html', faqSelector: 'mr-faq' }
];

const failures = [];
const notes = [];

function decode(s) {
  return s
    .replace(/<[^>]+>/g, '')           // strip inner tags (<strong>, <a>, ...)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function faqFromJsonLd(html, file) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const b of blocks) {
    let parsed;
    try { parsed = JSON.parse(b[1]); } catch (e) {
      failures.push(`${file}: a JSON-LD block does not parse: ${e.message}`);
      continue;
    }
    if (parsed && parsed['@type'] === 'FAQPage') {
      return (parsed.mainEntity || []).map((q) => [
        decode(q.name || ''),
        decode((q.acceptedAnswer || {}).text || '')
      ]);
    }
  }
  return null;
}

function faqFromVisible(html) {
  // <details> ... <summary>Q</summary> ... <p>A</p> ... </details>
  const out = [];
  for (const d of html.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)) {
    const inner = d[1];
    const q = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const a = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (q && a) out.push([decode(q[1]), decode(a[1])]);
  }
  return out;
}

for (const page of PAGES) {
  const abs = path.join(ROOT, page.file);
  if (!fs.existsSync(abs)) { failures.push(`${page.file}: file does not exist`); continue; }
  const html = fs.readFileSync(abs, 'utf8');

  const json = faqFromJsonLd(html, page.file);
  const vis = faqFromVisible(html);

  if (!json) { failures.push(`${page.file}: no FAQPage JSON-LD found`); continue; }
  if (!vis.length) { failures.push(`${page.file}: no visible <details> FAQ found`); continue; }

  if (json.length !== vis.length) {
    failures.push(`${page.file}: FAQPage has ${json.length} Q&A but ${vis.length} are visible`);
  }
  json.forEach(([q, a], i) => {
    if (!vis[i]) { failures.push(`${page.file}: Q${i + 1} "${q}" has no visible counterpart`); return; }
    if (vis[i][0] !== q) failures.push(`${page.file}: Q${i + 1} question drift\n    JSON: ${q}\n    PAGE: ${vis[i][0]}`);
    if (vis[i][1] !== a) failures.push(`${page.file}: Q${i + 1} answer drift\n    JSON: ${a.slice(0, 90)}…\n    PAGE: ${vis[i][1].slice(0, 90)}…`);
  });

  // Required SEO furniture on every mining surface.
  if (!/<link rel="canonical"/.test(html)) failures.push(`${page.file}: missing canonical`);
  if (page.file !== 'mining/index.html' && !/"@type":\s*"WebApplication"/.test(html)) {
    failures.push(`${page.file}: tool page missing WebApplication schema`);
  }
  notes.push(`${page.file}: ${json.length} Q&A in sync`);
}

// Hub honesty invariants — this hub shipped as a facade; keep it from regressing.
const hub = fs.readFileSync(path.join(ROOT, 'mining/index.html'), 'utf8');
const selfLinks = (hub.match(/href="\/mining\/"/g) || []).length;
if (selfLinks > 0) {
  failures.push(`mining/index.html: ${selfLinks} dead self-link(s) to /mining/ — tool cards must point at real routes, never back at the hub.`);
}
// A card badged LIVE must resolve to a real page on disk.
for (const m of hub.matchAll(/<a href="(\/tools\/[^"]+)\/" class="en-tool-card">/g)) {
  const target = path.join(ROOT, m[1].replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(target)) failures.push(`mining/index.html: card links to ${m[1]}/ which does not exist on disk`);
}
const liveCards = (hub.match(/class="en-tool-card-tag tag-live"/g) || []).length;
const plannedCards = (hub.match(/class="en-tool-card-tag tag-planned"/g) || []).length;
const anchorCards = (hub.match(/<a href="\/tools\/[^"]+\/" class="en-tool-card">/g) || []).length;
if (liveCards !== anchorCards) {
  failures.push(`mining/index.html: ${liveCards} LIVE badges but ${anchorCards} linked cards — a LIVE badge must mean a working link.`);
}
notes.push(`mining/index.html: ${anchorCards} live cards, ${plannedCards} planned, 0 self-links`);

console.log('Mining FAQ parity + hub honesty');
for (const n of notes) console.log(`  ok    ${n}`);
for (const f of failures) console.error(`  FAIL  ${f}`);

if (failures.length) {
  console.error(`\n${failures.length} failure(s).`);
  process.exit(1);
}
console.log('  All mining FAQ schema matches the visible FAQ; hub honesty invariants hold.');
process.exit(0);

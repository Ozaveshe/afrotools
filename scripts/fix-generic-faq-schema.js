#!/usr/bin/env node
/**
 * fix-generic-faq-schema.js — Replaces the generic boilerplate FAQPage JSON-LD
 * ("How should I use X? … create a planning summary … educational planning
 * workflow …") with schema built from the page's REAL visible FAQ, so the
 * structured data matches on-page content (Google requires this).
 *
 * Complements regenerate-df-blocks.js: that script handles pages with a df-faq
 * block; this one handles pages that carry the generic FAQ schema but have their
 * own hand-written visible FAQ (<details><summary>Q</summary><p>A</p></details>).
 *
 * Usage:
 *   node scripts/fix-generic-faq-schema.js          (audit)
 *   node scripts/fix-generic-faq-schema.js --fix     (apply)
 */
const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const SIG = /planning summary|educational planning workflow|What should I verify before acting|an official result\?/i;

function walk(d) {
  const out = [];
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) out.push(...walk(f)); }
    else if (e.name === 'index.html') out.push(f);
  }
  return out;
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function extractVisibleFaq(html) {
  const pairs = [];
  // Format A: <details><summary>Q</summary><p>A</p></details>
  const reDetails = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = reDetails.exec(html))) {
    const q = stripTags(m[1]);
    const aMatch = m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const a = stripTags(aMatch ? aMatch[1] : m[2]);
    if (q && a && q.length > 3 && a.length > 15) pairs.push({ q, a });
  }
  // Format B: <div class="landing-faq-item"><div class="...faq-q">Q</div><div class="...faq-a">A</div></div>
  const reLanding = /<div class="landing-faq-item">\s*<div class="landing-faq-q">([\s\S]*?)<\/div>\s*<div class="landing-faq-a">([\s\S]*?)<\/div>/gi;
  while ((m = reLanding.exec(html))) {
    const q = stripTags(m[1]);
    const a = stripTags(m[2]);
    if (q && a && q.length > 3 && a.length > 15) pairs.push({ q, a });
  }
  return pairs;
}

const files = [...walk(path.join(ROOT, 'tools')), ...walk(path.join(ROOT, 'crypto'))];
let applied = 0, removed = 0, none = 0;
const removedList = [];

for (const file of files) {
  let html = fs.readFileSync(file, 'utf-8');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const target = scripts.find((sm) => {
    let j; try { j = JSON.parse(sm[1].trim()); } catch (e) { return false; }
    return j && j['@type'] === 'FAQPage' && SIG.test(JSON.stringify(j));
  });
  if (!target) { none++; continue; }

  const faq = extractVisibleFaq(html);
  let replacement;
  if (faq.length < 2) {
    // No visible FAQ to back the schema — REMOVE it (FAQPage schema without
    // matching on-page content is a structured-data violation).
    replacement = '';
    removed++;
    removedList.push(path.relative(ROOT, file));
  } else {
    const schema = {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.slice(0, 8).map((f) => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    replacement = `<script type="application/ld+json">\n${JSON.stringify(schema)}\n</script>`;
  }
  const out = html.replace(target[0], replacement);
  if (out === html) { none++; continue; }

  if (FIX) {
    const tmp = file + '.tmp-faq';
    writeFileSyncWithRetry(tmp, out, 'utf-8');
    renameSyncWithRetry(tmp, file);
  }
  applied++;
}

console.log('\n🔧 generic FAQPage schema → visible FAQ');
console.log('═'.repeat(52));
console.log(`${FIX ? 'Changed' : 'Would change'}: ${applied} (rebuilt from visible FAQ: ${applied - removed}, removed as unbacked: ${removed})`);
if (removedList.length) { console.log('Removed (no visible FAQ on page):'); removedList.slice(0, 25).forEach((s) => console.log('  · ' + s)); }
if (!FIX && applied) console.log('\nRun with --fix to apply.');
console.log('');

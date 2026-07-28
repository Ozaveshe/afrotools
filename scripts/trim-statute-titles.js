#!/usr/bin/env node
'use strict';

/**
 * Drop the statute citation from contract-generator page titles.
 *
 * Four page families append the governing law to <title>:
 *
 *   "South Africa Employment Contract Builder — Basic Conditions of Employment
 *    Act 75 of 1997; Labour Relations Act 66 of 1995; National Minimum Wage
 *    Act 9 of 2018 | AfroTools"                                   170 chars
 *
 * A search result shows roughly 60. Everything after "Employment Contract
 * Builder" is truncated, so the citation buys nothing in the SERP while
 * pushing the country and the tool name — the part someone actually scans
 * for — to the edge of what is displayed.
 *
 * The citation is not lost: this script only trims a title whose statute text
 * still appears in the page body, so the claim stays where a reader can check
 * it. Pages that fail that test are left alone and reported.
 *
 * Usage: node scripts/trim-statute-titles.js [--write]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const FAMILIES = [
  'tools/tenancy-agreement',
  'tools/employment-contract',
  'fr/tools/contrat-bail',
  'fr/tools/contrat-travail'
];

// "<Country> <Tool name> — <statute> | AfroTools"
const TITLE_RE = /^(.*?)\s+[—-]\s+(.+?)\s*\|\s*AfroTools\s*$/;

function listPages(dir) {
  const full = path.join(ROOT, dir);
  let entries;
  try { entries = fs.readdirSync(full, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.html') && e.name !== 'index.html')
    .map((e) => path.join(full, e.name));
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

function main() {
  let changed = 0;
  const kept = [];
  for (const dir of FAMILIES) {
    for (const file of listPages(dir)) {
      const original = fs.readFileSync(file, 'utf8');
      const tm = original.match(/<title>([\s\S]*?)<\/title>/i);
      if (!tm) continue;
      const title = tm[1].replace(/\s+/g, ' ').trim();
      if (title.length <= 70) continue;
      const parts = title.match(TITLE_RE);
      if (!parts) continue;
      const [, lead, statute] = parts;

      // Only drop a citation the page still states somewhere the reader can see.
      const body = original.slice(original.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/gi, ' ');
      if (!body.includes(statute) && !body.includes(decode(statute))) {
        kept.push(path.relative(ROOT, file));
        continue;
      }

      const next = `${lead} | AfroTools`;
      if (next === title) continue;
      let out = original.replace(/<title>[\s\S]*?<\/title>/i, `<title>${next}</title>`);
      for (const [attr, name] of [['property', 'og:title'], ['name', 'twitter:title']]) {
        const re = new RegExp(`(<meta[^>]+${attr}="${name}"[^>]*content=")[^"]*(")`, 'i');
        out = out.replace(re, (m, head, tail) => head + next + tail);
      }
      if (out === original) continue;
      changed += 1;
      if (WRITE) fs.writeFileSync(file, out, 'utf8');
    }
  }
  console.log(`${WRITE ? 'Trimmed' : 'Would trim'} the statute citation from ${changed} title(s).`);
  if (kept.length) console.log(`Left alone (statute not repeated in body) on ${kept.length} page(s): ${kept.slice(0, 5).join(', ')}`);
  if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
}

main();

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, dedupeRepeatedParagraphs } = require('./lib/content-integrity');

const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check') || !WRITE;
const SKIP = new Set(['.git', 'dist', 'node_modules', 'reports', 'test-results', 'tests']);

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(file);
  }
  return output;
}

function main() {
  const stale = [];
  let pages = 0;
  let blocks = 0;
  let whitespacePages = 0;
  for (const file of walk(ROOT)) {
    const before = fs.readFileSync(file, 'utf8');
    const result = dedupeRepeatedParagraphs(before);
    const after = result.html.normalize('NFC').replace(/[ \t]+$/gm, '');
    if (after === before) continue;
    pages += 1;
    blocks += result.count;
    if (!result.count) whitespacePages += 1;
    if (WRITE) fs.writeFileSync(file, after, 'utf8');
    else stale.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
  if (CHECK && stale.length) {
    console.error(`Repeated visible paragraphs remain in ${stale.length} page(s):\n${stale.slice(0, 50).join('\n')}`);
    process.exit(1);
  }
  console.log(`${WRITE ? 'Normalized' : 'Checked'} generated content: ${blocks} duplicate block(s) across ${pages} changed page(s); ${whitespacePages} whitespace-only page(s).`);
}

if (require.main === module) main();

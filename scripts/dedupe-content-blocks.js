#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, dedupeRepeatedParagraphs } = require('./lib/content-integrity');

const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check') || !WRITE;
const SKIP = new Set([
  'artifacts',
  'audit-results',
  'dist',
  'node_modules',
  'reports',
  'test-results',
  'tests'
]);

function shouldSkipDirectory(name) {
  return name.startsWith('.') || SKIP.has(name);
}

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && shouldSkipDirectory(entry.name)) continue;
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
    else stale.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), blocks: result.count });
  }
  if (CHECK && stale.length) {
    // Distinguish the two reasons a page is stale. Reporting "repeated visible
    // paragraphs" for a page whose only difference is trailing whitespace on a
    // blank line sends the reader hunting for duplicate content that is not
    // there — which is exactly what it did for ai/index.html.
    const duplicated = stale.filter((entry) => entry.blocks > 0);
    const whitespaceOnly = stale.filter((entry) => entry.blocks === 0);
    if (duplicated.length) {
      console.error(`Repeated visible paragraphs remain in ${duplicated.length} page(s):\n${duplicated.slice(0, 50).map((e) => `${e.file} (${e.blocks} block(s))`).join('\n')}`);
    }
    if (whitespaceOnly.length) {
      console.error(`Trailing whitespace to normalize in ${whitespaceOnly.length} page(s) (no duplicate content):\n${whitespaceOnly.slice(0, 50).map((e) => e.file).join('\n')}`);
    }
    console.error('Run: node scripts/dedupe-content-blocks.js --write');
    process.exit(1);
  }
  console.log(`${WRITE ? 'Normalized' : 'Checked'} generated content: ${blocks} duplicate block(s) across ${pages} changed page(s); ${whitespacePages} whitespace-only page(s).`);
}

if (require.main === module) main();

module.exports = { shouldSkipDirectory, walk };

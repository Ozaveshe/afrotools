#!/usr/bin/env node
/**
 * Clean common mojibake artifacts in public product pages.
 * Skips Pro, dist, vendor bundles, docs, reports, and minified assets.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXTENSIONS = new Set(['.html', '.js', '.json']);

function shouldSkip(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized.startsWith('pro/') ||
    normalized.includes('/pro/') ||
    normalized.startsWith('dist/') ||
    normalized.startsWith('node_modules/') ||
    normalized.startsWith('assets/vendor/') ||
    normalized.startsWith('docs/') ||
    normalized.startsWith('reports/') ||
    normalized === 'assets/js/components/tool-registry.js' ||
    normalized === 'assets/js/components/related-tools-data.js' ||
    normalized === 'assets/js/components/navbar.js' ||
    normalized.endsWith('.min.js') ||
    normalized.endsWith('.map')
  );
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (shouldSkip(rel + '/')) continue;
      walk(full, out);
      continue;
    }
    if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    if (shouldSkip(rel)) continue;
    out.push(full);
  }
  return out;
}

function cleanText(input) {
  let text = input;

  const replacements = [
    [/\u00e2\u20ac\u201d/g, '-'], // em dash mojibake
    [/\u00e2\u20ac\u201c/g, '-'], // en dash mojibake
    [/\u00e2\u20ac\u2122/g, "'"],
    [/\u00e2\u20ac\u0153/g, '"'],
    [/\u00e2\u20ac\u009d/g, '"'],
    [/\u00e2\u2020\u2019/g, '->'],
    [/\u00e2\u2020\u0092/g, '->'],
    [/\u00e2\u2020\u0090/g, '<-'],
    [/\u00e2\u0153\u201c/g, 'OK'],
    [/\u00e2\u0153\u2026/g, 'Live'],
    [/\u00e2\u008f\u00b3/g, 'Planned'],
    [/\u00c2\u00b7/g, '-'],
    [/\u00c2\u00a0/g, ' '],
    [/\u00c2(?=[\u0080-\u00bf])/g, ''],
    [/\u00ef\u00b8\u008f/g, ''],
    [/\u00c3\u00a9/g, 'e'],
    [/\u00c3\u00a8/g, 'e'],
    [/\u00c3\u00aa/g, 'e'],
    [/\u00c3\u00ab/g, 'e'],
    [/\u00c3\u00a0/g, 'a'],
    [/\u00c3\u00a2/g, 'a'],
    [/\u00c3\u00b4/g, 'o'],
    [/\u00c3\u00bb/g, 'u'],
    [/\u00c3\u00a7/g, 'c'],
    [/\u00c3\u00af/g, 'i'],
    [/\u00c5\u201c/g, 'oe'],
  ];

  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }

  // Remove remaining broken emoji byte sequences such as ".
  text = text.replace(/\u00f0\u0178.{1,3}/gu, '');

  // Last-resort cleanup for incomplete mojibake clusters.
  text = text.replace(/\u00e2[\u0080-\u00bf\u0150-\u017f\u2010-\u203f]{1,2}/gu, '-');

  return text;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  if (!/[\u00e2\u00c2\u00c3\u00ef\u00f0\u0178]/u.test(before)) continue;
  const after = cleanText(before);
  if (after === before) continue;
  fs.writeFileSync(file, after);
  changed += 1;
  console.log(path.relative(ROOT, file));
}

console.log(`Cleaned ${changed} public files.`);

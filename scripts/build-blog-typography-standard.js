#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const blogRoots = ['blog', path.join('fr', 'blog'), path.join('sw', 'blogu')];
const stylesheet = '/blog/assets/css/blog-typography.css';
const link = `<link rel="stylesheet" href="${stylesheet}">`;
const hubTitles = new Map([
  ['blog/index.html', 'Practical African Guides for Money, Work &amp; Everyday Decisions'],
  ['fr/blog/index.html', 'Guides pratiques pour l’argent, le travail et les décisions du quotidien'],
  ['sw/blogu/index.html', 'Miongozo ya Vitendo kwa Fedha, Kazi na Maamuzi ya Kila Siku']
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return entry.isFile() && entry.name === 'index.html' ? [target] : [];
  });
}

function normalize(html, relative) {
  const pattern = /<link\b[^>]*href=["'][^"']*\/blog\/assets\/css\/blog-typography\.css(?:\?[^"']*)?["'][^>]*>/gi;
  const existing = html.match(pattern);
  const canonicalLink = existing && existing.length === 1 ? existing[0] : link;
  const withoutExisting = html.replace(/\s*<link\b[^>]*href=["'][^"']*\/blog\/assets\/css\/blog-typography\.css(?:\?[^"']*)?["'][^>]*>\s*/gi, '\n');
  const withStylesheet = withoutExisting.replace(/\s*<\/head>/i, `\n${canonicalLink}\n</head>`);
  const title = hubTitles.get(relative);
  if (!title) return withStylesheet;
  return withStylesheet.replace(/(<header\b[^>]*class=["'][^"']*\bblog-hero\b[^"']*["'][^>]*>[\s\S]*?<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${title}$2`);
}

const files = blogRoots.flatMap((directory) => walk(path.join(root, directory)));
const changed = [];
const invalid = [];

for (const file of files) {
  const current = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replace(/\\/g, '/');
  if (!/<\/head>/i.test(current)) {
    invalid.push(relative);
    continue;
  }
  const next = normalize(current, relative);
  if (next !== current) {
    changed.push(relative);
    if (write) fs.writeFileSync(file, next, 'utf8');
  }
}

if (invalid.length) {
  console.error(`Blog typography: ${invalid.length} HTML file(s) have no closing head tag.`);
  invalid.slice(0, 10).forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

if (!write && changed.length) {
  console.error(`Blog typography is stale in ${changed.length} of ${files.length} pages.`);
  changed.slice(0, 10).forEach((file) => console.error(`- ${file}`));
  console.error('Run npm run blog:typography:build.');
  process.exit(1);
}

console.log(`Blog typography ${write ? 'synchronized' : 'verified'} across ${files.length} pages${write ? ` (${changed.length} updated)` : ''}.`);

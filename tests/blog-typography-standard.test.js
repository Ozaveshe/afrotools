'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const roots = ['blog', path.join('fr', 'blog'), path.join('sw', 'blogu')];
const expectedHubTitles = new Map([
  ['blog/index.html', 'Practical African Guides for Money, Work &amp; Everyday Decisions'],
  ['fr/blog/index.html', 'Guides pratiques pour l’argent, le travail et les décisions du quotidien'],
  ['sw/blogu/index.html', 'Miongozo ya Vitendo kwa Fedha, Kazi na Maamuzi ya Kila Siku']
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : entry.name === 'index.html' ? [target] : [];
  });
}

const files = roots.flatMap((directory) => walk(path.join(root, directory)));
assert(files.length >= 470, `Expected the full blog estate, found ${files.length} pages`);

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const matches = html.match(/<link\b[^>]*href=["']\/blog\/assets\/css\/blog-typography\.css(?:\?[^"']*)?["'][^>]*>/gi) || [];
  assert.strictEqual(matches.length, 1, `${relative} must load the canonical typography stylesheet once`);
  const linkEnd = html.indexOf(matches[0]) + matches[0].length;
  const trailingHead = html.slice(linkEnd, html.search(/<\/head>/i));
  assert(!/<style\b|<link\b[^>]*rel=["']stylesheet["']/i.test(trailingHead), `${relative} must load canonical typography after legacy styles`);
}

for (const [relative, title] of expectedHubTitles) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  assert(html.includes(`<h1>${title}</h1>`), `${relative} must use the approved localized H1`);
}

const css = fs.readFileSync(path.join(root, 'blog', 'assets', 'css', 'blog-typography.css'), 'utf8');
assert(css.includes("--blog-title-font: 'DM Sans'"), 'Typography must use the local multilingual DM Sans family');
assert(css.includes('font-style: normal !important'), 'Typography must neutralize italic legacy titles');
assert(css.includes('font-weight: 700 !important'), 'Typography must use the approved weight');
assert(css.includes('text-wrap: balance'), 'Typography must balance multiline titles');

const requiredHubTitleSelectors = [
  '.featured-card-body h2',
  '.featured-card-body h3',
  '.article-card-body h2',
  '.article-card-body h3',
  '.featured-title',
  '.post-title'
];

for (const selector of requiredHubTitleSelectors) {
  assert(css.includes(selector), `Typography must standardize ${selector}`);
}
assert(css.includes('.article-card-body h2 a'), 'French hub card links must inherit the standardized title treatment');

for (const relative of expectedHubTitles.keys()) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  assert(
    /class=["'][^"']*(?:article-card-body|post-title|featured-title)[^"']*["']/.test(html),
    `${relative} must expose a standardized hub card-title selector`
  );
}

console.log(`Blog typography standard verified across ${files.length} pages.`);

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const asset = fs.readFileSync(path.join(BLOG, 'assets/js/blog-reading.js'), 'utf8');

assert.match(asset, /ensureTableOfContents/);
assert.match(asset, /Copy article link/);
assert.match(asset, /requestAnimationFrame/);
assert.doesNotMatch(asset, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);

let checked = 0;
for (const entry of fs.readdirSync(BLOG, { withFileTypes: true })) {
  const file = path.join(BLOG, entry.name, 'index.html');
  if (!entry.isDirectory() || entry.name === 'assets' || !fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (!/<html\b[^>]*\blang=["']en(?:-[^"']+)?["']/i.test(html)) continue;
  if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) continue;
  checked += 1;
  assert.match(html, /<link rel="stylesheet" href="\/blog\/assets\/css\/blog-platform\.css(?:\?v=[a-f0-9]+)?">/, `${entry.name} shared reading styles`);
  assert.match(html, /<script src="\/blog\/assets\/js\/blog-reading\.js(?:\?v=[a-f0-9]+)?" defer><\/script>/, `${entry.name} shared reading asset`);
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(inlineScripts.every((match) => !/readingProgress/.test(match[1])), `${entry.name} legacy progress script`);
  assert.doesNotMatch(html, /<\/strong>\s+,/, `${entry.name} punctuation spacing`);
  assert.doesNotMatch(html, /\b2026\s+,/, `${entry.name} year punctuation spacing`);
}

assert.ok(checked > 200, `expected more than 200 English articles, found ${checked}`);
console.log(`Blog platform tests passed (${checked} English articles).`);

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const WRITE = process.argv.includes('--write');
const SCRIPT_TAG = '<script src="/blog/assets/js/blog-reading.js" defer></script>';
const STYLE_TAG = '<link rel="stylesheet" href="/blog/assets/css/blog-platform.css">';

function articleFiles() {
  return fs.readdirSync(BLOG, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
    .map((entry) => path.join(BLOG, entry.name, 'index.html'))
    .filter((file) => fs.existsSync(file));
}

function isEnglishArticle(html) {
  return /<html\b[^>]*\blang=["']en(?:-[^"']+)?["']/i.test(html)
    && !/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html);
}

function removeLegacyProgressScripts(html) {
  return html.replace(/<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi, (block, source) => {
    return /readingProgress/.test(source) ? '' : block;
  });
}

function improve(html) {
  let output = html.replace(/<\/strong>\s+,/g, '</strong>,').replace(/\b2026\s+,/g, '2026,');
  output = removeLegacyProgressScripts(output);
  if (!output.includes('/blog/assets/css/blog-platform.css')) {
    output = output.replace(/<\/head>/i, `${STYLE_TAG}\n</head>`);
  }
  if (!output.includes('/blog/assets/js/blog-reading.js')) {
    output = /<script\b[^>]*src=["']\/assets\/js\/lazy-analytics\.js/i.test(output)
      ? output.replace(/(<script\b[^>]*src=["']\/assets\/js\/lazy-analytics\.js)/i, `${SCRIPT_TAG}\n$1`)
      : output.replace(/<\/body>/i, `${SCRIPT_TAG}\n</body>`);
  }
  output = output.replace(`${SCRIPT_TAG}<script`, `${SCRIPT_TAG}\n<script`);
  return output.replace(/[ \t]+$/gm, '');
}

const files = articleFiles();
const stale = [];
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  if (!isEnglishArticle(before)) continue;
  const after = improve(before);
  if (after === before) continue;
  stale.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

if (!WRITE && stale.length) {
  console.error(`Blog platform is stale in ${stale.length} English article(s).`);
  console.error(stale.slice(0, 25).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${WRITE ? 'Updated' : 'Checked'} shared blog platform across ${files.length} route(s); ${stale.length} changed.`);
}

module.exports = { improve, isEnglishArticle, removeLegacyProgressScripts };

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const toolsRoot = path.join(root, 'tools');
if (!fs.existsSync(path.join(root, 'assets/css/sports-tools-theme.css'))) {
  throw new Error('Missing shared sports tool theme');
}
const write = process.argv.includes('--write');
const pages = fs.readdirSync(toolsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(toolsRoot, entry.name, 'index.html'))
  .filter((file) => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('data-sports-tool='));

if (pages.length !== 15) throw new Error(`Expected 15 sports tool pages, found ${pages.length}`);

let stale = 0;
for (const file of pages) {
  const original = fs.readFileSync(file, 'utf8');
  const heroMeta = /<div class="en-tool-hero-meta">[\s\S]*?<\/div>\r?\n/;
  const intro = /<section class="sports-tool-intro">[\s\S]*?<\/section>\r?\n/;
  const stylesheet = /(<link rel="stylesheet" href="\/assets\/css\/top-level-page-ui-refresh\.css\?v=[^"]+">)/;
  const themeStylesheet = /<link rel="stylesheet" href="\/assets\/css\/sports-tools-theme\.css(?:\?v=[^"]+)?">/;
  if (!stylesheet.test(original)) throw new Error(`Missing final stylesheet on ${file}`);
  let next = original.replace(heroMeta, '').replace(intro, '');
  if (!themeStylesheet.test(next)) {
    next = next.replace(stylesheet, '$1<link rel="stylesheet" href="/assets/css/sports-tools-theme.css">');
  }
  if (next === original) continue;
  stale += 1;
  if (write) fs.writeFileSync(file, next);
}

console.log(`${write ? 'Updated' : 'Checked'} ${pages.length} sports tool pages; ${stale} ${write ? 'changed' : 'stale'}.`);
if (stale && !write) process.exitCode = 1;

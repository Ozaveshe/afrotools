'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ownerPath = path.join(root, 'scripts/upgrade-localized-agriculture-trust-batch.js');
const source = fs.readFileSync(ownerPath, 'utf8');
// Render only: the historical migration must not write over newer Swahili owners.
const boundary = source.indexOf('let changed = 0;');
assert(boundary > 0, 'Historical write boundary must be explicit');
const owner = new Module(ownerPath, module);
owner.filename = ownerPath;
owner.paths = module.paths;
owner._compile(source.slice(0, boundary) + '\nmodule.exports = { pages, scriptBlock };', ownerPath);
const pages = owner.exports.pages.filter(page => page.lang === 'ha');
assert.equal(pages.length, 3);
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  const actual = html.match(/<script data-localized-agriculture-batch="export-js">[\s\S]*?<\/script>/)?.[0];
  assert.equal(actual?.replace(/\r\n/g, '\n'), owner.exports.scriptBlock(page).replace(/\r\n/g, '\n'), page.file);
}
console.log('Three maintained Hausa report blocks match their owner without running migration writes.');

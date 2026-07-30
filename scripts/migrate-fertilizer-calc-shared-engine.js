#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'tools', 'fertilizer-calc', 'index.html');
const TAGS = [
  '<script src="/data/agriculture/fertilizer-calc-data.js"></script>',
  '<script src="/engines/fertilizer-calc-engine.js"></script>',
  '<script src="/assets/js/pages/fertilizer-calc-controller.js"></script>'
].join('\n');
let html = fs.readFileSync(FILE, 'utf8');
if (!html.includes('/assets/js/pages/fertilizer-calc-controller.js')) {
  const match = html.match(/<script>\s*var CROPS=\{[\s\S]*?\n\}\s*<\/script>/);
  assert(match, 'Legacy Fertilizer Calculator controller not found');
  html = html.replace(match[0], TAGS);
  fs.writeFileSync(FILE, html, 'utf8');
}
assert(html.includes(TAGS));
assert(!/var CROPS=\{/.test(html));
console.log('Fertilizer Calculator English page now uses the shared DOM-free engine and exact extracted dataset');

#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'tools', 'planting-calendar', 'index.html');
const DATA_TAG = '<script src="/data/agriculture/planting-calendar-data.js"></script>';
const ENGINE_TAG = '<script src="/engines/planting-calendar-engine.js"></script>';
const CONTROLLER_TAG = '<script src="/assets/js/pages/planting-calendar-controller.js"></script>';
let html = fs.readFileSync(FILE, 'utf8');

if (!html.includes(CONTROLLER_TAG)) {
  const match = html.match(/<script>\s*const MONTHS=\[[\s\S]*?\ngenerate\(\);\s*<\/script>/);
  assert(match, 'Legacy Planting Calendar controller not found');
  html = html.replace(match[0], [DATA_TAG, ENGINE_TAG, CONTROLLER_TAG].join('\n'));
  fs.writeFileSync(FILE, html, 'utf8');
}

assert(html.includes(DATA_TAG) && html.includes(ENGINE_TAG) && html.includes(CONTROLLER_TAG));
assert(!/const MONTHS=\[/.test(html));
console.log('Planting Calendar English page now uses the shared DOM-free engine and exact extracted dataset');

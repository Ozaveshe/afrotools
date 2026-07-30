#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FAMILY_DIR = path.join(ROOT, 'agriculture', 'vaccination-schedule');
const ENGINE_TAG = '<script src="/engines/vaccination-engine.js';
const RENDERER_TAG = '<script src="/assets/js/agriculture/vaccination-renderer.js"></script>';
const RESPONSIVE_STYLESHEET = '<link rel="stylesheet" href="/assets/css/agriculture/vaccination-responsive.css">';
const LEGACY_SW_HUMAN_ALTERNATE = '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/ratiba-ya-chanjo/">';
const SWAHILI_ALTERNATE = '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/ratiba-ya-chanjo-za-mifugo/">';

function transform(content, relativeFile) {
  if (path.basename(relativeFile) === 'index.html') {
    let next = content.replace(`${LEGACY_SW_HUMAN_ALTERNATE}\n`, '');
    if (next.includes(SWAHILI_ALTERNATE)) return next;
    const englishAlternate = '<link rel="alternate" hreflang="en" href="https://afrotools.com/agriculture/vaccination-schedule/">';
    if (!next.includes(englishAlternate)) {
      throw new Error(`${relativeFile} lacks the expected English alternate.`);
    }
    return next.replace(englishAlternate, `${englishAlternate}\n${SWAHILI_ALTERNATE}`);
  }
  if (!content.includes(ENGINE_TAG)) {
    throw new Error(`${relativeFile} does not load the vaccination engine.`);
  }

  let next = content;
  if (!next.includes(RESPONSIVE_STYLESHEET)) {
    next = next.replace('</head>', `${RESPONSIVE_STYLESHEET}\n</head>`);
  }
  if (!next.includes(RENDERER_TAG)) {
    next = next.replace(
      /(<script src="\/engines\/vaccination-engine\.js[^"]*"><\/script>)/,
      `$1\n${RENDERER_TAG}`
    );
  }
  if (!/var VE\s*=\s*window\.AfroTools\.VaccinationEngine;/.test(next)) {
    throw new Error(`${relativeFile} does not expose the expected English controller.`);
  }
  if (!/var VR\s*=\s*window\.AfroTools\.VaccinationRenderer;/.test(next)) {
    next = next.replace(
      /(var VE\s*=\s*window\.AfroTools\.VaccinationEngine;)/,
      '$1\n  var VR   = window.AfroTools.VaccinationRenderer;'
    );
  }
  next = next.replace(/\bVE\.renderCalendarGrid\(/g, 'VR.renderCalendarGrid(');
  next = next.replace(/\bVE\.renderScheduleTable\(/g, 'VR.renderScheduleTable(');
  next = next.replace(/\bVE\.renderCostTable\(/g, 'VR.renderCostTable(');
  next = next.replace(/\bVE\.renderGovInfo\(/g, 'VR.renderGovInfo(');
  return next;
}

function run({ check = false } = {}) {
  const files = fs.readdirSync(FAMILY_DIR)
    .filter(name => name.endsWith('.html'))
    .sort();
  let changed = 0;
  let migrated = 0;

  for (const name of files) {
    const relativeFile = path.posix.join('agriculture', 'vaccination-schedule', name);
    const file = path.join(FAMILY_DIR, name);
    const current = fs.readFileSync(file, 'utf8');
    const next = transform(current, relativeFile);
    if (name !== 'index.html') migrated += 1;
    if (current === next) continue;
    changed += 1;
    if (!check) fs.writeFileSync(file, next, 'utf8');
  }

  if (check && changed) {
    throw new Error(`${changed} English vaccination controllers are stale.`);
  }
  if (migrated !== 54) {
    throw new Error(`Expected 54 English country controllers, found ${migrated}.`);
  }
  console.log(JSON.stringify({ mode: check ? 'check' : 'write', migrated, changed }, null, 2));
}

if (require.main === module) {
  try {
    run({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { transform, run };

#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'agriculture/farm-size-converter/index.html');

function replaceFunction(source, name, replacement) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function ${name}.`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escape = false;
  let line = false;
  let block = false;
  let end = -1;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (line) { if (char === '\n') line = false; continue; }
    if (block) { if (char === '*' && next === '/') { block = false; index += 1; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') { line = true; index += 1; continue; }
    if (char === '/' && next === '*') { block = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) { end = index + 1; break; }
  }
  if (end < 0) throw new Error(`Unclosed function ${name}.`);
  return source.slice(0, start) + replacement + source.slice(end);
}

const CONVERT = `function convert() {
  var val = parseFloat(document.getElementById('inputVal').value);
  var fromKey = document.getElementById('fromUnit').value;
  var toKey = document.getElementById('toUnit').value;
  var model = FARM_SIZE_ENGINE.calculate({ amount: val, fromKey: fromKey, toKey: toKey }, FARM_SIZE_DATA);

  if (!model.ok) {
    document.getElementById('inputVal').focus();
    return;
  }
  window.FARM_SIZE_LAST_RESULT = model;

  document.getElementById('eqFrom').textContent = fmt(model.input.amount) + ' ' + model.fromUnit.name;
  document.getElementById('eqVal').textContent = fmt(model.result);
  document.getElementById('eqUnit').textContent = model.toUnit.name;

  var context = model.context;
  var ctxStr;
  if (context.code === 'smaller-than-tennis') ctxStr = 'About ' + fmt(context.squareMetres) + ' m² — smaller than a tennis court';
  else if (context.code === 'pitch-percent') ctxStr = 'About ' + fmt(context.percent) + '% of a football pitch';
  else if (context.code === 'pitch-about') ctxStr = 'About ' + fmt(context.pitches) + ' football pitches';
  else if (context.code === 'pitches') ctxStr = fmt(context.pitches) + ' football pitches';
  else ctxStr = fmt(context.pitches) + ' football pitches (' + fmt(context.squareKilometres) + ' km²)';
  document.getElementById('eqContext').textContent = '≈ ' + ctxStr;

  var ctxEl = document.getElementById('countryCtx');
  if (model.fromUnit.notes) {
    ctxEl.innerHTML = '<strong>About this unit:</strong> ' + model.fromUnit.notes;
    ctxEl.style.display = 'block';
  } else {
    ctxEl.style.display = 'none';
  }

  var grid = document.getElementById('resultGrid');
  grid.innerHTML = '';
  model.keyReferences.forEach(function(item) {
    var tile = document.createElement('div');
    tile.className = 'result-tile' + (item.highlight ? ' highlight' : '');
    tile.innerHTML =
      '<div class="rt-label">' + item.unit.name + '</div>' +
      '<div class="rt-val">' + fmt(item.value) + ' ' + item.unit.abbr + '</div>' +
      (item.key === 'football_pitch' ? '<div class="rt-sub">≈ ' + fmt(item.value) + ' pitches</div>' : '');
    grid.appendChild(tile);
  });

  var tbody = document.getElementById('refTableBody');
  tbody.innerHTML = '';
  model.table.forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + item.unit.name + '</td>' +
      '<td style="font-weight:700">' + fmt(item.value) + ' ' + item.unit.abbr + '</td>' +
      '<td><span class="cat-badge cat-' + item.category + '">' + CATEGORY_LABELS[item.category] + '</span></td>';
    tbody.appendChild(tr);
  });

  document.getElementById('results').classList.add('show');
  document.getElementById('results').scrollIntoView({behavior:'smooth', block:'start'});
}`;

function migrate(input) {
  let source = input;
  const marker = '<script>\n//';
  if (!source.includes('/engines/farm-size-engine.js')) {
    source = source.replace(
      marker,
      '<script src="/data/agriculture/farm-size-data.js"></script>\n<script src="/engines/farm-size-engine.js"></script>\n' + marker
    );
  }
  const dataStart = source.indexOf('var LAND_UNITS = {');
  const refsStart = source.indexOf('var KEY_REFS = [', dataStart);
  const dataEnd = source.indexOf(';', refsStart) + 1;
  if (dataStart < 0 || refsStart < 0 || dataEnd <= refsStart) throw new Error('Missing embedded Farm Size data.');
  source = source.slice(0, dataStart) +
    'var FARM_SIZE_DATA = window.AfroTools.FarmSizeData;\n' +
    'var FARM_SIZE_ENGINE = window.AfroTools.FarmSizeEngine;\n' +
    'var LAND_UNITS = FARM_SIZE_DATA.units;\n' +
    'var CATEGORY_LABELS = FARM_SIZE_DATA.categoryLabels;\n' +
    'var KEY_REFS = FARM_SIZE_DATA.keyRefs;' +
    source.slice(dataEnd);
  source = replaceFunction(source, 'convert', CONVERT);
  return source;
}

function run() {
  const current = fs.readFileSync(PAGE, 'utf8');
  const output = current.includes('/engines/farm-size-engine.js') ? current : migrate(current);
  if (process.argv.includes('--check')) {
    assert.equal(current, output);
    console.log('PASS Farm Size English shared-engine migration');
  } else {
    fs.writeFileSync(PAGE, output, 'utf8');
    console.log('Migrated Farm Size English page to shared owners');
  }
}

if (require.main === module) run();
module.exports = { migrate, replaceFunction };

#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var enginePath = path.join(__dirname, '..', 'assets', 'js', 'engines', 'igbo-market-days.js');
var source = fs.readFileSync(enginePath, 'utf8');
var sandbox = {
  window: { AfroTools: { engines: {} } },
  Intl: Intl,
  Date: Date,
  Math: Math,
  RegExp: RegExp,
  Number: Number,
  String: String,
  Object: Object,
  Array: Array,
  console: console
};

vm.runInNewContext(source, sandbox, { filename: 'igbo-market-days.js' });

var engine = sandbox.window.AfroTools.engines.igboMarketDays;
var failures = 0;

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    console.log('PASS', label);
    return;
  }

  failures += 1;
  console.error('FAIL', label, '| expected:', expected, '| actual:', actual);
}

function assert(condition, label) {
  if (condition) {
    console.log('PASS', label);
    return;
  }

  failures += 1;
  console.error('FAIL', label);
}

assertEqual(engine.getMarketDay('2026-01-01').name, 'Orie', '2026-01-01 maps to Orie');
assertEqual(engine.getMarketDay('2026-01-04').name, 'Eke', '2026-01-04 maps to Eke');
assertEqual(engine.getMarketDay('2026-01-05').name, 'Orie', '2026-01-05 maps to Orie');
assertEqual(engine.getMarketDay('2026-04-17').name, 'Nkwo', '2026-04-17 maps to Nkwo');

assertEqual(
  engine.getTodayDateKey('Africa/Lagos', new Date('2026-04-16T23:30:00Z')),
  '2026-04-17',
  'Africa/Lagos date key crosses into April 17'
);

assertEqual(
  engine.getTodayDateKey('America/New_York', new Date('2026-04-16T23:30:00Z')),
  '2026-04-16',
  'America/New_York date key stays on April 16'
);

assert(engine.filterMarkets({ state: 'Anambra', day: '3', query: '' }).length >= 3, 'Anambra + Nkwo filter returns multiple markets');
assert(engine.filterMarkets({ state: 'all', day: 'all', query: 'Emene' }).length === 1, 'Search by town narrows to Orie Emene');
assert(engine.filterMarkets({ state: 'all', day: 'all', query: 'Otuocha' }).length === 1, 'Search finds Eke Market Otuocha');
assert(engine.filterMarkets({ state: 'Imo', day: '3', query: '' }).length >= 3, 'Imo + Nkwo filter returns several named markets');
assert(engine.marketDirectory.length >= 20, 'Market directory keeps the expanded town set');
assert(engine.getSourceList().length >= 6, 'Source list includes anchor references plus market sources');

if (failures > 0) {
  process.exit(1);
}

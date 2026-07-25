#!/usr/bin/env node
'use strict';

// Every scheduled Netlify function must be require-able.
//
// `scheduled-send-jamb-daily` built its question pool at module scope:
//
//   const PRACTICE_POOL = (...).filter(isLaunchSafeQuestion);   // line 7
//   ...
//   const VISUAL_DEPENDENT_RE = /.../;                          // line 19
//
// isLaunchSafeQuestion is a hoisted function declaration so the call succeeded,
// but it dereferences VISUAL_DEPENDENT_RE, which `const` leaves in the temporal
// dead zone until line 19. Requiring the module threw before the handler was ever
// reached, so Netlify could not load the function: an hourly job that had never
// run once and never recorded scheduled proof. The automation-health monitor
// reported it as "missing" with no hint as to why.
//
// A module-level throw is invisible to every other check in this repo -- lint
// passes, the syntax is valid, and nothing imports these files. Loading them is
// the only thing that catches it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'netlify', 'functions');

function scheduledFunctionFiles() {
  return fs
    .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter(function (entry) {
      return entry.isFile()
        && entry.name.endsWith('.js')
        && /^(scheduled-|send-)/.test(entry.name);
    })
    .map(function (entry) { return entry.name; })
    .sort();
}

function run() {
  const files = scheduledFunctionFiles();
  assert.ok(files.length > 0, 'expected to discover scheduled function files');

  const failures = [];
  for (const name of files) {
    const full = path.join(FUNCTIONS_DIR, name);
    let mod;
    try {
      mod = require(full);
    } catch (error) {
      failures.push(name + ': ' + (error && error.message ? error.message : String(error)));
      continue;
    }
    if (typeof mod.handler !== 'function') {
      failures.push(name + ': module loaded but exports no handler function');
    }
  }

  assert.deepStrictEqual(
    failures,
    [],
    'scheduled functions must load and export a handler:\n  ' + failures.join('\n  ')
  );

  console.log('scheduled-functions-load.test.js passed (' + files.length + ' functions loaded)');
}

run();

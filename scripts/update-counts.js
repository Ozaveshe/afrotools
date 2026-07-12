#!/usr/bin/env node
'use strict';

/**
 * Compatibility entrypoint for the historical count-sync command.
 * Count ownership now lives in the canonical registry builder and every HTML
 * value is bound to an explicit data-registry-count selector.
 */

const { run } = require('./build-canonical-registry');

try {
  run({ write: process.argv.includes('--write') });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

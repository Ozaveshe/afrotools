#!/usr/bin/env node
'use strict';

/**
 * Compatibility entrypoint for the historical count-sync command.
 * Count ownership now lives in the canonical registry builder and every HTML
 * value is bound to an explicit data-registry-count selector.
 */

const { run } = require('./build-canonical-registry');
const canonicalRegistry = require('./lib/canonical-registry');

function getPublicCounts(registry = canonicalRegistry.buildCanonicalRegistry()) {
  return Object.fromEntries(registry.selectors.map((selector) => [selector.id, selector.value]));
}

function main(argv = process.argv.slice(2)) {
  return run({ write: argv.includes('--write') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { getPublicCounts, main };

"use strict";

function getEngineTerserOptions() {
  return {
    compress: {
      dead_code: true,
      drop_console: false,
      passes: 2,
    },
    mangle: {
      reserved: [
        "AFRO_TOOLS", "AFRO_CATEGORIES", "onRegistryReady",
        "SaveState", "renderSavedItems", "clearAllFavs",
      ],
    },
    output: {
      comments: /^!/,
    },
  };
}

function getEngineRecoveryOptions() {
  return {
    compress: false,
    mangle: false,
    format: {
      ascii_only: false,
      beautify: true,
      braces: true,
      comments: "all",
      indent_level: 2,
      semicolons: true,
    },
  };
}

// An engine source normally minifies to engines/<name>.js. These build to a
// different path because that is where the pages actually load them from.
//
// solar-roi is the only engine served out of assets/js/engines/. It used to
// exist in both places as byte-identical copies, one generated and one
// hand-committed, with only the generated one wired to this source — so the
// live file had no build link and the two could silently drift apart while the
// formula registry asserted a digest for each. The unused copy is gone and the
// live path is now the build output.
//
// Shared so scripts/minify.js and tests/engine-source-recovery.test.js cannot
// disagree about where a source is expected to land.
const ENGINE_OUTPUT_OVERRIDES = Object.freeze({
  "solar-roi-engine.js": "assets/js/engines/solar-roi-engine.js",
});

/** Repo-relative build output for an engine source file name. */
function engineOutputPath(sourceFileName) {
  return ENGINE_OUTPUT_OVERRIDES[sourceFileName] || `engines/${sourceFileName}`;
}

module.exports = {
  ENGINE_OUTPUT_OVERRIDES,
  engineOutputPath,
  getEngineRecoveryOptions,
  getEngineTerserOptions,
};

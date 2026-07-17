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

module.exports = {
  getEngineRecoveryOptions,
  getEngineTerserOptions,
};

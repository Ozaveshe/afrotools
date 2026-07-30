"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const controllerFile = path.join(
  root,
  "assets/js/pages/creative/african-palette-controller.js"
);
const engineFile = path.join(
  root,
  "engines/src/african-palette-engine.js"
);
const source = fs.readFileSync(controllerFile, "utf8");

if (source.includes("AfricanPaletteEngine is unavailable")) {
  process.stdout.write("african-palette already extracted\n");
  process.exit(0);
}

const currentStart = source.indexOf("var current=");
const helperStart = source.indexOf("function hexToRgb");
const renderStart = source.indexOf("function renderStyleGrid");
if (currentStart < 0 || helperStart < 0 || renderStart < 0) {
  throw new Error("African Palette extraction boundaries changed");
}

const paletteOwner = source.slice(0, currentStart);
const helpers = source.slice(helperStart, renderStart);
const engine = `(function (global) {
  "use strict";
${paletteOwner}${helpers}
  function getPalette(id) { return PALETTES[id] || null; }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.AfricanPaletteEngine = Object.freeze({
    palettes: PALETTES,
    getPalette: getPalette,
    hexToRgb: hexToRgb,
    luminance: luminance,
    contrastRatio: contrastRatio,
    isDark: isDark
  });
})(typeof window !== "undefined" ? window : globalThis);
`;
const controller = `var PALETTE_ENGINE=window.AfroTools&&window.AfroTools.AfricanPaletteEngine;
if(!PALETTE_ENGINE)throw new Error('AfricanPaletteEngine is unavailable');
var PALETTES=PALETTE_ENGINE.palettes;
var hexToRgb=PALETTE_ENGINE.hexToRgb;
var contrastRatio=PALETTE_ENGINE.contrastRatio;
var isDark=PALETTE_ENGINE.isDark;
${source.slice(currentStart, helperStart)}${source.slice(renderStart)}`;

fs.writeFileSync(engineFile, engine);
fs.writeFileSync(controllerFile, controller);
process.stdout.write("african-palette shared engine extracted\n");

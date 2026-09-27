#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { MANIFEST_PATH, writeRecipeIndex } = require("./lib/afrokitchen-recipe-index");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const outputPath = writeRecipeIndex(manifest);
console.log(`Built AfroKitchen published recipe index: ${outputPath}`);

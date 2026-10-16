#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { MANIFEST_PATH, writeRecipeIndex, projectPublicationEvidence } = require("./lib/afrokitchen-recipe-index");

let manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const evidenceArg = process.argv.find(arg => arg.startsWith("--eligibility-file="));
if (evidenceArg) {
  if (!process.argv.includes("--write")) throw new Error("Eligibility projection requires explicit --write");
  const bytes = fs.readFileSync(evidenceArg.slice("--eligibility-file=".length));
  manifest = projectPublicationEvidence(manifest, JSON.parse(bytes), bytes);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}
const outputPath = writeRecipeIndex(manifest);
console.log(`Built AfroKitchen published recipe index: ${outputPath}`);

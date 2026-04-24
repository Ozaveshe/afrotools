#!/usr/bin/env node
"use strict";

const {
  MANIFEST_PATH,
  buildManifest,
  writeManifest
} = require("./lib/africa-conflict-static");

async function main() {
  const manifest = await buildManifest();
  writeManifest(manifest, MANIFEST_PATH);

  console.log("Africa Conflict SEO manifest exported.");
  console.log(`Manifest path: ${MANIFEST_PATH}`);
  console.log(`Published conflicts: ${manifest.source.published_count}`);
  console.log(`Published African conflicts: ${manifest.source.published_african_count}`);
  console.log(`Generated dossier candidates: ${manifest.wave.conflict_count}`);
  console.log(`Excluded records: ${manifest.wave.exclusion_count}`);
  if (manifest.exclusions.length) {
    console.log("Exclusions:");
    manifest.exclusions.forEach((entry) => {
      console.log(`- ${entry.slug}: ${entry.blockers.join(", ")}`);
    });
  }
}

main().catch((error) => {
  console.error("Failed to export Africa Conflict SEO manifest.");
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

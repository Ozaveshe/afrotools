#!/usr/bin/env node

const path = require('path');
const api = require('./lib/localization-platform');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

if (process.argv.includes('--write-yoruba-client')) {
  const manifest = api.loadYorubaRouteManifest();
  const target = path.join(api.ROOT, 'assets', 'js', 'data', 'yoruba-route-manifest.js');
  const source = `(function(root){root.AfroToolsYorubaRouteManifest=${JSON.stringify(manifest)};})(typeof window!=="undefined"?window:globalThis);\n`;
  writeFileSyncWithRetry(target, source, 'utf8');
  console.log(`Generated ${path.relative(api.ROOT, target).replace(/\\/g, '/')} from data/registry/yoruba-route-manifest.json.`);
  process.exit(0);
}

const write = process.argv.includes('--write');
const check = process.argv.includes('--check') || !write;
const outcome = api.generateLocalizationArtifacts({ write });

if (!outcome.ok) {
  for (const entry of outcome.errors || []) console.error(api.formatIssue(entry));
  process.exitCode = 1;
} else {
  const mode = write ? 'generated' : 'validated';
  console.log(`Localization platform ${mode}: ${outcome.report.summary.rawPages} pages across ${Object.keys(outcome.report.byLocale).length} manifest locales.`);
  console.log(`Coverage: ${outcome.report.summary.native} native, ${outcome.report.summary.localizedShell} localized shells, ${outcome.report.summary.englishFallback} English fallbacks, ${outcome.report.summary.unavailable} unavailable, ${outcome.report.summary.deprecated} deprecated.`);
  if (write && outcome.changedFiles.length) console.log(`Updated: ${outcome.changedFiles.join(', ')}`);
  if (check) console.log('Locale manifest, shared catalogs, page coverage, Unicode catalog values, and generated artifacts are consistent.');
}

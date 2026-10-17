#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function createPlan(root = ROOT) {
  const dataset = require(path.join(root, 'data/energy/solar-roi-country-dataset.js'));
  const entries = Object.entries(dataset.countries);
  if (dataset.countryCount !== 54 || dataset.requiredCountryCount !== 54 || entries.length !== 54) {
    throw new Error('Solar input generation requires the existing exact 54-country dataset.');
  }
  const countries = entries.map(([code, country]) => {
    if (country.code !== code || !/^[a-z]+(?:-[a-z]+)*$/.test(country.slug)) {
      throw new Error('Invalid Solar country identity: ' + code);
    }
    return { code, slug: country.slug };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
  if (new Set(countries.map(country => country.slug)).size !== 54) {
    throw new Error('Solar country slugs must be unique.');
  }
  const outputs = ['tools/solar-roi/index.html'];
  for (const country of countries) {
    outputs.push('tools/solar-roi/' + country.slug + '/index.html');
    outputs.push('fr/tools/roi-solaire/' + country.slug + '/index.html');
  }
  for (const file of outputs) {
    if (!fs.statSync(path.join(root, file)).isFile()) throw new Error('Missing existing Solar surface: ' + file);
  }
  return {
    countries,
    outputs,
    commands: [
      ['scripts/generate-energy-x54.js', '--tool', 'solar-roi', '--countries-only'],
      ['scripts/generate-energy-x54.js', '--solar-root-selection-only'],
      ...countries.map(country => [
        'scripts/build-i18n.js', '--lang', 'fr', '--page', 'tools/solar-roi/' + country.slug, '--overwrite-existing'
      ])
    ]
  };
}

function main() {
  if (process.argv.slice(2).some(argument => argument !== '--dry-run')) {
    throw new Error('Solar input generation accepts only the optional --dry-run flag.');
  }
  const plan = createPlan();
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  // Build the maintained English controllers first. Explicit single-page i18n
  // then refreshes only their existing French counterparts. The following
  // fr:surface:build stage owns French country repair and visible copy, while
  // the remaining normal build owns metadata, assets, links and SEO.
  for (const args of plan.commands) {
    console.log('[solar-inputs] node ' + args.join(' '));
    const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('Solar input owner failed: ' + args[0] + ' (exit ' + result.status + ')');
  }
  console.log('Solar input owners completed: 54 English countries, the bounded English root, and 54 French countries.');
}

if (require.main === module) main();
module.exports = { createPlan };

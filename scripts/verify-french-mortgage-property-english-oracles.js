'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const startPortableServer = require('../tests/support/french-mortgage-property-static-server');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/registry/french-mortgage-property.json');
const frozen = require('../data/fixtures/french-mortgage-property-english-oracles.json');
const calculatorIds = new Set(require('../assets/js/engines/mortgage-property-english-owner').calculatorIds);

async function main() {
  assert.equal(frozen.status, 'pre-extraction-English-owner-oracles');
  assert.equal(frozen.count, 46);
  const stopServer = await startPortableServer();
  process.env.MP66_ORACLE_BASE_URL = process.env.MP66_BASE_URL;
  const { captureRow } = require('./capture-french-mortgage-property-english-oracles');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    for (const expected of frozen.rows.filter((row) => calculatorIds.has(row.englishId))) {
      const manifestRow = manifest.rows.find((row) => row.englishId === expected.englishId);
      assert(manifestRow, expected.englishId);
      const actual = await captureRow(page, manifestRow);
      assert.deepEqual(actual.inputFixture, expected.inputFixture, `${expected.englishId}: exact fixture`);
      assert.equal(actual.outputText, expected.outputText, `${expected.englishId}: pre-extraction output`);
      assert.equal(actual.outputSha256, expected.outputSha256, `${expected.englishId}: pre-extraction hash`);
      console.log(`${expected.englishId}: ${actual.outputSha256.slice(0, 12)} exact`);
    }
  } finally {
    await browser.close();
    await stopServer();
  }
  console.log('Verified all 10 calculator owners against frozen pre-extraction English DOM output.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

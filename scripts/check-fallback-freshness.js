'use strict';

const fs = require('fs');
const path = require('path');

const freshness = require('../netlify/functions/api-data-freshness')._test;
const { DATASETS, META_PATH, canonicalTimestamp } = require('./refresh-static-fallbacks');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(path.relative(process.cwd(), filePath) + ': ' + error.message);
  }
}

function checkFallbackFreshness(nowMs) {
  const errors = [];
  const meta = readJson(META_PATH);

  DATASETS.forEach(function (dataset) {
    const relativePath = path.relative(process.cwd(), dataset.filePath);
    let payload;
    try {
      payload = readJson(dataset.filePath);
    } catch (error) {
      errors.push(error.message);
      return;
    }

    const snapshotAsOf = canonicalTimestamp(payload);
    const metaAsOf = canonicalTimestamp(meta[dataset.category]);
    const config = freshness.CATEGORY_CONFIGS[dataset.category];
    const threshold = config && config.thresholds && config.thresholds.stale;

    if (!snapshotAsOf) errors.push(relativePath + ' has no valid freshness timestamp.');
    if (!metaAsOf) errors.push('data/_meta.json has no valid ' + dataset.category + ' freshness timestamp.');
    if (snapshotAsOf && metaAsOf && snapshotAsOf !== metaAsOf) {
      errors.push(relativePath + ' timestamp ' + snapshotAsOf + ' does not match data/_meta.json ' + metaAsOf + '.');
    }
    if (!Number.isFinite(threshold)) {
      errors.push('No stale threshold is configured for ' + dataset.category + '.');
      return;
    }
    if (snapshotAsOf) {
      const rawAge = (nowMs - new Date(snapshotAsOf).getTime()) / 60000;
      const age = freshness.ageMinutes(snapshotAsOf, nowMs);
      if (!Number.isFinite(rawAge) || rawAge < -5) {
        errors.push(relativePath + ' has an invalid or future timestamp (' + snapshotAsOf + ').');
      } else if (age > threshold) {
        errors.push(relativePath + ' is stale: ' + Math.round(age) + ' minutes old; limit is ' + threshold + ' minutes.');
      } else {
        console.log('Fresh: ' + relativePath + ' (' + Math.round(age) + 'm old; limit ' + threshold + 'm)');
      }
    }
  });

  return errors;
}

if (require.main === module) {
  const errors = checkFallbackFreshness(Date.now());
  if (errors.length) {
    console.error('Static fallback freshness check failed:\n- ' + errors.join('\n- '));
    process.exit(1);
  }
  console.log('Static fallback freshness check passed.');
}

module.exports = { checkFallbackFreshness };

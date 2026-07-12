#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const quality = require('./lib/calculation-quality');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const ACCEPT_CHANGE = process.argv.includes('--accept-formula-change');
const AS_OF_ARG = process.argv.find((arg) => arg.startsWith('--as-of='));
const REVIEW_ARG = process.argv.find((arg) => arg.startsWith('--review-file='));
const AS_OF = AS_OF_ARG ? AS_OF_ARG.slice('--as-of='.length) : new Date().toISOString().slice(0, 10);

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function writeFile(relativePath, content) {
  const absolute = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function changedFormulaIds(previous, next) {
  if (!previous) return [];
  const before = new Map(previous.formulas.map((formula) => [formula.id, formula]));
  return next.formulas
    .filter((formula) => before.has(formula.id) && before.get(formula.id).artifactDigest !== formula.artifactDigest)
    .map((formula) => formula.id)
    .sort();
}

function validateReviewFile(changedIds) {
  if (!ACCEPT_CHANGE) {
    throw new Error(
      'Protected formula artifacts changed: ' + changedIds.join(', ') + '. ' +
      'Do not refresh digests or fixtures automatically. Add a reviewed change record, then rerun with ' +
      '--accept-formula-change --review-file=<path>.'
    );
  }
  if (!REVIEW_ARG) throw new Error('--review-file is required with --accept-formula-change');
  const reviewPath = REVIEW_ARG.slice('--review-file='.length);
  const review = readJson(reviewPath);
  const required = ['reviewedBy', 'reviewedAt', 'sourceUrl', 'reason', 'formulaIds', 'fixtureDeltas'];
  for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(review, field)) throw new Error('Review file missing ' + field);
  }
  if (!/^https?:\/\//.test(review.sourceUrl)) throw new Error('Review sourceUrl must be an external HTTP(S) source');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt)) throw new Error('Review reviewedAt must be YYYY-MM-DD');
  const declared = review.formulaIds.slice().sort();
  if (JSON.stringify(declared) !== JSON.stringify(changedIds)) {
    throw new Error('Review formulaIds must exactly match changed formulas: ' + changedIds.join(', '));
  }
  if (!Array.isArray(review.fixtureDeltas)) throw new Error('Review fixtureDeltas must be an array');
  return review;
}

function preserveFixtureExpectations(previousFixtures, nextFixtures, allowChanges) {
  if (!previousFixtures || allowChanges) return nextFixtures;
  const before = new Map(previousFixtures.fixtures.map((fixture) => [fixture.id, fixture]));
  return {
    ...nextFixtures,
    fixtures: nextFixtures.fixtures.map((fixture) => {
      const previous = before.get(fixture.id);
      return previous ? { ...fixture, expected: previous.expected, formulaVersion: previous.formulaVersion, changeNote: previous.changeNote } : fixture;
    })
  };
}

function main() {
  const built = quality.buildQualityArtifacts(ROOT);
  const hasPrevious = exists(quality.QUALITY_FILES.formulas);
  const previousFormulas = hasPrevious ? readJson(quality.QUALITY_FILES.formulas) : null;
  const previousFixtures = exists(quality.QUALITY_FILES.fixtures) ? readJson(quality.QUALITY_FILES.fixtures) : null;
  const changedIds = changedFormulaIds(previousFormulas, built.formulas);
  let review = null;

  if (WRITE && changedIds.length) review = validateReviewFile(changedIds);
  built.fixtures = preserveFixtureExpectations(previousFixtures, built.fixtures, Boolean(review));
  if (review) built.fixtureDeltas = { $schema: './calculation-quality.schema.json#/$defs/FixtureDeltaRegistry', schemaVersion: 1, deltas: review.fixtureDeltas };

  if (WRITE) {
    for (const [key, relativePath] of Object.entries(quality.QUALITY_FILES)) {
      writeFile(relativePath, quality.stableJson(built[key]));
    }
    const report = quality.generateQualityReport(built, ROOT, AS_OF);
    writeFile('reports/calculation-quality-report.json', quality.stableJson(report));
    writeFile('reports/calculation-quality-report.md', quality.reportMarkdown(report));
    const errors = report.findings.filter((finding) => finding.severity === 'error');
    if (errors.length) {
      throw new Error('Wrote calculation-quality artifacts, but validation has ' + errors.length + ' error finding(s).');
    }
    console.log('Wrote calculation-quality system: ' + report.inventory.total + ' artifacts, ' + report.fixtures.total + ' golden fixtures, ' + report.traceability.mappedRoutes + '/' + report.traceability.protectedRoutes + ' protected routes mapped.');
    return;
  }

  const drift = [];
  for (const [key, relativePath] of Object.entries(quality.QUALITY_FILES)) {
    if (!exists(relativePath)) {
      drift.push(relativePath + ' missing');
      continue;
    }
    const expected = quality.stableJson(built[key]);
    const actual = quality.stableJson(readJson(relativePath));
    if (expected !== actual) drift.push(relativePath + ' is stale');
  }
  const committed = quality.loadQualityArtifacts(ROOT);
  const report = quality.generateQualityReport(committed, ROOT, AS_OF);
  const errors = report.findings.filter((finding) => finding.severity === 'error');
  if (drift.length || errors.length) {
    for (const item of drift) console.error('ERROR ' + item);
    for (const finding of errors) console.error('ERROR ' + finding.code + ' ' + finding.id + ': ' + finding.message);
    process.exit(1);
  }
  console.log('Calculation-quality check passed: ' + report.inventory.total + ' artifacts, ' + report.fixtures.passed + '/' + report.fixtures.total + ' fixtures, ' + report.externalData.stale.length + ' stale dataset warning(s).');
}

main();

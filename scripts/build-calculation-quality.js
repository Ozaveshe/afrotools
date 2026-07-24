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
const ONLY_FORMULAS_ARG = process.argv.find((arg) => arg.startsWith('--only-formula-ids='));
const AS_OF = AS_OF_ARG ? AS_OF_ARG.slice('--as-of='.length) : new Date().toISOString().slice(0, 10);
const ONLY_FORMULA_IDS = ONLY_FORMULAS_ARG
  ? ONLY_FORMULAS_ARG.slice('--only-formula-ids='.length).split(',').map((id) => id.trim()).filter(Boolean).sort()
  : [];

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

function changedFormulaRecordIds(previous, next) {
  if (!previous) return [];
  const before = new Map(previous.formulas.map((formula) => [formula.id, quality.stableJson(formula)]));
  return next.formulas
    .filter((formula) => before.has(formula.id) && before.get(formula.id) !== quality.stableJson(formula))
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

function mergeSelected(previous, next, collectionKey, idKey, selectionKey, selectedIds) {
  const replacements = new Map(next[collectionKey]
    .filter((item) => selectedIds.includes(item[selectionKey]))
    .map((item) => [item[idKey], item]));
  const previousIds = new Set(previous[collectionKey].map((item) => item[idKey]));
  const additions = next[collectionKey]
    .filter((item) => selectedIds.includes(item[selectionKey]) && !previousIds.has(item[idKey]));
  return {
    ...previous,
    [collectionKey]: previous[collectionKey]
      .filter((item) => !selectedIds.includes(item[selectionKey]) || replacements.has(item[idKey]))
      .map((item) => replacements.get(item[idKey]) || item)
      .concat(additions)
      .sort((a, b) => String(a[idKey]).localeCompare(String(b[idKey])))
  };
}

function mergeSelectedInventory(previous, next, selectedFormulaIds) {
  const isSelected = (engine) => (engine.formulaIds || []).some((id) => selectedFormulaIds.includes(id));
  const selectedArtifactPaths = new Set(next.engines.filter(isSelected).map((engine) => engine.artifactPath));
  return {
    ...previous,
    engines: previous.engines.filter((engine) => !isSelected(engine) && !selectedArtifactPaths.has(engine.artifactPath))
      .concat(next.engines.filter(isSelected))
      .sort((a, b) => a.id.localeCompare(b.id))
  };
}

function changedInventoryFormulaIds(previous, next, formulaIds) {
  const signature = (inventory, formulaId, selectedArtifactPaths) => quality.stableJson(
    inventory.engines.filter((engine) =>
      (engine.formulaIds || []).includes(formulaId) || selectedArtifactPaths.has(engine.artifactPath)
    )
  );
  return formulaIds.filter((formulaId) => {
    const selectedArtifactPaths = new Set(
      next.engines
        .filter((engine) => (engine.formulaIds || []).includes(formulaId))
        .map((engine) => engine.artifactPath)
    );
    return signature(previous, formulaId, selectedArtifactPaths) !== signature(next, formulaId, selectedArtifactPaths);
  });
}

function changedRouteMappingFormulaIds(previous, next, formulaIds) {
  const signature = (registry, formulaId) => quality.stableJson(
    (registry.routeMappings || []).filter((mapping) => mapping.formulaId === formulaId)
  );
  return formulaIds.filter((formulaId) => signature(previous, formulaId) !== signature(next, formulaId));
}

function supersededArtifactFormulaIds(previous, next, formulaIds) {
  const nextIds = new Set(next.formulas.map((formula) => formula.id));
  const selectedArtifacts = new Set(
    next.formulas
      .filter((formula) => formulaIds.includes(formula.id))
      .map((formula) => formula.artifactPath),
  );
  const hasSuperseded = previous.formulas.some((formula) =>
    selectedArtifacts.has(formula.artifactPath) && !nextIds.has(formula.id)
  );
  return hasSuperseded ? formulaIds.slice() : [];
}

function main() {
  const built = quality.buildQualityArtifacts(ROOT);
  const hasPrevious = exists(quality.QUALITY_FILES.formulas);
  const previousFormulas = hasPrevious ? readJson(quality.QUALITY_FILES.formulas) : null;
  const previousFixtures = exists(quality.QUALITY_FILES.fixtures) ? readJson(quality.QUALITY_FILES.fixtures) : null;
  const previousFixtureDeltas = exists(quality.QUALITY_FILES.fixtureDeltas) ? readJson(quality.QUALITY_FILES.fixtureDeltas) : null;
  const previousInventory = exists(quality.QUALITY_FILES.inventory) ? readJson(quality.QUALITY_FILES.inventory) : null;
  const changedIds = changedFormulaIds(previousFormulas, built.formulas);
  const changedRecordIds = changedFormulaRecordIds(previousFormulas, built.formulas);
  const changedInventoryIds = previousInventory
    ? changedInventoryFormulaIds(previousInventory, built.inventory, ONLY_FORMULA_IDS)
    : [];
  const changedRouteMappingIds = previousFormulas
    ? changedRouteMappingFormulaIds(previousFormulas, built.formulas, ONLY_FORMULA_IDS)
    : [];
  const supersededArtifactIds = previousFormulas
    ? supersededArtifactFormulaIds(previousFormulas, built.formulas, ONLY_FORMULA_IDS)
    : [];
  const reviewedIds = ONLY_FORMULA_IDS.length ? ONLY_FORMULA_IDS : changedIds;
  let review = null;

  if (ONLY_FORMULA_IDS.length) {
    const unchangedRequested = ONLY_FORMULA_IDS.filter((id) =>
      !changedRecordIds.includes(id) && !changedInventoryIds.includes(id)
      && !changedRouteMappingIds.includes(id) && !supersededArtifactIds.includes(id)
    );
    if (unchangedRequested.length === ONLY_FORMULA_IDS.length) {
      throw new Error('Requested formula ids are not changed: ' + unchangedRequested.join(', '));
    }
  }
  if (WRITE && reviewedIds.length) review = validateReviewFile(reviewedIds);
  built.fixtures = preserveFixtureExpectations(previousFixtures, built.fixtures, Boolean(review));
  if (review) {
    const reviewedFixtureIds = new Set(review.fixtureDeltas.map((delta) => delta.fixtureId));
    const carriedDeltas = ONLY_FORMULA_IDS.length && previousFixtureDeltas
      ? (previousFixtureDeltas.deltas || []).filter((delta) => !reviewedFixtureIds.has(delta.fixtureId))
      : [];
    built.fixtureDeltas = {
      $schema: './calculation-quality.schema.json#/$defs/FixtureDeltaRegistry',
      schemaVersion: 1,
      deltas: carriedDeltas.concat(review.fixtureDeltas),
    };
  }

  if (WRITE) {
    if (ONLY_FORMULA_IDS.length) {
      const selectedFormulaRecords = mergeSelected(previousFormulas, built.formulas, 'formulas', 'id', 'id', ONLY_FORMULA_IDS);
      const selectedArtifacts = new Set(
        built.formulas.formulas
          .filter((formula) => ONLY_FORMULA_IDS.includes(formula.id))
          .map((formula) => formula.artifactPath),
      );
      const nextFormulaIds = new Set(built.formulas.formulas.map((formula) => formula.id));
      selectedFormulaRecords.formulas = selectedFormulaRecords.formulas.filter((formula) =>
        !selectedArtifacts.has(formula.artifactPath) || nextFormulaIds.has(formula.id)
      );
      const selectedFormulas = mergeSelected(selectedFormulaRecords, built.formulas, 'routeMappings', 'toolId', 'formulaId', ONLY_FORMULA_IDS);
      const selectedFixtures = mergeSelected(previousFixtures, built.fixtures, 'fixtures', 'id', 'formulaId', ONLY_FORMULA_IDS);
      const selectedInventory = mergeSelectedInventory(previousInventory, built.inventory, ONLY_FORMULA_IDS);
      writeFile(quality.QUALITY_FILES.inventory, quality.stableJson(selectedInventory));
      writeFile(quality.QUALITY_FILES.formulas, quality.stableJson(selectedFormulas));
      writeFile(quality.QUALITY_FILES.fixtures, quality.stableJson(selectedFixtures));
      writeFile(quality.QUALITY_FILES.fixtureDeltas, quality.stableJson(built.fixtureDeltas));
      console.log('Accepted reviewed formula changes for: ' + ONLY_FORMULA_IDS.join(', ') + '. Unrelated formula drift was not modified.');
      return;
    }
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

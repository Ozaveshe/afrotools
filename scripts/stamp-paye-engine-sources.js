'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENGINE_DIR = path.join(ROOT, 'netlify', 'functions', '_engines');
const FORMULA_PATH = path.join(ROOT, 'data', 'calculation-quality', 'formula-registry.json');
const FIXTURE_PATH = path.join(ROOT, 'data', 'calculation-quality', 'golden-fixtures.json');
const SOURCE_REGISTRY_PATH = path.join(ROOT, 'data', 'source-registry.json');
const REPORT_PATH = path.join(ROOT, 'reports', 'paye-source-review-needs-review.json');
const STAMP_START = '  /* source-confidence-stamp:start */';
const STAMP_END = '  /* source-confidence-stamp:end */';

function atomicWrite(targetPath, content) {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = path.join(directory, '.' + path.basename(targetPath) + '.' + process.pid + '.' + Date.now() + '.tmp');
  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_cleanupError) {
      // Preserve the original write or rename error.
    }
    throw error;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function dateFromFormulaVersion(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})\+/);
  return match ? match[1] : null;
}

function addDays(dateValue, days) {
  if (!dateValue) return null;
  const date = new Date(dateValue + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function removeExistingStamp(source) {
  const pattern = new RegExp('^[ \\t]*/\\* source-confidence-stamp:start \\*/[\\s\\S]*?^[ \\t]*/\\* source-confidence-stamp:end \\*/\\r?\\n?(?:[ \\t]*\\r?\\n)?', 'gm');
  return source.replace(pattern, '');
}

function buildStamp(lines) {
  return [STAMP_START].concat(lines).concat([STAMP_END, '']).join('\n');
}

function stampEngine(source, metadata, relativePath) {
  let next = removeExistingStamp(source);
  const anchor = next.indexOf('createEngine({') >= 0 ? next.indexOf('createEngine({') : next.indexOf('module.exports = {');
  if (anchor < 0) throw new Error(relativePath + ' has no supported engine metadata block.');

  const head = next.slice(0, anchor);
  let body = next.slice(anchor);
  const existingLastUpdated = body.match(/^[ \t]*lastUpdated:\s*['"][^'"]+['"],?\r?$/m);

  if (existingLastUpdated) {
    const insertion = buildStamp([
      '  sourceCheckedOn: ' + (metadata.sourceCheckedOn ? "'" + metadata.sourceCheckedOn + "'" : 'null') + ',',
      '  nextReviewDate: ' + (metadata.nextReviewDate ? "'" + metadata.nextReviewDate + "'" : 'null') + ',',
    ]);
    const end = existingLastUpdated.index + existingLastUpdated[0].length;
    body = body.slice(0, end) + '\n' + insertion + body.slice(end).replace(/^\r?\n/, '\n');
  } else {
    const sourceLine = body.match(/^[ \t]*source:\s*[^\r\n]+,?\r?$/m);
    if (!sourceLine) throw new Error(relativePath + ' has no source field in its engine metadata block.');
    const insertion = buildStamp([
      "  lastUpdated: '" + metadata.lastUpdated + "',",
      '  sourceCheckedOn: ' + (metadata.sourceCheckedOn ? "'" + metadata.sourceCheckedOn + "'" : 'null') + ',',
      '  nextReviewDate: ' + (metadata.nextReviewDate ? "'" + metadata.nextReviewDate + "'" : 'null') + ',',
    ]);
    const end = sourceLine.index + sourceLine[0].length;
    body = body.slice(0, end) + '\n' + insertion + body.slice(end).replace(/^\r?\n/, '\n');
  }

  return head + body;
}

function main() {
  const formulaRegistry = readJson(FORMULA_PATH);
  const fixtureRegistry = readJson(FIXTURE_PATH);
  const sourceRegistry = readJson(SOURCE_REGISTRY_PATH);
  const payeSource = sourceRegistry.sources.find(function (source) {
    return source.id === 'paye-tax-engine-country-packs';
  });
  const cadenceDays = payeSource && payeSource.reviewCadenceDays ? payeSource.reviewCadenceDays : 90;
  const formulas = formulaRegistry.formulas.filter(function (formula) {
    return formula.formulaFamily === 'paye-server';
  });
  const formulasByCountry = new Map(formulas.map(function (formula) {
    return [formula.jurisdictions[0], formula];
  }));
  const fixtureVersions = new Map();
  fixtureRegistry.fixtures.forEach(function (fixture) {
    if (!fixture.formulaId || !fixture.formulaId.startsWith('paye-server-')) return;
    if (!fixtureVersions.has(fixture.formulaId)) fixtureVersions.set(fixture.formulaId, new Set());
    fixtureVersions.get(fixture.formulaId).add(fixture.formulaVersion);
  });

  const engineFiles = fs.readdirSync(ENGINE_DIR).filter(function (name) {
    return /-paye\.js$/.test(name);
  }).sort();
  if (engineFiles.length !== 53 || formulas.length !== 53) {
    throw new Error('Expected 53 PAYE engines and formulas; found ' + engineFiles.length + ' engines and ' + formulas.length + ' formulas.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const reportRows = [];

  engineFiles.forEach(function (name) {
    const country = name.slice(0, 2).toUpperCase();
    const formula = formulasByCountry.get(country);
    if (!formula) throw new Error('No paye-server formula found for ' + country + '.');
    const versions = fixtureVersions.get(formula.id) || new Set();
    if (!versions.has(formula.formulaVersion)) {
      throw new Error(formula.id + ' golden fixtures do not carry formulaVersion ' + formula.formulaVersion + '.');
    }

    const lastUpdated = dateFromFormulaVersion(formula.formulaVersion);
    if (!lastUpdated) throw new Error(formula.id + ' has no dated formulaVersion.');
    const hasAuditedSource = formula.verificationBasis === 'AfroTools source audit' &&
      Array.isArray(formula.sources) && formula.sources.some(function (source) {
        return source.authorityStatus === 'source-reviewed' && /^https?:\/\//.test(source.url || '');
      });
    const sourceCheckedOn = hasAuditedSource && /^\d{4}-\d{2}-\d{2}$/.test(formula.lastVerified || '')
      ? formula.lastVerified
      : null;
    const nextReviewDate = addDays(sourceCheckedOn, cadenceDays);
    const reasons = [];
    if (!sourceCheckedOn) reasons.push('missing-source-check');
    if (formula.effectiveDateStatus !== 'declared') reasons.push('effective-date-review-required');
    if (nextReviewDate && nextReviewDate < today) reasons.push('source-review-overdue');

    const filePath = path.join(ENGINE_DIR, name);
    const source = fs.readFileSync(filePath, 'utf8');
    const next = stampEngine(source, { lastUpdated, sourceCheckedOn, nextReviewDate }, 'netlify/functions/_engines/' + name);
    if (next !== source) atomicWrite(filePath, next);

    reportRows.push({
      country,
      engine: 'netlify/functions/_engines/' + name,
      formulaId: formula.id,
      formulaVersion: formula.formulaVersion,
      lastUpdated,
      sourceCheckedOn,
      nextReviewDate,
      needsReview: reasons.length > 0,
      reasons,
    });
  });

  const report = {
    schemaVersion: 1,
    generatedAt: today,
    reviewCadenceDays: cadenceDays,
    summary: {
      engines: reportRows.length,
      stamped: reportRows.length,
      needsReview: reportRows.filter(function (row) { return row.needsReview; }).length,
      missingSourceCheck: reportRows.filter(function (row) { return row.reasons.includes('missing-source-check'); }).length,
    },
    engines: reportRows,
  };
  atomicWrite(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log('Stamped ' + reportRows.length + '/53 PAYE engines; ' + report.summary.needsReview + ' remain flagged for source review.');
}

if (require.main === module) main();

module.exports = { atomicWrite, dateFromFormulaVersion, stampEngine };

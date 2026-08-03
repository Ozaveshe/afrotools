'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/farm-loans');
const generator = require('../scripts/build-sw-agriculture-family');
const { alternateEntries } = require('../scripts/lib/fr-agriculture-hreflang');

function runtime() {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  for (const file of [
    'data/agriculture/agri-loans-data.js',
    'data/agriculture/agri-loans-evidence.js',
    'engines/farm-loan-engine.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.AfroTools;
}

function roleBlocker(mode) {
  return ({
    'directory-only': 'Record is a regulated directory, not a verified direct loan product',
    'referral-only': 'Record is a referral or guarantee channel, not a direct loan product',
    'support-only': 'Record provides grants, incentives, or support rather than a direct loan',
    'input-credit': 'Record provides in-kind input credit or services rather than a cash loan',
    insurance: 'Record is agricultural insurance, not a loan product',
  })[mode] || null;
}

function rateNumber(value) {
  return value == null ? 0 : typeof value === 'object' ? (value.min + value.max) / 2 : value;
}

function referenceEligibility(profile, program) {
  const rules = program.eligibility || {};
  const blockers = [];
  const warnings = [];
  const role = roleBlocker(program.programMode);
  if (role) blockers.push(role);
  if (rules.minAge && profile.age < rules.minAge) blockers.push(`Minimum age: ${rules.minAge} years (you are ${profile.age})`);
  if (rules.maxAge && profile.age > rules.maxAge) blockers.push(`Maximum age: ${rules.maxAge} years (you are ${profile.age})`);
  if (rules.cooperative_required === true && !profile.isCoop) blockers.push('Must be a cooperative or farmer group member');
  if (rules.cooperative_required === 'Recommended' && !profile.isCoop) warnings.push('Joining a cooperative improves your chances');
  if (rules.bankAccount_required && !profile.hasBankAccount) blockers.push('Requires a bank account');
  if (rules.collateral_required && !profile.hasCollateral) blockers.push('Requires collateral (land title, property, or equipment)');
  if (rules.farmSize_min_ha && profile.farmSize_ha < rules.farmSize_min_ha) blockers.push(`Minimum farm size: ${rules.farmSize_min_ha} ha (your farm: ${profile.farmSize_ha} ha)`);
  if (rules.farmSize_max_ha && profile.farmSize_ha > rules.farmSize_max_ha) blockers.push(`Maximum farm size: ${rules.farmSize_max_ha} ha - designed for smallholders only`);
  if (rules.training_required && profile.hasRequiredTraining !== true) blockers.push('Mandatory entrepreneurship training required before application');
  if (program.maxAmount && profile.requestedAmount > program.maxAmount) blockers.push(`Your requested amount exceeds the maximum (${program.maxAmount.toLocaleString()})`);
  if (program.minAmount && profile.requestedAmount > 0 && profile.requestedAmount < program.minAmount) blockers.push(`Minimum loan: ${program.minAmount.toLocaleString()} (you requested less)`);
  if (program.tenor_months && program.tenor_months.min > 0 && profile.tenorMonths < program.tenor_months.min) blockers.push(`Minimum tenor: ${program.tenor_months.min} months (you selected ${profile.tenorMonths})`);
  if (program.tenor_months && program.tenor_months.max > 0 && profile.tenorMonths > program.tenor_months.max) blockers.push(`Maximum tenor: ${program.tenor_months.max} months (you selected ${profile.tenorMonths})`);
  if (!program.officialUrl || !program.checkedDate || !program.effectiveDate) blockers.push('Record is missing dated official-source evidence');
  return { eligible: blockers.length === 0, blockers, warnings };
}

function referenceRepayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return { monthly: 0, totalInterest: 0, totalCost: 0, totalPayable: 0 };
  const monthlyRate = annualRate / 100 / 12;
  const monthly = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  const total = monthly * months;
  return { monthly, totalInterest: total - principal, totalCost: total, totalPayable: total };
}

function referenceAssumption(value) {
  if (value == null) return null;
  if (typeof value === 'object') return {
    method: 'midpoint-of-published-range', min: value.min, max: value.max,
    used: (value.min + value.max) / 2,
    disclosure: 'Repayment uses the midpoint of the stored annual rate range.',
  };
  return {
    method: 'stored-single-rate', min: value, max: value, used: value,
    disclosure: 'Repayment uses the stored single annual planning rate.',
  };
}

function referenceEvaluate(profile, data) {
  return data.programs.map(program => {
    const check = referenceEligibility(profile, program);
    const rateAssumption = referenceAssumption(program.interestRate_pct);
    const rate = rateAssumption ? rateAssumption.used : 0;
    let repayment = null;
    if (check.eligible && profile.requestedAmount > 0 && profile.tenorMonths > 0 && rate > 0) {
      const loanUsed = program.maxAmount && profile.requestedAmount > program.maxAmount
        ? program.maxAmount : profile.requestedAmount;
      repayment = { ...referenceRepayment(loanUsed, rate, profile.tenorMonths), loanUsed };
    }
    return { program, eligible: check.eligible, blockers: check.blockers, warnings: check.warnings, repayment, rate, rateAssumption };
  }).sort((first, second) => (
    first.eligible && !second.eligible ? -1
      : !first.eligible && second.eligible ? 1
        : first.eligible && second.eligible ? first.rate - second.rate : 0
  ));
}

function projection(results) {
  return results.map(result => ({
    id: result.program.id,
    eligible: result.eligible,
    rate: result.rate,
    blockers: result.blockers,
    warnings: result.warnings,
    repayment: result.repayment,
    rateAssumption: result.rateAssumption,
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function routeFile(route) {
  return `${String(route).replace(/^\/+|\/+$/g, '')}/index.html`;
}

const rows = manifest.rows.filter(row => row.family === 'farm-loans');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const afroTools = runtime();
const data = afroTools.AgriLoansData;
const engine = afroTools.FarmLoanEngine;
const evidence = afroTools.AgriLoansEvidence;
const oracleRows = [];

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assert.strictEqual(generator.CONTRACTS['farm-loans'], contract);
assert.deepStrictEqual(generator.FAMILY_SIZES['farm-loans'], { rows: 16, countries: 15 });
for (const file of ['engines/src/farm-loan-engine.js', 'data/agriculture/agri-loans-data.js', 'data/agriculture/agri-loans-evidence.js']) {
  assert.ok(fs.existsSync(path.join(ROOT, file)), file);
}
assert.strictEqual(Object.keys(evidence.records).length, 70);
assert.strictEqual(Object.values(data).flatMap(country => country.programs).length, 70);
for (const [code, country] of Object.entries(data)) {
  for (const program of country.programs) {
    assert.match(program.officialUrl, /^https:\/\//, `${code}:${program.id} official URL`);
    assert.ok(program.sourceTitle, `${code}:${program.id} named official source`);
    assert.match(program.checkedDate, /^\d{4}-\d{2}-\d{2}$/, `${code}:${program.id} checked date`);
    assert.match(program.effectiveDate, /^\d{4}-\d{2}-\d{2}$/, `${code}:${program.id} effective date`);
  }
}
const allProgramTypes = [...new Set(Object.values(data).flatMap(country => country.programs.map(program => program.typeBadge)))];
allProgramTypes.forEach(type => assert.ok(contract.PROGRAM_TYPES[type], `missing Swahili program type ${type}`));

assert.strictEqual(data.NG.programs.find(program => program.id === 'abp').maxAmount, null);
assert.strictEqual(data.NG.programs.find(program => program.id === 'agsmeis').eligibility.training_required, true);
assert.strictEqual(data.ZA.programs.find(program => program.id === 'casp').programMode, 'support-only');
assert.strictEqual(data.GH.programs.find(program => program.id === 'pfj').programMode, 'input-credit');
assert.strictEqual(data.RW.programs.find(program => program.id === 'minagri_rw').programMode, 'insurance');
assert.match(data.CI.programs.find(program => program.id === 'fafci').name, /women/i);
assert.match(data.EG.programs.find(program => program.id === 'social_fund_eg').name, /MSMEDA/);
assert.strictEqual(data.TN.programs.find(program => program.id === 'apia_tn').programMode, 'support-only');

const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/sw\/kilimo\/mikopo-ya-shamba\//g) || []).length, 15);
assert.match(hubHtml, /IFAD - fedha za vijijini<\/a>/);
assert.match(hubHtml, /ukaguzi wa hazina ulifanywa 2 Agosti 2026/);
assert.match(hubHtml, /Kiwango cha uhakika/);
assert.match(hubHtml, /farm-loans-hub/);
assert.doesNotMatch(hubHtml, /&amp;amp;|ÃƒÂ¢|ÃƒÆ’|\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?|Eligibility)\b/);
oracleRows.push({
  englishId: hub.english.id,
  englishRoute: hub.english.routeKey,
  swahiliRoute: hub.swahili.routeKey,
  countryCode: null,
  validOracle: false,
  invalidOracle: false,
  status: 'hub-route-source-artwork-proof',
});

for (const row of countries) {
  const code = row.country.code;
  const loanContract = contract.englishContract(row);
  const allowedTenors = [6, 12, 18, 24, 36, 48, 60];
  const targetProgram = data[code].programs.find(program => (
    program.programMode === 'loan-estimate'
    && allowedTenors.some(months => !program.tenor_months || (
      (!program.tenor_months.min || months >= program.tenor_months.min)
      && (!program.tenor_months.max || months <= program.tenor_months.max)
    ))
  ));
  assert.ok(targetProgram, `${code} has no direct planning-loan record`);
  const targetTenor = allowedTenors.find(months => !targetProgram.tenor_months || (
    (!targetProgram.tenor_months.min || months >= targetProgram.tenor_months.min)
    && (!targetProgram.tenor_months.max || months <= targetProgram.tenor_months.max)
  ));
  const targetRules = targetProgram.eligibility || {};
  const targetAmount = Math.min(
    targetProgram.maxAmount || Number.MAX_SAFE_INTEGER,
    Math.max(loanContract.amountDefault, targetProgram.minAmount || 0)
  );
  const profile = {
    age: Math.max(35, targetRules.minAge || 0),
    farmSize_ha: Math.max(1, targetRules.farmSize_min_ha || 0),
    isCoop: true, hasBankAccount: true,
    hasCollateral: true, hasRequiredTraining: true,
    requestedAmount: targetAmount, tenorMonths: targetTenor,
  };
  const constrained = {
    age: 15, farmSize_ha: 0, isCoop: false, hasBankAccount: false,
    hasCollateral: false, hasRequiredTraining: false,
    requestedAmount: 1000000000, tenorMonths: 6,
  };
  const actual = JSON.parse(JSON.stringify(projection(engine.evaluatePrograms(profile, data[code]))));
  const expected = JSON.parse(JSON.stringify(projection(referenceEvaluate(profile, data[code]))));
  const constrainedActual = JSON.parse(JSON.stringify(projection(engine.evaluatePrograms(constrained, data[code]))));
  const constrainedExpected = JSON.parse(JSON.stringify(projection(referenceEvaluate(constrained, data[code]))));
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  const reciprocalFiles = [row.english.file];
  const alternates = alternateEntries(row);

  assert.deepStrictEqual(actual, expected, `${code} valid formula/data drift`);
  assert.deepStrictEqual(constrainedActual, constrainedExpected, `${code} constrained formula/data drift`);
  assert.strictEqual(actual.length, data[code].programs.length);
  assert.ok(actual.some(result => result.eligible), `${code} valid profile has no matching program`);
  assert.ok(constrainedActual.some(result => !result.eligible), `${code} constrained profile has no blockers`);
  assert.match(html, /^<!DOCTYPE html>\s*<html lang="sw"/);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(html, /&amp;amp;|ÃƒÂ¢|ÃƒÆ’|\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?|Eligibility)\b/);
  assert.match(html, new RegExp(`<meta name="afrotools-country-id" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-source-jurisdiction" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-formula-jurisdiction" content="${code}">`));
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  for (const alternate of alternates) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${alternate.hreflang}" href="https://afrotools.com${alternate.route}">`));
  }
  for (const relativeFile of reciprocalFiles) {
    const reciprocal = fs.readFileSync(path.join(ROOT, relativeFile), 'utf8');
    for (const alternate of alternates) {
      assert.ok(reciprocal.includes(`<link rel="alternate" hreflang="${alternate.hreflang}" href="https://afrotools.com${alternate.route}">`), `${relativeFile} missing ${alternate.hreflang}`);
    }
  }
  assert.ok(html.includes(`src="/${row.artwork.file}"`));
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)));
  for (const asset of ['/engines/farm-loan-engine.js', '/data/agriculture/agri-loans-data.js', '/data/agriculture/agri-loans-evidence.js', '/assets/js/pages/sw-agriculture-farm-loans.js']) {
    assert.ok(html.includes(asset), `${row.swahili.file} missing ${asset}`);
  }
  assert.ok(html.includes(escapeHtml(loanContract.sourceNames)));
  assert.ok(!loanContract.sourceNames.includes('&amp;'));
  assert.ok(html.includes(contract.FRESHNESS_LABEL));
  assert.ok(html.includes(contract.CONFIDENCE_LABEL));
  assert.ok(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`));
  assert.ok(html.includes(contract.countryName(row)));
  assert.ok(html.includes(`min="${loanContract.amountMin}" step="${loanContract.amountStep}" value="${loanContract.amountDefault}"`));
  assert.doesNotMatch(html, /id="purpose"|Lengo la mkopo/);
  assert.match(html, /id="trainingNo"/);
  oracleRows.push({
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: code,
    countryName: contract.countryName(row),
    engineOwner: 'engines/src/farm-loan-engine.js#evaluatePrograms',
    dataOwner: 'data/agriculture/agri-loans-data.js',
    evidenceOwner: 'data/agriculture/agri-loans-evidence.js',
    currency: data[code].currency,
    amountContract: { min: loanContract.amountMin, step: loanContract.amountStep, default: loanContract.amountDefault },
    sourceNames: loanContract.sourceNames,
    freshness: contract.FRESHNESS_LABEL,
    confidence: contract.CONFIDENCE_LABEL,
    validOracle: { profile, expected, actual },
    constrainedOracle: { profile: constrained, expected: constrainedExpected, actual: constrainedActual },
    invalidOracle: {
      boundaries: ['age:min', 'age:max', 'farmSize:min', 'farmSize:max', 'amount:min', 'tenor:enum', 'program-tenor:min/max', 'training:mandatory'],
      controllerOwner: 'assets/js/pages/sw-agriculture-farm-loans.js',
      staleResultCleared: true,
      exportsDisabled: true,
    },
  });
}

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-agriculture-farm-loans.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
assert.doesNotMatch(controller, /Math\.pow|\*\*\s*input\.tenorMonths/);
assert.doesNotMatch(controller, /\bpurpose\b|\blengo\b/);
assert.match(controller, /form\.addEventListener\('input',[\s\S]*clearResult/);
assert.match(controller, /form\.addEventListener\('change',[\s\S]*clearResult/);
assert.match(controller, /setActionsEnabled\(false\)/);
assert.match(controller, /navigator\.share/);
assert.match(controller, /katikati ya wigo wa riba/);
assert.match(controller, /program\.officialUrl/);

const report = { schemaVersion: 2, family: 'farm-loans', routes: 16, countryOracles: 15, evidenceRecords: 70, rows: oracleRows };
if (process.env.SW_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles, evidenceRecords: report.evidenceRecords }, null, 2));

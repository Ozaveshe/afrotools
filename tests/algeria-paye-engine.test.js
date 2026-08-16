const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../assets/js/engines/dz-paye.js');
const serverEngine = require('../netlify/functions/_engines/dz-paye.js');

const ROOT = path.join(__dirname, '..');
const DGI_SOURCE = 'https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires';
const CNAS_SOURCE = 'https://cnas.dz/fr/employeur/';

test('uses the six DGI salary bands from 0% through 35%', () => {
  assert.deepEqual(
    engine.constants.irgBands.map((band) => band.rate),
    [0, 0.23, 0.27, 0.30, 0.33, 0.35]
  );
  const result = engine.calculateProgressiveAnnual(5_000_000);
  assert.equal(result.bandBreakdown.at(-1).rate, 0.35);
  assert.equal(result.bandBreakdown.at(-1).income, 1_160_000);
});

test('applies the DGI monthly exemption and both salary-abatement paths', () => {
  assert.equal(engine.calculateMonthlyIrg(30_000).tax, 0);
  assert.ok(Math.abs(engine.calculateMonthlyIrg(35_000).tax - 2069.963235294117) < 0.001);
  assert.equal(engine.calculateMonthlyIrg(36_000).tax, 2208);
  assert.equal(engine.calculateMonthlyIrg(100_000).tax, 19_900);
});

test('calculates a regular annual salary with CNAS and transparent IRG abatements', () => {
  const result = engine.calculate(2_000_000);
  assert.equal(result.cnas, 180_000);
  assert.equal(result.taxableAnnual, 1_820_000);
  assert.equal(result.grossAnnualPAYE, 442_800);
  assert.equal(result.irgAbatementAnnual, 18_000);
  assert.equal(result.annualPAYE, 424_800);
  assert.equal(result.netAnnual, 1_395_200);
  assert.equal(result.annualGross, result.gross);
  assert.equal(result.annualNet, result.netAnnual);
  assert.equal(result.monthly, false);
});

test('uses the CNAS general-case employer split of 25% plus 0.5% social works', () => {
  const result = engine.calculate(2_000_000);
  assert.equal(result.empCNAS, 500_000);
  assert.equal(result.socialWorks, 10_000);
  assert.equal(result.totalEmployerCostAnnual, 2_510_000);
  assert.equal(result.limitations.employerReductionsIncluded, false);
});

test('keeps the Netlify engine aligned with the browser owner', () => {
  const browserResult = engine.calculate(2_000_000);
  const serverResult = serverEngine.calculate({ grossAnnual: 2_000_000 });
  assert.equal(serverResult.deductions.cnas, browserResult.cnas);
  assert.equal(serverResult.tax.netTax, browserResult.annualPAYE);
  assert.equal(serverResult.result.netAnnual, browserResult.netAnnual);
  assert.equal(serverResult.employer.cnas, browserResult.empCNAS);
  assert.equal(serverResult.employer.socialWorks, browserResult.socialWorks);
  assert.equal(serverEngine.sourceCheckedOn, '2026-08-17');
});

test('French page uses the reviewed engine, official links, and private local export', () => {
  const html = fs.readFileSync(path.join(ROOT, 'fr/algerie/calculateur-salaire-net.html'), 'utf8');
  assert.match(html, /window\.AlgeriaPayeEngine\.calculate\(/);
  assert.match(html, new RegExp(DGI_SOURCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, new RegExp(CNAS_SOURCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /onclick="generatePdf\(\)"/);
  assert.doesNotMatch(html, /function\s+calcAnnualPAYE\s*\(/);
  assert.doesNotMatch(html, /ai-advisor|gross_salary|pdf-leads|type="email"/i);
  assert.doesNotMatch(html, /CNAS employeur \(26%\)|Cotisation patronale 26%/i);
});

test('supports a zero baseline and rejects invalid gross salary', () => {
  assert.equal(engine.calculate(0).netAnnual, 0);
  assert.equal(engine.calculate(0).annualPAYE, 0);
  assert.match(engine.calculate(-1).error, /invalide/);
  assert.match(engine.calculate('bad').error, /invalide/);
});

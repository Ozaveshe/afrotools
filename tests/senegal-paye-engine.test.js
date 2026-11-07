const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ROOT = process.env.AFROTOOLS_SN_TEST_ROOT || path.join(__dirname, '..');
const engine = require(path.join(ROOT, 'assets/js/engines/sn-paye.js'));
const serverEngine = require(path.join(ROOT, 'netlify/functions/_engines/sn-paye.js'));

test('uses all seven current IRPP bands, including 43% above 50m XOF', () => {
  const result = engine.calculateIrpp(55_000_000);
  assert.equal(result.bandBreakdown.at(-1).rate, 0.43);
  assert.equal(result.bandBreakdown.at(-1).income, 5_000_000);
});

test('caps general-scheme IPRES at 5,184,000 XOF annually', () => {
  const result = engine.calculate(30_000_000);
  assert.equal(result.ipresBase, 5_184_000);
  assert.equal(result.ipres, 290_304);
  assert.equal(result.empIPRES, 435_456);
});

test('does not invent an employee CSS deduction', () => {
  const result = engine.calculate(7_500_000);
  assert.equal(result.css, 0);
  assert.equal(result.totalSocialContrib, result.ipres);
  assert.equal(result.limitations.cssEmployerIncluded, false);
});

test('marks family reduction and cadres supplement as excluded', () => {
  const result = engine.calculate(7_500_000);
  assert.equal(result.limitations.familyReductionIncluded, false);
  assert.equal(result.limitations.cadresSupplementIncluded, false);
});

test('rejects invalid gross salary', () => {
  assert.match(engine.calculate(0).error, /invalide/);
  assert.match(engine.calculate('bad').error, /invalide/);
});

test('keeps the server engine aligned with the reviewed browser formula', () => {
  const gross = 30_000_000;
  const browserResult = engine.calculate(gross);
  const serverResult = serverEngine.calculate({ grossAnnual: gross });

  assert.equal(serverResult.deductions.ipres, Math.round(browserResult.ipres));
  assert.equal(serverResult.tax.netTax, Math.round(browserResult.annualPAYE));
  assert.equal(serverResult.result.marginalRate, '40%');
  assert.equal(serverEngine.formulaParameters.socialSecurity[0].baseCap, 432_000);
});

test('French calculator page has one IRPP owner and no stale inline PAYE engine', () => {
  const html = fs.readFileSync(path.join(ROOT, 'fr/senegal/calculateur-salaire-net.html'), 'utf8');
  assert.match(html, /window\.SenegalPayeEngine\.calculate\(/);
  assert.match(html, /href="\/fr\/blog\/guide-irpp-senegal-2026\/"/);
  assert.doesNotMatch(html, /function\s+calcAnnualPAYE\s*\(/);
  assert.doesNotMatch(html, /40%\s+au-del[aà] de\s+13\s*500\s*000/i);
});

test('salary allowance represents pension costs instead of stacking with IPRES', () => {
  const withIpres = engine.calculate(7_500_000);
  const withoutIpres = engine.calculate(7_500_000, { includeIpres: false });
  assert.equal(withIpres.salaryAllowance, 900_000);
  assert.equal(withIpres.taxableAnnual, 6_600_000);
  assert.equal(withIpres.annualPAYE, 1_834_000);
  assert.equal(withIpres.netAnnual, 5_375_696);
  assert.equal(withoutIpres.annualPAYE, withIpres.annualPAYE);
  assert.equal(withoutIpres.netAnnual - withIpres.netAnnual, 290_304);
});

test('30 percent allowance caps at three million gross and is not a cash deduction', () => {
  assert.equal(engine.calculate(2_999_000).salaryAllowance, 899_700);
  assert.equal(engine.calculate(3_000_000).salaryAllowance, 900_000);
  assert.equal(engine.calculate(3_001_000).salaryAllowance, 900_000);
  const result = engine.calculate(1_200_000);
  assert.equal(result.salaryAllowance, 360_000);
  assert.equal(result.taxableAnnual, 840_000);
  assert.equal(result.annualPAYE, 42_000);
  assert.equal(result.netAnnual, 1_090_800);
  assert.equal(result.totalEmployeeDeductions, result.ipres + result.annualPAYE);
});

test('taxable rounding follows article 173 at the zero-rate boundary', () => {
  assert.equal(engine.calculateIrpp(630_999).tax, 0);
  assert.equal(engine.calculateIrpp(631_000).tax, 200);
});

test('40 percent band continues through 50 million and 43 percent begins above it', () => {
  assert.equal(engine.calculateIrpp(30_000_000).tax, 10_959_000);
  assert.equal(engine.calculateIrpp(50_000_000).tax, 18_959_000);
  assert.equal(engine.calculateIrpp(50_001_000).tax, 18_959_430);
});

test('browser and server agree across allowance, IPRES and upper-band boundaries', () => {
  for (const gross of [1_200_000, 2_999_000, 3_000_000, 3_001_000, 5_184_000, 7_500_000, 30_000_000, 50_900_000, 50_901_000, 60_000_000]) {
    for (const includeIpres of [true, false]) {
      const browser = engine.calculate(gross, { includeIpres });
      const server = serverEngine.calculate({ grossAnnual: gross, ipres: includeIpres });
      assert.equal(server.tax.taxableIncome, browser.taxableAnnual);
      assert.equal(server.tax.salaryAllowance, browser.salaryAllowance);
      assert.equal(server.tax.netTax, Math.round(browser.annualPAYE));
      assert.equal(server.result.netAnnual, Math.round(browser.netAnnual));
    }
  }
});

function runFrenchController(gross) {
  const vm = require('node:vm');
  const html = fs.readFileSync(path.join(ROOT, 'fr/senegal/calculateur-salaire-net.html'), 'utf8');
  const script = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi), m => m[1])
    .find(value => value.includes('function renderRows(R)'));
  assert.ok(script);
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '7500000', min: '500000', max: '100000000', style: {}, textContent: '', innerHTML: '',
      classList: { contains: () => true, add() {}, remove() {}, toggle() {} },
      addEventListener() {}, setAttribute() {}, removeAttribute() {}, scrollIntoView() {}, focus() {} });
    return nodes.get(id);
  }
  let printed;
  const context = vm.createContext({
    document: { documentElement: {}, getElementById: get, querySelectorAll: () => [], querySelector: selector => selector.startsWith('[data-tog=') ? get('ipres') : null },
    window: { SenegalPayeEngine: engine, open() { return null; } },
    getComputedStyle: () => ({ getPropertyValue: () => '' }), setTimeout() {},
    Chart: function () { this.destroy = () => {}; }, AfroChartColors: { doughnut: ['green', 'red', 'blue'] },
    Blob, URL: { createObjectURL(blob) { printed = blob; return 'blob:test'; }, revokeObjectURL() {} },
    alert(message) { throw new Error(message); }
  });
  vm.runInContext(script, context);
  get('grossSalary').value = String(gross);
  context.calculate();
  return { context, nodes, printed: () => printed.text() };
}

test('French result explains fiscal allowance separately from cash deductions', () => {
  const { context, nodes } = runFrenchController(7_500_000);
  assert.equal(context.RESULT.netAnnual, 5_375_696);
  const rendered = nodes.get('resContent').innerHTML;
  assert.ok(rendered.includes('Abattement salarial'));
  assert.ok(rendered.includes('sans retenue de trésorerie'));
  assert.equal((rendered.match(/IPRES/g) || []).length, 1);
  assert.ok(nodes.get('resAmount').textContent.replace(/\D/g, '').includes('5375696'));
});

test('French printable HTML uses the corrected tax base and charges IPRES once', async () => {
  const run = runFrenchController(7_500_000);
  run.context.generatePdf();
  const printed = await run.printed();
  assert.ok(printed.includes('Abattement fiscal (30%, plafond 900 000)'));
  const taxBaseSection = printed.slice(printed.indexOf('Section 1'), printed.indexOf('Section 2'));
  assert.ok(!taxBaseSection.includes('IPRES'), 'pension must not also be deducted from taxable base');
  assert.ok(taxBaseSection.replace(/\D/g, '').includes('6600000'));
  assert.ok(printed.replace(/\D/g, '').includes('5375696'));
  assert.ok(printed.includes('Réduction familiale et TRIMF non incluses'));
});

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

test('includes household taxes while keeping supplementary retirement out of scope', () => {
  const result = engine.calculate(7_500_000);
  assert.equal(result.limitations.familyReductionIncluded, true);
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
  assert.equal(withIpres.netAnnual, 5_357_696);
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
  assert.equal(result.netAnnual, 1_086_000);
  assert.equal(result.totalEmployeeDeductions, result.ipres + result.annualPAYE + result.trimf);
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

function runFrenchController(gross, values = {}) {
  const vm = require('node:vm');
  const html = fs.readFileSync(path.join(ROOT, 'fr/senegal/calculateur-salaire-net.html'), 'utf8');
  const script = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi), m => m[1])
    .find(value => value.includes('function renderRows(R)'));
  assert.ok(script);
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, { value: ({familyStatus:'single',dependentChildren:'0',soleTaxableEarner:'',spousesWithoutIncome:'',confirmedParts:'',confirmedTrimfPersons:''}[id] ?? '7500000'), min: '500000', max: '100000000', style: {}, textContent: '', innerHTML: '',
      classList: { contains: () => true, add() {}, remove() {}, toggle() {} },
      addEventListener() {}, setAttribute(key,value) { this[key]=value; }, removeAttribute() {}, scrollIntoView() {}, focus() { this.focused = true; } });
    return nodes.get(id);
  }
  let printed;
  const saved = { data: null, setData(data) { this.data = data; } };
  const shared = { style: {}, hidden: true, setResult(value) { this.result = value; } };
  const context = vm.createContext({
    document: { documentElement: {}, getElementById: get, querySelectorAll: () => [], querySelector: selector => selector.startsWith('[data-tog=') ? get('ipres') : selector === 'save-result-button' ? saved : selector === 'share-result-button' ? shared : null },
    window: { SenegalPayeEngine: engine, open() { return null; } },
    getComputedStyle: () => ({ getPropertyValue: () => '' }), setTimeout() {},
    Chart: function () { this.destroy = () => {}; }, AfroChartColors: { doughnut: ['green', 'red', 'blue'] },
    Blob, URL: { createObjectURL(blob) { printed = blob; return 'blob:test'; }, revokeObjectURL() {} },
    alert(message) { throw new Error(message); }
  });
  vm.runInContext(script, context);
  get('grossSalary').value = String(gross);
  for (const [id, value] of Object.entries(values)) get(id).value = value;
  context.calculate();
  return { context, nodes, saved, shared, printed: () => printed && printed.text() };
}

test('French result explains fiscal allowance separately from cash deductions', () => {
  const { context, nodes } = runFrenchController(7_500_000);
  assert.equal(context.RESULT.netAnnual, 5_357_696);
  const rendered = nodes.get('resContent').innerHTML;
  assert.ok(rendered.includes('Abattement salarial'));
  assert.ok(rendered.includes('sans retenue de trésorerie'));
  assert.equal((rendered.match(/IPRES/g) || []).length, 1);
  assert.ok(nodes.get('resAmount').textContent.replace(/\D/g, '').includes('446475'));
});

test('French printable HTML uses the corrected tax base and charges IPRES once', async () => {
  const run = runFrenchController(7_500_000);
  run.context.generatePdf();
  const printed = await run.printed();
  assert.ok(printed.includes('Abattement fiscal (30%, plafond 900 000)'));
  const taxBaseSection = printed.slice(printed.indexOf('Section 1'), printed.indexOf('Section 2'));
  assert.ok(!taxBaseSection.includes('IPRES'), 'pension must not also be deducted from taxable base');
  assert.ok(taxBaseSection.replace(/\D/g, '').includes('6600000'));
  assert.ok(printed.replace(/\D/g, '').includes('5357696'));
  assert.ok(printed.includes('Réduction familiale et TRIMF incluses'));
});


test('all nine family relief rows apply their own minimum, interior and maximum', () => {
  const rules = [[1,0,0,0],[1.5,.1,100000,300000],[2,.15,200000,650000],
    [2.5,.2,300000,1100000],[3,.25,400000,1650000],[3.5,.3,500000,2030000],
    [4,.35,600000,2490000],[4.5,.4,700000,2755000],[5,.45,800000,3180000]];
  for (const [parts, rate, min, max] of rules) {
    for (const grossTax of [0, 42000, 900000, 1834000, 5000000, 20000000]) {
      const expected = Math.min(grossTax, Math.max(min, Math.min(grossTax * rate, max)));
      const actual = engine.calculateFamilyRelief(grossTax, parts);
      assert.equal(actual.reduction, expected, `${parts} shares, ${grossTax} gross tax`);
      assert.equal(actual.netTax, grossTax - expected);
    }
  }
});

test('common family examples produce independent expected take-home amounts', () => {
  const examples = [
    [{familyStatus:'single'},1,0,1834000,18000,5357696],
    [{familyStatus:'married',dependentChildren:0,soleTaxableEarner:true,spousesWithoutIncome:1},2,275100,1558900,36000,5614796],
    [{familyStatus:'married',dependentChildren:2,soleTaxableEarner:false,spousesWithoutIncome:0},2.5,366800,1467200,18000,5724496],
    [{familyStatus:'married',dependentChildren:2,soleTaxableEarner:true,spousesWithoutIncome:1},3,458500,1375500,36000,5798196],
    [{familyStatus:'widowed',dependentChildren:2},2.5,366800,1467200,18000,5724496]
  ];
  for (const [opts,parts,reduction,tax,trimf,net] of examples) {
    const result = engine.calculate(7500000,opts);
    assert.deepEqual([result.familyParts,result.familyReduction,result.annualPAYE,result.trimf,result.netAnnual], [parts,reduction,tax,trimf,net]);
    const api = serverEngine.calculate({grossAnnual:7500000,...opts});
    assert.equal(api.tax.netTax,tax); assert.equal(api.deductions.trimf,trimf);
    assert.equal(api.result.netAnnual,net); assert.equal(api.result.netMonthly,Math.round(net/12));
  }
});

test('TRIMF bracket boundaries use gross, not the salary-allowance base', () => {
  for (const [gross,expected] of [[599999,900],[600000,3600],[999999,3600],[1000000,4800],
    [1999999,4800],[2000000,12000],[6999999,12000],[7000000,18000],[11999999,18000],[12000000,36000]]) {
    assert.equal(engine.calculate(gross).trimf,expected);
    assert.equal(serverEngine.calculate({grossAnnual:gross}).deductions.trimf,expected);
  }
});

test('taxable and any-income spouse questions are independent', () => {
  const opts={familyStatus:'married',dependentChildren:2,soleTaxableEarner:true,spousesWithoutIncome:0};
  const exemptIncomeSpouse=engine.calculate(7500000,opts);
  assert.equal(exemptIncomeSpouse.familyParts,3);
  assert.equal(exemptIncomeSpouse.trimfPersons,1);
  const twoSpouses=engine.calculate(7500000,{...opts,spousesWithoutIncome:2});
  assert.equal(twoSpouses.familyParts,3);
  assert.equal(twoSpouses.trimfPersons,3);
  assert.equal(twoSpouses.trimf,54000);
});

test('widow, child, cap and confirmed overrides do not invent family shares', () => {
  assert.equal(engine.calculate(7500000,{familyStatus:'widowed'}).familyParts,1);
  assert.equal(engine.calculate(7500000,{familyStatus:'widowed',dependentChildren:1}).familyParts,2);
  assert.equal(engine.calculate(7500000,{dependentChildren:20}).familyParts,5);
  const override=engine.calculate(7500000,{confirmedParts:1.5,confirmedTrimfPersons:0});
  assert.equal(override.familyParts,1.5);assert.equal(override.trimf,0);
  assert.equal(override.assumptions.confirmedTrimfPersons,0);
});

test('low-income relief stops at zero tax; published 6m example is independently corrected', () => {
  const opts={familyStatus:'married',soleTaxableEarner:true,spousesWithoutIncome:1};
  const low=engine.calculate(1200000,opts);
  assert.equal(low.familyReduction,42000);assert.equal(low.annualPAYE,0);
  assert.equal(low.trimf,9600);assert.equal(low.netAnnual,1123200);
  const six=engine.calculate(6000000,{...opts,dependentChildren:2});
  assert.equal(six.grossAnnualPAYE,1309000);assert.equal(six.familyReduction,400000);
  assert.equal(six.annualPAYE,909000);assert.equal(six.netAnnual,4776696);
});

test('IPRES changes cash only; family and TRIMF are independent of the toggle', () => {
  const opts={familyStatus:'married',dependentChildren:2,soleTaxableEarner:true,spousesWithoutIncome:1};
  const on=engine.calculate(7500000,opts),off=engine.calculate(7500000,{...opts,includeIpres:false});
  assert.equal(off.netAnnual-on.netAnnual,290304);
  for(const key of ['annualPAYE','familyReduction','salaryAllowance','trimf']) assert.equal(on[key],off[key]);
  assert.equal(serverEngine.calculate({grossAnnual:7500000,...opts,ipres:false}).result.netAnnual,off.netAnnual);
});

test('invalid and incomplete family inputs fail rather than silently assume a spouse has no income', () => {
  for(const opts of [{familyStatus:'married'},{familyStatus:'married',soleTaxableEarner:true},
    {dependentChildren:-1},{dependentChildren:1.5},{confirmedParts:1.2},{confirmedParts:6},
    {confirmedParts:true},{confirmedTrimfPersons:-1},{confirmedTrimfPersons:1.5},
    {spousesWithoutIncome:1},{familyStatus:'unknown'}]) {
    assert.ok(engine.calculate(7500000,opts).error,JSON.stringify(opts));
    assert.throws(()=>serverEngine.calculate({grossAnnual:7500000,...opts}),RangeError);
  }
});

test('actual French controller, save payload and printable result carry the same family assumptions', async () => {
  const run=runFrenchController(7500000,{familyStatus:'married',dependentChildren:'2',soleTaxableEarner:'yes',spousesWithoutIncome:'1'});
  assert.equal(run.context.RESULT.netAnnual,5798196);
  assert.equal(run.nodes.get('resAmount').textContent.replace(/\D/g,''),'483183');
  assert.equal(run.saved.data.inputs.household.dependentChildren,2);
  assert.equal(run.saved.data.outputs.trimf,36000);
  assert.match(run.nodes.get('resContent').innerHTML,/TRIMF/);
  run.context.generatePdf();const printed=await run.printed();
  assert.ok(printed.replace(/\D/g,'').includes('5798196'));
  assert.match(printed,/Parts fiscales : 3/);assert.match(printed,/TRIMF : 2 personne/);
});

test('editing salary, family or IPRES invalidates the actual controller result and save payload', () => {
  for(const action of ['salary','family','ipres']) {
    const run=runFrenchController(7500000);
    if(action==='salary')run.context.onInput(run.nodes.get('grossSalary'));
    if(action==='family')run.context.familyChanged();
    if(action==='ipres')run.context.togItem(run.nodes.get('ipres'));
    assert.equal(run.context.RESULT,null);assert.equal(run.saved.data,null);assert.equal(run.shared.hidden,true);
    run.context.generatePdf();assert.equal(run.printed(),undefined);
  }
});

test('family change clears stale confirmed overrides and unanswered married fields block a result', () => {
  const run=runFrenchController(7500000,{confirmedParts:'3',confirmedTrimfPersons:'0'});
  run.nodes.get('familyStatus').value='married';run.context.familyChanged();
  assert.equal(run.nodes.get('confirmedParts').value,'');assert.equal(run.nodes.get('confirmedTrimfPersons').value,'');
  run.context.calculate();assert.equal(run.context.RESULT,null);
  assert.match(run.nodes.get('calculationStatus').textContent,/Précisez/);
});


test('reverse calculation retains family options for a reachable ordinary salary', () => {
  const result=serverEngine.reverseCalculate({netAnnual:5798196,familyStatus:'married',dependentChildren:2,soleTaxableEarner:true,spousesWithoutIncome:1});
  assert.equal(result.result.netAnnual,5798196);
  assert.equal(result.tax.familyParts,3);assert.equal(result.deductions.trimf,36000);
});


test('annual-input reverse mode shows a monthly gross headline and keeps the net target unchanged', async () => {
  const run=runFrenchController(7500000,{familyStatus:'married',dependentChildren:'2',soleTaxableEarner:'yes',spousesWithoutIncome:'1'});
  const target=run.context.RESULT.netAnnual;
  run.context.setCalcMode('net');
  assert.equal(run.nodes.get('grossSalary').value,target);
  assert.equal(run.context.RESULT.targetNetAnnual,target);
  assert.equal(run.context.RESULT.calculationMode,'net');
  const result=run.context.RESULT;
  assert.ok(result.netAnnual>=target && result.netAnnual-target<1);
  assert.equal(Number(run.nodes.get('resAmount').textContent.replace(/\D/g,'')),Math.round(result.gross/12));
  assert.match(run.nodes.get('resultHeadlineLabel').textContent,/Brut mensuel/);
  assert.match(run.nodes.get('salarySliderLabel').textContent,/net annuel/);
  assert.match(run.nodes.get('salarySlider')['aria-label'],/net annuel/);
  assert.match(run.nodes.get('grossSalary')['aria-label'],/net annuel/);
  assert.match(run.nodes.get('salaryInputHint').textContent,/Après/);
  assert.equal(run.saved.data.inputs.targetNetAnnual,target);
  run.context.calculate();assert.equal(run.context.RESULT.targetNetAnnual,target);
  run.context.generatePdf();const pdf=await run.printed();
  assert.match(pdf,/Net annuel demandé/);assert.match(pdf,/Brut mensuel requis estimé/);
  run.context.setCalcMode('gross');
  assert.equal(run.context.RESULT.targetNetAnnual,null);
  assert.match(run.nodes.get('salaryInputHint').textContent,/Avant/);
  assert.match(run.nodes.get('salarySlider')['aria-label'],/brut annuel/);
  assert.equal(Number(run.nodes.get('resAmount').textContent.replace(/\D/g,'')),Math.round(run.context.RESULT.netAnnual/12));
});

test('explicit annual target 7.5m is not displayed as a monthly gross of 9.8m', () => {
  const run=runFrenchController(7500000,{familyStatus:'married',dependentChildren:'2',soleTaxableEarner:'yes',spousesWithoutIncome:'1'});
  run.context.setCalcMode('net');run.nodes.get('grossSalary').value='7500000';run.context.calculate();
  assert.ok(run.context.RESULT.gross>9000000 && run.context.RESULT.gross<11000000);
  const monthly=Number(run.nodes.get('resAmount').textContent.replace(/\D/g,''));
  assert.ok(monthly>750000 && monthly<1000000);
  assert.ok(run.context.RESULT.netAnnual>=7500000 && run.context.RESULT.netAnnual<7500001);
  assert.equal(run.nodes.get('grossSalary').value,'7500000');
});

test('page inverse independently re-evaluates targets across family cases and tax thresholds', () => {
  const run=runFrenchController(7500000);
  const cases=[{}, {familyStatus:'married',dependentChildren:2,soleTaxableEarner:true,spousesWithoutIncome:1},
    {familyStatus:'married',dependentChildren:2,soleTaxableEarner:false,spousesWithoutIncome:0},
    {familyStatus:'widowed',dependentChildren:2}, {confirmedParts:4,confirmedTrimfPersons:0}];
  for(const opts of cases)for(const includeIpres of [true,false])for(const gross of [600000,999999,1200000,2000000,6000000,6999999,7000000,7500000,12000000,60000000]){
    const forward=engine.calculate(gross,{...opts,includeIpres});
    const inverse=run.context.grossForAnnualNet(forward.netAnnual,{...opts,includeIpres});
    const checked=engine.calculate(inverse.gross,{...opts,includeIpres});
    assert.ok(checked.netAnnual>=forward.netAnnual && checked.netAnnual-forward.netAnnual<1);
  }
});


test('page reverse rejects huge or invalid annual targets before any forward call', () => {
  const run=runFrenchController(7500000);
  let calls=0;
  run.context.window.SenegalPayeEngine={calculate(){calls++;throw new Error('must not be called');}};
  for(const target of [1e16,Number.MAX_VALUE,Infinity,NaN,-1,0,1000000000001]) {
    assert.match(run.context.grossForAnnualNet(target,{}).error,/net annuel/);
  }
  assert.equal(calls,0);
});

test('page reverse propagates first, upper-bound and midpoint errors without stale output', () => {
  for(const failingCall of [1,2,3]) {
    const run=runFrenchController(7500000);let calls=0;
    run.context.window.SenegalPayeEngine={calculate(gross,opts){calls++;return calls===failingCall ? {error:'Paramètres non calculables'} : engine.calculate(gross,opts);}};
    assert.equal(run.context.grossForAnnualNet(5000000,{}).error,'Paramètres non calculables');
    assert.equal(calls,failingCall);
  }
  const run=runFrenchController(7500000);
  run.context.window.SenegalPayeEngine={calculate(){return {netAnnual:NaN};}};
  assert.match(run.context.grossForAnnualNet(5000000,{}).error,/moteur/);
});

test('huge target through the actual controller shows an error and clears saved/export result', () => {
  const run=runFrenchController(7500000);run.context.setCalcMode('net');
  run.nodes.get('grossSalary').value='10000000000000000';run.context.calculate();
  assert.equal(run.context.RESULT,null);assert.equal(run.saved.data,null);
  assert.match(run.nodes.get('calculationStatus').textContent,/ne pas dépasser/);
  assert.equal(run.nodes.get('grossSalary').focused,true);
  run.context.generatePdf();assert.equal(run.printed(),undefined);
});


test('internal Senegal zero-income contract models no employment and no TRIMF', () => {
  for(const opts of [{},{ipres:false},{familyStatus:'married'}]) {
    const result=serverEngine.calculate({grossAnnual:0,...opts});
    for(const amount of [result.tax.grossTax,result.tax.netTax,result.tax.salaryAllowance,result.deductions.ipres,result.deductions.trimf,result.deductions.totalDeductions,result.result.netAnnual,result.result.netMonthly,result.employer.totalCostAnnual]) assert.equal(amount,0);
    assert.equal(result.tax.trimf.liablePersons,0);
    assert.equal(result.input.household.noEmploymentIncome,true);
  }
  assert.equal(serverEngine.reverseCalculate({netAnnual:0}).result.netAnnual,0);
  assert.match(engine.calculate(0).error,/invalide/,'visitor calculator remains positive-salary only');
  for(const grossAnnual of [-1,Infinity,NaN,null,undefined,false,'']) assert.throws(()=>serverEngine.calculate({grossAnnual}),RangeError);
});

test('maintained paye-sn-zero golden fixture keeps all four expected zero selectors', () => {
  const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'data/calculation-quality/golden-fixtures.json'),'utf8'));
  const fixture=registry.fixtures.find(item=>item.id==='paye-sn-zero');
  assert.ok(fixture);assert.equal(fixture.input.grossAnnual,0);
  const actual=serverEngine.calculate({grossAnnual:fixture.input.grossAnnual});
  for(const [selector,expected] of Object.entries(fixture.expected)) {
    assert.equal(expected,0);
    assert.equal(selector.split('.').reduce((value,key)=>value[key],actual),expected);
  }
});

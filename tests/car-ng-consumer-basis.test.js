const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Price = require('../assets/js/lib/car-price-intelligence.js');
const Engine = require('../assets/js/lib/car-import-cost-engine.js');
const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
function fixture(extra={}) {
  const data=read('data/cars/price-intelligence.json');
  const vehicle=Object.assign({},Price.findVehicle(data,{make:'toyota',model:'corolla',year:2018}),{id:'synthetic-ng-car',year:2022,cc:[1800,1800],fuel:['petrol'],body:'sedan'},extra);
  data.vehicles=[vehicle];
  const imports=Engine.mergeData(read('data/trade/car-import-cost-core.json'),['ng','ke','gh','ug','zm','tz'].map(code=>read('data/trade/car-import-cost-'+code+'.json')),{NGN:1334.2233,KES:129.45,GHS:14.89,UGX:3720,ZMW:27.5,TZS:2650});
  function context(overrides) {return Price.buildVehicleContext(data,imports,{country:'nigeria',vehicle,overrides});}
  return {data,imports,vehicle,context};
}
function ui(priceOverride) {
  const source=fs.readFileSync(path.join(root,'assets/js/cars-directory.js'),'utf8');
  const tail='"loading"===document.readyState?document.addEventListener("DOMContentLoaded",U):U()}();';
  assert.equal(source.split(tail).length,2,'exact maintained bootstrap tail');
  const nodes=new Map();
  function node(id) {if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},querySelectorAll(){return[];},querySelector(){return null;}});return nodes.get(id);}
  const copies=[],csv=[],requests=[];
  const window={AfroCarPriceIntelligence:Price,AfroCarImportCost:Engine,AfroExport:{csv(rows,name){csv.push({rows,name});}}};
  const context={window,document:{readyState:'loading',addEventListener(){},querySelector:node,querySelectorAll(){return[];}},location:{pathname:'/cars/nigeria/toyota/corolla/2022/',hostname:'127.0.0.1',search:''},localStorage:{getItem(key){return key==='carPriceIntelligenceOverride'&&priceOverride?JSON.stringify(priceOverride):null;}},navigator:{clipboard:{writeText(text){copies.push(text);return Promise.resolve();}}},URL,URLSearchParams,Intl,Date,console,fetch(url){
    if(!priceOverride||!/^\/data\/[a-z0-9/-]+\.json$/.test(url))throw new Error('No network in consumer test');
    requests.push(url);return Promise.resolve({ok:true,json(){return Promise.resolve(read(url.slice(1)));}});
  }};
  const exposed='window.__consumer={state:r,costBreakdown:typeof costBreakdown==="function"?costBreakdown:null,customsSummary:typeof customsSummary==="function"?customsSummary:null,customsPanel:typeof customsPanel==="function"?customsPanel:null,customsCsv:typeof customsCsv==="function"?customsCsv:null,sourceComparisonCard:typeof sourceComparisonCard==="function"?sourceComparisonCard:null,renderBrowseCard,browse:C,start:U};';
  vm.runInNewContext(source.replace(tail,exposed+tail),context,{filename:'maintained-cars-directory.js'});
  return {api:window.__consumer,node,copies,csv,requests};
}
test('dated reference remains useful and exports its exact customs basis',()=>{
  const f=fixture(),c=f.context();
  assert.equal(c.landed.customsAssessment.status,'dated-reference');
  assert.equal(c.landed.customsAssessment.hsCode,'8703232000');
  assert.equal(c.landed.customsAssessment.observedAt,'2026-10-22');
  assert.match(c.landed.customsAssessment.sourceUrl,/tip\.nsw\.gov\.ng/);
  assert.equal(c.landed.customsAssessment.greenTax.amount,null);
  assert.equal(c.landed.comparable,false);assert.ok(c.landed.normal>0);
  assert.equal(c.aiContext.landedCost.normal,null);assert.equal(c.aiContext.landedCost.officialTaxesUsd,null);
  assert.equal(c.aiContext.landedCost.planningBudgetUsd,c.landed.normal);
  assert.deepEqual(c.aiContext.landedCost.customsAssessment,c.landed.customsAssessment);
  assert.equal(c.recommendation.status,'customs-assessment-needed');
  assert.match(c.recommendation.explanation,/dated NTIP/);
  assert.equal(c.financing.bestOffer,null);assert.equal(c.financing.offers.length,0);
  assert.ok(c.calculatorUrl.includes('/tools/car-import-cost/'));
});
test('unsupported classifications retain an explicit pre-tax subtotal, never zero assessed tax',()=>{
  for(const extra of [{fuel:['diesel']},{fuel:['ev']},{body:'pickup'},{cc:[1500,1500]}]) {
    const c=fixture(extra).context();
    assert.equal(c.landed.customsAssessment.status,'unsupported');assert.equal(c.landed.customsAssessment.totalNgn,null);
    assert.equal(c.landed.budgetLabel,'Pre-tax planning subtotal');assert.ok(c.landed.normal>0);
    assert.equal(c.aiContext.landedCost.normal,null);assert.equal(c.aiContext.landedCost.referenceOrEnteredChargesUsd,null);
    assert.equal(c.recommendation.status,'customs-assessment-needed');assert.equal(c.financing.bestOffer,null);
  }
});
test('unassessed and dated-reference budgets do not pass complete-landed budget filters',()=>{
  for(const extra of [{},{fuel:['diesel']}]) {
    const f=fixture(extra);
    assert.equal(Price.filterVehicles(f.data,{country:'nigeria'},f.imports).length,1,'still discoverable without a complete-budget constraint');
    assert.equal(Price.filterVehicles(f.data,{country:'nigeria',maxLanded:1e12},f.imports).length,0);
  }
});
test('a full assessment for a diesel car is preserved without inventing best/painful quote variants',()=>{
  const c=fixture({fuel:['diesel']}).context({ngAssessmentMode:'quoted-total',ngAssessmentNgn:'7920000.50',ngAssessmentDate:'2026-10-21',ngAssessmentSource:'Synthetic quote',asOfDate:'2026-10-22T12:00:00Z'});
  assert.equal(c.landed.customsAssessment.status,'user-assessment');assert.equal(c.landed.comparable,true);
  assert.equal(c.landed.best,c.landed.normal);assert.equal(c.landed.painful,c.landed.normal);
  assert.equal(c.aiContext.landedCost.customsAssessment.totalNgn,7920000.50);
  assert.equal(c.aiContext.landedCost.normal,c.landed.normal);
});
test('source comparisons identify their own basis and do not mix pre-tax totals into numeric ranking',()=>{
  const c=fixture({fuel:['diesel']}).context();
  const imports=c.sourceComparison.filter(row=>row.sourceMarket!=='local-dealer');
  assert.ok(imports.length>0);assert.ok(imports.every(row=>row.landed.comparable===false&&row.landed.budgetLabel==='Pre-tax planning subtotal'));
  const firstOrder=['japan','uae','uk','south-africa'].filter(name=>imports.some(row=>row.sourceMarket===name));
  assert.deepEqual(imports.map(row=>row.sourceMarket),firstOrder);
});
test('real directory rendering marks unavailable charges and preserves reference source/HS/date',()=>{
  const {api}=ui(),reference=fixture().context(),unsupported=fixture({fuel:['diesel']}).context();
  const missing=api.costBreakdown(unsupported);
  assert.match(missing,/Customs charges not assessed/);assert.match(missing,/>Not assessed</);assert.doesNotMatch(missing,/Official taxes/);
  assert.match(missing,/Pre-tax planning subtotal/);
  const panel=api.customsPanel(reference);
  assert.match(panel,/Dated NTIP reference budget/);assert.match(panel,/8703232000/);assert.match(panel,/2026-10-22/);
  assert.match(panel,/NTIP reference source/);assert.match(panel,/Green Tax/);
  const fields=api.customsCsv(reference);
  assert.equal(fields.customs_status,'dated-reference');assert.equal(fields.customs_hs_code,'8703232000');
  assert.equal(fields.customs_reference_observed,'2026-10-22');assert.equal(fields.complete_landed_comparison,false);
  assert.equal(fields.green_tax_amount,'');assert.ok(fields.planning_budget_usd>0);
});
test('assessment source text is escaped in rendered markup and retained literally in export fields',()=>{
  const {api}=ui(),c=fixture().context({ngAssessmentMode:'quoted-total',ngAssessmentNgn:'1',ngAssessmentDate:'2026-10-21',ngAssessmentSource:'Synthetic <img onerror="bad"> quote',asOfDate:'2026-10-22T12:00:00Z'});
  const panel=api.customsPanel(c);assert.doesNotMatch(panel,/<img/);assert.match(panel,/&lt;img/);
  assert.equal(api.customsCsv(c).customs_assessment_supplied_by,'Synthetic <img onerror="bad"> quote');
});
test('actual browse rendering excludes incomplete costs from cheapest-import picks without hiding the car',()=>{
  const {api,node}=ui(),f=fixture({fuel:['diesel']});
  api.state.priceData=f.data;api.state.importData=f.imports;api.state.marketData={observations:[]};api.state.filters={country:'nigeria'};
  api.browse({type:'country',country:'nigeria'});
  const html=node('#carsApp').innerHTML;
  assert.match(html,/Pre-tax planning subtotal/);assert.match(html,/View prices/);assert.match(html,/Customs assessment needed/);
  const lowest=html.slice(html.indexOf('Lowest landed cost'),html.indexOf('Best resale band'));
  assert.doesNotMatch(lowest,/Corolla/,'not ranked as a cheapest complete import');
});
test('genuine loader/detail/copy/CSV handlers keep dated customs metadata and planning numbers',async()=>{
  const f=fixture(),view=ui(f.data);view.api.start();await new Promise(setImmediate);
  const html=view.node('#carsApp').innerHTML;
  assert.match(html,/Dated NTIP reference budget/);assert.match(html,/8703232000/);assert.match(html,/2026-10-22/);assert.match(html,/NTIP reference source/);
  view.node('#carsCopySummary').listeners.click();await Promise.resolve();
  assert.match(view.copies[0],/NTIP reference checked 2026-10-22/);assert.match(view.copies[0],/Green Tax/);
  view.node('#carsExportCsv').listeners.click();const row=view.csv[0].rows[0];
  assert.equal(row.landed_normal_usd,'');assert.equal(row.complete_landed_comparison,false);assert.ok(row.planning_budget_usd>0);
  assert.equal(row.customs_hs_code,'8703232000');assert.equal(row.customs_reference_observed,'2026-10-22');assert.match(row.customs_reference_source,/tip\.nsw\.gov\.ng/);
  assert.equal(row.green_tax_amount,'');assert.ok(view.requests.every(url=>url.startsWith('/data/')));
});
test('genuine unsupported-class detail/copy/CSV presents unassessed customs, not a complete import quote',async()=>{
  const f=fixture({fuel:['diesel']}),view=ui(f.data);view.api.start();await new Promise(setImmediate);
  const html=view.node('#carsApp').innerHTML;assert.match(html,/Pre-tax planning subtotal/);assert.match(html,/>Not assessed</);assert.doesNotMatch(html,/>Official taxes</);
  view.node('#carsCopySummary').listeners.click();await Promise.resolve();assert.match(view.copies[0],/Pre-tax planning subtotal/);assert.match(view.copies[0],/Customs charges not assessed/);
  view.node('#carsExportCsv').listeners.click();const row=view.csv[0].rows[0];assert.equal(row.customs_status,'unsupported');assert.equal(row.customs_reference_observed,'');assert.equal(row.customs_reference_source,'');assert.equal(row.customs_charge_total_ngn,'');assert.equal(row.landed_normal_local,'');assert.ok(row.planning_budget_local>0);assert.equal(row.monthly_finance_local,'');
});

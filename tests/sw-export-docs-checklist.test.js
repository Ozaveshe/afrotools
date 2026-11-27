'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{test}=require('node:test');
const api=require('../engines/src/agriculture-export-docs-controller');
const served=require('../engines/agriculture-export-docs-controller');
const context={window:{AfroTools:{}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/agriculture/export-docs-data.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(require.resolve('../data/agriculture/country-index.js'),'utf8'),context);
const data=context.window.AfroTools.exportDocsData,countries=context.window.AfroTools.countryIndex;
const preserved=fs.readFileSync(require.resolve('./fixtures/export-docs-selection-82234951.txt'),'utf8');
const start=preserved.indexOf('    function generateChecklist() {'),end=preserved.indexOf('\n    // ── Render results',start);
assert.ok(start>0&&end>start,'exact accepted English selection boundary');
const original=preserved.slice(start,end);
const transportStart=preserved.indexOf('  var oceanReference ='),transportEnd=preserved.indexOf('  // ── Wait for DOM');
const oldSelect=vm.compileFunction(preserved.slice(transportStart,transportEnd)+original+'\nreturn generateChecklist();',['data','specific','tradeBloc','selProduct','selDest','selShipment']);

test('all supported countries/modes/destinations retain accepted English selection fields',()=>{
  const before=JSON.stringify(data);let count=0;
  for(const country of countries){
    const specific=data.countrySpecific[country.code]||{},products=[...new Set([country.topCrops[0],'other',...Object.keys(specific.commodityDocs||{})])];
    for(const product of products)for(const destination of ['africa','eu','us','middle_east','asia','other'])for(const shipment of ['road','air','container','lcl']){
      if(product!=='other'&&!country.topCrops.includes(product))continue;
      const baseline=oldSelect(data,specific,specific.tradeBloc||'AFCFTA',{value:product},{value:destination},{value:shipment});
      const next=api.build({countryCode:country.code,product,destination,shipment},data,countries);
      assert.equal(JSON.stringify(next),JSON.stringify(baseline),[country.code,product,destination,shipment].join('/'));assert.equal(JSON.stringify(served.build({countryCode:country.code,product,destination,shipment},data,countries)),JSON.stringify(next),'paired served selection parity');assert.equal(new Set(next.map(item=>JSON.stringify([item.source||'',item.doc.id||'',item.doc.name||'']))).size,next.length,'distinct stable reference identities');count++;
    }
  }
  assert.equal(JSON.stringify(data),before,'shared data not mutated');
  console.log('Accepted English full-field selection comparisons:',count);
});

test('Kenya maize road and tea EU air retain one matching transport reference',()=>{
  const road=api.build({countryCode:'KE',product:'maize',destination:'africa',shipment:'road'},data,countries);
  const air=api.build({countryCode:'KE',product:'tea',destination:'eu',shipment:'air'},data,countries);
  for(const [rows,phrase] of [[road,'Road consignment'],[air,'Air waybill']]){
    const transport=rows.filter(x=>x.doc.id==='bill_of_lading');assert.equal(transport.length,1);assert.ok(transport[0].doc.name.includes(phrase));
  }
  assert.ok(air.some(x=>x.doc.id==='ktda_num'));
  assert.ok(air.some(x=>x.doc.id==='eu_traces'));
  assert.ok(road.some(x=>x.doc.id==='phytosanitary')&&road.some(x=>x.doc.id==='kephis_cert'),'overlap kept as references, not silently merged');
});

test('invalid country/product/destination/prototype shipment cannot select requirements',()=>{
  const input={countryCode:'KE',product:'maize',destination:'africa',shipment:'road'};
  for(const key of Object.keys(input))assert.throws(()=>api.build({...input,[key]:'constructor'},data,countries));
});

const locale=require('../assets/js/pages/sw-export-docs-checklist');
const directoryEngine=require('../engines/src/export-docs-directory-engine');
const directory=directoryEngine.buildDirectory(countries,context.window.AfroTools.regionLabels,Object.keys(context.window.AfroTools.regionLabels));
const deps={countries,directory,data,build:api.build,search:directoryEngine.search};
test('locale report reopens legacy directories and recomputes new checklists without trusting stored result',()=>{
  const base={schemaVersion:1,tool:'export-docs',locale:'sw',input:{query:'Kenya'},result:{rows:[{name:'untrusted'}]}};
  const old=locale.restoreReport(base,deps);assert.equal(old.result.mode,'directory');assert.equal(old.result.rows[0].code,'KE');assert.equal(old.checked.length,0);
  const selection={query:'Kenya',countryCode:'KE',product:'tea',destination:'eu',shipment:'air'};
  const next=locale.restoreReport({...base,input:selection,result:{docs:[{name:'untrusted'}]},checked:[locale.docKey(api.build(selection,data,countries)[0]),locale.docKey(api.build(selection,data,countries)[0]),999,-1,'1']},deps);
  assert.ok(next.result.docs.some(x=>x.doc.name.includes('Air waybill')));assert.deepEqual(next.checked,[locale.docKey(api.build(selection,data,countries)[0])]);
  const roadKey=locale.docKey(api.build({...selection,shipment:'road'},data,countries).find(x=>x.source==='transport-mode'));
  assert.deepEqual(locale.restoreReport({...base,input:selection,checked:[roadKey]},deps).checked,[],'a checked road reference cannot mark an air reference checked');
  assert.throws(()=>locale.restoreReport({...base,input:{...selection,shipment:'constructor'}},deps));
  assert.throws(()=>locale.restoreReport({...base,locale:'en'},deps));
  assert.throws(()=>locale.restoreReport({...base,input:{query:[]}},deps));
});

test('Swahili purposes preserve names/transport selection and do not assert duplicate certificates',()=>{
  const input={countryCode:'KE',product:'maize',destination:'africa',shipment:'road'};
  for(const item of api.build(input,data,countries))assert.equal(typeof locale.purpose(item,input),'string');
  const transport=api.build(input,data,countries).find(x=>x.source==='transport-mode');assert.match(locale.purpose(transport,input),/barabara/);
  assert.doesNotMatch(locale.purpose(transport,input),/ndege|bahari/i);
  assert.match(locale.purpose({doc:{id:'constructor'}},input),/Rejea maalumu/);
  const before=JSON.stringify(data);locale.restoreReport({schemaVersion:1,tool:'export-docs',locale:'sw',input,checked:[]},deps);assert.equal(JSON.stringify(data),before);
});

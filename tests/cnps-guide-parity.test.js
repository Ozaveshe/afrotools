'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const engine=require('../engines/src/cnps-guide-engine.js');
const root=path.resolve(__dirname,'..');
function input(overrides){return Object.assign({agency:'ci-cnps',task:'employer',actor:'employer',workerBand:'not-applicable',asOfDate:'2026-08-09',privacyConfirmed:true,officialSubmissionConfirmed:true,receiptPlanConfirmed:true,riskRateConfirmed:false,currentSourceConfirmed:false},overrides||{});}

test('all seven country-specific tasks produce complete four-step plans',()=>{
  for(const task of ['employer','worker','branches','ceilings','remit','disa','independent']){
    const overrides={task:task};
    if(['branches','ceilings','remit'].includes(task))overrides.riskRateConfirmed=true;
    if(task==='remit')overrides.workerBand='20-plus';
    if(task==='independent')overrides.actor='independent';
    const plan=engine.calculate(input(overrides));
    assert.equal(plan.decision,'prepare-and-open-official-route',task);
    assert.equal(plan.checklist.length,4,task);
    assert.match(plan.officialUrl,/^https:\/\/(?:www\.)?(?:cnps\.ci|e\.cnps\.ci)\//,task);
  }
});

test('country and agency mismatch fails closed',()=>{
  const plan=engine.calculate(input({agency:'other-agency'}));
  assert.equal(plan.decision,'stop-and-confirm');
  assert.match(plan.stopReasons.join(' '),/only CNPS Côte d’Ivoire/);
});

test('remittance schedule requires a worker band and assigned risk rate',()=>{
  const unknown=engine.calculate(input({task:'remit',workerBand:'unknown'}));
  assert.equal(unknown.schedule,'unresolved');
  assert.match(unknown.stopReasons.join(' '),/worker-count band/);
  assert.match(unknown.stopReasons.join(' '),/sector-assigned/);
  assert.equal(engine.calculate(input({task:'remit',workerBand:'20-plus',riskRateConfirmed:true})).schedule,'monthly');
  assert.equal(engine.calculate(input({task:'remit',workerBand:'under-20',riskRateConfirmed:true})).schedule,'quarterly');
});

test('independent-worker route requires confirmed RSTI actor identity',()=>{
  assert.equal(engine.calculate(input({task:'independent',actor:'unsure'})).decision,'stop-and-confirm');
  assert.equal(engine.calculate(input({task:'independent',actor:'independent'})).decision,'prepare-and-open-official-route');
});

test('source review expires after 90 days unless official pages are reconfirmed',()=>{
  assert.throws(()=>engine.calculate(input({asOfDate:'2026-12-01'})),/older than 90 days/);
  assert.equal(engine.calculate(input({asOfDate:'2026-12-01',currentSourceConfirmed:true})).sourceStatus,'user-reconfirmed-after-review-window');
});

test('English and Swahili owners expose the same private local workflow',()=>{
  const en=fs.readFileSync(path.join(root,'tools/cnps-guide/index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw/zana/mwongozo-wa-cnps/index.html'),'utf8');
  for(const html of [en,sw]){
    for(const name of ['agency','task','actor','workerBand','asOfDate','privacyConfirmed','officialSubmissionConfirmed','receiptPlanConfirmed','riskRateConfirmed','currentSourceConfirmed'])assert.match(html,new RegExp(`name="${name}"`));
    for(const action of ['reset','save','load','import','copy','json','txt','pdf'])assert.match(html,new RegExp(`data-action="${action}"`));
    assert.match(html,/engines\/cnps-guide-engine\.js/);
    assert.doesNotMatch(html,/<iframe|name="(?:cnpsNumber|password|salary|payroll|identity|payment)"/i);
  }
  assert.match(en,/assets\/img\/og-default\.png/);
  assert.match(sw,/assets\/img\/tools\/cnps-guide\.svg/);
  assert.ok(fs.statSync(path.join(root,'assets/img/og-default.png')).size>1000);
  assert.ok(fs.statSync(path.join(root,'assets/img/tools/cnps-guide.svg')).size>1000);
});

test('official source registry is current and exact for the three locale owners',()=>{
  const verification=JSON.parse(fs.readFileSync(path.join(root,'data/tool-verification.json'),'utf8')).tools['cnps-guide'];
  assert.equal(verification.last_verified,'2026-08-09');
  for(const url of ['https://www.cnps.ci/employeur/','https://www.cnps.ci/wp-content/uploads/2023/01/NOUVEAU-PLAFOND-DES-COTISATIONS-SOCIALES-DE-LA-CNPS.pdf','https://www.cnps.ci/services-en-ligne/formulaires-telechargeables/','https://www.cnps.ci/services-en-ligne/e-disa/','https://www.cnps.ci/services-en-ligne/textes-legaux-et-reglementaires/','https://www.cnps.ci/independant/'])assert.ok(verification.source_urls.includes(url));
  const registry=JSON.parse(fs.readFileSync(path.join(root,'data/source-registry.json'),'utf8'));
  const source=registry.sources.find(row=>row.id==='cnps-ci-guide-source');
  assert.equal(source.lastCheckedAt,'2026-08-09');
  assert.deepEqual(source.routes,['/fr/tools/guide-de-la-cnps-en-cote-d-ivoire','/sw/zana/mwongozo-wa-cnps','/tools/cnps-guide']);
});

test('canonical, schema, artwork and reciprocal hreflang ownership remain exact',()=>{
  const owners={
    en:fs.readFileSync(path.join(root,'tools/cnps-guide/index.html'),'utf8'),
    fr:fs.readFileSync(path.join(root,'fr/tools/guide-de-la-cnps-en-cote-d-ivoire/index.html'),'utf8'),
    sw:fs.readFileSync(path.join(root,'sw/zana/mwongozo-wa-cnps/index.html'),'utf8')
  };
  const routes={en:'https://afrotools.com/tools/cnps-guide/',fr:'https://afrotools.com/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/',sw:'https://afrotools.com/sw/zana/mwongozo-wa-cnps/'};
  assert.match(owners.en,new RegExp(`rel="canonical" href="${routes.en}"`));
  assert.match(owners.fr,new RegExp(`rel="canonical" href="${routes.fr}"`));
  assert.match(owners.sw,new RegExp(`rel="canonical" href="${routes.sw}"`));
  for(const html of Object.values(owners))for(const [lang,route] of Object.entries(routes))assert.ok(html.includes(`hreflang="${lang}" href="${route}"`));
  assert.match(owners.en,/"dateModified":"2026-08-09"/);
  assert.match(owners.sw,/"dateModified":"2026-08-09"/);
  assert.match(owners.en,/assets\/img\/og-default\.png/);
  assert.match(owners.sw,/assets\/img\/tools\/cnps-guide\.svg/);
});

test('source owner is deterministic',()=>{
  const files=['tools/cnps-guide/index.html','sw/zana/mwongozo-wa-cnps/index.html'];
  const before=files.map(file=>fs.readFileSync(path.join(root,file),'utf8'));
  delete require.cache[require.resolve('../scripts/build-sw-cnps-guide.js')];
  require('../scripts/build-sw-cnps-guide.js');
  files.forEach((file,index)=>assert.equal(fs.readFileSync(path.join(root,file),'utf8'),before[index]));
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os'),{EventEmitter}=require('node:events');
const ROOT=path.resolve(__dirname,'..'),c=require('../scripts/ci-artifact-contract');
const PREDECESSOR='tests/fixtures/ci-original/same-origin-frames-predecessor-95c0e7f8.json';
const OLD_RAW_SHA='7b2bd9623fe42d4c341637a0e19b856c9718245c87a82bb3178d2843466e1928',OLD_JSON_SHA='3543bada4fb75090f00defac93b3cd5896a07623544177b4e153a15bac8d21bc';
const priorBytes=fs.readFileSync(path.join(ROOT,PREDECESSOR)),prior=JSON.parse(priorBytes),live=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/ci-artifact-groups.json')));
const command='playwright test --config=playwright.same-origin-frames.config.cjs --project=chromium --workers=1 --retries=0';
const expectedStep={name:'Verify same-origin fallback frames under actual artifact HTTP CSP',env:{AFROTOOLS_TEST_PUBLISH_ARTIFACT:'1',AFROTOOLS_TEST_SECURITY_HEADERS:'1',PORT:'4269'},run:'npm run test:same-origin-frames:browser'};
function predecessorIsExact(value){
 assert.equal(c.sha(priorBytes),OLD_RAW_SHA);assert.equal(c.jsonHash(prior),OLD_JSON_SHA);assert.equal(prior.browser.length,45);
 assert.ok(value.browser.length>=46);assert.deepEqual(value.browser.slice(0,45),prior.browser);
 assert.deepEqual(value.browser[45],{id:'browser-46',group:2,step:expectedStep,stepSha256:c.jsonHash(expectedStep)});
 const prefix=[...prior.additiveGateIds,'browser-46'];assert.deepEqual(value.additiveGateIds.slice(0,prefix.length),prefix);
 assert.deepEqual(value.additiveGateIds.slice(prefix.length),value.browser.slice(46).map(g=>g.id));c.inventoryCheck(value);
 const recovered=structuredClone(value);recovered.browser=structuredClone(prior.browser);recovered.additiveGateIds=structuredClone(prior.additiveGateIds);assert.deepEqual(recovered,prior);
 assert.equal(JSON.stringify(recovered,null,2)+'\n',priorBytes.toString(),'Whole predecessor bytes must recover, including producer/deadline/workflow metadata');
}
function loadConfig(port='4269'){
 const file=path.join(ROOT,'playwright.same-origin-frames.config.cjs'),old={PORT:process.env.PORT,flag:process.env.AFROTOOLS_TEST_SECURITY_HEADERS,base:process.env.PLAYWRIGHT_BASE_URL};
 try{process.env.PORT=port;process.env.AFROTOOLS_TEST_SECURITY_HEADERS='0';process.env.PLAYWRIGHT_BASE_URL='https://must-not-be-used.invalid';delete require.cache[require.resolve(file)];const config=require(file);return {config,workerFlag:process.env.AFROTOOLS_TEST_SECURITY_HEADERS};}
 finally{for(const [key,value]of [['PORT',old.PORT],['AFROTOOLS_TEST_SECURITY_HEADERS',old.flag],['PLAYWRIGHT_BASE_URL',old.base]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
}
test('protected46 prefix recovers every original45 object and all producer/deadline/workflow bytes',()=>{predecessorIsExact(live);assert.equal(c.inventoryCheck(live),c.jsonHash(live));});
test('owned CSP46 remains exact command/env/hash and is not invented historical YAML',()=>{
 const gate=live.browser[45];assert.deepEqual(gate,{id:'browser-46',group:2,step:expectedStep,stepSha256:c.jsonHash(expectedStep)});
 assert.deepEqual(live.additiveGateIds.slice(0,prior.additiveGateIds.length+1),[...prior.additiveGateIds,'browser-46']);assert.equal(live.originalBuildTimeoutMinutes,75);
 const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json')));assert.equal(pkg.scripts['test:same-origin-frames:browser'],command);
});
test('moving historical regular8 reads changes no existing assertion or historical case',()=>{
 const current=fs.readFileSync(path.join(ROOT,'tests/ci-regular-eight-union-contract.test.js'),'utf8');const next="final=require('./fixtures/ci-original/same-origin-frames-predecessor-95c0e7f8.json');",old="final=require('../scripts/ci-artifact-groups.json');";
 assert.equal(current.split(next).length,2);assert.equal(c.sha(current.replace(next,old)),'12f0bdfab638378c2b841886b3b0315171fbff41e5217e7c9a6255f0ca4d323a');
});
test('dedicated real Playwright config sets worker/server headers and bounded fresh local execution',()=>{
 const {config,workerFlag}=loadConfig();assert.equal(workerFlag,'1');assert.equal(config.testDir,'./tests/e2e');assert.equal(config.testMatch,'same-origin-frame-policy.spec.js');
 assert.equal(config.workers,1);assert.equal(config.retries,0);assert.equal(config.fullyParallel,false);assert.equal(config.globalTimeout,150000);assert.equal(config.timeout,40000);
 assert.equal(config.webServer.command,'node tests/support/static-server.js');assert.equal(config.webServer.url,'http://127.0.0.1:4269');assert.equal(config.webServer.reuseExistingServer,false);assert.equal(config.webServer.timeout,15000);assert.deepEqual(config.webServer.env,{PORT:'4269',AFROTOOLS_TEST_SECURITY_HEADERS:'1'});
 assert.equal(config.use.baseURL,config.webServer.url);assert.equal(config.use.bypassCSP,false);assert.equal(config.use.serviceWorkers,'block');assert.equal(config.use.storageState,undefined);assert.equal(config.use.launchOptions.args.includes('--proxy-server=http://127.0.0.1:9'),true);assert.deepEqual(config.projects.map(p=>p.name),['chromium']);
 console.log('CSP_GATE_ACTUAL_PLAYWRIGHT_MODULE='+require.resolve('@playwright/test'));
});
for(const value of ['0','65536','4269.5','not-a-port'])test('dedicated config rejects invalid port '+value,()=>assert.throws(()=>loadConfig(value),/valid local test port/));
test('the additive gate stays in the actual generic workflow and original native75 deadline',()=>{
 const workflow=fs.readFileSync(path.join(ROOT,'.github/workflows/ci.yml'),'utf8');
 assert.match(workflow,/run: node scripts\/ci-artifact-browser\.js group/);assert.match(workflow,/SEALED_DEADLINE: \$\{\{ needs\.artifact\.outputs\.deadline \}\}/);assert.match(workflow,/max-parallel: 2/);
 const deadline=require('../scripts/ci-artifact-deadline'),start=Date.parse('2026-10-18T00:00:00Z');
 const jobs=[{name:'Artifact producer',status:'in_progress',started_at:new Date(start).toISOString()}];
 assert.equal(deadline.selectNativeStart(jobs,start+1),start+75*60000);assert.throws(()=>deadline.selectNativeStart(jobs,start+75*60000),/expired/);
});
test('actual maintained spec guard admits static GET only while all original3 case assertions remain exact',async()=>{
 const source=fs.readFileSync(path.join(ROOT,'tests/e2e/same-origin-frame-policy.spec.js'),'utf8');
 const match=source.match(/  await page\.context\(\)\.route\('\*\*\/\*', async \(route\) => \{([\s\S]*?)\n  \}\);/);assert(match,'Actual guard span must be unique');
 const oldGuard="  await page.context().route('**/*', async (route) => {\n    const url = new URL(route.request().url());\n    if (url.origin === origin) return route.continue();\n    return route.abort('blockedbyclient');\n  });";
 assert.equal(c.sha(source.replace(match[0],oldGuard)),'f4c44658eeff0a0756b2d47651e78f12ed730887ca1747a431ee5f2e3f6969bc','Whole prior3cases/image/HTTP/CSP assertions must remain exact');
 const origin='http://127.0.0.1:4269',guard=vm.runInNewContext('(async (route) => {'+match[1]+'\n})',{URL,origin});
 for(const [url,method,want]of [
  ['/fr/blog/best-free-pdf-tools-online/','GET','continue'],['/blog/best-free-pdf-tools-online/','GET','continue'],['/fr/kenya/','GET','continue'],['/kenya/','GET','continue'],['/assets/img/blog/best-free-pdf-tools-online.webp','GET','continue'],['/data/navigation/navbar-data.json','GET','continue'],['/engines/example.js','GET','continue'],['/fr/manifest.json','GET','continue'],
  ['/api/auth/session','GET','abort'],['/.netlify/functions/private','GET','abort'],['/release.json','GET','abort'],['/status.json','GET','abort'],['/status/release.json','GET','abort'],['/service-worker.js','GET','abort'],['/unapproved-document/','GET','abort'],['/fr/kenya/','POST','abort'],['/assets/example.js','HEAD','abort'],['https://example.invalid/static.js','GET','abort'],['http://localhost:4269/kenya/','GET','abort']
 ]){let observed;await guard({request:()=>({url:()=>new URL(url,origin).href,method:()=>method}),continue:()=>{observed='continue';},abort:code=>{assert.equal(code,'blockedbyclient');observed='abort';}});assert.equal(observed,want,method+' '+url);}
});
function complete(){const deadline=Date.parse('2026-10-18T00:00:00Z')+75*60000,manifest={commit:'a'.repeat(40),tree:'b'.repeat(40),runId:'synthetic46',attempt:'1',deadline,inventorySha256:c.jsonHash(live),distTreeSha256:'c'.repeat(64),sourceTreeSha256:'d'.repeat(64),archiveSha256:'e'.repeat(64)};
 return {manifest,reports:[1,2].map(group=>({...manifest,group,status:'success',integrity:'pass',setup:'pass',gates:live.browser.filter(g=>g.group===group).map(g=>({id:g.id,stepSha256:g.stepSha256,status:'success',exitCode:0}))})),needs:{artifact:{result:'success'},browser:{result:'success'}}};}
const accept=f=>c.aggregate(live,f.manifest,f.reports,f.needs,f.manifest.deadline-1);
test('actual maintained aggregate requires every current gate under the original75-minute binding',()=>{const f=complete();assert.equal(f.reports.flatMap(r=>r.gates).length,live.browser.length);assert.equal(accept(f),true);assert.throws(()=>c.aggregate(live,f.manifest,f.reports,f.needs,f.manifest.deadline),/75-minute deadline/);});
for(const [name,change,reason]of [
 ['missing new gate',f=>{f.reports[1].gates=f.reports[1].gates.filter(g=>g.id!=='browser-46');},/gate missing/],
 ['failed new gate',f=>{f.reports[1].gates.find(g=>g.id==='browser-46').exitCode=1;},/gate failed/],
 ['skipped new gate',f=>{f.reports[1].gates.find(g=>g.id==='browser-46').status='skipped';},/gate failed/],
 ['duplicate new gate',f=>{f.reports[1].gates.push({...f.reports[1].gates.find(g=>g.id==='browser-46')});},/Duplicate/],
 ['changed new command hash',f=>{f.reports[1].gates.find(g=>g.id==='browser-46').stepSha256='0'.repeat(64);},/gate failed/]
])test('actual maintained aggregate rejects '+name,()=>{const f=complete();change(f);assert.throws(()=>accept(f),reason);});
test('even a rehashed original45 command mutation cannot pass live predecessor protection',()=>{const changed=structuredClone(live);changed.browser[0].step.run+=' --unreviewed';changed.browser[0].stepSha256=c.jsonHash(changed.browser[0].step);assert.equal(typeof c.inventoryCheck(changed),'string');assert.throws(()=>predecessorIsExact(changed));});
test('unchanged generic runGroup actually selects and emits the additive command in a CLOSED synthetic OS-boundary unit',async()=>{
 // Only the OS spawn and sealed-check filesystem boundary are synthetic. No command, browser, server or network is executed.
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'afrotools-csp-gate-unit-')),evidence=path.join(root,'evidence'),runnerTemp=path.join(root,'runner-temp');fs.mkdirSync(runnerTemp);
 const manifest={deadline:Date.now()+75*60000,inventorySha256:c.jsonHash(live),commit:'synthetic',tree:'synthetic',runId:'synthetic46',attempt:'1',distTreeSha256:'synthetic',sourceTreeSha256:'synthetic',archiveSha256:'synthetic'};const emitted=[];
 const contract={...c,restore:()=>manifest,verify:()=>manifest,sourceClean:()=>{}};
 const cp={spawn(command,args,options){assert.equal(command,'bash');assert.equal(args[0],'-e');emitted.push({script:fs.readFileSync(args[1],'utf8'),env:options.env});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{throw Error('Synthetic orchestration exceeded bound');};queueMicrotask(()=>child.emit('close',0,null));return child;}};
 const module={exports:{}},source=fs.readFileSync(path.join(ROOT,'scripts/ci-artifact-browser.js'),'utf8');const load=name=>name==='./ci-artifact-contract'?contract:name==='node:child_process'?cp:require(name);
 vm.runInNewContext(source,{require:load,module,exports:module.exports,__dirname:path.join(ROOT,'scripts'),process:{env:{RUNNER_TEMP:runnerTemp},platform:process.platform,stdout:{write(){}},stderr:{write(){}}},console:{log(){}},setTimeout,clearTimeout,Buffer},{filename:'actual-unchanged-ci-artifact-browser.js',timeout:1000});
 const result=await module.exports.runGroup(root,'SYNTHETIC_NO_REAL_SEAL',evidence,2,live,{});assert.equal(result.status,'success');assert.equal(result.gates.filter(g=>g.id==='browser-46').length,1);
 const added=emitted.filter(x=>x.script==='npm run test:same-origin-frames:browser');assert.equal(added.length,1);assert.equal(added[0].env.AFROTOOLS_TEST_PUBLISH_ARTIFACT,'1');assert.equal(added[0].env.AFROTOOLS_TEST_SECURITY_HEADERS,'1');assert.equal(added[0].env.PORT,'4269');assert.equal(result.deadline,manifest.deadline);assert.equal(emitted.length,live.consumerSetup.length+live.browser.filter(g=>g.group===2).length+1);
});

// Trailing additions are permitted; all original45+owned46 and non-extension metadata stay protected.
function futureInventory(){const value=structuredClone(live),step={name:'Synthetic future append only',env:{CI:'1'},run:'SYNTHETIC_NOT_EXECUTED future-static-check'};value.browser.push({id:'browser-future',group:1,step,stepSha256:c.jsonHash(step)});value.additiveGateIds.push('browser-future');return value;}
test('declared valid future trailing gate passes protected46 without replacing any immutable fixture',()=>{const value=futureInventory();predecessorIsExact(value);assert.equal(typeof c.inventoryCheck(value),'string');});
for(const [name,change]of [
 ['owned46 command rehashed',v=>{v.browser[45].step.run+=' --skip';v.browser[45].stepSha256=c.jsonHash(v.browser[45].step);}],
 ['owned46 environment rehashed',v=>{v.browser[45].step.env.AFROTOOLS_TEST_SECURITY_HEADERS='0';v.browser[45].stepSha256=c.jsonHash(v.browser[45].step);}],
 ['protected45 reorder',v=>{[v.browser[0],v.browser[1]]=[v.browser[1],v.browser[0]];}],
 ['owned46 reorder',v=>{[v.browser[44],v.browser[45]]=[v.browser[45],v.browser[44]];}],
 ['owned46 removal',v=>{v.browser.splice(45,1);v.additiveGateIds=v.additiveGateIds.filter(x=>x!=='browser-46');}],
 ['protected45 removal',v=>{v.browser.splice(0,1);}],
 ['unlisted trailing gate',v=>{v.additiveGateIds.pop();}],
 ['orphan additive id',v=>{v.additiveGateIds.push('orphan');}],
 ['future step hash mismatch',v=>{v.browser.at(-1).stepSha256='0'.repeat(64);}],
 ['non-extension deadline',v=>{v.originalBuildTimeoutMinutes=76;}],
 ['non-extension producer command',v=>{v.producer[2].step.run+=' --skip';}]
])test('protected46 append-safe contract rejects '+name,()=>{const value=futureInventory();change(value);assert.throws(()=>predecessorIsExact(value));});

'use strict';
// Phase1 qualifies CI configuration only. Authored FINAL4 spec/fixture byte binding remains a separate pending review.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os'),{EventEmitter}=require('node:events'),c=require('../scripts/ci-artifact-contract');
const ROOT=path.resolve(__dirname,'..'),priorBytes=fs.readFileSync(path.join(ROOT,'tests/fixtures/ci-original/same-origin-frames-predecessor-95c0e7f8.json')),prior=JSON.parse(priorBytes),live=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/ci-artifact-groups.json')));
const PROTECTED46_SHA='a7649a7632bb99bfc5185cd50ebb8ac56bca679e830335c1e615099a3d25b505',OWNED47_HASH='0a65722dbb5557f18bbbf29cccd8dab60efdf253c63b99cee78eb5b2089c4d40';
const SPEC='tests/e2e/afrokitchen-visual-recipe.spec.js',expectedStep={name:'Verify complete Kitchen visual recipe suite including FINAL4 journeys',env:{CI:'1',AFROTOOLS_TEST_PUBLISH_ARTIFACT:'1',AFROTOOLS_TEST_SECURITY_HEADERS:'1'},run:'npx playwright test '+SPEC+' --project=chromium --workers=1 --retries=0 --global-timeout=180000'};
function kitchenIsExact(value){
 assert.equal(c.sha(priorBytes),'7b2bd9623fe42d4c341637a0e19b856c9718245c87a82bb3178d2843466e1928');assert.equal(c.jsonHash(prior),'3543bada4fb75090f00defac93b3cd5896a07623544177b4e153a15bac8d21bc');
 assert.ok(value.browser.length>=47);
 // Recover the old46 pin from genuine original45 plus the unchanged owned CSP46.
 const cspStep={name:'Verify same-origin fallback frames under actual artifact HTTP CSP',env:{AFROTOOLS_TEST_PUBLISH_ARTIFACT:'1',AFROTOOLS_TEST_SECURITY_HEADERS:'1',PORT:'4269'},run:'npm run test:same-origin-frames:browser'};
 const protected46=[...structuredClone(prior.browser),{id:'browser-46',group:2,step:cspStep,stepSha256:c.jsonHash(cspStep)}];
 assert.equal(c.jsonHash(protected46),PROTECTED46_SHA);
 assert.equal(protected46[2].id,'browser-03');assert.equal(protected46[2].group,1);
 const expectedSchedule=structuredClone(protected46);expectedSchedule[2].group=2;
 assert.deepEqual(value.browser.slice(0,46),expectedSchedule);
 assert.equal(c.jsonHash(expectedStep),OWNED47_HASH);assert.deepEqual(value.browser[46],{id:'browser-47',group:2,step:expectedStep,stepSha256:OWNED47_HASH});
 const prefix=[...prior.additiveGateIds,'browser-46','browser-47'];assert.deepEqual(value.additiveGateIds.slice(0,prefix.length),prefix);assert.deepEqual(value.additiveGateIds.slice(prefix.length),value.browser.slice(47).map(g=>g.id));c.inventoryCheck(value);
 const inverse=structuredClone(value);inverse.browser=structuredClone(prior.browser);inverse.additiveGateIds=structuredClone(prior.additiveGateIds);assert.deepEqual(inverse,prior);assert.equal(JSON.stringify(inverse,null,2)+'\n',priorBytes.toString());
}
function fixture(inventory=live){const manifest={commit:'a'.repeat(40),tree:'b'.repeat(40),runId:'SYNTHETIC_CI_ONLY',attempt:'1',deadline:Date.parse('2026-10-18T00:00:00Z')+75*60000,inventorySha256:c.jsonHash(inventory),distTreeSha256:'c'.repeat(64),sourceTreeSha256:'d'.repeat(64),archiveSha256:'e'.repeat(64)};return{manifest,reports:[1,2].map(group=>({...manifest,group,status:'success',integrity:'pass',setup:'pass',gates:inventory.browser.filter(g=>g.group===group).map(g=>({id:g.id,stepSha256:g.stepSha256,status:'success',exitCode:0}))})),needs:{artifact:{result:'success'},browser:{result:'success'}}}}
const aggregate=(inventory,f)=>c.aggregate(inventory,f.manifest,f.reports,f.needs,f.manifest.deadline-1);
function future(){const value=structuredClone(live),step={name:'Synthetic future only',env:{CI:'1'},run:'SYNTHETIC_NOT_EXECUTED future-proof'},used=new Set(value.browser.map(g=>g.id));let n=48;while(used.has('browser-'+n))n++;const id='browser-'+n;assert.ok(!used.has(id));value.browser.push({id,group:1,step,stepSha256:c.jsonHash(step)});value.additiveGateIds.push(id);return value}
test('Kitchen CI47 is additive after exact protected45+CSP46 and preserves all other metadata',()=>{kitchenIsExact(live);assert.equal(live.originalBuildTimeoutMinutes,75)});
test('Kitchen gate selects the complete maintained spec without grep or skip and bounds native execution',()=>{assert.deepEqual(live.browser[46].step,expectedStep);assert.match(expectedStep.run,/afrokitchen-visual-recipe\.spec\.js --project=chromium --workers=1 --retries=0 --global-timeout=180000$/);assert.doesNotMatch(expectedStep.run,/--grep|--grep-invert|--skip|--last-failed/);assert.deepEqual(expectedStep.env,{CI:'1',AFROTOOLS_TEST_PUBLISH_ARTIFACT:'1',AFROTOOLS_TEST_SECURITY_HEADERS:'1'})});
test('actual generic aggregate accepts all current47 and rejects missing/failed/skipped/tampered evidence for EVERY gate',()=>{const complete=fixture();assert.equal(complete.reports.flatMap(r=>r.gates).length,live.browser.length);assert.equal(aggregate(live,complete),true);for(const gate of live.browser)for(const change of ['missing','failed','skipped','hash']){const f=fixture(),report=f.reports.find(r=>r.group===gate.group),record=report.gates.find(g=>g.id===gate.id);if(change==='missing')report.gates=report.gates.filter(g=>g.id!==gate.id);if(change==='failed')record.exitCode=1;if(change==='skipped')record.status='skipped';if(change==='hash')record.stepSha256='0'.repeat(64);assert.throws(()=>aggregate(live,f),/missing|failed/,gate.id+':'+change)}});
test('declared valid future trailing gate is append-safe but generic aggregate still requires its evidence',()=>{const value=future();kitchenIsExact(value);const appendedId=value.browser.at(-1).id,f=fixture(value);assert.equal(aggregate(value,f),true);f.reports[0].gates=f.reports[0].gates.filter(g=>g.id!==appendedId);assert.throws(()=>aggregate(value,f),/gate missing/)});
for(const [name,change]of [
 ['original45 command rehashed',v=>{v.browser[0].step.run+=' --skip';v.browser[0].stepSha256=c.jsonHash(v.browser[0].step)}],
 ['CSP46 command rehashed',v=>{v.browser[45].step.run+=' --skip';v.browser[45].stepSha256=c.jsonHash(v.browser[45].step)}],
 ['Kitchen47 command rehashed',v=>{v.browser[46].step.run+=' --grep FINAL4';v.browser[46].stepSha256=c.jsonHash(v.browser[46].step)}],
 ['Kitchen47 skipped by command',v=>{v.browser[46].step.run+=' --grep-invert FINAL4';v.browser[46].stepSha256=c.jsonHash(v.browser[46].step)}],
 ['Kitchen47 headers removed',v=>{delete v.browser[46].step.env.AFROTOOLS_TEST_SECURITY_HEADERS;v.browser[46].stepSha256=c.jsonHash(v.browser[46].step)}],
 ['Kitchen47 retry enabled',v=>{v.browser[46].step.run=v.browser[46].step.run.replace('--retries=0','--retries=1');v.browser[46].stepSha256=c.jsonHash(v.browser[46].step)}],
 ['protected46 reorder',v=>{[v.browser[44],v.browser[45]]=[v.browser[45],v.browser[44]]}],
 ['Kitchen47 reorder',v=>{[v.browser[45],v.browser[46]]=[v.browser[46],v.browser[45]]}],
 ['protected46 deletion',v=>{v.browser.splice(45,1);v.additiveGateIds=v.additiveGateIds.filter(id=>id!=='browser-46')}],
 ['Kitchen47 deletion',v=>{v.browser.splice(46,1);v.additiveGateIds=v.additiveGateIds.filter(id=>id!=='browser-47')}],
 ['future hash mutation',v=>{v.browser.at(-1).stepSha256='0'.repeat(64)}],
 ['future orphan additive id',v=>{v.additiveGateIds.push('orphan')}],
 ['future missing additive id',v=>{v.additiveGateIds.pop()}],
 ['native deadline metadata',v=>{v.originalBuildTimeoutMinutes=76}],
 ['original producer command',v=>{v.producer[2].step.run+=' --skip'}]
])test('Kitchen append-safe enrollment rejects '+name,()=>{const value=future();change(value);assert.throws(()=>kitchenIsExact(value))});
test('actual generic aggregate rejects duplicate Kitchen47 and an expired shared75-minute deadline',()=>{const f=fixture();f.reports[1].gates.push({...f.reports[1].gates.find(g=>g.id==='browser-47')});assert.throws(()=>aggregate(live,f),/Duplicate/);const complete=fixture();assert.throws(()=>c.aggregate(live,complete.manifest,complete.reports,complete.needs,complete.manifest.deadline),/75-minute deadline/)});
test('unchanged generic runGroup emits ALL47 exact commands/env through a SYNTHETIC OS boundary, including Kitchen once',async()=>{
 // Actual maintained orchestrator, with only OS process spawn/seal IO synthetic. No command/server/browser is executed.
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'afrotools-kitchen-ci-unit-')),temp=path.join(scratch,'runner-temp');fs.mkdirSync(temp);const manifest={deadline:Date.now()+75*60000,inventorySha256:c.jsonHash(live),commit:'synthetic',tree:'synthetic',runId:'synthetic47',attempt:'1',distTreeSha256:'synthetic',sourceTreeSha256:'synthetic',archiveSha256:'synthetic'},emitted=[];
 const contract={...c,restore:()=>manifest,verify:()=>manifest,sourceClean:()=>{}},fakeCP={spawn(command,args,options){assert.equal(command,'bash');assert.equal(args[0],'-e');emitted.push({script:fs.readFileSync(args[1],'utf8'),env:options.env});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{throw Error('Synthetic bound exceeded')};queueMicrotask(()=>child.emit('close',0,null));return child}};
 const module={exports:{}},source=fs.readFileSync(path.join(ROOT,'scripts/ci-artifact-browser.js'),'utf8'),load=name=>name==='./ci-artifact-contract'?contract:name==='node:child_process'?fakeCP:require(name);
 vm.runInNewContext(source,{require:load,module,exports:module.exports,__dirname:path.join(ROOT,'scripts'),process:{env:{RUNNER_TEMP:temp},platform:process.platform,stdout:{write(){}},stderr:{write(){}}},console:{log(){}},setTimeout,clearTimeout,Buffer},{filename:'actual-unchanged-ci-artifact-browser.js',timeout:1000});
 const reports=[];for(const group of [1,2])reports.push(await module.exports.runGroup(scratch,'SYNTHETIC_NO_REAL_SEAL',path.join(scratch,'group'+group),group,live,{}));assert.equal(reports.flatMap(r=>r.gates).length,live.browser.length);assert.equal(emitted.length,2*live.consumerSetup.length+live.browser.length+2);for(const gate of live.browser){const matching=emitted.filter(e=>e.script===gate.step.run);assert.ok(matching.length>=1,gate.id);for(const [key,value]of Object.entries(gate.step.env||{})){const expected=value.replaceAll('${{ runner.temp }}',temp);assert.ok(matching.some(e=>e.env[key]===expected),gate.id+':'+key)}}const kitchen=emitted.filter(e=>e.script===expectedStep.run);assert.equal(kitchen.length,1);assert.equal(kitchen[0].env.CI,'1');assert.equal(kitchen[0].env.AFROTOOLS_TEST_PUBLISH_ARTIFACT,'1');assert.equal(kitchen[0].env.AFROTOOLS_TEST_SECURITY_HEADERS,'1');assert.ok(reports.every(r=>r.deadline===manifest.deadline));
});

// Exact Root/native-peer accepted V3 source binding; these checks do not execute browser journeys.
const LEGACY_FIXTURE='tests/fixtures/afrokitchen/final-four-legacy-source-html.json';
function final4NativeInputsAreExact(specBytes,fixtureBytes){
 assert.equal(specBytes.length,37239,'Exact accepted Maheu-method successor spec byte count');assert.equal(c.sha(specBytes),'3b83d94be541ff170d7205333a91583190d6d5003fed14eaba1039cabb86f282','Exact accepted Maheu-method successor spec SHA');
 assert.equal(fixtureBytes.length,139393,'Exact accepted historical fixture byte count');assert.equal(c.sha(fixtureBytes),'3e794ba4f824c042c8e981f0cdbcbb7945863816b5053b0b39d9eccb362b556f','Exact accepted historical fixture SHA');
 const fixture=JSON.parse(fixtureBytes.toString('utf8'));assert.equal(fixture.schemaVersion,1);assert.equal(fixture.records.length,2);
 const expected=[{slug:'kisra-south-sudan-ss',bytes:67127,sha256:'172e7839cdec45b32d55e4fb8fd8a183ee08a986b0bebf3f7d0f8c8329e9f6cc'},{slug:'maheu-zm',bytes:64291,sha256:'9c0c6635464cd55d7e37848ad7b6c82713f5d2d63841ac6422a16f7ede7c7b72'}];
 for(const [index,record]of fixture.records.entries()){const wanted=expected[index];assert.equal(record.slug,wanted.slug);assert.equal(record.source,'tools/afrokitchen/recipes/'+wanted.slug+'/index.html');assert.equal(record.route,'/tools/afrokitchen/recipes/'+wanted.slug+'/');assert.equal(record.sourceCommit,'853cfcd88d1c9ad36cffe31b34a8fe28c22c51be');assert.equal(record.htmlBytes,wanted.bytes);assert.equal(record.htmlSha256,wanted.sha256);const html=Buffer.from(record.html,'utf8');assert.equal(html.length,wanted.bytes);assert.equal(c.sha(html),wanted.sha256)}
 return true;
}
test('Kitchen gate binds the exact accepted V3 full spec and both historical cached documents',()=>{assert.equal(final4NativeInputsAreExact(fs.readFileSync(path.join(ROOT,SPEC)),fs.readFileSync(path.join(ROOT,LEGACY_FIXTURE))),true)});
test('native source binding rejects skipped FINAL4, corrupt cached HTML and substituted lineage',()=>{
 const spec=fs.readFileSync(path.join(ROOT,SPEC)),fixtureBytes=fs.readFileSync(path.join(ROOT,LEGACY_FIXTURE)),text=spec.toString('utf8');assert.equal(text.split("test('FINAL4 ").length-1,5);
 const skipped=Buffer.from(text.replace("test('FINAL4 ","test.skip('FINAL4 "));assert.notDeepEqual(skipped,spec);assert.throws(()=>final4NativeInputsAreExact(skipped,fixtureBytes),/Exact accepted Maheu-method successor spec/);
 const corrupted=Buffer.from(fixtureBytes);corrupted[Math.floor(corrupted.length/2)]^=1;assert.throws(()=>final4NativeInputsAreExact(spec,corrupted),/Exact accepted historical fixture/);
 const substituted=JSON.parse(fixtureBytes.toString('utf8'));substituted.records[0].sourceCommit='0'.repeat(40);assert.throws(()=>final4NativeInputsAreExact(spec,Buffer.from(JSON.stringify(substituted))),/Exact accepted historical fixture/);
});

test('reviewed scheduling retains all47 once and sends education evidence to group2',()=>{
 kitchenIsExact(live);const f=fixture();
 assert.equal(f.reports.flatMap(r=>r.gates).filter(g=>g.id==='browser-03').length,1);
 assert.ok(f.reports.find(r=>r.group===2).gates.some(g=>g.id==='browser-03'));
 assert.ok(!f.reports.find(r=>r.group===1).gates.some(g=>g.id==='browser-03'));
 assert.equal(aggregate(live,f),true);
 const record=f.reports[1].gates.find(g=>g.id==='browser-03');
 f.reports[1].gates=f.reports[1].gates.filter(g=>g.id!=='browser-03');f.reports[0].gates.push(record);
 assert.throws(()=>aggregate(live,f),/misassigned/);
});
test('Kitchen strict scheduling comparison refuses any unreviewed group move',()=>{
 for(const index of [0,2,3,45,46]){const value=structuredClone(live);value.browser[index].group=value.browser[index].group===1?2:1;assert.throws(()=>kitchenIsExact(value),'group move '+value.browser[index].id);}
});

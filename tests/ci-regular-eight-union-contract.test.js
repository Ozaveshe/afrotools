'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),jsh=x=>sha(JSON.stringify(x)),pin={"baseInventoryFile":"tests/fixtures/ci-original/r19-inventory-fba7feee.json","baseInventorySha256":"650198dabd6464209e86a159703a22c2cf32ffe65ba6a8f189e0de23b6b47779","finalInventorySha256":"3543bada4fb75090f00defac93b3cd5896a07623544177b4e153a15bac8d21bc","unionFixtureSha256":"9bf4e3eaf10f4aaf6a8b49f572f99cc1e94c002f93c2a35338e92cc691e1de0a","originalOrchestrationSha256":"a3931971fcf7679c0db76efb2bd196cd54c1ed4a6a3114777de7fcf17e3ea153","oldInventoryDeclaration":"const inventory = require('../scripts/ci-artifact-groups.json');","pinnedInventoryDeclaration":"const retainedR19InventoryFile = path.join(__dirname, 'fixtures/ci-original/r19-inventory-fba7feee.json');\nassert.equal(c.sha(fs.readFileSync(retainedR19InventoryFile)), '650198dabd6464209e86a159703a22c2cf32ffe65ba6a8f189e0de23b6b47779', 'Retained R19 inventory pin changed');\nconst inventory = JSON.parse(fs.readFileSync(retainedR19InventoryFile, 'utf8'));","additions":[{"id":"browser-40","group":2,"originalIndex":49,"stepSha256":"ef9653e856efe7bce1c28a9c9bbbba1b4d42bfd1f6c6fff5fc0379a755143edc"},{"id":"browser-41","group":1,"originalIndex":50,"stepSha256":"add0236d6138c9533135c723d26df2035a23ff8f0c38e7710b859f18afb00249"},{"id":"browser-42","group":2,"originalIndex":51,"stepSha256":"0af61b0e6609a4bb49f713c2df6ea2f9c8b391e1605a73bbdd823778f4a4a8bc"},{"id":"browser-43","group":1,"originalIndex":52,"stepSha256":"3df7c8eaa51701b8cd5b2923a6db774d0ecce42a2a18458ebaaa215dab6a3598"},{"id":"browser-44","group":1,"originalIndex":53,"stepSha256":"feaa0bbb2b43894a77fb3d70d29fd43da9fc8f22885d7a4155c801291c7e17f1"},{"id":"browser-45","group":1,"originalIndex":54,"stepSha256":"3925270dcfe544e8a5442d86c0c2d9cacd0dfc89fed9597fdde42ba95b4533cf"}]};
const baseRaw=fs.readFileSync(path.join(ROOT,pin.baseInventoryFile)),base=JSON.parse(baseRaw),final=require('../scripts/ci-artifact-groups.json');
const raw=fs.readFileSync(path.join(ROOT,final.originalWorkflowFile),'utf8');
function recover(inventory,text){
 assert.equal(sha(text),inventory.originalWorkflowSha256);
 for(const gate of inventory.browser.slice(39)){assert.equal(text.split(gate.originalYaml).length,2,'Each new raw step occurs exactly once');text=text.replace(gate.originalYaml,'');}
 assert.equal(sha(text),base.originalWorkflowSha256,'Exact retained R18 workflow inverse');return text;
}
function step(block){
 const lines=block.trimEnd().split('\n'),s={name:lines[0].slice('      - name: '.length)},e=lines.indexOf('        env:'),r=lines.findIndex(l=>l.startsWith('        run:'));assert(r>=0);
 if(e>=0){s.env={};for(const line of lines.slice(e+1,r)){const m=line.match(/^          ([A-Z_0-9]+): (.+)$/);assert(m);let v=m[2];if(v.startsWith("'")&&v.endsWith("'"))v=v.slice(1,-1).replaceAll("''","'");s.env[m[1]]=v;}}
 const run=lines[r].slice('        run: '.length);s.run=run==='|'?lines.slice(r+1).map(l=>l.slice(10)).join('\n')+'\n':run;return s;
}
test('regular8 pins every original39 R19 browser object and10 producer objects plus native75',()=>{
 assert.equal(sha(baseRaw),pin.baseInventorySha256);assert.equal(jsh(final),pin.finalInventorySha256);assert.equal(final.browser.length,45);
 assert.deepEqual(final.browser.slice(0,39),base.browser);assert.deepEqual(final.producer,base.producer);assert.deepEqual(final.consumerSetup,base.consumerSetup);assert.deepEqual(final.generatedCheck,base.generatedCheck);assert.equal(final.originalBuildTimeoutMinutes,75);
 assert.deepEqual(final.browser.slice(39).map(g=>({id:g.id,group:g.group,originalIndex:g.originalIndex,stepSha256:g.stepSha256})),pin.additions);
});
test('regular8 matches all55 raw steps by full identity including both legal commands',()=>{
 assert.equal(sha(raw),pin.unionFixtureSha256);const blocks=raw.split('  build:\n')[1].split('  e2e:\n')[0].match(/      - name: .*?(?=\n      - name:|$)/gs);assert.equal(blocks.length,55);const seen=new Set();
 for(const [index,block] of blocks.entries()){
  const producer=final.producer.filter(g=>g.originalYaml===block.trimEnd()+'\n\n');if(producer.length){assert.equal(producer.length,1);continue;}
  const parsed=step(block),hash=jsh(parsed),matches=final.browser.filter(g=>g.stepSha256===hash&&JSON.stringify(g.step)===JSON.stringify(parsed));assert.equal(matches.length,1,'Raw step needs exactly one full command/env identity');const g=matches[0];assert.equal(g.originalIndex,index);assert(!seen.has(g.id));seen.add(g.id);
 }
 assert.equal(seen.size,45);const legal=final.browser.filter(g=>g.step.name==='Verify legal local print bypasses trade email capture');assert.equal(legal.length,2);assert.deepEqual(legal[0],base.browser.find(g=>g.id==='browser-31'));assert(legal[1].step.run.includes('legal-workflow-full-print.spec.js'));assert.equal(legal[1].step.env.PORT,'4204');
});
test('regular8 exact new-step removal recovers complete original39 R19 fixture',()=>{assert.equal(recover(final,raw),fs.readFileSync(path.join(ROOT,base.originalWorkflowFile),'utf8'));});
test('regular8 rejects missing duplicate tampered rehashed and wrong-ancestor declarations',()=>{
 const missing=structuredClone(final);missing.browser.pop();assert.throws(()=>recover(missing,raw));
 assert.throws(()=>recover(final,raw+final.browser.at(-1).originalYaml));
 assert.throws(()=>recover(final,raw+'# unrelated\n'));
 const changed=structuredClone(final),unrelated=raw+'# unrelated\n';changed.originalWorkflowSha256=sha(unrelated);assert.throws(()=>recover(changed,unrelated),/retained R18/);
 const wrong=structuredClone(final);wrong.browser.at(-1).originalYaml='      - name: Wrong\n\n';assert.throws(()=>recover(wrong,raw));
});
test('regular8 preserves every historical orchestration assertion body under pinned R18 projection',()=>{
 let text=fs.readFileSync(path.join(ROOT,'tests/ci-artifact-orchestration.test.js'),'utf8');assert.equal(text.split(pin.pinnedInventoryDeclaration).length,2);text=text.replace(pin.pinnedInventoryDeclaration,pin.oldInventoryDeclaration);assert.equal(sha(text),pin.originalOrchestrationSha256);
});


// Exercise the existing runtime implementation, not a copied predicate.
const actualContract=require('../scripts/ci-artifact-contract');
const cp=require('node:child_process'),os=require('node:os'),vm=require('node:vm');
const SYNTHETIC_START=Date.parse('2026-10-15T00:00:00Z');
const SYNTHETIC_DEADLINE=SYNTHETIC_START+75*60000;
function completeRegular(){
 const manifest={commit:'a'.repeat(40),tree:'b'.repeat(40),runId:'synthetic45',attempt:'1',deadline:SYNTHETIC_DEADLINE,inventorySha256:actualContract.jsonHash(final),distTreeSha256:'c'.repeat(64),sourceTreeSha256:'d'.repeat(64),archiveSha256:'e'.repeat(64)};
 const reports=[1,2].map(group=>({...manifest,group,status:'success',integrity:'pass',setup:'pass',gates:final.browser.filter(g=>g.group===group).map(g=>({id:g.id,stepSha256:g.stepSha256,status:'success',exitCode:0}))}));
 return {manifest,reports,needs:{artifact:{result:'success'},browser:{result:'success'}}};
}
function acceptRegular(f,now=SYNTHETIC_DEADLINE-1){return actualContract.aggregate(final,f.manifest,f.reports,f.needs,now);}
test('regular8 actual runtime inventoryCheck accepts exact45 unchanged step identities',()=>{
 assert.equal(actualContract.inventoryCheck(final),actualContract.jsonHash(final));
 assert.equal(actualContract.jsonHash(final),pin.finalInventorySha256);
});
test('regular8 actual runtime aggregate accepts both completeRegular groups one millisecond before native75 expires',()=>{
 const f=completeRegular();assert.equal(f.reports.flatMap(r=>r.gates).length,45);assert.deepEqual(f.reports.map(r=>r.group),[1,2]);assert.equal(acceptRegular(f),true);
});
const runtimeNegatives=[
 ['missing gate',f=>{f.reports[0].gates.pop();},/gate missing/],
 ['duplicate gate',f=>{f.reports[0].gates.push({...f.reports[0].gates[0]});},/Duplicate\/unknown\/misassigned gate/],
 ['failed gate status',f=>{f.reports[0].gates[0].status='failed';},/gate failed, skipped, cancelled or changed/],
 ['failed gate exit code',f=>{f.reports[0].gates[0].exitCode=1;},/gate failed, skipped, cancelled or changed/],
 ['skipped gate',f=>{f.reports[0].gates[0].status='skipped';},/gate failed, skipped, cancelled or changed/],
 ['cancelled gate',f=>{f.reports[0].gates[0].status='cancelled';},/gate failed, skipped, cancelled or changed/],
 ['changed command hash',f=>{f.reports[0].gates[0].stepSha256='0'.repeat(64);},/gate failed, skipped, cancelled or changed/],
 ['unexpected gate',f=>{f.reports[0].gates.push({id:'browser-999',stepSha256:'0'.repeat(64),status:'success',exitCode:0});},/Duplicate\/unknown\/misassigned gate/],
 ['misassigned gate',f=>{f.reports[1].gates.push(f.reports[0].gates.pop());},/Duplicate\/unknown\/misassigned gate/],
 ['missing report',f=>{f.reports.pop();},/Missing or duplicate group reports/],
 ['extra report',f=>{f.reports.push(structuredClone(f.reports[0]));},/Missing or duplicate group reports/],
 ['duplicate report group',f=>{f.reports[1]=structuredClone(f.reports[0]);},/Duplicate\/unknown report group/],
 ['unexpected report group',f=>{f.reports[1].group=3;},/Duplicate\/unknown report group/],
 ['failed group report',f=>{f.reports[0].status='failed';},/Group failed, skipped or cancelled/],
 ['skipped group report',f=>{f.reports[0].status='skipped';},/Group failed, skipped or cancelled/],
 ['failed integrity',f=>{f.reports[0].integrity='fail';},/Group failed, skipped or cancelled/],
 ['skipped setup',f=>{f.reports[0].setup='skipped';},/Group failed, skipped or cancelled/],
 ['failed producer job',f=>{f.needs.artifact.result='failure';},/Producer\/browser job failed, skipped or cancelled/],
 ['skipped browser job',f=>{f.needs.browser.result='skipped';},/Producer\/browser job failed, skipped or cancelled/],
 ['changed report source identity',f=>{f.reports[0].sourceTreeSha256='0'.repeat(64);},/Report artifact\/source binding mismatch/],
 ['rebound inventory seal',f=>{f.manifest.inventorySha256='0'.repeat(64);for(const r of f.reports)r.inventorySha256=f.manifest.inventorySha256;},/Gate inventory differs from seal/]
];
for(const [name,change,reason] of runtimeNegatives)test('regular8 actual runtime rejects '+name,()=>{const f=completeRegular();change(f);assert.throws(()=>acceptRegular(f),reason);});
test('regular8 actual runtime rejects exact native75 expiry and any later aggregate',()=>{
 const f=completeRegular();assert.equal(acceptRegular(f,SYNTHETIC_DEADLINE-1),true);
 assert.throws(()=>acceptRegular(f,SYNTHETIC_DEADLINE),/Shared 75-minute deadline expired or invalid/);
 assert.throws(()=>acceptRegular(f,SYNTHETIC_DEADLINE+1),/Shared 75-minute deadline expired or invalid/);
});

// Invoke the exact helper from the final proposed orchestration source with real
// filesystem fixtures, without evaluating that module's historical test suite.
const combinedSource=fs.readFileSync(path.join(ROOT,'tests/ci-artifact-orchestration.test.js'),'utf8');
const helperSource=combinedSource.match(/function readOriginalWorkflow\(pin, root = ROOT\) \{[\s\S]*?\n\}/)?.[0];
assert(helperSource,'Actual final combined fixture helper must exist');
const actualReadOriginalWorkflow=vm.runInNewContext('('+helperSource+')',{fs,path,cp,assert,c:actualContract,ROOT},{filename:'actual-combined-readOriginalWorkflow.js'});
function combinedFixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'afrotools-regular8-combined-'));const file=path.join(root,final.originalWorkflowFile);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,raw);return {root,file};}
test('regular8 candidate372 actual combined fixture helper accepts all45 and rejects directory in place of fixture',()=>{
 const f=combinedFixture();assert.equal(actualReadOriginalWorkflow(final,f.root),raw);fs.renameSync(f.file,f.file+'.original');fs.mkdirSync(f.file);assert.throws(()=>actualReadOriginalWorkflow(final,f.root),/must be a file/);
});
test('regular8 candidate372 actual combined fixture helper rejects wrong predecessor and rehashed unrelated bytes',()=>{
 const f=combinedFixture();assert.throws(()=>actualReadOriginalWorkflow({...final,predecessorWorkflowSha256:'0'.repeat(64)},f.root),/predecessor/);
 const changed=raw+'# synthetic unrelated change\n';fs.writeFileSync(f.file,changed);assert.throws(()=>actualReadOriginalWorkflow({...final,originalWorkflowSha256:actualContract.sha(changed)},f.root),/predecessor/);
});
test('regular8 candidate372 actual combined fixture helper requires every appended6 addition exactly once',()=>{
 const f=combinedFixture();for(const addition of final.browser.slice(39)){
  const missing=structuredClone(final);delete missing.browser.find(g=>g.id===addition.id).originalYaml;assert.throws(()=>actualReadOriginalWorkflow(missing,f.root),/predecessor/);
  const wrong=structuredClone(final);wrong.browser.find(g=>g.id===addition.id).originalYaml='      - name: Synthetic unrecognized addition\n\n';assert.throws(()=>actualReadOriginalWorkflow(wrong,f.root),/exactly once/);
 }
});

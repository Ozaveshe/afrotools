'use strict';
// Synthetic validator unit fixtures only. No browser or app acceptance is produced.
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {validateRecord,summarize}=require('../scripts/lib/free-app-acceptance-evidence');
const policy=require('../data/registry/free-app-acceptance-contracts/vaccine-visit-brief.json');
const canonical=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(item=>JSON.parse(canonical(item))):Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])):value);
const recordDigest=record=>sha(Buffer.from(canonical({...record,reviewPin:null}),'utf8'));
const POLICY='data/registry/free-app-acceptance-contracts/vaccine-visit-brief.json';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),clone=value=>JSON.parse(JSON.stringify(value));
function fixture(kind='export',scenarioId='txt-exact',memberKey='vaccine-en'){
 const member=policy.roster.find(r=>r.memberKey===memberKey),scenario=policy.scenarios.find(s=>s.id===scenarioId),sourceFiles={},evidenceFiles={};
 const add=(files,path,value)=>{const bytes=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value));files[path]=bytes;return {path,bytes:bytes.length,sha256:sha(bytes)};};
 const policyPin=add(sourceFiles,POLICY,JSON.stringify(policy));
 const registryPin=add(sourceFiles,'data/registry/canonical-registry.json',{tools:policy.roster.map(r=>({id:r.catalogueId,canonicalRoute:r.route,localeCoverage:[r.locale],publicationStatus:'published',availability:'free'}))});
 const ownerPins=[...policy.roster.map(r=>r.pageOwner),...policy.sharedOwners].map(p=>add(sourceFiles,p,'SYNTHETIC UNIT SOURCE '+p));
 const manifestPin=add(evidenceFiles,'unit/artifact.json',{synthetic:true}),artifact={id:'synthetic-optimized-artifact',kind:'optimized',manifestPin};
 const caseId=memberKey+':'+scenarioId,caseTitle='Synthetic validator fixture '+caseId;
 const reportPin=add(evidenceFiles,'unit/'+caseId+'/report.json',{suites:[{specs:[{title:caseTitle,tests:[{expectedStatus:'passed',results:[{status:'passed',retry:0}]}]}]}],errors:[]});
 const assertion={syntheticInputs:true,memberKey,route:member.route,locale:member.locale,scenarioId,variantIds:[...scenario.requiredVariants],checks:scenario.checks.map(id=>({id,expected:true,observed:true}))};
 const assertionPin=add(evidenceFiles,'unit/'+caseId+'/assertions.json',assertion);
 const expectedPayload=scenarioId==='print-pdf'?'%PDF-1.7\nSYNTHETIC UNIT FIXTURE\n':'SYNTHETIC EXPECTED PAYLOAD\n';
 const observedPin=add(evidenceFiles,'unit/'+caseId+'/observed.txt',expectedPayload),expectedPin=add(evidenceFiles,'unit/'+caseId+'/expected.txt',expectedPayload);
 const record={schemaVersion:1,caseId,contractPin:policyPin,contractId:policy.contractId,memberKey,route:member.route,locale:member.locale,kind,scenarioId,state:'verified',
 source:{commit:'1'.repeat(40),tree:'2'.repeat(40),owners:ownerPins.filter(p=>[member.pageOwner,...policy.sharedOwners].includes(p.path))},artifact,
 execution:{reportPin,caseTitle,runId:'synthetic-unit-run',startedAt:'2026-10-20T00:00:00Z',finishedAt:'2026-10-20T00:00:01Z',platform:'synthetic unit fixture',browser:'synthetic unit fixture',viewport:{width:390,height:844},syntheticInputs:true,native:true,attempt:1,retries:0,skipped:false,harnessAccepted:true,ownerExit:0},assertionPin,
 payloads:kind==='export'?[{format:scenarioId==='txt-exact'?'txt':'print-pdf',observedPin,expectedPin,comparison:'bytes-exact',witnessPin:null}]:[],
 evidence:scenario.evidenceKinds.map(k=>({kind:k,pin:add(evidenceFiles,'unit/'+caseId+'/'+k+'.json',{synthetic:true,kind:k})})),reviewPin:null,
 limitations:['Synthetic validator unit input models an admitted record; it is not actual browser/app evidence.']};
 const review={decision:'accepted',reviewer:'synthetic-unit-reviewer',caseId,contractId:record.contractId,memberKey,route:record.route,locale:record.locale,kind,scenarioId,sourceCommit:record.source.commit,sourceTree:record.source.tree,artifactId:artifact.id,assertionSha256:assertionPin.sha256,executionReportSha256:reportPin.sha256,recordSha256:recordDigest(record)};
 record.reviewPin=add(evidenceFiles,'unit/'+caseId+'/review.json',review);
 const context={sourceFiles,evidenceFiles,current:{commit:record.source.commit,tree:record.source.tree,ownerPins:clone(ownerPins),policyPin,registryPin,sourceFiles:{...sourceFiles},artifact},admittedReviewHashes:[record.reviewPin.sha256]};
 return {record,context,assertion,review,add};
}
test('only a complete explicitly admitted current scenario can represent verified',()=>{const f=fixture();assert.equal(validateRecord(f.record,f.context).state,'verified');});
test('historical original-case PASS with owner125 remains qualified and export only partial',()=>{const f=fixture();f.record.state='qualified';f.record.artifact=null;f.record.execution.harnessAccepted=false;f.record.execution.ownerExit=125;f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,{...f.assertion,checks:f.assertion.checks.slice(0,2)});const result=summarize([f.record],f.context);assert.equal(result.members[0].requirements.export.state,'partial');for(const k of ['happy','error','recovery','accessibility','privacy'])assert.equal(result.members[0].requirements[k].state,'unknown');assert.equal(result.productionVerified,false);for(const k of ['globalFamilyTotal','completedFamilies','remainingFamilies','completionPercentage'])assert.equal(result[k],null);});
test('draft has no execution proof and does not earn partial acceptance',()=>{const f=fixture();Object.assign(f.record,{state:'draft',execution:null,assertionPin:null,reviewPin:null,payloads:[],evidence:[]});assert.equal(summarize([f.record],f.context).members[0].requirements.export.state,'unknown');});
for(const [name,change]of [
 ['wrong route',f=>f.record.route='/tools/other/'],
 ['wrong locale',f=>f.record.locale='fr'],
 ['unknown property',f=>f.record.pass=true],
 ['wrong scenario kind',f=>f.record.kind='privacy'],
 ['source commit drift',f=>f.context.current.commit='3'.repeat(40)],
 ['source tree drift',f=>f.context.current.tree='3'.repeat(40)],
 ['missing artifact',f=>f.record.artifact=null],
 ['changed artifact',f=>f.context.current.artifact={...f.context.current.artifact,id:'other'}],
 ['unaccepted harness',f=>f.record.execution.harnessAccepted=false],
 ['failed owner',f=>f.record.execution.ownerExit=125],
 ['synthetic execution',f=>f.record.execution.native=false],
 ['retry',f=>f.record.execution.retries=1],
 ['skip',f=>f.record.execution.skipped=true],
 ['missing review authority',f=>f.context.admittedReviewHashes=[]],
 ['missing payload',f=>f.record.payloads=[]],
 ['missing native log',f=>f.record.evidence=f.record.evidence.filter(x=>x.kind!=='native-log')],
 ['payload bytes changed',f=>f.context.evidenceFiles[f.record.payloads[0].observedPin.path]=Buffer.from('different')],
 ['missing actual evidence',f=>delete f.context.evidenceFiles[f.record.assertionPin.path]]
])test('refuses verified '+name,()=>{const f=fixture();change(f);assert.throws(()=>validateRecord(f.record,f.context));});
test('current owner mutation invalidates a prior source-qualified observation',()=>{const f=fixture();f.record.state='qualified';const pin=f.context.current.ownerPins.find(x=>x.path===policy.sharedOwners[0]);const changed=f.add(f.context.current.sourceFiles,pin.path,'CHANGED SYNTHETIC CURRENT OWNER');Object.assign(pin,changed);assert.equal(validateRecord(f.record,f.context).state,'invalidated');});
test('verified source owner drift cannot inherit old acceptance',()=>{const f=fixture();const pin=f.context.current.ownerPins.find(x=>x.path===policy.sharedOwners[0]);Object.assign(pin,f.add(f.context.current.sourceFiles,pin.path,'CHANGED SYNTHETIC CURRENT OWNER'));assert.throws(()=>validateRecord(f.record,f.context));});
test('incomplete expected-observed checks cannot certify the scenario',()=>{const f=fixture();f.assertion.checks.pop();f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,f.assertion);assert.throws(()=>validateRecord(f.record,f.context),/COMPLETE_EXPECTED_OBSERVED/);});
test('mismatched actual observation cannot certify the scenario',()=>{const f=fixture();f.assertion.checks[0].observed=false;f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,f.assertion);assert.throws(()=>validateRecord(f.record,f.context),/COMPLETE_EXPECTED_OBSERVED/);});
test('placeholder empty observed values are refused',()=>{const f=fixture();Object.assign(f.assertion.checks[0],{expected:{},observed:{}});f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,f.assertion);assert.throws(()=>validateRecord(f.record,f.context),/OBSERVED_VALUE_REQUIRED/);});
test('actual roster route mutation is not a title/sourceId equivalence',()=>{const f=fixture();const reg=JSON.parse(f.context.current.sourceFiles[f.context.current.registryPin.path]);reg.tools[0].canonicalRoute='/tools/elsewhere/';f.context.current.registryPin=f.add(f.context.current.sourceFiles,f.context.current.registryPin.path,reg);assert.throws(()=>validateRecord(f.record,f.context),/ACTUAL_ROSTER_JOIN/);});
test('independent review must bind exact scenario, source, artifact and observations',()=>{const f=fixture();f.review.scenarioId='print-pdf';f.record.reviewPin=f.add(f.context.evidenceFiles,f.record.reviewPin.path,f.review);f.context.admittedReviewHashes=[f.record.reviewPin.sha256];assert.throws(()=>validateRecord(f.record,f.context),/REVIEW_SCOPE/);});
test('a failure dossier remains a failure without being discarded as a false PASS',()=>{const f=fixture();f.record.state='failed';f.assertion.checks[0].observed=false;f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,f.assertion);assert.equal(summarize([f.record],f.context).members[0].requirements.export.state,'blocked');});
test('TXT alone never verifies both promised export actions',()=>{const f=fixture();assert.equal(summarize([f.record],f.context).members[0].requirements.export.state,'partial');});
test('duplicate case IDs cannot inflate requirement coverage',()=>{const f=fixture();assert.throws(()=>summarize([f.record,f.record],f.context),/DUPLICATE_CASE/);});

test('an incomplete required input/state variant roster cannot certify a scenario',()=>{const f=fixture();f.assertion.variantIds.pop();f.record.assertionPin=f.add(f.context.evidenceFiles,f.record.assertionPin.path,f.assertion);assert.throws(()=>validateRecord(f.record,f.context),/COMPLETE_EXPECTED_OBSERVED/);});
test('admitted reviewer scope binds the entire record including actual payload and evidence pins',()=>{const f=fixture();const pin=f.add(f.context.evidenceFiles,'unit/other-native-log.json',{synthetic:true});f.record.evidence[0].pin=pin;assert.throws(()=>validateRecord(f.record,f.context),/REVIEW_SCOPE/);});
function parsedFixture(){
 const f=fixture('export','print-pdf'),expected={synthetic:true,text:'SYNTHETIC PARSED PRINT CONTENT'};
 const expectedPin=f.add(f.context.evidenceFiles,'unit/print/expected.json',expected),parsedObservedPin=f.add(f.context.evidenceFiles,'unit/print/parsed.json',expected),parserPin=f.add(f.context.evidenceFiles,'unit/print/parser.js','SYNTHETIC PINNED PARSER SOURCE');
 const witness={sourceSha256:f.record.payloads[0].observedPin.sha256,expectedSha256:expectedPin.sha256,parserPin,parsedObservedPin};
 Object.assign(f.record.payloads[0],{expectedPin,comparison:'parsed-json',witnessPin:f.add(f.context.evidenceFiles,'unit/print/witness.json',witness)});
 f.review.recordSha256=recordDigest(f.record);f.record.reviewPin=f.add(f.context.evidenceFiles,f.record.reviewPin.path,f.review);f.context.admittedReviewHashes=[f.record.reviewPin.sha256];
 return {...f,witness};
}
test('parsed export observations bind exact raw payload, parser and expected content pins',()=>{const f=parsedFixture();assert.equal(validateRecord(f.record,f.context).state,'verified');});
test('parsed export witness cannot substitute a different raw download',()=>{const f=parsedFixture();f.witness.sourceSha256='0'.repeat(64);f.record.payloads[0].witnessPin=f.add(f.context.evidenceFiles,f.record.payloads[0].witnessPin.path,f.witness);assert.throws(()=>validateRecord(f.record,f.context),/PARSED_PAYLOAD_BINDING/);});
test('parsed export content disagreement refuses acceptance',()=>{const f=parsedFixture();const parsed=f.add(f.context.evidenceFiles,f.witness.parsedObservedPin.path,{synthetic:true,text:'DIFFERENT'});f.witness.parsedObservedPin=parsed;f.record.payloads[0].witnessPin=f.add(f.context.evidenceFiles,f.record.payloads[0].witnessPin.path,f.witness);assert.throws(()=>validateRecord(f.record,f.context),/COMPLETE_EXPECTED_OBSERVED/);});

// Current contradictory observations cannot be hidden by a passing row. Historical
// source/artifact failures remain visible without vetoing a fully current result.
function conflictingFailure(f){
 const failed=clone(f.record);failed.caseId+=':contradictory-failure';failed.state='failed';failed.reviewPin=null;
 const dossier=clone(f.assertion);dossier.checks[0].observed=false;
 failed.assertionPin=f.add(f.context.evidenceFiles,'unit/'+failed.caseId+'/assertions.json',dossier);
 return failed;
}
for(const reversed of [false,true]){
 test('current failed observation blocks verified requirement in '+(reversed?'reverse':'forward')+' order',()=>{
  const f=fixture('happy','valid-render'),failed=conflictingFailure(f),rows=[f.record,failed];
  const result=summarize(reversed?rows.reverse():rows,f.context);
  assert.equal(result.members[0].requirements.happy.state,'blocked');
  assert.equal(result.cases.find(row=>row.caseId===failed.caseId).currentCompatible,true);
 });
 test('older artifact failure does not veto current verified requirement in '+(reversed?'reverse':'forward')+' order',()=>{
  const f=fixture('happy','valid-render'),failed=conflictingFailure(f);
  failed.artifact={...failed.artifact,id:'synthetic-older-artifact',manifestPin:f.add(f.context.evidenceFiles,'unit/older-artifact.json',{synthetic:true,older:true})};
  const rows=[f.record,failed],result=summarize(reversed?rows.reverse():rows,f.context);
  assert.equal(result.members[0].requirements.happy.state,'verified');
  assert.equal(result.cases.find(row=>row.caseId===failed.caseId).currentCompatible,false);
 });
 test('historical source failure is invalidated and cannot veto current verification in '+(reversed?'reverse':'forward')+' order',()=>{
  const f=fixture('happy','valid-render'),failed=conflictingFailure(f);failed.source.commit='3'.repeat(40);
  const rows=[f.record,failed],result=summarize(reversed?rows.reverse():rows,f.context);
  assert.equal(result.members[0].requirements.happy.state,'verified');
  assert.equal(result.cases.find(row=>row.caseId===failed.caseId).state,'invalidated');
  assert.equal(result.cases.find(row=>row.caseId===failed.caseId).currentCompatible,false);
 });
}

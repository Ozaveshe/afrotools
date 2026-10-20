'use strict';
// Pure companion evidence validation. No filesystem, browser, provider or global-count mutation.
const crypto=require('node:crypto'),{isDeepStrictEqual:same}=require('node:util');
const {checkShape}=require('./free-app-family-inventory');
const schema=require('../../data/registry/free-app-acceptance-evidence.schema.json');
const policy=require('../../data/registry/free-app-acceptance-contracts/vaccine-visit-brief.json');
const POLICY_PATH='data/registry/free-app-acceptance-contracts/vaccine-visit-brief.json';
const need=(ok,code)=>{if(!ok)throw Error(code);};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const canonical=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(item=>JSON.parse(canonical(item))):Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])):value);
const recordDigest=record=>digest(Buffer.from(canonical({...record,reviewPin:null}),'utf8'));
function pinned(pin,files){
 need(pin&&typeof pin.path==='string'&&!pin.path.includes('\0')&&!pin.path.split(/[\\/]/).includes('..'),'EVIDENCE_PIN');
 need(files&&Object.hasOwn(files,pin.path)&&Buffer.isBuffer(files[pin.path]),'EVIDENCE_MISSING');
 const bytes=files[pin.path];need(bytes.length===pin.bytes&&digest(bytes)===pin.sha256,'EVIDENCE_PIN');return bytes;
}
const document=(pin,files)=>JSON.parse(pinned(pin,files).toString('utf8'));
function exactKeys(value,keys){need(value&&typeof value==='object'&&!Array.isArray(value)&&same(Object.keys(value).sort(),keys.slice().sort()),'DOSSIER_SHAPE');}
function runResult(pin,title,files){
 const report=document(pin,files),found=[];let nodes=0;
 function walk(s){need(++nodes<=10000,'RUN_REPORT_BOUND');for(const spec of s.specs||[])if(spec.title===title)found.push(spec);for(const suite of s.suites||[])walk(suite);}
 walk(report);need(found.length===1&&found[0].tests.length===1,'RUN_CASE_SCOPE');
 const test=found[0].tests[0];need(test.results.length===1,'RUN_RETRY_HISTORY');
 return {status:test.results[0].status,retry:test.results[0].retry,expected:test.expectedStatus,globalErrors:(report.errors||[]).length};
}
function validateRecord(record,context){
 checkShape(record,schema,'$',schema.$defs);
 const current=context.current,files=context.evidenceFiles;
 need(current&&current.sourceFiles&&Array.isArray(current.ownerPins),'CURRENT_BINDING');
 const policyBytes=pinned(current.policyPin,current.sourceFiles);
 need(current.policyPin.path===POLICY_PATH&&same(JSON.parse(policyBytes.toString('utf8')),policy),'CONTRACT_OWNER');
 need(record.contractPin.path===POLICY_PATH,'CONTRACT_PIN_SCOPE');pinned(record.contractPin,context.sourceFiles);
 const policyCurrent=same(record.contractPin,current.policyPin);
 const registry=document(current.registryPin,current.sourceFiles);
 const member=policy.roster.find(row=>row.memberKey===record.memberKey);
 need(member&&member.route===record.route&&member.locale===record.locale,'ROUTE_SCOPE');
 const catalog=registry.tools.filter(row=>row.id===member.catalogueId);
 need(catalog.length===1&&catalog[0].canonicalRoute===member.route&&catalog[0].localeCoverage.includes(member.locale)&&catalog[0].publicationStatus==='published'&&['free','free-and-pro'].includes(catalog[0].availability),'ACTUAL_ROSTER_JOIN');
 const scenario=policy.scenarios.find(row=>row.id===record.scenarioId);
 need(scenario&&scenario.kind===record.kind,'SCENARIO_SCOPE');
 const paths=[member.pageOwner,...policy.sharedOwners].sort();
 need(same(record.source.owners.map(p=>p.path).sort(),paths),'OWNER_SCOPE');
 for(const pin of record.source.owners)pinned(pin,context.sourceFiles);
 const currentOwners=paths.map(path=>{const pins=current.ownerPins.filter(p=>p.path===path);need(pins.length===1,'CURRENT_OWNER_SCOPE');pinned(pins[0],current.sourceFiles);return pins[0];});
 const order=rows=>rows.slice().sort((a,b)=>a.path.localeCompare(b.path));
 const sourceCurrent=record.source.commit===current.commit&&record.source.tree===current.tree&&same(order(record.source.owners),order(currentOwners));
 const artifactCurrent=!!record.artifact&&!!current.artifact&&same(record.artifact,current.artifact);
 if(record.artifact)pinned(record.artifact.manifestPin,files);
 const output={caseId:record.caseId,memberKey:record.memberKey,kind:record.kind,scenarioId:record.scenarioId,state:record.state,currentCompatible:policyCurrent&&sourceCurrent&&artifactCurrent,checks:[],limitations:record.limitations};
 if(record.state==='draft'){need(record.execution===null&&record.assertionPin===null&&record.reviewPin===null&&record.payloads.length===0&&record.evidence.length===0,'DRAFT_NOT_EXECUTED');return output;}
 need(record.execution&&record.assertionPin,'EXECUTION_REQUIRED');
 const execution=record.execution;
 need(Number.isFinite(Date.parse(execution.startedAt))&&Number.isFinite(Date.parse(execution.finishedAt))&&Date.parse(execution.finishedAt)>=Date.parse(execution.startedAt),'EXECUTION_TIME');
 const result=runResult(execution.reportPin,execution.caseTitle,files);
 const dossier=document(record.assertionPin,files);
 exactKeys(dossier,['syntheticInputs','memberKey','route','locale','scenarioId','variantIds','checks']);
 need(dossier.syntheticInputs===true&&dossier.memberKey===record.memberKey&&dossier.route===record.route&&dossier.locale===record.locale&&dossier.scenarioId===record.scenarioId&&Array.isArray(dossier.checks),'OBSERVED_SCOPE');
 need(Array.isArray(dossier.variantIds)&&dossier.variantIds.length>0&&new Set(dossier.variantIds).size===dossier.variantIds.length&&dossier.variantIds.every(id=>scenario.requiredVariants.includes(id)),'OBSERVED_VARIANT_SCOPE');
 const checkIds=new Set();let matched=true;
 for(const check of dossier.checks){
  exactKeys(check,['id','expected','observed']);
  need(scenario.checks.includes(check.id)&&!checkIds.has(check.id),'OBSERVED_CHECK_SCOPE');checkIds.add(check.id);
  const present=value=>value!==null&&value!==undefined&&(typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.trim().length>0||Array.isArray(value)&&value.length>0||typeof value==='object'&&Object.keys(value).length>0);
  need(present(check.expected)&&present(check.observed),'OBSERVED_VALUE_REQUIRED');
  const equal=same(check.expected,check.observed);matched=matched&&equal;output.checks.push({id:check.id,equal});
 }
 for(const item of record.evidence)pinned(item.pin,files);
 for(const payload of record.payloads){
  const observed=pinned(payload.observedPin,files),expected=pinned(payload.expectedPin,files);
  need(observed.length>0&&expected.length>0,'OBSERVED_PAYLOAD_REQUIRED');
  if(payload.format==='print-pdf')need(observed.subarray(0,5).toString('ascii')==='%PDF-','OBSERVED_PDF_SIGNATURE');
  if(payload.comparison==='bytes-exact'){need(payload.witnessPin===null,'PAYLOAD_WITNESS');matched=matched&&observed.equals(expected);}
  else{
   need(payload.witnessPin,'PAYLOAD_WITNESS');const witness=document(payload.witnessPin,files);
   exactKeys(witness,['sourceSha256','expectedSha256','parserPin','parsedObservedPin']);
   need(witness.sourceSha256===payload.observedPin.sha256&&witness.expectedSha256===payload.expectedPin.sha256,'PARSED_PAYLOAD_BINDING');pinned(witness.parserPin,files);
   const parsed=document(witness.parsedObservedPin,files);matched=matched&&same(parsed,JSON.parse(expected.toString('utf8')));
  }
 }
 if(record.state==='qualified'){
  need(result.status==='passed'&&matched&&dossier.checks.length>0,'QUALIFIED_OBSERVATION_REQUIRED');
  output.state=sourceCurrent&&policyCurrent?'qualified':'invalidated';
  output.reason=output.state==='invalidated'?'CURRENT_SOURCE_OR_CONTRACT_CHANGED':'Partial or historical evidence; never current verified acceptance';return output;
 }
 if(record.state==='failed'||record.state==='invalidated'){if(!sourceCurrent||!policyCurrent){output.state='invalidated';output.reason='CURRENT_SOURCE_OR_CONTRACT_CHANGED';}return output;}
 need(record.state==='verified'&&policyCurrent&&sourceCurrent&&artifactCurrent,'CURRENT_RELEASE_MISMATCH');
 need(execution.native&&execution.harnessAccepted&&execution.ownerExit===0&&!execution.skipped&&execution.retries===0&&result.status==='passed'&&result.expected==='passed'&&result.retry===0&&result.globalErrors===0,'NATIVE_ACCEPTANCE_REQUIRED');
 need(matched&&same([...checkIds].sort(),scenario.checks.slice().sort())&&same(dossier.variantIds.slice().sort(),scenario.requiredVariants.slice().sort()),'COMPLETE_EXPECTED_OBSERVED_REQUIRED');
 for(const kind of scenario.evidenceKinds)need(record.evidence.some(item=>item.kind===kind&&item.pin.bytes>0),'REQUIRED_OBSERVATION_KIND');
 if(record.kind==='export')need(record.payloads.some(row=>row.format===(record.scenarioId==='txt-exact'?'txt':'print-pdf')),'ACTUAL_EXPORT_PAYLOAD_REQUIRED');
 need(record.reviewPin&&Array.isArray(context.admittedReviewHashes)&&context.admittedReviewHashes.includes(record.reviewPin.sha256),'INDEPENDENT_REVIEW_REQUIRED');
 const review=document(record.reviewPin,files);
 exactKeys(review,['decision','reviewer','caseId','contractId','memberKey','route','locale','kind','scenarioId','sourceCommit','sourceTree','artifactId','assertionSha256','executionReportSha256','recordSha256']);
 need(review.decision==='accepted'&&typeof review.reviewer==='string'&&review.reviewer.trim()&&review.caseId===record.caseId&&review.contractId===record.contractId&&review.memberKey===record.memberKey&&review.route===record.route&&review.locale===record.locale&&review.kind===record.kind&&review.scenarioId===record.scenarioId&&review.sourceCommit===current.commit&&review.sourceTree===current.tree&&review.artifactId===current.artifact.id&&review.assertionSha256===record.assertionPin.sha256&&review.executionReportSha256===execution.reportPin.sha256&&review.recordSha256===recordDigest(record),'REVIEW_SCOPE');
 return output;
}
function summarize(records,context){
 const seen=new Set(),cases=records.map(record=>{need(!seen.has(record.caseId),'DUPLICATE_CASE');seen.add(record.caseId);return validateRecord(record,context);});
 const members=policy.roster.map(member=>({memberKey:member.memberKey,route:member.route,locale:member.locale,requirements:Object.fromEntries(policy.requiredKinds.map(kind=>{
  const required=policy.scenarios.filter(s=>s.kind===kind).map(s=>s.id),rows=cases.filter(c=>c.memberKey===member.memberKey&&c.kind===kind);
  const complete=required.every(id=>rows.some(row=>row.scenarioId===id&&row.state==='verified'&&row.currentCompatible));
  const currentFailure=rows.some(row=>row.state==='failed'&&row.currentCompatible);
  return [kind,{state:currentFailure?'blocked':complete?'verified':rows.some(row=>row.state==='invalidated')?'invalidated':rows.some(row=>['qualified','verified'].includes(row.state))?'partial':'unknown',requiredScenarioIds:required,evidenceCaseIds:rows.map(row=>row.caseId)}];
 }))}));
 return {contractId:policy.contractId,identityStatus:policy.identityStatus,coverage:'scoped-only',members,cases,globalFamilyTotal:null,completedFamilies:null,remainingFamilies:null,completionPercentage:null,productionVerified:false};
}
module.exports={validateRecord,summarize};

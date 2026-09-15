'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {dedicatedContract}=require('../scripts/lib/paye-verification-contract');
const sourceHooks=require('../scripts/apply-source-confidence-hooks');
for(const country of ['morocco','tunisia'])test(country+' dedicated verification retains visible evidence and report action',()=>{
 const outputs=require('../scripts/build-'+country+'-paye').outputs();
 for(const [file,html]of outputs){assert.deepEqual(dedicatedContract(html).errors,[],file);const stripped=html.replace(/<p>[^<]*(?:September|septembre|Septemba)[^<]*<\/p>/,'');assert.ok(dedicatedContract(stripped).errors.length,file+' missing review disclosure fails');assert.ok(dedicatedContract(html.replace('topic=calculation-error','topic=other')).errors.length,file+' missing report path fails');assert.ok(dedicatedContract(html.replace(/<a href="https:\/\/(?:www.finances.gov.ma|jibaya.tn)[^"]*"/,'<a href="https://example.com"')).errors.length,file+' wrong source fails');}
 const targets=[...outputs.keys()].map(file=>({file,sourceId:'legacy-source'}));const result=sourceHooks.applyTargets(targets);assert.ok(result.every(row=>row.action==='already-present'),'generic builder must preserve validated dedicated evidence');
});

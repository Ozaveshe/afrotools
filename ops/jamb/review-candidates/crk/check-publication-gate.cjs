'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fixtureLedger}=require('./check-candidate-integrity.cjs');
function verify(root=path.resolve(__dirname,'../../../..')){
 const modulePath=path.join(root,'scripts/lib/jamb-content-trust.js');
 const trust=require(modulePath),publication=require(path.join(root,'scripts/lib/jamb-publication.js'));
 let candidates=0,duplicate_negatives=0;
 require('./check-recovery-integrity.cjs').load();
 for(const f of fs.readdirSync(__dirname).filter(f=>/^crk-(?:wave|recovery)\d+\.json$/.test(f)).sort()){
  const batch=JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8')),ledger={schema_version:1,...fixtureLedger(batch)};
  for(const r of batch.records){
   const a=trust.assessQuestion(r.candidate,ledger);assert.equal(a.state,'eligible',r.id+': '+a.reasons.join(','));candidates++;
   const bad=structuredClone(r.candidate),keys=Object.keys(bad.options);bad.options[keys[1]]=bad.options[keys[0]];
   const badLedger=structuredClone(ledger);badLedger.questions[r.id].content_sha256=trust.questionFingerprint(bad);
   assert.ok(trust.assessQuestion(bad,badLedger).reasons.includes('duplicate_option_text'),r.id+' duplicate negative');duplicate_negatives++;
  }
  publication.buildPublications({questions:batch.records.map(r=>r.candidate)},{decks:[]},ledger);
 }
 return {passed:true,candidates,duplicate_negatives,publication_module_sha256:crypto.createHash('sha256').update(fs.readFileSync(modulePath)).digest('hex'),scope:'Candidate-only temporary accepted fixtures; no ledger or source pool mutation'};
}
module.exports={verify};
if(require.main===module){const at=process.argv.indexOf('--source-root');console.log(JSON.stringify(verify(at>=0?path.resolve(process.argv[at+1]):undefined)));}

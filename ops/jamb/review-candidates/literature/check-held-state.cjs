const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
function checkHeldState(original,current,{integrated=false,ledger,assessQuestion,recoveries}={}){
  a.equal(questionFingerprint(original.original_record),original.original_content_sha256);
  if(JSON.stringify(current)===JSON.stringify(original.original_record))return;
  a(integrated,'Held content changed outside integrated replay');
  const matches=recoveries.filter(r=>r.id===original.id&&r.candidate);a.equal(matches.length,1,'Unique recovery required');const r=matches[0];
  a.deepEqual(r.original_record,original.original_record);a.equal(r.original_content_sha256,original.original_content_sha256);
  a.equal(questionFingerprint(r.candidate),r.content_sha256);a.deepEqual(current,r.candidate);
  const accepted=ledger.questions[r.id];a(accepted,'Accepted recovery ledger entry required');a.equal(accepted.content_sha256,r.content_sha256);a.equal(accepted.source_id,r.source_id);
  for(const key of ['question_review','answer_review','explanation_review'])a.equal(accepted[key]?.status,'accepted');
  a.equal(assessQuestion(current,ledger).state,'eligible','Actual publication gate must accept recovery');
}
function check(original,current){const arg=process.argv.find(x=>x.startsWith('--ledger='));const recoveries=fs.readdirSync(__dirname).filter(f=>/^literature-recovery-\d{3}\.json$/.test(f)).flatMap(f=>{const b=JSON.parse(fs.readFileSync(path.join(__dirname,f)));return b.records.map(r=>({...r,source_id:b.source_id}));});checkHeldState(original,current,{integrated:process.argv.includes('--integrated'),recoveries,ledger:JSON.parse(fs.readFileSync(arg?arg.slice(9):path.join(root,'data/jamb/review-ledger.json'))),assessQuestion:require(path.join(root,'scripts/lib/jamb-content-trust')).assessQuestion});}
module.exports={checkHeldState,check};

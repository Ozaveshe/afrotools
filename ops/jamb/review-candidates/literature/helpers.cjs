const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),{questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust'),inventory=require('./source-inventory.json');
function loadOriginals(current,records){
  const live=new Map(current.map(q=>[q.id,q])),saved=new Map();
  for(const r of records){
    a(inventory.eligible_ids.includes(r.id),'Unknown saved original ID');
    a.equal(r.original_record.id,r.id);
    a.equal(r.original_record.subject,'literature');
    a.equal(questionFingerprint(r.original_record),r.original_content_sha256,'Original fingerprint changed: '+r.id);
    a(!saved.has(r.id),'Duplicate saved original: '+r.id);
    saved.set(r.id,r.original_record);
  }
  return inventory.eligible_ids.map(id=>{
    if(saved.has(id))return structuredClone(saved.get(id));
    const q=live.get(id);a(q,'Missing original: '+id);
    a(!q.verification,'Unreviewed fallback already has verification: '+id);
    return structuredClone(q);
  });
}
const arg=process.argv.find(x=>x.startsWith('--pool=')),current=arg?JSON.parse(fs.readFileSync(arg.slice(7))).questions:require('../../../jamb/source-pool.json').questions;
const saved=fs.readdirSync(__dirname).filter(f=>/^literature-\d{3}\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f))).records);
const pool=loadOriginals(current,saved);
const clean=s=>s.replace(/\[PAGE \d+\]/g,'').replace(/([a-z])-\s+([a-z])/gi,'$1$2').replace(/\s+/g,' ').trim();
const opt=(...v)=>Object.fromEntries(v.map((x,i)=>['ABCD'[i],x]));
function batch(start){const reviews={};return{reviews,r(i,answer,explanation,extra={}){const o=pool[start+i-1],options=extra.options||Object.fromEntries(Object.entries(o.options).map(([k,v])=>[k,clean(v)]));const expected=extra.expected; if(!expected&&!extra.solve)throw Error('Independent expected meaning required');reviews[i]={answer,question:clean(o.question),options,explanation,solve:extra.solve||(()=>{const matches=Object.values(options).filter(x=>expected.test(x));if(matches.length!==1)throw Error('Nonunique semantic solution '+i);return matches[0];}),...extra};}};}
module.exports={batch,opt,loadOriginals};

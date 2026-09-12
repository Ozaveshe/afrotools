const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),{loadOriginals}=require('./helpers.cjs'),iv=require('./source-inventory.json');
const records=fs.readdirSync(__dirname).filter(f=>/^literature-\d{3}\.json$/.test(f)).flatMap(f=>require('./'+f).records),pool=require('../../../jamb/source-pool.json').questions;
const candidateApplied=structuredClone(pool);for(const r of records.filter(r=>r.candidate)){candidateApplied[candidateApplied.findIndex(q=>q.id===r.id)]=r.candidate;}
const restored=loadOriginals(candidateApplied,records);a.deepEqual(restored.map(q=>q.id),iv.eligible_ids);for(const r of records)a.deepEqual(restored.find(q=>q.id===r.id),r.original_record);
const changed=structuredClone(records);changed[0].original_record.question+=' changed';a.throws(()=>loadOriginals(candidateApplied,changed),/fingerprint changed/);
a.throws(()=>loadOriginals(candidateApplied,[...records,records[0]]),/Duplicate saved/);
const missing=records.filter(r=>r.id!==records.find(r=>r.candidate).id);a.throws(()=>loadOriginals(candidateApplied,missing),/fallback already has verification/);
console.log(JSON.stringify({pass:true,originals_restored:records.length,stable_inventory_ids:restored.length,negative_guards:['changed original fingerprint','duplicate original','candidate fallback without original']}));

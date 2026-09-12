'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function verify(pool,ledger,receipt=require('./firstpass-coverage.json')){
 const actual=require('./check-original-inventory.cjs').verify(pool,ledger);
 assert.equal(actual.examined,1020);assert.equal(actual.remaining,0);assert.equal(actual.next_id,null);
 assert.deepEqual(receipt.coverage,actual);
 const inventory=require('./original-inventory.json');
 assert.equal(receipt.original_ids_sha256,inventory.original_ids_sha256);
 assert.deepEqual(receipt.source,inventory.source);assert.deepEqual(receipt.biblical_reference,inventory.biblical_reference);
 const files=fs.readdirSync(__dirname).filter(f=>/^crk-wave\d+\.json$/.test(f)).sort();
 assert.equal(files.length,26);assert.deepEqual(receipt.batches.map(b=>b.file),files);
 for(const pin of receipt.batches){const raw=fs.readFileSync(path.join(__dirname,pin.file)),batch=JSON.parse(raw);
  assert.equal(sha(raw),pin.sha256,'batch manifest changed');
  assert.equal(pin.examined,batch.examined_count);assert.equal(pin.candidates,batch.records.length);assert.equal(pin.held,batch.held_records.length);
 }
 return actual;
}
module.exports={verify};
if(require.main===module){const i=process.argv.indexOf('--source-root'),root=i<0?path.resolve(__dirname,'../../../..'):path.resolve(process.argv[i+1]);console.log(JSON.stringify(verify(require(path.join(root,'ops/jamb/source-pool.json')).questions,require(path.join(root,'data/jamb/review-ledger.json')))));}

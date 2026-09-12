'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const check=require('../ops/jamb/review-candidates/chemistry/check-source-material.cjs');
const batch=require('../ops/jamb/review-candidates/chemistry/batch-016.json');
test('private PDF absence is allowed only after intake with pinned material identity',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jamb-source-test-'));
  const pdf=path.join(dir,'source.pdf');
  try {
    assert.match(check(batch,true,pdf),/private PDF unavailable/);
    assert.throws(()=>check(batch,false,pdf),/requires the original/);
    const changed=structuredClone(batch);changed.source.content_sha256='0'.repeat(64);
    assert.throws(()=>check(changed,true,pdf));
    fs.writeFileSync(pdf,'wrong material');
    assert.throws(()=>check(batch,true,pdf));
    assert.throws(()=>check(batch,false,pdf));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

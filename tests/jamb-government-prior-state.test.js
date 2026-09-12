'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const expectedHash = require('../ops/jamb/review-candidates/government/pool-record-hash.cjs');
test('Government mixed intake requires accepted prior evidence while current rows stay original', () => {
  const row = {id:'q', publication_candidate:true, original_content_sha256:'original', content_sha256:'candidate'};
  const entry = {content_sha256:'candidate', ...Object.fromEntries(['question_review','answer_review','explanation_review'].map(k=>[k,{status:'accepted'}]))};
  const mode = {integrated:false,mixedPrior:true,currentIds:new Set(),ledger:{questions:{q:entry}}};
  assert.equal(expectedHash(row, mode), 'candidate');
  assert.equal(expectedHash(row, {...mode,currentIds:new Set(['q'])}), 'original');
  assert.equal(expectedHash(row, {...mode,mixedPrior:false}), 'original');
  assert.equal(expectedHash(row, {...mode,ledger:{questions:{}}}), 'original');
  assert.equal(expectedHash(row, {...mode,integrated:true,currentIds:new Set(['q'])}), 'candidate');
  assert.throws(()=>expectedHash(row,{...mode,ledger:{questions:{q:{...entry,content_sha256:'drift'}}}}), /fingerprint drift/);
  for (const field of ['question_review','answer_review','explanation_review']) {
    assert.throws(()=>expectedHash(row,{...mode,ledger:{questions:{q:{...entry,[field]:{status:'pending'}}}}}), /incomplete/);
  }
  const held = {...row,publication_candidate:false};
  assert.throws(()=>expectedHash(held,mode), /Held prior/);
  assert.equal(expectedHash(held,{...mode,integrated:true,ledger:{questions:{}}}), 'original');
});

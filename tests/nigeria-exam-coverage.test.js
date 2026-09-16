'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {inventory}=require('../scripts/audit-nigeria-exam-coverage');

test('coverage includes other subjects and explicit recent-year acquisition gaps',()=>{
  const raw=[{id:'p1',subject:'physics',year:2020,num:1},{id:'p2',subject:'physics',year:2020,num:3},{id:'b1',subject:'biology',year:2019,num:1}];
  const rows=inventory(raw,[raw[0]],[2025,2026]);
  const physics=rows.find(r=>r.subject==='physics'&&r.year===2020);
  assert.equal(physics.source_records,2);
  assert.equal(physics.published_records,1);
  assert.equal(physics.held_records,1);
  assert.deepEqual(physics.holes_within_observed_numbering,[2]);
  for(const subject of ['physics','biology','english','mathematics']){
    for(const year of [2025,2026]){
      const gap=rows.find(r=>r.subject===subject&&r.year===year);
      assert.equal(gap.status,'source-needed');
      assert.equal(gap.expected_paper_questions,null);
      assert.equal(gap.complete_paper,false);
    }
  }
});

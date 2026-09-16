'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const intake=require('../ops/nigeria-exams/jamb-2023-mathematics-intake.json');
test('recent publisher-labelled JAMB candidates have independently verified answers without assuming official provenance',()=>{
 const counts={};for(const letter of 'SYLLABUS')counts[letter]=(counts[letter]||0)+1;
 function count(remaining){if(!remaining)return 1;let total=0;for(const letter of Object.keys(counts)){if(!counts[letter])continue;counts[letter]--;total+=count(remaining-1);counts[letter]++;}return total;}
 assert.equal(count(8),10080);assert.match(intake.records[0].independent_result,/10080/);
 assert.ok(Math.abs(16**0.16*16**0.04*2**0.2-2)<1e-12);assert.equal(4*16+4*4+20,100);assert.equal(intake.records[1].independent_result,'2; option A.');
 assert.ok(intake.records.every(q=>q.complete_options_observed));assert.equal(intake.status,'candidate-only');assert.match(intake.year_status,/not been authenticated/);
});

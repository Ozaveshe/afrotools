'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('path');
const quality=require('../scripts/lib/calculation-quality'),registration=require('../scripts/lib/calculation-quality-ci-birth');
const root=path.resolve(__dirname,'..'),artifact='assets/js/engines/ci-birth-leave.js';
test('CI birth permission is high-risk legal logic with noncurrency review-required provenance',()=>{
 const classification=quality.classifyArtifact(artifact);assert.equal(classification.riskDomain,'legal_regulatory');assert.equal(classification.riskLevel,'high');
 const metadata=registration.metadata(artifact);assert.deepEqual(metadata.jurisdictions,['CI']);assert.equal(metadata.currency,null);assert.ok(metadata.units.includes('working-days'));assert.ok(metadata.units.includes('calendar-days'));assert.equal(metadata.effectiveDateStatus,'review-required');assert.equal(metadata.supportStatus,'review-required');assert.match(metadata.sources[0].title,/2025 compilation/);assert.match(metadata.disclaimer,/Confirm current law/);
 assert.deepEqual(registration.metadata('assets/js/engines/unrelated.js'),{});
});
test('registered golden runner checks all literal expectations and detects date regression',()=>{
 const artifacts=quality.loadQualityArtifacts(root);artifacts.fixtures.fixtures=artifacts.fixtures.fixtures.filter(f=>f.operation==='ci-birth-leave');assert.equal(artifacts.fixtures.fixtures.length,12);
 const result=quality.runGoldenFixtures(artifacts,root);assert.equal(result.passed,12);assert.deepEqual(result.failures,[]);
 const fixture=artifacts.fixtures.fixtures.find(f=>f.id==='ci-birth-six-day-friday');fixture.expected['schedule.returnDate']='2026-09-20';
 const negative=quality.runGoldenFixtures(artifacts,root);assert.equal(negative.failures.length,1);assert.equal(negative.failures[0].id,fixture.id);
});

'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const engine=require('../assets/js/engines/idea-evidence-explorer');
const ledger=require('../data/ideas/registration-evidence.json');
const copy=()=>JSON.parse(JSON.stringify(ledger));
test('country claims stay separate from generated idea estimates and origins',()=>{
 const input={id:'synthetic',name:'Synthetic shop',country_code:'KE',sector:'retail',source:'seed',startup_cost_min:75000,monthly_revenue_max:50000};
 const before=engine.normalizeRow(input);const refs=engine.registrationReferences(ledger,'KE','2026-10-13');
 assert.equal(refs.length,1);assert.equal(refs[0].amount,950);assert.equal(refs[0].sourcePublicationDate,null);
 assert.deepEqual(engine.normalizeRow(input),before);assert.equal(before.recordOrigin,'generated_example');assert.equal(before.source.url,'');
 assert.equal(engine.registrationReferences(ledger,'NG','2026-10-13')[0].amount,null);
 assert.equal(engine.registrationReferences(ledger,'NG','2026-10-13')[0].state,'applicability_unverified');
 assert.deepEqual(engine.registrationReferences(ledger,'ZA','2026-10-13'),[]);
});
test('amount expires after 30 days but original source and check dates remain',()=>{
 assert.equal(engine.registrationReferences(ledger,'KE','2026-11-12')[0].amount,950);
 const ref=engine.registrationReferences(ledger,'KE','2026-11-13')[0];assert.equal(ref.amount,null);assert.equal(ref.state,'expired');
 assert.equal(ref.reviewedAt,'2026-10-13');assert.equal(ref.sourceUrl,ledger.claims[0].sourceUrl);
});
test('invalid dates, future review, wrong country currency and untrusted URLs fail closed',()=>{
 for(const patch of [{reviewedAt:'2026-02-30'},{observedAt:'2026-10-14'},{reviewedAt:'2026-10-14'},{sourcePublicationDate:'2026-02-30'},{sourceSignatureDate:'2026-02-30'},{effectiveFrom:'2026-10-14'},{amount:'950'},{currency:'NGN'},{sourceUrl:'https://brs.go.ke.attacker.invalid/fees'},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:pass@brs.go.ke/'},{reviewCadenceDays:90},{claimType:'monthly_revenue'},{entityType:'private_company'},{status:'approved'}]){
  const value=copy();Object.assign(value.claims[0],patch);assert.deepEqual(engine.registrationReferences(value,'KE','2026-10-13'),[],JSON.stringify(patch));
 }
 assert.deepEqual(engine.registrationReferences(ledger,'KE','not-a-date'),[]);
});
test('general registration citations cannot upgrade estimated financial fields',()=>{
 const value=copy();value.estimateFieldsVerified=['startup_cost_min'];assert.deepEqual(engine.registrationReferences(value,'KE','2026-10-13'),[]);
 value.estimateFieldsVerified=[];value.scope='verified_business_ideas';assert.deepEqual(engine.registrationReferences(value,'KE','2026-10-13'),[]);
});
test('ledger has distinct observed/document dates, evidence locators, exclusions and all public locale labels',()=>{
 for(const claim of ledger.claims){assert.equal(claim.effectiveFrom,null);assert.ok(claim.exclusions.length);assert.ok(claim.sourceLocator);assert.equal(claim.observedAt,'2026-10-13');for(const lang of ['en','fr','sw'])assert.ok(claim.label[lang]);}
 assert.equal(ledger.claims[1].sourcePublicationDate,'2025-05-29');assert.match(ledger.claims[0].reviewNotes,/conflicts/);assert.match(ledger.claims[1].reviewNotes,/disagree/);
});

test('recent inspection never promotes a historical amount with unproven applicability',()=>{
 const historical=engine.registrationReferences(ledger,'NG','2026-10-13')[0];assert.equal(historical.amount,null);assert.equal(historical.state,'applicability_unverified');assert.equal(historical.observedAt,'2026-10-13');assert.equal(historical.sourcePublicationDate,'2025-05-29');assert.equal(historical.sourceSignatureDate,'2024-10-31');assert.ok(historical.sourceUrl.includes('cac.gov.ng'));
});

test('published edition and instrument signature remain distinct and ordered',()=>{
 const claim=engine.registrationReferences(ledger,'NG','2026-10-13')[0];assert.equal(claim.sourcePublicationDate,'2025-05-29');assert.equal(claim.sourceSignatureDate,'2024-10-31');assert.equal(claim.amount,null);
 const invalid=copy();invalid.claims[1].sourceSignatureDate='2026-10-13';assert.deepEqual(engine.registrationReferences(invalid,'NG','2026-10-13'),[]);
});

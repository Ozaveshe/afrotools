'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const api = require('../assets/js/pages/za-household-lpg');
const reference = require('../data/fuel/household-lpg-references.json').ZA;
const lookup = require('../data/fuel/za-lpg-district-zones.json');
const owner = require('../scripts/generate-fuel-tracker-country-pages');
const snapshot = require('../data/fuel/latest.json');
const calc = (zone,kg,supply='unknown',date='2026-11-27') => api.calculate({zone,kg,supply},reference,date);

test('the two official November tables remain distinct, hash-bound source facts',()=>{
  const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(Object.keys(reference.zoneCentsPerKg).length,54);
  assert.equal(digest(reference.zoneCentsPerKg),'4e1d94651d5d198b546c07c5975fbcbc1edd22ecce434b231af17d548350345b');
  assert.equal(digest(reference.additionalSchedules.saldanha.zoneCentsPerKg),'51e6696d51dc983cf025b83bfb0638a9b81754ba80898576e43475e3aad7c51f');
  assert.equal(reference.validFrom,'2026-11-04'); assert.equal(reference.validThrough,'2026-12-01');
});
test('independent refill totals and unknown supply do not invent a supplier',()=>{
  assert.deepEqual(calc('1A','9').entries.map(x=>x.totalCents),[32751,35244]);
  assert.equal(calc('1A','19','saldanha').entries[0].totalCents,74404);
  assert.equal(calc('1A','48','general').entries[0].totalCents,174672);
  assert.equal(calc('9C','9','general').entries[0].totalCents,35676);
  assert.equal(calc('9C','4.5','general').entries[0].totalCents,17838);
  assert.equal(calc('9C','9').missingSaldanha,true);
  assert.throws(()=>calc('9C','9','saldanha'),/does not list/);
  assert.equal(calc('1A','9').supply,'unknown');
});
test('invalid or prototype selections and malformed mass cannot become a price',()=>{
  for(const kg of ['',0,-1,49,Infinity,NaN,'0x10','1e1','1.2345',null]) assert.throws(()=>calc('1A',kg),String(kg));
  for(const zone of ['','constructor','__proto__','01A']) assert.throws(()=>calc(zone,'9'));
  for(const supply of ['constructor','other','']) assert.throws(()=>calc('1A','9',supply));
});
test('expiry uses explicit inclusive dates; historical totals never become fresh by calculation',()=>{
  assert.equal(calc('1A','9','general','2026-11-03').state,'not-yet-effective');
  assert.equal(calc('1A','9','general','2026-11-04').state,'in-period');
  assert.equal(calc('1A','9','general','2026-12-01').state,'in-period');
  assert.equal(calc('1A','9','general','2026-12-02').state,'expired');
  assert.equal(calc('1A','9','general','2027-01-01').entries[0].totalCents,32751);
});
test('archival district lookup preserves split rows and clipped labels instead of guessing',()=>{
  assert.equal(lookup.records.length,385);assert.equal(lookup.sourceLastModified,'2021-11-08');
  assert.deepEqual(api.search('Johannesburg',lookup).map(x=>x.zone),['9C']);
  assert.deepEqual(api.search('Cape Town',lookup).map(x=>x.zone),['1A']);
  assert.deepEqual(api.search('Malmesbury',lookup).map(x=>x.zone).sort(),['1A','3A']);
  assert(api.search('Malmesbury',lookup).every(x=>x.boundaryCheck));
  assert(lookup.records.some(x=>x.sourceLabelClipped&&x.boundaryCheck));
  assert.deepEqual(api.search('unknown synthetic district',lookup),[]);
});
test('actual country renderer owns the calculator; other countries have none and no native names leak',()=>{
  const za=snapshot.countries.find(x=>x.code==='ZA'),ke=snapshot.countries.find(x=>x.code==='KE');
  const html=owner.htmlPage(za,snapshot.countries),other=owner.htmlPage(ke,snapshot.countries);
  assert.match(html,/data-za-lpg-calculator/);assert.match(html,/za-household-lpg\.js/);
  const form=html.match(/<form novalidate>[\s\S]*?<\/form>/)[0];
  assert.doesNotMatch(form,/\bname=/);assert.match(form,/<button type="submit" disabled>/);
  assert.match(html,/supplier routes are not detected/);assert.match(html,/1 December 2026/);
  assert.doesNotMatch(other,/data-za-lpg-calculator|za-household-lpg\.js/);
});

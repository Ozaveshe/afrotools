'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {validateFeed, MAX_BYTES} = require('../assets/js/lib/regulatory-public-feed.js');
const root = path.join(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'data/regulatory/public-feed.json')));
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'engines/src/regulatory-alerts-engine.js'), 'utf8'), sandbox);
const engine = sandbox.RAEngine, now = Date.parse('2026-10-16T11:00:00Z');
const copy = () => JSON.parse(JSON.stringify(seed));
function rejects(change) { const data=copy(); change(data); assert.throws(()=>validateFeed(data,engine,now),/invalid-public-regulatory-feed/); }
test('actual one-event public source preserves official instrument, precision, exceptions and review provenance',()=>{
  const feed=validateFeed(seed,engine,now), r=feed.records[0];
  assert.equal(feed.records.length,1);assert.deepEqual(feed.coverage.countries,['ZA']);
  assert.equal(r.id,'za-dole-notice-r7083-2026-nmw');assert.equal(r.source_id,'mw-za-gazette-2026');
  assert.equal(r.effective_date,'2026-03-01');assert.equal(r.source_published_date,'2026-02-03');
  assert.equal(r.reviewed_at,'2026-10-16T10:05:05.416Z');
  assert.equal(r.public_approval.source_review_sha256,'e5cb240bc8aa83ae159ae146035ad67bd793e3e60073488fe65b179cb5f35f2d');
  assert.match(r.summary,/30\.23 per ordinary hour/);assert.match(r.summary,/separately ZAR 16\.62/);
  assert.match(r.summary,/Schedule 2/);assert.doesNotMatch(r.summary,/monthly|annual/);
  assert.equal(r.sources.length,2);assert.match(r.sources[0].url,/54075rg11941gon7083\.pdf$/);
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/hr-payroll/official-sources.json'))).sources.find(s=>s.id===r.source_id);
  assert.equal(r.sources[0].url,ledger.url);assert.equal(r.country_code,ledger.country);assert.equal(r.effective_date,ledger.effectiveDate);
  assert.equal(r.status,'historical');assert.equal(r.review_due,false);
  assert.equal(r.review_due_at,'2027-01-14T10:05:05.416Z');
  assert.ok(fs.statSync(path.join(root,'data/regulatory/public-feed.json')).size<MAX_BYTES);
});
test('exact schema rejects private fields at envelope, coverage, event, source and public approval boundaries',()=>{
  for(const field of ['reporter','reporter_email','receipt_id','review_queue','gazette_changes','ip_hash','notes','verified','source_url']){
    rejects(d=>{d.records[0][field]='private synthetic';});
  }
  rejects(d=>{d.private_reports=[];});rejects(d=>{d.coverage.private_ids=[];});
  rejects(d=>{d.records[0].sources[0].private_id='synthetic';});
  rejects(d=>{d.records[0].public_approval.moderation_note='synthetic';});
});
test('country, public type, ID and reference keys are exact allowlists, not private taxonomy or callbacks',()=>{
  for(const country of ['ZZ','__proto__',null]) rejects(d=>{d.records[0].country_code=country;});
  for(const type of ['minimum_wage','other','__proto__']) rejects(d=>{d.records[0].change_type=type;});
  rejects(d=>{d.records[0].tools_referenced=['javascript:alert(1)'];});
  rejects(d=>{d.records[0].id='../private';});rejects(d=>{d.records[0].source_id='';});
});
test('duplicate identities and dishonest coverage fail closed',()=>{
  rejects(d=>{d.records.push(d.records[0]);});
  rejects(d=>{d.coverage.countries=['ZA','NG'];});
  rejects(d=>{d.coverage.change_types=['minimum-wage','paye-bands'];});
  rejects(d=>{d.coverage.not_exhaustive=false;});
  rejects(d=>{d.coverage.mode='live-54-country-monitoring';});
});
test('strict dates reject invalid days, forged review times, date-only review and invented effective instants',()=>{
  rejects(d=>{d.records[0].effective_date='2026-02-30';});
  rejects(d=>{d.records[0].effective_date='2026-03-01T00:00:00Z';});
  rejects(d=>{d.records[0].source_published_date='2026-13-01';});
  rejects(d=>{d.records[0].reviewed_at='2026-02-30T10:00:00.000Z';});
  rejects(d=>{d.records[0].reviewed_at='2026-10-17T00:00:00.000Z';});
  rejects(d=>{d.records[0].reviewed_at='2026-10-16';});
  rejects(d=>{d.records[0].reviewed_at='2026-01-01T00:00:00.000Z';});
  const data=copy();data.records[0].effective_date=null;
  assert.equal(validateFeed(data,engine,now).records[0].effective_date,null);
});
test('unsafe or duplicated sources, missing primary evidence and forged approval fields fail closed',()=>{
  for(const url of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','data:text/html,test',null]){
    rejects(d=>{d.records[0].sources[0].url=url;});
  }
  rejects(d=>{d.records[0].sources[0].kind='private-report';});
  rejects(d=>{d.records[0].sources[0].kind='corroboration';});
  rejects(d=>{d.records[0].sources.push(d.records[0].sources[0]);});
  rejects(d=>{d.records[0].public_approval.source_review_sha256='verified';});
  rejects(d=>{delete d.records[0].public_approval;});
});
test('review-due boundary is exactly90days, without replacing original review/effective dates',()=>{
  const due=Date.parse(seed.records[0].reviewed_at)+90*86400000;
  assert.equal(validateFeed(seed,engine,due-1).records[0].review_due,false);
  const r=validateFeed(seed,engine,due).records[0];assert.equal(r.review_due,true);
  assert.equal(r.reviewed_at,seed.records[0].reviewed_at);assert.equal(r.effective_date,'2026-03-01');
});
test('supersession and withdrawal retain historical records and require explicit corrections',()=>{
  const data=copy(), next=JSON.parse(JSON.stringify(data.records[0]));next.id='za-official-synthetic-successor';
  data.records.push(next);data.records[0].status='superseded';data.records[0].superseded_by=next.id;data.records[0].correction_note='Synthetic correction fixture only.';
  assert.equal(validateFeed(data,engine,now).records.length,2);
  rejects(d=>{d.records[0].status='superseded';});
  rejects(d=>{d.records[0].status='withdrawn';});
  rejects(d=>{d.records[0].superseded_by=d.records[0].id;});
  rejects(d=>{d.records[0].status='live';});
  data.records[0].status='withdrawn';data.records[0].superseded_by=null;
  assert.equal(validateFeed(data,engine,now).records[0].status,'withdrawn');
});
test('valid empty editorial list remains explicitly limited; unexpected fields never become empty success',()=>{
  const data=copy();data.records=[];data.coverage.countries=[];data.coverage.change_types=[];
  assert.deepEqual(validateFeed(data,engine,now).records,[]);
  data.data=[];assert.throws(()=>validateFeed(data,engine,now));
});
test('maintained build and focused check own this dataset without running generators or networking',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
  assert.equal(pkg.scripts['regulatory:feed:check'],'node scripts/check-regulatory-public-feed.js');
  assert.match(pkg.scripts['build:checks'],/^npm run regulatory:feed:check && /);
  const source=fs.readFileSync(path.join(root,'scripts/check-regulatory-public-feed.js'),'utf8');
  assert.doesNotMatch(source,/\bfetch\(|writeFile|execSync/);
});

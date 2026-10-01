
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const monitor=require('../netlify/functions/_shared/election-monitor');
const ledger=require('../data/government/africa-election-tracker.json');
test('monitor persists failures and keeps editorial review separate from observations',async()=>{
  const first=await monitor.collect(ledger,null,async()=> 'first','2026-10-01T00:00:00Z');
  assert.ok(first.sources.every(source=>source.requiresReview));
  const changed=await monitor.collect(ledger,first,async()=> 'changed','2026-10-01T01:00:00Z');
  assert.ok(changed.sources.every(source=>source.status==='changed'));
  const stable=await monitor.collect(ledger,changed,async()=> 'changed','2026-10-01T02:00:00Z');
  assert.ok(stable.sources.every(source=>source.requiresReview && source.changedAt==='2026-10-01T01:00:00Z'));
  const failed=await monitor.collect(ledger,stable,async()=> {throw new Error('HTTP 403');},'2026-10-01T03:00:00Z');
  assert.equal(failed.status,'degraded');
  assert.ok(failed.sources.every(source=>source.status==='blocked' && source.hash==='changed' && source.observedAt==='2026-10-01T02:00:00Z'));
  const publicData=monitor.publicReport(failed,Date.parse('2026-10-01T03:30:00Z'));
  assert.ok(publicData.sources.every(source=>!Object.hasOwn(source,'hash')));
  assert.equal(monitor.publicReport(failed,Date.parse('2026-10-01T06:00:00Z')).status,'stale');
  assert.equal(monitor.publicReport(failed,Date.parse('2026-09-30T06:00:00Z')).status,'stale');
});
test('source fetch rejects cross-host redirects, challenges, oversized responses and HTTP failures',async()=>{
  const source={url:'https://example.org/source'};
  for(const response of [
    new Response('',{status:302,headers:{location:'http://127.0.0.1/'}}),
    new Response('Forbidden',{status:403}),
    new Response('Verify you are human',{headers:{'content-type':'text/html'}}),
    new Response('x'.repeat(1024*1024+1),{headers:{'content-type':'text/html'}}),
    new Response('x',{headers:{'content-type':'image/jpeg'}})
  ]) await assert.rejects(monitor.retrieve(source,async()=>response));
  const hash=await monitor.retrieve(source,async()=>new Response('<html>Public notice</html>',{headers:{'content-type':'text/html'}}));
  assert.match(hash,/^[a-f0-9]{64}$/);
});
test('only bounded code-owned source targets are fetched',()=>{
  assert.ok(monitor.targets(ledger).length<=16);
  const bad=structuredClone(ledger);
  bad.elections[0].sources.forEach(source=>{source.url='http://127.0.0.1/';source.checkedAt='9999-01-01';});
  assert.throws(()=>monitor.targets(bad));
});

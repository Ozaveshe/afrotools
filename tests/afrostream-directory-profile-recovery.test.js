'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const snapshot = require('../data/afrostream/creator-directory-snapshot.json');
const richer = require('../data/afrostream/creators-fallback.json');
const html = fs.readFileSync(path.join(root, 'tools/afrostream/creator.html'), 'utf8');
const lookup = html.slice(html.indexOf('var profileLookupUnavailable'), html.indexOf('async function fetchAllCreators'));
const richRows = Array.isArray(richer) ? richer : richer.creators;
const reply = (status, payload) => ({ok:status>=200 && status<300, status, json:async()=>payload});
function profile(detail, list, saved=snapshot) {
  const requests = [];
  const ctx=vm.createContext({fetch:async url=>{
    requests.push(url);
    if(url.startsWith('/api/afrostream/creator?')) return detail;
    if(url.startsWith('/api/afrostream/creators?')) return list;
    assert.equal(url,'/data/afrostream/creator-directory-snapshot.json');
    return reply(200,saved);
  }});
  vm.runInContext(lookup,ctx);
  return {lookup:ctx.fetchCreator,requests};
}
const degraded=reply(200,{success:true,degraded:true,data:richRows});
test('each published directory slug recovers only its saved identity and matching channels',async()=>{
  const ctx=profile(reply(500,{}),degraded);
  for (const row of snapshot.creators) {
    const result=await ctx.lookup(row.slug);
    assert.equal(result.directoryRecord,row,row.slug);
    assert.equal(result.channelRecord,richRows.find(other=>other.slug===row.slug)||null);
    assert.equal(result.snapshotDate,snapshot.retrievedAt.slice(0,10));
  }
  assert.equal(await ctx.lookup('absent-from-the-saved-directory'),null);
});
test('live withdrawal, permission denial and an authoritative empty list stop recovery',async()=>{
  for (const scenario of [[reply(404,{}),degraded],[reply(410,{}),degraded],
    [reply(403,{}),degraded],[reply(200,{success:true,data:{creator:{is_published:false}}}),degraded],
    [reply(200,{success:true,data:{creator:{flagged:true}}}),degraded],
    [reply(500,{}),reply(200,{success:true,data:[],count:0})]]) {
    const ctx=profile(...scenario);
    assert.equal(await ctx.lookup(snapshot.creators[0].slug),null);
    assert(!ctx.requests.some(url=>url.startsWith('/data/')));
  }
  const absent=profile(reply(500,{}),degraded,{...snapshot,creators:[]});
  assert.equal(await absent.lookup(richRows[0].slug),null);
});

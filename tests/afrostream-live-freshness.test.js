'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function engine(file, fetcher) {
  const context = {window:{},fetch:fetcher,AbortSignal,URL,console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return context.window.AfroStreamEngine;
}
for (const file of ['engines/src/afrostream-engine.js','engines/afrostream-engine.js']) {
  test(file + ': cached flags, duplicate URLs and unknown countries cannot manufacture a current stream',async()=>{
    const now=Date.now(), calls=[];
    const current={id:1,creator_name:'A creator',platform:'youtube',is_live:true,stream_date:new Date(now-60000).toISOString(),url:'https://youtube.com/watch?v=abcdefghijk',country:'ZW'};
    const rows=[current,{...current,id:2},{...current,id:3,url:'https://youtube.com/watch?v=oldabcdefgh',stream_date:new Date(now-3*3600000).toISOString()},{...current,id:4,url:'https://youtube.com/watch?v=futureabcde',stream_date:new Date(now+3600000).toISOString()}];
    const future={...current,id:5,is_live:false,stream_date:new Date(now+3600000).toISOString()};
    const app=engine(file,async(url)=>{calls.push(url);return new Response(JSON.stringify({success:true,data:url.includes('live=false')?[future]:rows}));});
    const result=await app.loadStreams([]);
    assert.equal(result.live.length,1);
    assert.equal(result.live[0].country,-1,'unmapped Zimbabwe must not be labelled Nigeria');
    assert.equal(result.live[0].url,current.url);
    assert.equal(result.upcoming.length,1);
    assert.ok(calls.some(url=>url.includes('live=true')));
    assert.ok(calls.some(url=>url.includes('live=false')));
  });
  test(file + ': an unavailable provider is distinct from a successfully checked empty live feed',async()=>{
    const empty=engine(file,async()=>new Response(JSON.stringify({success:true,data:[]})));
    assert.equal((await empty.loadStreams([])).live.length,0);
    const failed=engine(file,async(url)=>new Response(url.includes('live=true')?'upstream unavailable':JSON.stringify({success:true,data:[]}),{status:url.includes('live=true')?503:200}));
    await assert.rejects(()=>failed.loadStreams([]),/checks unavailable/);
    const partial=engine(file,async(url)=>new Response(url.includes('live=false')?'upstream unavailable':JSON.stringify({success:true,data:[]}),{status:url.includes('live=false')?503:200}));
    const result=await partial.loadStreams([]);
    assert.equal(result.live.length,0);assert.equal(result.upcoming,null);
  });
}

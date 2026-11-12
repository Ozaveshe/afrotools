const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const path=require('path');
const root=__dirname;
const repo=path.resolve(__dirname, '..');
const api=require(repo+'/assets/js/lib/product-health.js');
const source=fs.readFileSync(repo+'/assets/js/pages/product-health-status.js','utf8');
async function run(release){
 const fixture={platform:[{id:'website',name:'Website',status:'unknown'},{id:'authentication',name:'Authentication',status:'unknown'}],products:[{id:'fuel',name:'Fuel',status:'stale',last_verified:'2026-09-01T00:00:00Z',coverage:'Saved source coverage'},{id:'afrostream',name:'AfroStream',status:'stale',next_expected_check:'2026-08-03'}]};
 const strong={},span={};const nodes={productHealthSnapshot:{textContent:JSON.stringify(fixture)},platformStatus:{},productStatus:{},releaseStatus:{},healthSummary:{dataset:{},querySelector:s=>s==='strong'?strong:span}};
 const responses=[{categories:{fuel:{status:'offline',updatedAt:null}},overall_health:'unknown'}, {data:{generated_at:'2026-11-07',creators:{published:4},streams:{total_published:5},news:{total_published:6},sources:{with_error:1}}},release];let i=0;
 vm.runInNewContext(source,{window:{AfroTools:{productHealth:api}},document:{getElementById:id=>nodes[id]},fetch:async()=>({ok:true,json:async()=>responses[i++]}),Promise,Date});
 await new Promise(r=>setImmediate(r));
 assert.match(nodes.productStatus.innerHTML,/Live refresh unavailable/);
 assert.match(nodes.productStatus.innerHTML,/2026-09-01/);
 assert.match(nodes.productStatus.innerHTML,/Saved source coverage/);
 assert.doesNotMatch(nodes.productStatus.innerHTML,/2026-08-03/);
 assert.doesNotMatch(strong.textContent,/verified evidence|Temporarily unavailable/);
 assert.match(nodes.platformStatus.innerHTML,/Authentication/);
 if(release.production&&release.context==='production'){
  assert.match(nodes.platformStatus.innerHTML,/Status endpoint reachable/);
  assert.match(nodes.platformStatus.innerHTML,/individual tools, search and authentication have separate checks/);
 }else assert.doesNotMatch(nodes.platformStatus.innerHTML,/Status endpoint reachable/);
 return true;
}
require('node:test')('status runtime distinguishes reachability, freshness and retained evidence', async()=>{await run({production:true,context:'production',commit:'3ef297ab334eeaa9ae2f0174dec6986bf40ed1cf',built_at:'2026-11-07'});await run({production:true,context:'deploy-preview',commit:'3ef297ab334eeaa9ae2f0174dec6986bf40ed1cf',built_at:'2026-11-07'});await run({});console.log('PASS: unavailable refresh preserves saved evidence; stale schedule cleared; scope-limited production reachability; preview/absent release rejected; summary avoids outage/verification overclaim.');});

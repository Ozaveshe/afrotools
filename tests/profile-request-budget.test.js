'use strict';
const a=require('node:assert/strict'),{test}=require('node:test');
const {fixture,response,flush,user,baseEvent}=require('./support/profile-provider-fixture');
const authOK=t=>t.pathname==='/auth/v1/user'?response(200,user):null;
function noSessionMutation(r){a.equal(r.multiValueHeaders,undefined);a.equal(r.headers['Set-Cookie'],undefined);}
function check(name,run){test(name,run);}
function register(){
 for(const name of['netlify/functions/api-profile.js','netlify/functions/afropoints-profile.js']){
  check(name+' signedout401 without provider traffic',async()=>{const f=fixture(()=>{throw Error('Unexpected fetch');});const r=await f.handler(name)({...baseEvent,headers:{}});a.equal(r.statusCode,401);a.equal(f.requests.length,0);noSessionMutation(r);a.equal(f.state().activeTimers,0);});
  check(name+' valid Auth+REST200',async()=>{const f=fixture(async t=>authOK(t)||response(200,[{id:user.id,current_balance:7}]));const r=await f.handler(name)(baseEvent);a.equal(r.statusCode,200);a.equal(f.requests.length,2);noSessionMutation(r);a(/no-store/.test(r.headers['Cache-Control']));});
  check(name+' invalid401 remains401',async()=>{const f=fixture(async()=>response(401,{}));const r=await f.handler(name)(baseEvent);a.equal(r.statusCode,401);a.equal(f.requests.length,1);noSessionMutation(r);});
  check(name+' Auth504 becomes503 without credential fallback',async()=>{const f=fixture(async()=>response(504,{}));const r=await f.handler(name)({...baseEvent,headers:{...baseEvent.headers,cookie:'afro_session=synthetic-cookie; afro_refresh=synthetic-refresh'}});a.equal(r.statusCode,503);a.equal(f.requests.length,1);noSessionMutation(r);});
  for(const service of['Auth','REST','refresh'])for(const body of[false,true])check(name+' hung '+service+' '+(body?'body':'headers')+' finite5000ms',async()=>{
   const f=fixture(async t=>{
    const targeted=service==='Auth'?t.pathname==='/auth/v1/user':service==='REST'?t.pathname.startsWith('/rest/'):t.pathname==='/auth/v1/token';
    if(targeted)return body?{status:200,ok:true,text:()=>new Promise(()=>{}),json:()=>new Promise(()=>{})}:new Promise(()=>{});
    if(service==='refresh'&&t.pathname==='/auth/v1/user')return response(401,{});
    return authOK(t)||response(200,[]);
   });
   const e=service==='refresh'?{...baseEvent,headers:{cookie:'afro_session=synthetic-old; afro_refresh=synthetic-refresh'}}:baseEvent;
   const p=f.handler(name)(e);await flush();a.equal(f.timers.size,1);f.advance(5000);const r=await p;a.equal(r.statusCode,503);noSessionMutation(r);a.equal(f.state().activeTimers,0);a(f.state().aborted>=1);const calls=f.requests.length;await flush();a.equal(f.requests.length,calls,'No automatic retry after failure');
  });
  check(name+' Auth4000ms plus REST share remaining1000ms, no timer reset',async()=>{
   let restStarted=false;const f=fixture(async t=>{if(t.pathname==='/auth/v1/user'){f.at(4000);return response(200,user);}restStarted=true;return new Promise(()=>{});});
   const p=f.handler(name)(baseEvent);await flush();a(restStarted);a.equal([...f.timers.values()][0].at,5000);f.advance(999);await flush();a.equal(f.state().activeTimers,1);f.advance(1);const r=await p;a.equal(r.statusCode,503);noSessionMutation(r);
  });
  check(name+' REST504 returns503 without consuming body or retry',async()=>{let reads=0;const f=fixture(async t=>authOK(t)||{status:504,ok:false,text:async()=>{reads++;return'private';},json:async()=>{reads++;return{};}});const r=await f.handler(name)(baseEvent);a.equal(r.statusCode,503);a.equal(reads,0);a.equal(f.requests.length,2);noSessionMutation(r);});
  check(name+' known refreshed cookies survive later REST body timeout',async()=>{const f=fixture(async t=>t.pathname==='/auth/v1/user'?response(401,{}):t.pathname==='/auth/v1/token'?response(200,{access_token:'synthetic-rotated',refresh_token:'synthetic-new-refresh',expires_in:3600,user}):{status:200,ok:true,text:()=>new Promise(()=>{}),json:()=>new Promise(()=>{})});const p=f.handler(name)({...baseEvent,headers:{cookie:'afro_session=synthetic-old; afro_refresh=synthetic-refresh'}});await flush();a.equal(f.requests.length,3);f.advance(5000);const r=await p;a.equal(r.statusCode,503);a.equal(r.multiValueHeaders['Set-Cookie'].length,2);a(r.multiValueHeaders['Set-Cookie'].some(x=>x.includes('synthetic-rotated')));a(!r.multiValueHeaders['Set-Cookie'].some(x=>/Max-Age=0/.test(x)));});
  check(name+' concurrent success survives independent timeout+late completion',async()=>{let releaseFirst,releaseSecond,n=0;const f=fixture(async t=>{if(t.pathname==='/auth/v1/user')return response(200,user);return++n===1?new Promise(r=>{releaseFirst=r;}):new Promise(r=>{releaseSecond=r;});});const firstPending=f.handler(name)(baseEvent),secondPending=f.handler(name)(baseEvent);await flush();a.equal(n,2);a.equal(f.timers.size,2);releaseFirst(response(200,[{id:user.id,current_balance:7}]));const first=await firstPending;const saved=JSON.stringify(first);a.equal(f.timers.size,1);f.advance(5000);const failed=await secondPending;a.equal(failed.statusCode,503);releaseSecond(response(200,[{id:'synthetic-late'}]));await flush();a.equal(JSON.stringify(first),saved);noSessionMutation(failed);});
 }
 check('api-profile POST fallback REST headers stays inside original total deadline',async()=>{let rest=0;const f=fixture(async t=>{if(t.pathname==='/auth/v1/user')return response(200,user);return++rest===1?response(400,{}):new Promise(()=>{});});const p=f.handler('netlify/functions/api-profile.js')({...baseEvent,httpMethod:'POST',body:JSON.stringify({name:'Synthetic'})});await flush();a.equal(rest,2);f.advance(5000);a.equal((await p).statusCode,503);});
 check('afropoints POST write body stays inside original total deadline',async()=>{const f=fixture(async(t,opts)=>{if(t.pathname==='/auth/v1/user')return response(200,user);return(opts.method||'GET')==='GET'?response(200,[{created_at:'2026-01-01',current_balance:7}]):{status:200,ok:true,text:()=>new Promise(()=>{})};});const p=f.handler('netlify/functions/afropoints-profile.js')({...baseEvent,httpMethod:'POST',body:'{}'});await flush();a.equal(f.requests.length,3);f.advance(5000);a.equal((await p).statusCode,503);});

}
register();

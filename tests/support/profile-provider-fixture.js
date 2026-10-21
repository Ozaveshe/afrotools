'use strict';
// All provider/account inputs are synthetic. This fixture never imports production modules into the host context.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),user=Object.freeze({id:'synthetic-user',email:'fixture@example.invalid'});
const baseEvent={httpMethod:'GET',headers:{authorization:'Bearer synthetic-access'},queryStringParameters:{}};
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
function response(status,data){return{status,ok:status>=200&&status<300,text:async()=>JSON.stringify(data),json:async()=>data};}
function fixture(provider){
 const cache={},timers=new Map(),requests=[];let seq=0,now=0,aborted=0;
 const clock={setTimeout(f,ms){a.equal(ms,5000);const id=++seq;timers.set(id,{at:now+ms,f});return id;},clearTimeout(id){timers.delete(id);}};
 async function fetch(url,opts={}){const target=new URL(url);a.equal(target.hostname,'synthetic.example.invalid');a(opts.signal,'Every opted-in provider call has the total-budget signal');requests.push({path:target.pathname,method:opts.method||'GET'});opts.signal.addEventListener('abort',()=>aborted++);return provider(target,opts,requests.length);}
 function load(name){if(cache[name])return cache[name];const sandbox={module:{exports:{}},exports:{},AbortController,Promise,Number,RangeError,Error,URL,Date,console:{error(){throw Error('Unexpected private logger');}},process:{env:{SUPABASE_AUTH_URL:'https://synthetic.example.invalid',SUPABASE_ANON_KEY_AUTH:'synthetic-anon',SUPABASE_AUTH_SERVICE_KEY:'synthetic-service'}},fetch,setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout,require(dep){if(dep==='./utils/cors')return{getAllowedOrigin:()=> 'https://synthetic-client.example.invalid'};if(dep==='./_shared/browser-session-auth')return load('netlify/functions/_shared/browser-session-auth.js');if(dep==='./_shared/profile-request-budget')return load('netlify/functions/_shared/profile-request-budget.js');if(dep==='./_shared/market-data')return load('netlify/functions/_shared/market-data.js');throw Error('Unknown import '+dep);}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),sandbox,{filename:name});const out=Object.keys(sandbox.module.exports).length?sandbox.module.exports:sandbox.exports;cache[name]=out;return out;}
 return{handler:name=>load(name).handler,requests,timers,advance(ms){now+=ms;for(const [id,t]of[...timers])if(t.at<=now){timers.delete(id);t.f();}},at(ms){now=ms;},state:()=>({aborted,activeTimers:timers.size,now})};
}

function legacyFixture(name,provider,{key=true}={}){
 const requests=[],sideEffects=[];
 const sandbox={module:{exports:{}},AbortController:class{constructor(){throw Error('Default API must not create an AbortController');}},setTimeout(){throw Error('Default API must not create timer');},clearTimeout(){throw Error('Default API must not clear timer');},process:{env:{SUPABASE_AUTH_URL:'https://synthetic.example.invalid',...(key?{SUPABASE_ANON_KEY_AUTH:'synthetic-anon',SUPABASE_AUTH_SERVICE_KEY:'synthetic-service'}:{})}},fetch:async(url,opts={})=>{const target=new URL(url);a.equal(target.hostname,'synthetic.example.invalid');a(!('signal'in opts),'Default request remains signal-free');const r={path:target.pathname,method:opts.method||'GET',headers:opts.headers,body:opts.body};requests.push(r);return provider(target,opts,requests.length);},require(n){throw Error('Unexpected module '+n);},console:{error(){sideEffects.push('console-error');}}};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,name),'utf8'),sandbox,{filename:name});
 return{api:sandbox.module.exports,requests,sideEffects};
}

module.exports={fixture,legacyFixture,response,flush,user,baseEvent};

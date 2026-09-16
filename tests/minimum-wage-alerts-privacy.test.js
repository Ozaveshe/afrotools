const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../netlify/functions/minimum-wage-alerts.js'), 'utf8');
for (const type of ['alert','violation']) for (const mode of ['success','http-error','network-error']) test(`${type}: ${mode} preserves response and never logs submitted content`,async()=>{
  const logs=[],requests=[];let bodyReads=0;
  const sensitive='synthetic-sensitive@example.invalid salary=123456.78 city=Synthetic City';
  const context={exports:{},process:{env:{}},require:()=>({getAllowedOrigin:()=> 'https://afrotools.com'}),console:{error:(...args)=>logs.push(args)},fetch:async(url,options)=>{
    requests.push({url,options});
    if(mode==='network-error')throw new Error(sensitive);
    return {ok:mode==='success',status:mode==='success'?201:409,text:async()=>{bodyReads++;return sensitive;}};
  }};
  vm.runInNewContext(source,context);
  const input=type==='alert'?{type,country_code:'ZA',email:'synthetic-sensitive@example.invalid'}:{type,country_code:'ZA',sector:'Synthetic sector',salary:123456.78,city:'Synthetic City'};
  const response=await context.exports.handler({httpMethod:'POST',body:JSON.stringify(input)});
  assert.equal(response.statusCode,mode==='success'?200:500);
  assert.deepEqual(JSON.parse(response.body),mode==='success'?{ok:true}:{ok:false,error:type==='alert'?'Subscription failed':'Report submission failed'});
  assert.equal(requests.length,1);assert.equal(bodyReads,0);
  const payload=JSON.parse(requests[0].options.body);
  assert.deepEqual(payload,type==='alert'?{country_code:'ZA',email:input.email}:{country_code:'ZA',sector:input.sector,city:input.city,reported_salary:input.salary});
  assert.deepEqual(JSON.parse(JSON.stringify(logs)),mode==='success'?[]:[['minimum-wage insert failed',{operation:type,status:mode==='http-error'?409:0}]]);
  assert.equal(response.headers['Access-Control-Allow-Origin'],'https://afrotools.com');
});

const test = require("node:test");
const assert = require("node:assert/strict");
const proxy = require("../netlify/functions/idea-evidence.js");

function jwt(payload) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({alg:"HS256",typ:"JWT"})}.${encode(payload)}.signature`;
}
const goodKey = jwt({ ref:"zpclagtgczsygrgztlts", role:"anon" });
const goodEnv = { SUPABASE_AUTH_URL:"https://zpclagtgczsygrgztlts.supabase.co", SUPABASE_ANON_KEY_AUTH:goodKey };
const event = (overrides = {}) => Object.assign({ httpMethod:"GET", headers:{}, queryStringParameters:{} }, overrides);

test("accepts only OPTIONS and bodyless GET", async () => {
  const handler = proxy.createHandler({ env:goodEnv, fetchImpl:async () => ({ok:true,json:async()=>[],headers:{get:()=>null}}) });
  assert.equal((await handler(event({httpMethod:"OPTIONS"}))).statusCode, 204);
  assert.equal((await handler(event({httpMethod:"POST"}))).statusCode, 405);
  assert.equal((await handler(event({body:"{}"}))).statusCode, 400);
});

test("fails closed on project URL mismatch or missing publishable key", async () => {
  let called = false;
  const fetchImpl = async () => { called=true; throw new Error("should not run"); };
  const mismatch = proxy.createHandler({ env:{...goodEnv,SUPABASE_AUTH_URL:"https://wncwtzqipnoqwmqlznqn.supabase.co"},fetchImpl });
  assert.equal((await mismatch(event())).statusCode, 503);
  const missing = proxy.createHandler({ env:{SUPABASE_AUTH_URL:goodEnv.SUPABASE_AUTH_URL},fetchImpl });
  assert.equal((await missing(event())).statusCode, 503);
  assert.equal(called,false);
});

test("rejects malformed, wrong-project and service-role JWTs without upstream access", async () => {
  let called = false;
  const fetchImpl = async () => { called=true; return {ok:true,json:async()=>[]}; };
  for (const key of ["not-a-jwt", jwt({ref:"wncwtzqipnoqwmqlznqn",role:"anon"}), jwt({ref:"zpclagtgczsygrgztlts",role:"service_role"})]) {
    const handler = proxy.createHandler({ env:{...goodEnv,SUPABASE_ANON_KEY_AUTH:key},fetchImpl });
    const result = await handler(event());
    assert.equal(result.statusCode,503);
    assert.doesNotMatch(result.body,/wncwtz|service_role|not-a-jwt/);
  }
  assert.equal(called,false);
});

test("whitelists query names and validates every filter", async () => {
  const handler = proxy.createHandler({ env:goodEnv,fetchImpl:async()=>({ok:true,json:async()=>[],headers:{get:()=>null}}) });
  assert.equal((await handler(event({queryStringParameters:{admin:"true"}}))).statusCode,400);
  assert.equal((await handler(event({queryStringParameters:{country:"KEN"}}))).statusCode,400);
  assert.equal((await handler(event({queryStringParameters:{sector:"unknown"}}))).statusCode,400);
  assert.equal((await handler(event({queryStringParameters:{page:"1001"}}))).statusCode,400);
});

test("builds a bounded read-only upstream request and returns count separately", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request={url,options};
    return {ok:true,json:async()=>[{id:"one",name:"Allowed",country_code:"KE",sector:"energy",submitter_email:"private@example.com",user_id:"private-user",internal_secret:"hidden"}],headers:{get:name=>name==="content-range"?"0-0/42":null}};
  };
  const handler=proxy.createHandler({env:goodEnv,fetchImpl});
  const result=await handler(event({queryStringParameters:{country:"ke",sector:"energy",risk:"low",maxBudget:"500000",search:"solar & cold",sort:"cost",page:"2"}}));
  assert.equal(result.statusCode,200);
  assert.match(request.url,/zpclagtgczsygrgztlts\.supabase\.co\/rest\/v1\/business_ideas/);
  assert.match(request.url,/limit=24/);
  assert.match(request.url,/offset=24/);
  assert.doesNotMatch(request.url,/select=\*/);
  assert.match(request.url,/select=id%2Cname|select=id,name/);
  assert.equal(request.options.method,"GET");
  assert.equal(request.options.body,undefined);
  assert.equal(request.options.headers.apikey,goodKey);
  const body=JSON.parse(result.body);
  assert.equal(body.rows[0].id,"one");
  assert.equal(body.rows[0].name,"Allowed");
  assert.equal(body.reportedTotal,42);
  assert.doesNotMatch(result.body,/private@example|private-user|internal_secret|hidden/);
  assert.doesNotMatch(result.body,new RegExp(goodKey.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.equal(result.headers["Cache-Control"],"no-store, max-age=0");
});

test("does not echo upstream errors and times out safely", async () => {
  const broken=proxy.createHandler({env:goodEnv,fetchImpl:async()=>{throw new Error("token=private-upstream-detail")}});
  const failure=await broken(event());
  assert.equal(failure.statusCode,502);
  assert.doesNotMatch(failure.body,/private-upstream-detail|token=/);
  const timeout=proxy.createHandler({env:goodEnv,timeoutMs:100,fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener("abort",()=>reject(new Error("abort")), {once:true}))});
  const timed=await timeout(event());
  assert.equal(timed.statusCode,504);
  assert.deepEqual(JSON.parse(timed.body),{error:"evidence_service_timeout"});
});

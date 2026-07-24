"use strict";
const assert=require("assert");
const direct=require("../netlify/functions/crypto-p2p.js");
const proxy=require("../netlify/functions/api-crypto.js");

(async()=>{
  const originalFetch=global.fetch;
  let calls=0;
  global.fetch=async()=>{calls+=1;throw new Error("upstream fetch must not run");};
  try{
    const event={httpMethod:"GET",path:"/.netlify/functions/crypto-p2p",headers:{origin:"https://afrotools.com"},queryStringParameters:{asset:"USDT",fiat:"NGN"}};
    const response=await direct.handler(event);
    assert.equal(response.statusCode,410);
    const body=JSON.parse(response.body);
    assert.equal(body.error,"p2p_rate_endpoint_retired");
    assert.equal(body.replacement,"/crypto/p2p-rates/");

    const proxyResponse=await proxy.handler({...event,path:"/api/crypto/p2p",headers:{origin:"https://afrotools.com","x-forwarded-for":"192.0.2.1"}});
    assert.equal(proxyResponse.statusCode,410);
    const proxyBody=JSON.parse(proxyResponse.body);
    assert.equal(proxyBody.status,"retired");
    assert.equal(proxyBody.endpoint,"crypto/p2p");
    assert.equal(calls,0);

    const discovery=await proxy.handler({...event,path:"/api/crypto",queryStringParameters:{},headers:{origin:"https://afrotools.com","x-forwarded-for":"192.0.2.2"}});
    assert.equal(discovery.statusCode,200);
    const discoveryBody=JSON.parse(discovery.body);
    assert.equal(discoveryBody.endpoints.p2p.status,"retired");
    assert.equal(discoveryBody.endpoints.p2p.response,"410 Gone");
    assert.equal(calls,0);

    const options=await direct.handler({...event,httpMethod:"OPTIONS"});
    assert.equal(options.statusCode,204);
    assert.equal(calls,0);
  }finally{
    global.fetch=originalFetch;
  }
  console.log("crypto-p2p-retired: ok");
})().catch(error=>{console.error(error);process.exitCode=1;});

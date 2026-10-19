const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

const ADAPTER = path.join(__dirname, '..', 'netlify', 'functions', '_shared', 'email-adapter.js');
const WEBHOOK = path.join(__dirname, '..', 'netlify', 'functions', 'resend-webhook.js');
const WEEKLY = path.join(__dirname, '..', 'netlify', 'functions', 'send-weekly-newsletter.js');
const delivery = require('../netlify/functions/_shared/marketing-delivery');
const originalReserve = delivery.reserve;
const originalFinish = delivery.finish;

function loadAdapter(env) {
  delete require.cache[require.resolve(ADAPTER)];
  process.env.RESEND_API_KEY = env.RESEND_API_KEY || '';
  process.env.EMAIL_MARKETING_PAUSED = env.EMAIL_MARKETING_PAUSED || '';
  process.env.EMAIL_MARKETING_FROM = env.EMAIL_MARKETING_FROM || '';
  process.env.EMAIL_REPLY_TO = env.EMAIL_REPLY_TO || '';
  return require(ADAPTER);
}

(async function run() {
  var originalFetch = global.fetch;
  var originalKey = process.env.RESEND_API_KEY;
  var originalPaused = process.env.EMAIL_MARKETING_PAUSED;
  var originalMarketingFrom = process.env.EMAIL_MARKETING_FROM;
  var originalReplyTo = process.env.EMAIL_REPLY_TO;
  try {
    var missing = loadAdapter({});
    var missingResult = await missing.sendEmail({ to: 'person@example.test' });
    assert.equal(missingResult.providerStatus, 'provider_missing');

    var paused = loadAdapter({ RESEND_API_KEY: 're_test', EMAIL_MARKETING_PAUSED: 'true' });
    var pausedResult = await paused.sendEmail({ to: 'person@example.test', marketing: true });
    assert.equal(pausedResult.providerStatus, 'marketing_paused');

    var captured;
    global.fetch = async function (_url, options) {
      captured = JSON.parse(options.body);
      return {
        ok: true,
        json: async function () { return { id: 'email_test_123' }; },
      };
    };
    var active = loadAdapter({
      RESEND_API_KEY: 're_test',
      EMAIL_MARKETING_FROM: 'AfroTools Brief <brief@afrotools.com>',
      EMAIL_REPLY_TO: 'hello@afrotools.com',
    });
    delivery.reserve = async () => ({ status: 'reserved', key: 'test-key' });
    delivery.finish = async () => {};
    var sent = await active.sendEmail({
      to: 'person@example.test',
      subject: 'Useful update',
      html: '<p>Hello</p>',
      text: 'Hello',
      marketing: true,
      unsubscribeUrl: 'https://afrotools.com/api/email/unsubscribe?token=test',
      tags: [{ name: 'email_type', value: 'weekly_brief' }],
    });
    assert.equal(sent.id, 'email_test_123');
    assert.equal(captured.from, 'AfroTools Brief <brief@afrotools.com>');
    assert.equal(captured.reply_to, 'hello@afrotools.com');
    assert.equal(captured.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    assert.match(captured.headers['List-Unsubscribe'], /^<https:\/\/afrotools\.com\//);
    assert.deepEqual(captured.tags, [{ name: 'email_type', value: 'weekly_brief' }]);

    const webhook = require(WEBHOOK);
    const rawSecret = crypto.randomBytes(32);
    const secret = 'whsec_' + rawSecret.toString('base64');
    const body = JSON.stringify({ type: 'email.complained', data: { to: ['Person@Example.test'] } });
    const timestamp = Math.floor(Date.now() / 1000);
    const id = 'msg_test_123';
    const signature = crypto
      .createHmac('sha256', rawSecret)
      .update(id + '.' + timestamp + '.' + body)
      .digest('base64');
    const event = {
      body,
      headers: {
        'svix-id': id,
        'svix-timestamp': String(timestamp),
        'svix-signature': 'v1,' + signature,
      },
    };
    assert.equal(webhook.verifyWebhook(event, secret, timestamp), true);
    assert.equal(webhook.verifyWebhook(event, secret, timestamp + 301), false);
    assert.equal(webhook.suppressionReason({ type: 'email.bounced', data: { bounce: { type: 'Permanent' } } }), 'permanent_bounce');
    assert.equal(webhook.suppressionReason({ type: 'email.bounced', data: { bounce: { type: 'Transient' } } }), '');
    assert.deepEqual(webhook.recipientEmails({ data: { to: ['Person@Example.test'] } }), ['person@example.test']);

    const weekly = require(WEEKLY);
    const editionDates = [
      new Date('2026-07-06T08:00:00Z'),
      new Date('2026-07-13T08:00:00Z'),
      new Date('2026-07-20T08:00:00Z'),
      new Date('2026-07-27T08:00:00Z'),
    ];
    const editions = editionDates.map(function (date) {
      return weekly.weeklyEdition({ country_code: 'NG' }, date).id;
    });
    assert.equal(new Set(editions).size, 4, 'four consecutive weeks should rotate through four editions');
    editionDates.forEach(function (date) {
      var message = weekly.buildWeeklyMessage(
        { email: 'person@example.test', name: 'Ada', country_code: 'NG' },
        'https://afrotools.com/api/email/unsubscribe?token=test',
        date
      );
      assert.equal(message.tags.length, 3);
      assert.equal((message.html.match(/utm_content=/g) || []).length, 1, 'weekly email should have one primary content CTA');
      assert.match(message.text, /Unsubscribe: https:\/\/afrotools\.com\//);
    });

    console.log('email-delivery-safety: ok');
  } finally {
    delivery.reserve = originalReserve;
    delivery.finish = originalFinish;
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalPaused === undefined) delete process.env.EMAIL_MARKETING_PAUSED;
    else process.env.EMAIL_MARKETING_PAUSED = originalPaused;
    if (originalMarketingFrom === undefined) delete process.env.EMAIL_MARKETING_FROM;
    else process.env.EMAIL_MARKETING_FROM = originalMarketingFrom;
    if (originalReplyTo === undefined) delete process.env.EMAIL_REPLY_TO;
    else process.env.EMAIL_REPLY_TO = originalReplyTo;
    delete require.cache[require.resolve(ADAPTER)];
  }
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});

// Optional-email regression: synthetic API key handler boundary, no real services.
(function apiKeyEmailBoundary() {
 const {test}=require('node:test'),assert=require('node:assert/strict');
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 function apiFixture(options={}) {
  const calls={rate:[],auth:0,list:0,get:0,set:[],fetch:[],random:[],plan:[]};
  const lead={opt_in_digest:options.existingPreference===undefined?false:options.existingPreference,suppressed:true};
  const records=options.records||{};
  const store={list:async()=>{calls.list++;return{blobs:Object.keys(records).map(key=>({key}))}},get:async key=>{calls.get++;return records[key]},setJSON:async(key,value)=>{calls.set.push({key,value});if(options.failStore)throw Error('Synthetic store failure')}};
  const mocks={
   '@netlify/blobs':{getStore:name=>{assert.equal(name,'apikeys');return store}},
   crypto:{randomBytes:n=>{calls.random.push(n);return Buffer.alloc(n,7)}},
   './utils/cors':{getAllowedOrigin:()=> 'https://afrotools.com'},
   './_shared/rate-limit':{checkRateLimit:(key,limit)=>{calls.rate.push({key,limit});return options.rateAllowed!==false}},
   './utils/supabase-session':{resolveAuthenticatedUser:async(_event,policy)=>{calls.auth++;assert.deepEqual(JSON.parse(JSON.stringify(policy)),{requireVerifiedEmail:true});return options.authError||{userId:'synthetic-user',email:' Reader@Example.test '}}},
   './_shared/api-plans':{getApiPlanLimit:tier=>{calls.plan.push(tier);assert.equal(tier,'free');return{day:100,month:3000}}}
  };
  const module={exports:{}};
  const context={module,exports:module.exports,Buffer,URLSearchParams,Date,
   process:{env:{SUPABASE_DATA_URL:'https://synthetic.invalid',SUPABASE_DATA_SERVICE_ROLE_KEY:'synthetic-service-key'}},
   console:{error:()=>{}},
   require:name=>{assert.ok(Object.hasOwn(mocks,name),'No external dependency '+name);return mocks[name]},
   fetch:async(url,init)=>{calls.fetch.push({url,init});const body=JSON.parse(init.body);lead.opt_in_digest=body.opt_in_digest;return{ok:true}}
  };
  const source=fs.readFileSync(path.join(__dirname,'../netlify/functions/api-keys-create.js'),'utf8');
  vm.runInNewContext(source,context,{filename:'synthetic-api-key-handler.js'});
  const request=(body={},method='POST',extra={})=>({httpMethod:method,headers:{'content-type':'application/json','x-nf-client-connection-ip':'192.0.2.10'},body:JSON.stringify(body),...extra});
  return{calls,lead,handler:module.exports.handler,request};
 }
 for(const choice of [undefined,false,true])test('API key optional-email: issuance never enrolls from '+String(choice),async()=>{
  const f=apiFixture(),body={name:'  Synthetic Key  ',useCase:'comparison',email:'ignored@example.test'};
  if(choice!==undefined){body.opt_in_digest=choice;body.email_digest_enabled=choice;}
  const result=await f.handler(f.request(body)),data=JSON.parse(result.body);
  assert.equal(result.statusCode,200);assert.equal(data.ok,true);assert.equal(data.apiKey,'afro_live_'+Buffer.alloc(16,7).toString('hex'));assert.equal(data.key,data.apiKey);assert.equal(data.tier,'free');
  assert.deepEqual(data.rateLimit,{requests_per_day:100,requests_per_month:3000});assert.equal(data.message,'Store this key securely. It will not be shown again in full.');
  assert.equal(f.calls.set.length,1);const saved=f.calls.set[0].value;
  assert.equal(saved.email,'reader@example.test');assert.equal(saved.userId,'synthetic-user');assert.equal(saved.name,'Synthetic Key');assert.equal(saved.useCase,'comparison');assert.equal(saved.tier,'free');assert.equal(saved.lastUsed,null);assert.equal(Object.keys(saved.usage).length,0);assert.ok(Number.isFinite(Date.parse(saved.createdAt)));
  assert.deepEqual(f.calls.random,[16]);assert.deepEqual(f.calls.plan,['free']);assert.equal(f.calls.rate[0].limit,12);
  assert.equal(f.calls.fetch.length,0,'Key creation must not issue any optional email-lead mutation');assert.deepEqual(f.lead,{opt_in_digest:false,suppressed:true});
 });
 test('API key optional-email: existing explicit true is also untouched, not rewritten false',async()=>{const f=apiFixture({existingPreference:true});assert.equal((await f.handler(f.request())).statusCode,200);assert.equal(f.calls.fetch.length,0);assert.equal(f.lead.opt_in_digest,true);assert.equal(f.lead.suppressed,true)});
 test('API key optional-email: verified-session rejection precedes storage and enrollment',async()=>{const f=apiFixture({authError:{error:'Verified account required',status:403}}),r=await f.handler(f.request());assert.equal(r.statusCode,403);assert.equal(JSON.parse(r.body).error,'Verified account required');assert.equal(f.calls.list,0);assert.equal(f.calls.set.length,0);assert.equal(f.calls.fetch.length,0)});
 test('API key optional-email: three account keys preserve existing hard limit',async()=>{const f=apiFixture({records:{afro_live_a:{userId:'synthetic-user'},afro_live_b:{email:'reader@example.test'},afro_live_c:{userId:'synthetic-user'},other_record:{email:'reader@example.test'}}}),r=await f.handler(f.request());assert.equal(r.statusCode,429);assert.match(JSON.parse(r.body).error,/Maximum 3 API keys/);assert.equal(f.calls.random.length,0);assert.equal(f.calls.set.length,0);assert.equal(f.calls.fetch.length,0)});
 test('API key optional-email: unrelated owners do not consume this account limit',async()=>{const f=apiFixture({records:{afro_live_other:{userId:'other',email:'other@example.test'},ignored:{userId:'synthetic-user'}}}),r=await f.handler(f.request());assert.equal(r.statusCode,200);assert.equal(f.calls.set.length,1);assert.equal(f.calls.fetch.length,0)});
 test('API key optional-email: storage failure preserves safe issuance failure without enrollment',async()=>{const f=apiFixture({failStore:true}),r=await f.handler(f.request());assert.equal(r.statusCode,500);assert.equal(JSON.parse(r.body).error,'Failed to create key. Try again.');assert.equal(f.calls.set.length,1);assert.equal(f.calls.plan.length,0);assert.equal(f.calls.fetch.length,0)});
 test('API key optional-email: method, preflight, malformed JSON and rate limit preserve no-mutation exits',async()=>{
  for(const [method,extra,expected]of [['GET',{},405],['OPTIONS',{},204],['POST',{body:'{'},400]]){const f=apiFixture(),r=await f.handler(f.request({},method,extra));assert.equal(r.statusCode,expected);assert.equal(f.calls.auth,0);assert.equal(f.calls.set.length,0);assert.equal(f.calls.fetch.length,0)}
  const f=apiFixture({rateAllowed:false}),r=await f.handler(f.request());assert.equal(r.statusCode,429);assert.equal(f.calls.auth,0);assert.equal(f.calls.set.length,0);assert.equal(f.calls.fetch.length,0);
 });
 test('API key optional-email: form and base64 request contracts retain ordinary key issuance',async()=>{
  for(const extra of [{headers:{'content-type':'application/x-www-form-urlencoded'},body:'name=Form+Key&use_case=local'}, {isBase64Encoded:true,body:Buffer.from(JSON.stringify({name:'Base64 Key'})).toString('base64')}]){const f=apiFixture(),r=await f.handler(f.request({},'POST',extra));assert.equal(r.statusCode,200);assert.equal(f.calls.set.length,1);assert.equal(f.calls.fetch.length,0)}
 });
})();
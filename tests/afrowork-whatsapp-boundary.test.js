const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const test=require('node:test');
const root=require('node:path').resolve(__dirname,'..');
const local=require('module').createRequire(root+'/netlify/functions/afrowork-whatsapp.js');
// These handler unit cases isolate provider/signature/consent behavior from receipt persistence.
// The real helper and SQL are additionally exercised by the whole-handler replay evidence.
function unitRequire(name) {
 if(name!=='./_shared/whatsapp-delivery-store')return local(name);
 const real=local(name);
 return {...real,createDeliveryStore:({url})=>({
  configured:url===real.PROJECT_URL,
  receipt:id=>({messageKey:id,attemptToken:crypto.randomUUID()}),
  claim:async()=> 'claimed',transition:async()=>{}
 })};
}

const source=fs.readFileSync(root+'/netlify/functions/afrowork-whatsapp.js','utf8');
const configured={WHATSAPP_GRAPH_VERSION:'v23.0',WHATSAPP_TOKEN:'synthetic-token',WHATSAPP_PHONE_ID:'synthetic-phone',WHATSAPP_APP_SECRET:'synthetic-secret',WHATSAPP_VERIFY_TOKEN:'synthetic-verify'};
const payload=JSON.stringify({entry:[{changes:[{value:{messages:[{id:'wamid.'+crypto.randomUUID(),type:'text',from:'15555550123',text:{body:'PAYE Nigeria 450000'}}]}}]}]});
const signature=body=>'sha256='+crypto.createHmac('sha256',configured.WHATSAPP_APP_SECRET).update(body).digest('hex');
test('inactive code rejects requests before parsing or contacting receipts and providers',async()=>{
 const requests=[],logs=[];
 const context={exports:{},require:local,process:{env:{}},Buffer,AbortSignal,
  console:{warn:(...v)=>logs.push(v),error:(...v)=>logs.push(v)},
  fetch:async(...args)=>{requests.push(args);throw Error('Inactive release attempted network access');}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const httpMethod of ['GET','POST']) {
  const event={httpMethod,headers:{},queryStringParameters:{}};
  Object.defineProperty(event,'body',{get(){throw Error('Inactive release read message body');}});
  const response=await context.exports.handler(event);
  assert.equal(response.statusCode,503);
  assert.equal(response.body,httpMethod==='GET'?'Webhook verification is not configured':'Webhook delivery is not configured');
 }
 assert.equal(requests.length,0);assert.equal(logs.length,0);
});
async function run(name,env,event,expectedStatus,expectedCalls){
  const requests=[];
  const context={exports:{},require:unitRequire,process:{env},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,json:async()=>({messages:[{id:'synthetic'}]})};}};
  vm.createContext(context);vm.runInContext(source,context);
  const response=await context.exports.handler(event);
  assert.equal(response.statusCode,expectedStatus,name+' status');assert.equal(requests.length,expectedCalls,name+' side effects');
  if(expectedCalls){assert.equal(requests[0].body.to,'15555550123');const message=requests[0].body.text.body;assert(message.includes('Estimated net pay:'));assert(!/NaN|Infinity/.test(message));assert(message.includes('Model updated:'));assert(message.includes('default settings'));assert(/Current-date coverage is not verified|Model period:/.test(message));}
  return {name,status:response.statusCode,outboundMockCalls:requests.length};
}
test('webhook authenticates synthetic requests and preserves legitimate payroll delivery',async()=>{
 const cases=[];
 const get={httpMethod:'GET',queryStringParameters:{'hub.mode':'subscribe','hub.verify_token':'synthetic-verify','hub.challenge':'synthetic-challenge'}};
 cases.push(await run('unconfigured verification',{},get,503,0));
 cases.push(await run('legitimate verification',configured,get,200,0));
 cases.push(await run('former default token rejected',configured,{...get,queryStringParameters:{...get.queryStringParameters,'hub.verify_token':'afrotools-wa-verify'}},403,0));
 cases.push(await run('wrong verification mode',configured,{...get,queryStringParameters:{...get.queryStringParameters,'hub.mode':'other'}},400,0));
 const post={httpMethod:'POST',headers:{},body:payload};
 cases.push(await run('unconfigured delivery',{},post,503,0));
 cases.push(await run('missing signature secret',{WHATSAPP_TOKEN:'synthetic',WHATSAPP_PHONE_ID:'synthetic'},post,503,0));
 cases.push(await run('unsigned configured request',configured,post,403,0));
 cases.push(await run('malformed signature',configured,{...post,headers:{'x-hub-signature-256':'sha256=abc'}},403,0));
 cases.push(await run('wrong signed body',configured,{...post,headers:{'x-hub-signature-256':signature(payload+'x')}},403,0));
 cases.push(await run('legitimate signed message',configured,{...post,headers:{'x-hub-signature-256':signature(payload)}},200,1));
 cases.push(await run('base64 representation and mixed header case',configured,{...post,isBase64Encoded:true,body:Buffer.from(payload).toString('base64'),headers:{'X-Hub-Signature-256':signature(payload)}},200,1));
 const statusBody=JSON.stringify({entry:[{changes:[{value:{statuses:[]}}]}]});
 cases.push(await run('signed status event',configured,{...post,body:statusBody,headers:{'x-hub-signature-256':signature(statusBody)}},200,0));
 assert.equal(cases.length,12);
});

test('provider error bodies never enter logs',async()=>{
 const sentinel='SYNTHETIC_PRIVATE_PROVIDER_ECHO';const logs=[];let bodyRead=false;
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn:(...a)=>logs.push(a),error:(...a)=>logs.push(a)},fetch:async()=>({ok:false,status:400,text:async()=>{bodyRead=true;return sentinel;}})};
 vm.createContext(context);vm.runInContext(source,context);
 await context.exports.handler({httpMethod:'POST',body:payload,headers:{'x-hub-signature-256':signature(payload)}});
 assert.equal(bodyRead,false);assert(!JSON.stringify(logs).includes(sentinel));assert(logs.some(a=>a[1]?.status===400));
});

test('AI receives only a per-message explicit opt-in and never retains consent',async()=>{
 const requests=[];
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,json:async()=>url.endsWith('/ai-advisor')?{reply:'Synthetic AI reply'}:{messages:[{id:'synthetic'}]}};}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const [text,allowed] of [['LAW Nigeria synthetic question',false],['AI CONSENT: LAW Nigeria synthetic question',true],['LAW Nigeria another synthetic question',false],['AI CONSENT:',false]]){
  requests.length=0;
  const body=JSON.stringify({entry:[{changes:[{value:{messages:[{id:'wamid.'+crypto.randomUUID(),type:'text',from:'15555550123',text:{body:text}}]}}]}]});
  const response=await context.exports.handler({httpMethod:'POST',body,headers:{'x-hub-signature-256':signature(body)}});
  assert.equal(response.statusCode,200);
  const ai=requests.filter(r=>r.url.endsWith('/ai-advisor'));
  assert.equal(ai.length,allowed?1:0,text);
  const reply=requests.find(r=>r.url.endsWith('/messages'));
  assert(reply,'Expected WhatsApp response');
  if(allowed){assert.equal(ai[0].body.message,'LAW Nigeria synthetic question');assert.equal(ai[0].body.aiConsent,'accepted');assert.equal(ai[0].body.aiContentConsent,'accepted');assert(!JSON.stringify(ai[0].body).includes('15555550123'));}
  else {assert(reply.body.text.body.includes('AI CONSENT:'));assert(reply.body.text.body.includes('Local alternative:'));}
 }
});

test('usage events retain no phone or salary and reject another project',async()=>{
 for(const project of ['https://zpclagtgczsygrgztlts.supabase.co','https://wrong-project.supabase.co']){
  const requests=[];
  const context={exports:{},require:unitRequire,process:{env:{...configured,SUPABASE_DATA_URL:project,SUPABASE_DATA_SERVICE_ROLE_KEY:'synthetic-key'}},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,status:201,json:async()=>url.includes('/rest/v1/')?[]:{messages:[{id:'synthetic-outbound'}]}};}};
  vm.createContext(context);vm.runInContext(source,context);
  await context.exports.handler({httpMethod:'POST',body:payload,headers:{'x-hub-signature-256':signature(payload)}});
  const usage=requests.filter(r=>r.url.includes('/rest/v1/'));
  assert.equal(usage.length,project.includes('wrong-project')?0:1);
  if(usage.length){assert(usage[0].url.endsWith('/wb_usage_log'));assert.deepEqual(Object.keys(usage[0].body).sort(),['conversation_id','country_code','intent_type','response_time_ms','success']);assert.equal(usage[0].body.conversation_id,null);assert(!JSON.stringify(usage[0].body).includes('15555550123'));assert(!JSON.stringify(usage[0].body).includes('450000'));assert(!JSON.stringify(usage[0].body).includes(crypto.createHash('sha256').update('15555550123').digest('hex')));}
 }
});

test('malformed signed payloads cannot trigger provider calls',async()=>{
 const messages=[null,42,[],{entry:[{changes:[{value:{messages:[{id:'wamid.'+crypto.randomUUID(),type:'text',from:'15555550123',text:{body:{unexpected:true}}}]}}]}]},{entry:[{changes:[{value:{messages:[{id:'wamid.'+crypto.randomUUID(),type:'text',text:{body:'HELP'}}]}}]}]}];
 for(const value of messages){const body=JSON.stringify(value);await run('malformed signed structure',configured,{httpMethod:'POST',body,headers:{'x-hub-signature-256':signature(body)}},400,0);}
});

test('all text messages across entries and changes are processed, with retryable delivery failures',async()=>{
 const message=from=>({id:'wamid.'+crypto.randomUUID(),type:'text',from,text:{body:'HELP'}});
 const data={entry:[{changes:[{value:{messages:[message('15555550101'),message('15555550102')]}},{value:{statuses:[]}}]},{changes:[{value:{messages:[message('15555550103')]}}]}]};
 const body=JSON.stringify(data);
 for(const failing of [false,true]){
  const recipients=[];
  const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:async(url,options)=>{const request=JSON.parse(options.body);recipients.push(request.to);return {ok:!(failing&&request.to==='15555550102'),status:failing&&request.to==='15555550102'?503:200,json:async()=>({messages:[{id:'synthetic-outbound'}]})};}};
  vm.createContext(context);vm.runInContext(source,context);
  const response=await context.exports.handler({httpMethod:'POST',body,headers:{'x-hub-signature-256':signature(body)}});
  assert.equal(response.statusCode,failing?503:200);
  assert.deepEqual(recipients,['15555550101','15555550102','15555550103']);
 }
});


test('Graph version configuration fails closed and selects only the fixed Meta host',async()=>{
 const event={httpMethod:'POST',body:payload,headers:{'x-hub-signature-256':signature(payload)}};
 for(const version of ['', 'v23.0/../../other', 'https://example.com', 'v23.0?token=bad', '23.0']){
  await run('invalid version '+version,{...configured,WHATSAPP_GRAPH_VERSION:version},event,503,0);
 }
 const requests=[];
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:async(url)=>{
  requests.push(url);return {ok:true,status:200,json:async()=>({messages:[{id:'synthetic'}]})};
 }};
 vm.createContext(context);vm.runInContext(source,context);
 assert.equal((await context.exports.handler(event)).statusCode,200);
 assert.deepEqual(requests,['https://graph.facebook.com/v23.0/synthetic-phone/messages']);
});


test('overtime rejects unsupported or non-finite estimates and exposes its assumptions',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const salary of [0,-10,Infinity,NaN]) {
  const result=context.handleOvertime({country:'NG',salary},'OT Nigeria 100 4 hours weekday');
  assert(!result.includes('*Overtime Pay:'));assert(!/NaN|Infinity/.test(result));
 }
 const unsupported=context.handleOvertime({country:'ZZ',salary:1000},'OT Unknown 1000 4 hours weekday');
 assert(unsupported.includes('not supported'));assert(!unsupported.includes('*Overtime Pay:'));
 const huge=context.handleOvertime({country:'NG',salary:Number.MAX_VALUE},'OT Nigeria 1000 999999 hours weekday');
 assert(huge.includes('too large'));assert(!/NaN|Infinity/.test(huge));
 const estimate=context.handleOvertime({country:'NG',salary:176000},'OT Nigeria 176000 4 hours weekday');
 assert(estimate.includes('40 hours/week × 4.33 weeks/month')); assert(estimate.includes('unverified reference assumption'));assert(estimate.includes('*Overtime Pay:'));
});

test('deadline reference does not invent a calendar date for payday-relative obligations',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 const result=context.handleDeadline({country:'NG'});
 assert(result.includes('7 working days after payday'));
 assert(result.includes('Exact date requires your payday'));
 assert(result.includes('not been verified for the current filing period'));
 assert(!result.includes('Due:'));assert(!result.includes(new Date().toLocaleString('en-US',{month:'long'})+' 7'));
});


test('WhatsApp overtime matches the maintained web engine and declines incomplete categories',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 const browser={window:{AfroTools:{}}};vm.createContext(browser);
 vm.runInContext(fs.readFileSync(root+'/data/hr/overtime-rules.js','utf8'),browser);
 vm.runInContext(fs.readFileSync(root+'/engines/src/hr-engine.js','utf8'),browser);
 for(const country of ['NG','KE','GH','TZ','UG','ST']){
  const input={country,monthlySalary:120000,overtimeHours:4,dayType:'weekday'};
  const expected=browser.window.AfroTools.HREngine.calculateOvertime(input);
  const reply=context.handleOvertime({country,salary:120000},'OT '+country+' 120000 4 hours weekday');
  assert(reply.includes(expected.hourlyRate.toFixed(2)),country+' hourly model');
  assert(reply.includes('('+expected.otMultiplier+'×)'),country+' multiplier');
  assert(reply.includes(context.BotEngine ? context.BotEngine.fmtNum(expected.overtimePay) : local('../../engines/whatsapp-bot-engine').fmtNum(expected.overtimePay)),country+' pay');
 }
 const kenya=context.handleOvertime({country:'KE',salary:120000},'OT Kenya 120000 4 hours public holiday');
 assert(kenya.includes('(2×)'));assert(!kenya.includes('(3×)'));
 for(const country of ['CI','SN','CM'])assert(context.handleOvertime({country,salary:120000},'OT '+country+' 120000 4 hours weekday').includes('additional inputs'));
 assert(context.handleOvertime({country:'ZA',salary:120000},'OT South Africa 120000 4 hours weekend').includes('not supported'));
});


test('minimum wage uses maintained records, preserves categories and never invents missing rates',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 const za=context.handleMinwage({country:'ZA'});
 assert(za.includes('30.23'));assert(za.includes('16.62'));assert(za.includes('2026-03-01'));
 assert(za.includes('https://www.gov.za/'));assert(za.includes('Learnership'));
 assert(!za.includes('28.79'));assert(za.includes('Current-date coverage is not verified'));
 const kenya=context.handleMinwage({country:'KE'});
 assert(kenya.includes('Unskilled - Cities'));assert(kenya.includes('Agriculture'));assert(kenya.includes('2022-05-01'));
 const ethiopia=context.handleMinwage({country:'ET'});
 assert(ethiopia.includes('No single numeric rate'));assert(!ethiopia.includes('Recorded monthly: Br 0'));
 const unknown=context.handleMinwage({country:'ZZ'});assert(unknown.includes('No wage reference'));
 const nigeria=context.handleMinwage({country:'NG'});assert(nigeria.includes('70,000'));assert(nigeria.includes('2024-07-01'));
});


test('leave references preserve pay, eligibility and multi-year periods from the maintained owner',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 const ng=context.handleLeave({country:'NG'});
 assert(ng.includes('50% of wages'));assert(ng.includes('6 months continuous service'));
 assert(ng.includes('After 12 months continuous service'));assert(ng.includes('with medical certificate'));
 assert(ng.includes('No positive duration is recorded'));assert(!ng.includes('Paternity: 3'));
 const za=context.handleLeave({country:'ZA'});
 assert(za.includes('Period: 3-year cycle'));assert(za.includes('Consecutive days per completed year'));
 assert(!za.includes('30 days/year'));assert(za.includes('Current-date coverage is not verified'));
 assert(context.handleLeave({country:'ZZ'}).includes('No leave reference'));
 const hr=local('./_shared/whatsapp-hr-runtime');
 for(const country of Object.keys(hr.leaveEntitlements)){
  const reply=context.handleLeave({country});assert(reply.length<=4096,country+' provider text limit');
  assert(!/NaN|Infinity|undefined/.test(reply),country+' valid output');
 }
});


test('pension replies reject invalid inputs and retain tested scheme-specific assumptions',()=>{
 const context={exports:{},require:unitRequire,process:{env:configured},Buffer,AbortSignal,console:{warn(){},error(){}}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const salary of [0,-300000,Infinity,NaN]){
  const reply=context.handlePension({country:'NG',salary});assert(reply.includes('positive monthly pensionable'));assert(!/NaN|Infinity/.test(reply));
 }
 const kenya=context.handlePension({country:'KE',salary:150000});assert(kenya.includes('6,480'));assert(kenya.includes('Year 4'));assert(kenya.includes('February 2026'));
 const za=context.handlePension({country:'ZA',salary:25000});assert(za.includes('1,875'));assert(za.includes('3,250'));assert(za.includes('Services employers contribute 16%'));
 assert(za.includes('Current-period scheme coverage'));assert(za.includes('pensionable earnings'));
});

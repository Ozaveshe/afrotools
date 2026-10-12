const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
// Supply an external, pinned PGlite install; no production dependency or network calls.
const path=require('node:path');
if(!process.argv[2] || !process.argv[3]) throw new Error('Usage: node scripts/verify-whatsapp-handler-replay.cjs <pglite-package-directory> <evidence-directory>');
const runtimePath=path.resolve(process.argv[2]);
const runtimeVersion=JSON.parse(fs.readFileSync(path.join(runtimePath,'package.json'),'utf8')).version;
assert.equal(runtimeVersion,'0.5.8','Use the validated PGlite version');
const {PGlite}=require(runtimePath);
const proofDirectory=path.resolve(process.argv[3]);
fs.mkdirSync(proofDirectory,{recursive:true});
const root=path.resolve(__dirname,'..');
const local=require('module').createRequire(root+'/netlify/functions/afrowork-whatsapp.js');
const source=fs.readFileSync(root+'/netlify/functions/afrowork-whatsapp.js','utf8');
const env={WHATSAPP_GRAPH_VERSION:'v23.0',WHATSAPP_TOKEN:'synthetic-token',WHATSAPP_PHONE_ID:'synthetic-id',WHATSAPP_APP_SECRET:'synthetic-secret',WHATSAPP_VERIFY_TOKEN:'synthetic-verify',SUPABASE_DATA_SERVICE_ROLE_KEY:'synthetic-service'};
(async()=>{
 const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;');await db.exec(fs.readFileSync(root+'/supabase/migrations/20261012214500_whatsapp_delivery_receipts.sql','utf8'));
 const sends=[],usage=[],modes=new Map();let unavailable=false,rpcCount=0,providerStarted,releaseProvider;
 async function fetchMock(url,options){const body=JSON.parse(options.body);
  if(url.includes('/rpc/')){rpcCount++;if(unavailable)throw new Error('Synthetic store outage');const transition=url.endsWith('/transition_whatsapp_delivery');const result=await db.query(transition?'select public.transition_whatsapp_delivery($1,$2,$3) as result':'select public.claim_whatsapp_delivery($1,$2) as result',transition?[body.p_message_key,body.p_attempt_token,body.p_state]:[body.p_message_key,body.p_attempt_token]);return {ok:true,json:async()=>result.rows[0].result};}
  if(url.includes('/wb_usage_log')){usage.push(body);return {ok:true,status:201};}
  if(url.startsWith('https://graph.facebook.com/')){sends.push(body.to);const mode=modes.get(body.to);if(mode==='reject')return {ok:false,status:503,text:async()=>{throw new Error('Provider body must not be read')}};if(mode==='timeout')throw new Error('Synthetic transport timeout');if(mode==='pause'){providerStarted();await new Promise(resolve=>{releaseProvider=resolve});}return {ok:true,status:200,json:async()=>mode==='invalid-ack'?{}:{messages:[{id:'synthetic-outbound-'+sends.length}]}};}
  throw new Error('Unexpected network destination');
 }
 function handler(overrides={}){const context={exports:{},require:local,process:{env:{...env,...overrides}},Buffer,AbortSignal,console:{warn(){},error(){}},fetch:fetchMock};vm.createContext(context);vm.runInContext(source,context);return context.exports.handler;}
 const message=(id,from)=>({id,type:'text',from,text:{body:'PAYE Nigeria 450000'}});
 const event=messages=>{const body=JSON.stringify({entry:[{changes:[{value:{messages}}]}]});return {httpMethod:'POST',body,headers:{'x-hub-signature-256':'sha256='+crypto.createHmac('sha256',env.WHATSAPP_APP_SECRET).update(body).digest('hex')}}};
 let assertions=0;const eq=(a,b)=>{assert.deepEqual(a,b);assertions++};
 const batch=event([message('wamid.A','15555550101'),message('wamid.B','15555550102'),message('wamid.C','15555550103')]);modes.set('15555550102','reject');eq((await handler()(batch)).statusCode,503);eq(sends,['15555550101','15555550102','15555550103']);modes.delete('15555550102');eq((await handler()(batch)).statusCode,200);eq(sends,['15555550101','15555550102','15555550103','15555550102']);eq((await handler()(batch)).statusCode,200);eq(sends.length,4);
 const uncertain=event([message('wamid.D','15555550104')]);modes.set('15555550104','timeout');eq((await handler()(uncertain)).statusCode,503);eq((await handler()(uncertain)).statusCode,503);eq(sends.length,5);
 const outage=event([message('wamid.E','15555550105')]);unavailable=true;eq((await handler()(outage)).statusCode,503);eq(sends.length,5);unavailable=false;eq((await handler()(outage)).statusCode,200);eq(sends.length,6);
 const invalidAck=event([message('wamid.F','15555550106')]);modes.set('15555550106','invalid-ack');eq((await handler()(invalidAck)).statusCode,503);eq((await handler()(invalidAck)).statusCode,503);eq(sends.length,7);
 const concurrent=event([message('wamid.G','15555550107')]);modes.set('15555550107','pause');const started=new Promise(resolve=>{providerStarted=resolve});const first=handler()(concurrent);await started;eq((await handler()(concurrent)).statusCode,503);releaseProvider();eq((await first).statusCode,200);eq(sends.length,8);eq((await handler()(concurrent)).statusCode,200);eq(sends.length,8);
 const beforeRpc=rpcCount;eq((await handler()({...batch,headers:{}})).statusCode,403);eq(rpcCount,beforeRpc);
 assert(usage.every(item=>item.conversation_id===null&&!JSON.stringify(item).includes('1555555')&&!JSON.stringify(item).includes('450000')));assertions++;
 const priorSends=sends.length,priorRpc=rpcCount;
 eq((await handler({SUPABASE_DATA_SERVICE_ROLE_KEY:''})(event([message('wamid.MISSING_STORE','15555550108')]))).statusCode,503);eq(sends.length,priorSends);eq(rpcCount,priorRpc);
 eq((await handler()(event([message('','15555550108')]))).statusCode,400);eq(sends.length,priorSends);eq(rpcCount,priorRpc);
 const proof={at:new Date().toISOString(),status:'passed',assertions,providerAttempts:sends.length,successfulUsageEvents:usage.length,handlerSha256:crypto.createHash('sha256').update(source).digest('hex'),qualification:'Actual native handler and receipt helper with local PostgreSQL RPC execution. Provider/network mocked. Overlapping handler invocations tested against serialized PGlite connection, not live multi-session database contention.',production:false};fs.writeFileSync(path.join(proofDirectory,'whole-handler-replay-proof.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));await db.close();
})().catch(error=>{console.error(error);process.exitCode=1});

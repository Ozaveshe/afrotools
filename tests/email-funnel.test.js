const assert = require('node:assert/strict');
const delivery = require('../netlify/functions/_shared/marketing-delivery');
process.env.RESEND_API_KEY = 'test-only';
delete process.env.EMAIL_MARKETING_PAUSED;
const { sendEmail } = require('../netlify/functions/_shared/email-adapter');
const { subscription, messageFor } = require('../netlify/functions/_shared/newsletter');
const { suppressionReason, recipientEmails } = require('../netlify/functions/resend-webhook');
const msg = messageFor({email:'reader@example.test', unsubscribe_token:'synthetic'}, false, new Date('2026-10-19T08:04:00Z'));

(async () => {
  assert.equal(subscription({form_name:'contact',data:{email:'reader@example.test'}}), null);
  assert.equal(subscription({form_name:'newsletter',data:{email:'reader@example.test'}}), null);
  assert.equal(subscription({form_name:'newsletter',data:{email:'reader@example.test',source:'homepage'}}), null);
  assert.deepEqual(subscription({form_name:'newsletter',data:{email:'reader@example.test',source:'homepage',consent_version:'weekly-2026-10-09'}}), {email:'reader@example.test',source:'newsletter'});
  assert.deepEqual(subscription({form_name:'newsletter',data:{email:' Reader@Example.test ',source:'footer'}}), {email:'reader@example.test',source:'newsletter'});
  assert.equal(subscription({form_name:'newsletter',data:{email:'invalid',source:'footer'}}), null);
  assert.match(msg.html, /You subscribed to the AfroTools newsletter/);
  assert.equal(msg.tags[0].value, 'newsletter_weekly');
  const a = delivery.deliveryIdentity(msg, new Date('2026-10-19T08:04:00Z'));
  const b = delivery.deliveryIdentity(msg, new Date('2026-10-25T22:00:00Z'));
  const c = delivery.deliveryIdentity(msg, new Date('2026-10-26T08:04:00Z'));
  assert.equal(a.key,b.key); assert.notEqual(a.key,c.key);
  assert.throws(() => delivery.deliveryIdentity({...msg,unsubscribeUrl:''}));
  assert.equal(suppressionReason({type:'contact.updated',data:{unsubscribed:true}}),'unsubscribed');
  assert.equal(suppressionReason({type:'contact.updated',data:{unsubscribed:false}}),'');
  assert.deepEqual(recipientEmails({type:'contact.updated',data:{email:'Reader@Example.test'}}),['reader@example.test']);
  let calls = 0, finished = [];
  global.fetch = async (_url, opts) => { calls++; assert.ok(opts.headers['Idempotency-Key']); return {ok:true,json:async()=>({id:'synthetic-provider-id'})}; };
  delivery.finish = async (_reservation,status) => finished.push(status);
  for (const status of ['suppressed','not_subscribed','frequency_capped','duplicate']) {
    delivery.reserve = async () => ({ status });
    assert.equal((await sendEmail(msg)).providerStatus,status);
  }
  assert.equal(calls,0);
  delivery.reserve = async () => { throw new Error('storage failure'); };
  assert.equal((await sendEmail(msg)).providerStatus,'storage_unavailable');
  assert.equal(calls,0);
  delivery.reserve = async () => ({status:'reserved',key:a.key});
  assert.equal((await sendEmail(msg)).ok,true);
  assert.deepEqual(finished,['accepted']);
  global.fetch = async () => ({ok:false,status:429,text:async()=>'{}'});
  await sendEmail(msg); assert.equal(finished.at(-1),'failed');
  finished=[];
  global.fetch = async () => ({ok:false,status:500,text:async()=>'{}'});
  await sendEmail(msg); assert.equal(finished.length,0);
  global.fetch = async () => { throw new Error('timeout'); };
  await assert.rejects(sendEmail(msg)); assert.equal(finished.length,0);
  global.fetch = async () => ({ok:true,json:async()=>({id:'transactional'})});
  delivery.reserve = async () => { throw new Error('must not reserve transactional'); };
  assert.equal((await sendEmail({to:'reader@example.test',subject:'Account verification'})).id,'transactional');
  const digest = require('../netlify/functions/send-monthly-digest');
  const privateCalculations = [{tool_name:'Private salary detail',outputs:{netPay:'SECRET-FINANCIAL-VALUE'}}];
  for (const build of [digest.buildDigestEmail,digest.buildDigestText]) {
    const rendered = build('Reader','November',2026,'October',privateCalculations,'https://example.test/unsubscribe');
    assert.ok(rendered.includes('1 calculation'));
    assert.ok(rendered.includes('https://afrotools.com/dashboard/'));
    assert.ok(!rendered.includes('Private salary detail'));
    assert.ok(!rendered.includes('SECRET-FINANCIAL-VALUE'));
  }
  console.log('email-funnel: all checks passed');
})().catch(error => { console.error(error); process.exitCode=1; });

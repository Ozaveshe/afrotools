import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, {issueSession, validSession, config} from '../netlify/functions/operator-dashboard.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
const origin = 'https://afrotools.com';
const fixture = 'synthetic-operator-test-only';
const oldKey = process.env.ADMIN_KEY;
const oldSecret = process.env.ADMIN_SECRET;
const request = (path, options={}) => new Request(origin+path,options);

test('service worker bypasses protected page and private APIs', () => {
  const handlers={};
  const context={URL,self:{location:{origin},addEventListener:(type,handler)=>{handlers[type]=handler;}}};
  vm.runInNewContext(fs.readFileSync('service-worker.js','utf8'),context);
  for(const path of ['/mc-7a2f9x','/mc-7a2f9x.html','/api/operator-dashboard/snapshot.json']){
    handlers.fetch({request:{method:'GET',url:origin+path},respondWith:()=>assert.fail('Private request intercepted by service worker')});
  }
});

test('server boundary, credentials, expiry and private resources', async () => {
  try {
    delete process.env.ADMIN_KEY; delete process.env.ADMIN_SECRET;
    assert.equal((await handler(request('/mc-7a2f9x.html'))).status,503);
    process.env.ADMIN_SECRET=fixture;
    const unauth = await handler(request('/mc-7a2f9x.html'));
    assert.equal(unauth.status,401);
    assert.ok((await unauth.text()).includes('Admin credential'));
    for (const path of ['/api/operator-dashboard/dashboard.js','/api/operator-dashboard/dashboard.css','/api/operator-dashboard/snapshot.json','/api/operator-dashboard/pro-readiness.md','/api/operator-dashboard/pro-gates.json']) {
      const result=await handler(request(path)); assert.equal(result.status,401); assert.match(result.headers.get('cache-control'),/no-store/);
    }
    assert.equal((await handler(request('/.netlify/functions/operator-dashboard'))).status,401);
    const form=(key,customOrigin=origin)=>({method:'POST',headers:{Origin:customOrigin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({credential:key})});
    assert.equal((await handler(request('/api/operator-dashboard/login',form(fixture,'https://attacker.example')))).status,403);
    assert.equal((await handler(request('/api/operator-dashboard/login',form('wrong')))).status,401);
    assert.equal((await handler(request('/api/operator-dashboard/login',form('x'.repeat(5000))))).status,413);
    const accepted=await handler(request('/api/operator-dashboard/login',form(fixture)));
    assert.equal(accepted.status,303);
    const cookie=accepted.headers.get('set-cookie');
    for (const flag of ['__Host-afro_ops=','HttpOnly','Secure','SameSite=Strict','Path=/','Max-Age=1800']) assert.ok(cookie.includes(flag));
    assert.ok(!cookie.includes(fixture));
    const headers={Cookie:cookie.split(';')[0]};
    const page=await handler(request('/mc-7a2f9x.html',{headers}));
    assert.equal(page.status,200); assert.ok((await page.text()).includes('Image tracker'));
    const snapshot=await handler(request('/api/operator-dashboard/snapshot.json',{headers}));
    assert.equal(snapshot.status,200); assert.ok((await snapshot.text()).length < 5_500_000);
    assert.equal((await handler(request('/api/operator-dashboard/legacy-operations.html',{headers}))).status,404);
    assert.equal((await handler(request('/api/operator-dashboard/%2e%2e%2fadmin%2flegacy-operations.html',{headers}))).status,404);
    const now=Date.now(); const signed=issueSession(fixture,now);
    assert.ok(validSession(signed,fixture,now));
    assert.ok(!validSession(signed,fixture,now+1800000));
    assert.ok(!validSession(signed+'x',fixture,now));
    assert.ok(!validSession(signed,'rotated',now));
    assert.ok(!validSession(signed,fixture,now-1));
    const logout=await handler(request('/api/operator-dashboard/logout',{method:'POST',headers:{...headers,Origin:origin}}));
    assert.equal(logout.status,303); assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    assert.equal((await handler(request('/api/operator-dashboard/logout'))).status,401);
    process.env.ADMIN_KEY='precedence-fixture';
    assert.equal((await handler(request('/api/operator-dashboard/session',{headers}))).status,401);
    assert.equal(config.rateLimit.windowLimit,30);
  } finally {
    if(oldKey===undefined)delete process.env.ADMIN_KEY;else process.env.ADMIN_KEY=oldKey;
    if(oldSecret===undefined)delete process.env.ADMIN_SECRET;else process.env.ADMIN_SECRET=oldSecret;
  }
});

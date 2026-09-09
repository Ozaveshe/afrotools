'use strict';
// Credentials are supplied in the process environment, never CLI arguments.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=new URL(process.argv[2] || 'https://afrotools.com');
if(base.protocol!=='https:' || !(base.hostname==='afrotools.com' || /^[a-z0-9-]+--afrotools\.netlify\.app$/.test(base.hostname))) throw Error('Unexpected operator verification host');
const secret=process.env.ADMIN_KEY || process.env.ADMIN_SECRET;
const proof={checked_at:new Date().toISOString(),origin:base.origin,checks:[],authenticated:false};
async function check(path,status,options={}){
  const r=await fetch(new URL(path,base),{redirect:'manual',...options});
  assert.equal(r.status,status,`${path} expected ${status}, got ${r.status}`);
  proof.checks.push({path,status:r.status});return r;
}
(async()=>{
  const page=await check('/mc-7a2f9x.html',401);
  assert.match(page.headers.get('cache-control'),/no-store/);
  assert.match(await page.text(),/Admin credential/);
  for(const resource of ['dashboard.js','dashboard.css','snapshot.json'])await check('/api/operator-dashboard/'+resource,401);
  for(const path of ['/admin/data/operator-dashboard.json','/admin/legacy-operations.html','/data/image-generation/image-library.json'])await check(path,404);
  await check('/.netlify/functions/operator-dashboard',401);
  if(secret){
    const login=await check('/api/operator-dashboard/login',303,{method:'POST',headers:{Origin:base.origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({credential:secret})});
    const rawCookie=login.headers.get('set-cookie') || '';
    assert.match(rawCookie,/HttpOnly/);assert.match(rawCookie,/Secure/);assert.match(rawCookie,/SameSite=Strict/);
    const cookie=rawCookie.split(';')[0];
    const headers={Cookie:cookie};
    await check('/mc-7a2f9x.html',200,{headers});
    for(const resource of ['dashboard.js','dashboard.css','snapshot.json','pro-readiness.md','pro-gates.json']){
      const result=await check('/api/operator-dashboard/'+resource,200,{headers});
      assert.match(result.headers.get('cache-control'),/no-store/);
      if(resource==='snapshot.json'){
        const data=await result.json();proof.image_count=data.images.rows.length;proof.batch_count=data.batch.rows.length;
        proof.snapshot_revision=data.revision;
      }
    }
    const logout=await check('/api/operator-dashboard/logout',303,{method:'POST',headers:{...headers,Origin:base.origin}});
    assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    proof.authenticated=true;
    if(process.argv.includes('--browser')){
      const {chromium}=require('playwright');
      const browser=await chromium.launch();
      try {
        const page=await browser.newPage({viewport:{width:390,height:844}});
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(new URL('/mc-7a2f9x.html',base).href);
        await page.getByLabel('Admin credential').fill(secret);
        await page.getByRole('button',{name:'Sign in',exact:true}).click();
        await page.waitForFunction(()=>document.getElementById('snapshot')?.textContent.includes('Snapshot generated'));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.deepEqual(errors,[]);
        fs.mkdirSync('artifacts/operator-live',{recursive:true});
        await page.screenshot({path:`artifacts/operator-live/${base.hostname}-390.png`});
        await page.getByRole('button',{name:'Sign out',exact:true}).click();
        await page.getByLabel('Admin credential').waitFor();
        proof.browser={width:390,login:true,logout:true,overflow:false,page_errors:0};
      }finally{await browser.close();}
    }
  }else proof.limit='Authenticated checks skipped: credential unavailable in verifier environment.';
  fs.mkdirSync('artifacts/operator-live',{recursive:true});
  fs.writeFileSync(`artifacts/operator-live/${base.hostname}.json`,JSON.stringify(proof,null,2)+'\n');
  console.log(JSON.stringify(proof));
})().catch(error=>{console.error('Operator live verification failed: '+error.message);process.exitCode=1;});

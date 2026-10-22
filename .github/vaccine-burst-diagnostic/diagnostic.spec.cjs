'use strict';
const {test,expect}=require(process.cwd()+'/node_modules/@playwright/test'),fs=require('fs'),path=require('path'),perf=require('perf_hooks').performance;
const D=__dirname,mode=process.env.DIAG_MODE||'unpaced',events=[],contexts=[];
test.beforeEach(async({browser})=>{
 const original=browser.newContext.bind(browser);browser.__diagRestore=()=>{browser.newContext=original;};
 browser.newContext=async(...args)=>{
  const context=await original(...args);contexts.push(context);let last=0;
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&['GET','HEAD'].includes(r.request().method())&&!/^\/(?:api|\.netlify|rest|auth)\//.test(u.pathname)?r.continue():r.abort('blockedbyclient');});
  await context.exposeBinding('__diagNativeEvent',(source,row)=>events.push({node_ms:perf.now(),url:source.page.url(),...row}));
  await context.addInitScript(()=>{
   const originalClick=HTMLAnchorElement.prototype.click;
   HTMLAnchorElement.prototype.click=function(...args){if(this.download)window.__diagNativeEvent({kind:'anchor-click',browser_ms:performance.now(),file:this.download,protocol:new URL(this.href).protocol});return originalClick.apply(this,args);};
   document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#download-button'))window.__diagNativeEvent({kind:'button-click',browser_ms:performance.now(),trusted:e.isTrusted});},true);
  });
  const newPage=context.newPage.bind(context);
  context.newPage=async(...pg)=>{
   const page=await newPage(...pg);page.on('download',d=>events.push({kind:'download',url:page.url(),node_ms:perf.now(),name:d.suggestedFilename()}));
   page.on('pageerror',e=>events.push({kind:'pageerror',url:page.url(),node_ms:perf.now(),message:String(e.message).slice(0,500)}));
   page.on('console',c=>{if(['error','warning'].includes(c.type()))events.push({kind:'console-'+c.type(),url:page.url(),node_ms:perf.now(),message:c.text().slice(0,500)});});
   const locator=page.locator.bind(page);page.locator=(selector,...args)=>{
    const result=locator(selector,...args);if(selector==='#download-button'){const click=result.click.bind(result);result.click=async(...options)=>{
     if(mode==='paced'){const wait=125-(perf.now()-last);if(wait>0)await new Promise(r=>setTimeout(r,wait));}
     last=perf.now();events.push({kind:'locator-click-start',mode,url:page.url(),node_ms:last});const out=await click(...options);events.push({kind:'locator-click-complete',mode,url:page.url(),node_ms:perf.now()});return out;
    };}return result;
   };return page;
  };return context;
 };
});
test.afterEach(async({browser},info)=>{
 await new Promise(r=>setTimeout(r,100));fs.writeFileSync(D+'/'+mode+'-events.json',JSON.stringify({at:new Date().toISOString(),mode,browser_version:browser.version(),status:info.status,expected_status:info.expectedStatus,events,network:'Only literal4173 staticGET/HEAD; external boot/auth/API blocked, not fulfilled',instrumentation:'Browser anchor wrapper and Node locator timestamps can affect timings; diagnostic only'},null,2));
 if(browser.__diagRestore)browser.__diagRestore();for(const c of contexts.splice(0))await c.close().catch(()=>{});
});
require(process.cwd()+'/tests/e2e/health-export-followon.spec.js');
test('diagnostic actual browser burst and paced control',async({browser},info)=>{
 test.setTimeout(60000);const fixtures=require(process.cwd()+'/tests/fixtures/health-export-followon/expected.json').vaccine;const rows=[];
 for(const paced of[false,true]){
  const context=await browser.newContext({serviceWorkers:'block',timezoneId:'UTC',viewport:{width:390,height:844}}),page=await context.newPage();await context.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));await page.goto('http://127.0.0.1:4173/fr/tools/calendrier-vaccinal/',{waitUntil:'load'});
  await page.locator('#country').selectOption('NG');await page.locator('#age-band').selectOption('newborn');await page.locator('#record-status').selectOption('routine');await page.locator('#record-product').fill('Download PDF — café <>&');await page.locator('#programme-form button[type=submit]').click();await expect(page.locator('#handoff')).toBeVisible();
  const downloads=[];page.on('download',d=>downloads.push(d));const started=perf.now();
  if(!paced)await page.evaluate(()=>{for(let n=0;n<20;n++)document.getElementById('download-button').click();});
  else for(let n=0;n<20;n++){if(n)await new Promise(r=>setTimeout(r,125));await page.locator('#download-button').click();}
  await new Promise(r=>setTimeout(r,1500));const dir=info.outputPath(paced?'paced-control':'burst-control');fs.mkdirSync(dir,{recursive:true});
  for(let n=0;n<downloads.length;n++){const file=path.join(dir,n+'.txt');await downloads[n].saveAs(file);expect(fs.readFileSync(file,'utf8')).toBe(fixtures.textFiles['fr-patched-0.txt']);}
  rows.push({paced,requested:20,received:downloads.length,duration_ms:perf.now()-started,all_delivered_files_exact:true});await context.close();
 }
 fs.writeFileSync(D+'/burst-control.json',JSON.stringify(rows,null,2));expect(rows[0].received).toBe(10);expect(rows[1].received).toBe(20);
});

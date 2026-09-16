const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const startServer=require('./support/consent-static-server');
(async()=>{
 const server=await startServer();
 let browser;
 try{browser=await chromium.launch();for(const status of ['declined','accepted']){
  const context=await browser.newContext();
  await context.addInitScript(value=>localStorage.setItem('afrotools_cookie_consent',value),status);
  const page=await context.newPage(),requests=[];
  page.on('request',request=>requests.push(request));
  await page.goto(server.origin+'/sw/sierra-leone/kikokotoo-kodi-mshahara/');
  await page.locator('[name=gross]').fill('1234567.89');
  await page.locator('[data-sw-paye-app] form button[type=submit]').click();
  await page.locator('[data-explain]').click();
  await page.waitForTimeout(5000);
  const commands=await page.evaluate(()=>(window.dataLayer||[]).filter(x=>x&&x.length).map(x=>Array.from(x)));
  const consent=commands.findIndex(x=>x[0]==='consent'&&x[1]==='default');
  const configs=commands.map((x,i)=>({x,i})).filter(row=>row.x[0]==='config');
  assert.equal(configs.length,1);assert.ok(consent>=0&&consent<configs[0].i);
  assert.equal(commands[consent][2].analytics_storage,status==='accepted'?'granted':'denied');
  for(const key of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(commands[consent][2][key],'denied');
  if(status==='declined')assert.equal(await page.locator('script[src*="clarity.ms/tag"]').count(),0);
  assert.ok(requests.every(r=>!(r.url()+' '+r.postData()).includes('1234567.89')),'synthetic salary must stay local');
  const cookies=await context.cookies();
  if(status==='declined')assert.equal(cookies.filter(c=>/^_ga|^_gcl/.test(c.name)).length,0,'declined storage must not create analytics or ad cookies');
  if(status==='accepted')assert.ok(cookies.some(c=>/^_ga/.test(c.name)),'accepted control must demonstrate provider analytics storage');
  const postHosts=requests.filter(r=>r.method()==='POST').map(r=>new URL(r.url()).hostname);
  console.log(JSON.stringify({status,configCount:configs.length,cookieNames:cookies.map(c=>c.name),postHosts,salaryAbsent:true}));
  await context.close();
 }}finally{try{if(browser)await browser.close();}finally{await server.stop();}}
})().catch(error=>{console.error(error.message);process.exitCode=1;});

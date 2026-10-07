const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const evidence = path.resolve(__dirname, '../..', 'artifacts/pro-phase1');
const STORAGE = 'afrobooks_finance_os_demo_v1';
async function localPro(page) {
  await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'Synthetic offline service'}}));
  await page.route('**/.netlify/functions/**',route=>route.fulfill({status:503,json:{error:'Synthetic offline service'}}));
  await page.route('https://**/*', route => route.fulfill({ body: '', contentType: 'text/plain' }));
  await page.route('**/assets/js/afro-auth.js*', route => route.fulfill({ contentType: 'application/javascript', body: `window.AfroAuth={getUser:()=>({id:'synthetic-phase1',tier:'pro'}),getSessionToken:()=> 'synthetic-token',onReady:f=>f(),getSupabase:()=>null,isLoggedIn:()=>true};` }));
  await page.route('**/api/profile*', route => route.fulfill({ json: { profile: { id: 'synthetic-phase1', subscription_tier: 'pro', subscription_expires_at: '2099-01-01' } } }));
  await page.route('**/.netlify/functions/create-subscription',route=>route.fulfill({status:503,json:{error:'Synthetic provider unavailable'}}));
  await page.route('**/api/replay-subscription*',route=>route.fulfill({status:503,json:{error:'Synthetic pending activation'}}));
  await page.route('**/api/workspace**', route => route.fulfill({ json: { workspaces: [], items: [] } }));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
}
test('capture desktop and mobile reference views', async ({ page }) => {
  await localPro(page); fs.mkdirSync(evidence, { recursive: true });
  for (const [name, route] of [['books', '/pro/apps/books/'], ['widgets', '/widgets/'], ['pricing', '/pricing/'], ['apps', '/pro/apps/']]) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(route); await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(evidence, `${process.env.PHASE1_SCREENSHOT_LABEL || 'after'}-${name}-${width}.png`), fullPage: true });
    }
  }
});
async function fillInvoice(page, number = 'SYNTHETIC-001', amount = '120.50') {
  await page.locator('#invoiceBatchBtn').evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.locator('#invoiceBatchBtn').click({timeout:5000});
  for (const [name, value] of Object.entries({invoiceNumber:number,customer:'Synthetic Workshop',description:'Synthetic service',amount,date:'2026-10-01',dueDate:'2026-10-02'})) await page.locator(`#booksEntryForm [name="${name}"]`).fill(value);
}
async function saveReviewed(page) {
  await page.getByRole('button',{name:'Review entry',exact:true}).click();
  await page.getByRole('button',{name:'Save reviewed entry',exact:true}).click();
  await expect(page.locator('#booksEntryDialog')).not.toBeVisible();
}
async function device(page) { return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE); }
test('Books real-entry task: cancel, create, allocate, correct, reopen and export',async({page})=>{
  await localPro(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/pro/apps/books/');
  await fillInvoice(page);await page.keyboard.press('Escape');
  expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBeNull();
  await fillInvoice(page);await saveReviewed(page);
  const first=await device(page);expect(first.invoices).toHaveLength(1);expect(first.invoices[0].amount).toBe(120.50);
  await page.locator('#recordPaymentBtn').click();
  await page.locator('[name="invoiceNumber"]').selectOption('SYNTHETIC-001');
  await page.locator('[name="amount"]').fill('130');await page.locator('[name="reference"]').fill('SYNTHETIC-PAY-001');
  await page.getByRole('button',{name:'Review entry',exact:true}).click();await expect(page.locator('#booksEntryError')).toContainText('exceeds');
  await page.locator('[name="amount"]').fill('40.25');await saveReviewed(page);
  let saved=await device(page);expect(saved.invoices[0].received).toBe(40.25);
  await page.locator('#booksCorrectionSelect').selectOption(JSON.stringify(['payment',saved.payments[0].id]));await page.locator('#booksCorrectionBtn').click();
  await page.locator('[name="amount"]').fill('30.00');await saveReviewed(page);
  saved=await device(page);expect(saved.payments).toHaveLength(1);expect(saved.invoices[0].received).toBe(30);
  await page.reload();await expect(page.locator('#booksEntryControls')).toBeVisible();
  expect((await device(page)).invoices[0].id).toBe(first.invoices[0].id);
  await expect(page.locator('#invoiceBody')).toContainText('90.50');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#booksRecoveryBtn').click()]);
  const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));expect(exported.invoices[0].amount).toBe(120.50);expect(exported.payments[0].amount).toBe(30);
  expect(errors).toEqual([]);
});
test('Books CSV review rejects bad rows, retains valid zero records and prevents retry duplicates',async({page})=>{
  await localPro(page);await page.goto('/pro/apps/books/');
  const csv='date,vendor,category,amount,rail,receipt status,note,due date\n2026-10-01,Synthetic Supplier,Materials,15.25,cash,received,Review,2026-10-02\n2026-10-01,Synthetic Bad,Materials,bad,cash,missing,,2026-10-02\n2026-10-01,Synthetic Zero,Materials,0,cash,missing,Complimentary,2026-10-02';
  const file={name:'synthetic-expenses.csv',mimeType:'text/csv',buffer:Buffer.from(csv)};
  await page.locator('#expenseCsvInput').setInputFiles(file);await expect(page.locator('#booksImportReport')).toContainText('row 3');
  expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBeNull();
  await page.locator('#booksImportCancel').click();expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBeNull();
  await page.locator('#expenseCsvInput').setInputFiles(file);await page.locator('#booksImportSave').click();
  expect((await device(page)).expenses.map(e=>e.amount)).toEqual([15.25,0]);
  await page.locator('#expenseCsvInput').setInputFiles(file);await page.locator('#booksImportSave').click();expect((await device(page)).expenses).toHaveLength(2);
});
test('Books preserves corrupt bytes, quota failures, legacy extension fields and tab conflicts',async({page})=>{
  await localPro(page);await page.addInitScript(key=>localStorage.setItem(key,'{corrupt synthetic'),STORAGE);
  await page.goto('/pro/apps/books/');await expect(page.locator('#booksEntryStatus')).toContainText('Unreadable');
  await fillInvoice(page);await page.getByRole('button',{name:'Review entry',exact:true}).click();await page.locator('#booksEntrySave').click();
  await expect(page.locator('#booksEntryError')).toContainText('Save failed');expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBe('{corrupt synthetic');
  await page.locator('#booksEntryCancel').click();
  await page.evaluate(key=>localStorage.removeItem(key),STORAGE);
  // Navigate without re-running the corrupt init script: replace page with a fresh context in another test below.
});
test('Books failed storage write keeps the review open and allows draft recovery',async({page})=>{
  await localPro(page);await page.goto('/pro/apps/books/');await fillInvoice(page);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='afrobooks_finance_os_demo_v1')throw new DOMException('Synthetic quota','QuotaExceededError');return original.call(this,key,value);};});
  await page.getByRole('button',{name:'Review entry',exact:true}).click();await page.locator('#booksEntrySave').click();await expect(page.locator('#booksEntryDialog')).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBeNull();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#booksDraftExport').click()]);const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));expect(data.reviewedRecord.amount).toBe(120.50);
});
test('Books legacy backup round-trip and concurrent-tab conflict preserve original records',async({page})=>{
  await localPro(page);const old=JSON.stringify({currency:'NGN',invoices:[],payments:[],expenses:[],customers:[],vendors:[],unknownExtension:{synthetic:'preserve'}});
  await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:STORAGE,raw:old});await page.goto('/pro/apps/books/');await fillInvoice(page);await saveReviewed(page);
  expect(await page.evaluate(key=>localStorage.getItem(key+'_phase1_recovery'),STORAGE)).toBe(old);expect((await device(page)).unknownExtension).toEqual({synthetic:'preserve'});
  await fillInvoice(page,'SYNTHETIC-002');await page.getByRole('button',{name:'Review entry',exact:true}).click();
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.otherTab='synthetic';localStorage.setItem(key,JSON.stringify(s));},STORAGE);
  await page.locator('#booksEntrySave').click();await expect(page.locator('#booksEntryError')).toContainText('another tab');expect((await device(page)).invoices).toHaveLength(1);expect((await device(page)).otherTab).toBe('synthetic');
});
test('unfinished actions are read-only and export original historical bytes',async({page})=>{
  await localPro(page);
  for(const [slug,key] of [['trade-desk','afrotrade_desk_pro_demo_v1'],['legal','afrolegal_desk_pro_demo_v1'],['grants-tenders','afrogrant_tender_os_demo_v1'],['creator-studio','afrocreator_studio_pro_demo_v1']]){
    await page.goto('/pro/apps/'+slug+'/');await expect(page.getByText('Historical preview · read-only')).toBeVisible();
    await page.locator('[data-action]').first().click();await expect(page.locator('#previewStatus')).toContainText('Unavailable');expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
    const raw='{synthetic corrupt history';await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#previewRecovery').click()]);expect(fs.readFileSync(await download.path(),'utf8')).toBe(raw);
  }
});
test('Widget Pro selected widget and attribution survive mocked enquiry completion',async({page})=>{
  await localPro(page);let payload;
  await page.route('**/api/b2b-enquiry',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{success:true}});});
  await page.goto('/widgets/?utm_source=synthetic&utm_medium=test&utm_campaign=phase1&utm_content=widget');
  await page.locator('#widget-pro-choice').selectOption('kenya-paye');await page.locator('#widget-pro-request').click();
  await expect(page.locator('[name="requested_offer"]')).toHaveValue('widget_pro');await expect(page.locator('[name="relevant_tool"]')).toHaveValue('kenya-paye');await expect(page.locator('[name="source_route"]')).toHaveValue('/widgets/');await expect(page.locator('[name="utm_campaign"]')).toHaveValue('phase1');
  for(const [name,value] of Object.entries({company:'Synthetic Widget Team',name:'Synthetic Buyer',email:'synthetic@example.test',message:'Synthetic fixture enquiry'}))await page.locator(`[data-b2b-enquiry-form] [name="${name}"]`).fill(value);
  await page.locator('[name="prospect_type"]').selectOption('other');await page.locator('[name="consent"]').check();await page.locator('[data-b2b-enquiry-form] [type="submit"]').click();await expect(page.locator('[data-b2b-status]')).toContainText('Enquiry received');expect(payload.requested_offer).toBe('widget_pro');expect(payload.relevant_tool).toBe('kenya-paye');expect(payload.cta_type).toBe('widget-pro-request');
});
for(const width of [320,390,768,1440]) test('responsive controls, keyboard focus, dark theme and reduced motion at '+width,async({page})=>{
  await localPro(page);await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
  {
    await page.setViewportSize({width,height:900});await page.goto('/pro/apps/books/');await fillInvoice(page);await expect(page.locator('#booksEntryDialog')).toBeVisible();
    const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(e).position!=='fixed').slice(0,8).map(e=>[e.tagName,e.id,e.className,Math.round(e.getBoundingClientRect().width)]));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(overflow)).toBeTruthy();
    await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.getElementById('booksEntryDialog').contains(document.activeElement))).toBeTruthy();await page.keyboard.press('Escape');await expect(page.locator('#invoiceBatchBtn')).toBeFocused();
    await page.goto('/widgets/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.goto('/pricing/');await page.getByRole('switch',{name:'Annual billing'}).focus();await page.keyboard.press('Space');await expect(page.locator('.save-badge')).toHaveText('SAVE 50%');await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','true');
  }
});
test('gate states reject malformed expiry and unavailable profiles without local promotion',async({page})=>{
  await localPro(page);
  for(const [name,profile,expected] of [
    ['free',{id:'synthetic-phase1',subscription_tier:'free'},false],
    ['expired',{id:'synthetic-phase1',subscription_tier:'pro',subscription_expires_at:'2000-01-01'},false],
    ['active',{id:'synthetic-phase1',subscription_tier:'pro',subscription_expires_at:'2099-01-01'},true],
    ['malformed expiry',{id:'synthetic-phase1',subscription_tier:'pro',subscription_expires_at:'invalid'},false]
  ]){
    await page.route('**/api/profile*',route=>route.fulfill({json:{profile}}));await page.goto('/pro/apps/books/');
    await expect.poll(()=>page.evaluate(()=>window.AfroProGate.getStatus().then(s=>s.isPro)),{message:name}).toBe(expected);
    expect(require('../../netlify/functions/_shared/entitlements').resolveProfileEntitlement(profile).isPro).toBe(expected);
  }
  await page.route('**/api/profile*',route=>route.fulfill({status:503,json:{error:'synthetic outage'}}));await page.goto('/pro/apps/books/');
  const fallback=await page.evaluate(()=>window.AfroProGate.getStatus());expect(fallback.isPro).toBe(false);expect(fallback.reason).toBe('profile-unavailable');await expect(page.locator('#afro-pro-lock')).toContainText('could not verify');
  await page.route('**/assets/js/afro-auth.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.AfroAuth={getUser:()=>null,getSessionToken:()=>null,onReady:f=>f(),getSupabase:()=>null};'}));await page.goto('/pro/apps/books/');await expect(page.locator('#afro-pro-lock')).toBeVisible();expect(await page.locator('.pro-gated-content').evaluate(el=>el.inert)).toBe(true);await expect(page.locator('#afro-pro-lock a.primary')).toBeFocused();
});
test('selected route survives guest gate, auth next, upgrade, cancel and pending activation',async({page})=>{
  await localPro(page);await page.route('**/api/profile*',route=>route.fulfill({json:{profile:{id:'synthetic-phase1',subscription_tier:'free'}}}));
  const target='/pro/apps/books/?view=invoices#invoices';await page.goto(target);await expect(page.locator('#afro-pro-lock')).toBeVisible();
  const href=await page.locator('#afro-pro-lock a.primary').getAttribute('href');const loginNext=new URL(href,'http://127.0.0.1:45821').searchParams.get('next');
  expect(new URL(loginNext,'http://127.0.0.1:45821').searchParams.get('next')).toBe(target);
  await page.goto(href);await expect(page.locator('#loginNext')).toHaveValue(loginNext);
  // Continue at the validated auth return route; the existing login bridge suite exercises actual login.
  await page.route('**/.netlify/functions/create-subscription',route=>route.fulfill({json:{authorization_url:new URL('/pro/cancel/',page.url()).href}}));
  await page.goto(loginNext);await page.locator('#btn-monthly').click();
  await page.goto('/pro/cancel/');expect(new URL(await page.locator('.cancel-btn.primary').getAttribute('href'),'http://127.0.0.1:45821').searchParams.get('next')).toBe(target);
  await page.goto('/pro/success/?reference=synthetic-reference');await expect(page.locator('#workspaceLink')).toHaveAttribute('aria-disabled','true');await page.locator('#workspaceLink').dispatchEvent('click');await expect(page).toHaveURL(/\/pro\/success/);
  await page.route('**/api/profile*',route=>route.fulfill({json:{profile:{id:'synthetic-phase1',subscription_tier:'pro',subscription_expires_at:'2099-01-01'}}}));await page.reload();await expect(page.locator('#workspaceLink')).toHaveAttribute('aria-disabled','false');await page.locator('#workspaceLink').click();await expect(page).toHaveURL(/\/pro\/apps\/books\/\?view=invoices#invoices$/);
  await page.goto('/pro/?next='+encodeURIComponent('//evil.test/private'));expect(await page.evaluate(()=>window.AfroProReturn.current())).toBe('/pro/workspace/');
});

test('Books explicit account failures preserve device edits and failed pull keeps the original copy',async({page})=>{
  await localPro(page);await page.goto('/pro/apps/books/');await fillInvoice(page);await saveReviewed(page);const before=await page.evaluate(key=>localStorage.getItem(key),STORAGE);
  await page.evaluate(()=>{window.AfroBooksSync={setCloudMeta:()=>{},getCloudMeta:()=>({}),saveLocalSnapshot:async()=>{throw new Error('Synthetic offline account save');},loadWorkspaceSnapshot:async()=>({snapshot:{currency:'NGN',invoices:[],expenses:[],payments:[]},conflicts:[]})};const s=document.getElementById('cloudWorkspaceSelect');s.add(new Option('Synthetic business','synthetic-workspace'));s.value='synthetic-workspace';});
  await page.locator('#saveCloudBtn').click();await expect(page.locator('#cloudReviewText')).toContainText('Synthetic offline');expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBe(before);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='afrobooks_finance_os_demo_v1')throw new DOMException('Synthetic quota','QuotaExceededError');return original.call(this,key,value);};});
  const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#pullCloudBtn').click()]);expect(JSON.parse(fs.readFileSync(await backup.path(),'utf8')).workspace.invoices[0].invoiceNumber).toBe('SYNTHETIC-001');await expect(page.locator('#cloudReviewText')).toContainText('Original device edits preserved');expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE)).toBe(before);
});

test('HR keeps the real employee editor, rejects blank identity and preserves unreadable history',async({page})=>{
 await localPro(page);await page.goto('/pro/apps/hr/');await page.locator('#completeOnboardingBtn').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrohr_people_os_demo_v1')||'{}').employees||[])).toHaveLength(0);
 await page.locator('#addEmployeeBtn').click();await page.locator('#saveEmployeeBtn').click();await expect(page.locator('#hrRecordStatus')).toContainText('full name');await page.locator('#employeeFullNameInput').fill('Synthetic HR Employee');await page.locator('#saveEmployeeBtn').click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrohr_people_os_demo_v1')));expect(saved.employees).toHaveLength(1);expect(saved.employees[0].name).toBe('Synthetic HR Employee');await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrohr_people_os_demo_v1')).employees[0].id)).toBe(saved.employees[0].id);
 await page.evaluate(()=>localStorage.setItem('afrohr_people_os_demo_v1','{synthetic unreadable'));await page.reload();await expect(page.locator('#hrRecordStatus')).toContainText('Unreadable');await expect(page.locator('#addEmployeeBtn')).toBeDisabled();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#hrRawRecovery').click()]);expect(fs.readFileSync(await download.path(),'utf8')).toBe('{synthetic unreadable');
});

test('free payslip and invoice continuations carry only repeat workflow context',async({page})=>{await localPro(page);await page.goto('/tools/payslip-generator/');await expect(page.locator('#pdfBtn')).toBeAttached();await expect(page.locator('#monthlyPayrollContinuation')).toHaveAttribute('href','/pro/?next=%2Fpro%2Fapps%2Fpayroll%2F%3Fview%3Druns');await page.locator('#monthlyPayrollContinuation').click();expect(new URL(page.url()).searchParams.get('next')).toBe('/pro/apps/payroll/?view=runs');await page.goBack();await expect(page.locator('#monthlyPayrollContinuation')).toBeVisible();await page.goForward();expect(new URL(page.url()).searchParams.get('next')).toBe('/pro/apps/payroll/?view=runs');await page.goto('/tools/invoice-generator/');const continuation=page.locator('afro-business-cta').getByRole('link',{name:'Review recurring invoices in Books'});expect(new URL(await continuation.getAttribute('href'),'http://127.0.0.1').searchParams.get('next')).toBe('/pro/apps/books/?view=invoices');});

test('Books actual expense can be reviewed, corrected and exported even if measurement fails',async({page})=>{await localPro(page);await page.goto('/pro/apps/books/');await page.locator('#addExpenseBtn').click();for(const [name,value] of Object.entries({vendor:'Synthetic Office Supplier',category:'Materials',amount:'45.75',date:'2026-10-01',dueDate:'2026-10-02',note:'Synthetic fixture receipt'}))await page.locator('#booksEntryForm [name="'+name+'"]').fill(value);await page.evaluate(()=>{window.AfroTools=window.AfroTools||{};window.AfroTools.analytics={track:()=>{throw new Error('Synthetic measurement failure');}};});await saveReviewed(page);let s=await device(page);expect(s.expenses[0].amount).toBe(45.75);const id=s.expenses[0].id;await page.locator('#booksCorrectionSelect').selectOption(JSON.stringify(['expense',id]));await page.locator('#booksCorrectionBtn').click();await page.locator('#booksEntryForm [name="amount"]').fill('40.25');await saveReviewed(page);await page.reload();s=await device(page);expect(s.expenses).toHaveLength(1);expect(s.expenses[0].id).toBe(id);expect(s.expenses[0].amount).toBe(40.25);const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#booksRecoveryBtn').click()]);expect(JSON.parse(fs.readFileSync(await download.path(),'utf8')).expenses[0].amount).toBe(40.25);});

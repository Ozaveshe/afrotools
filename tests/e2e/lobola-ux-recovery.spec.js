const { test, expect } = require('@playwright/test');
const fs = require('fs');

const route = '/tools/lobola-calculator/';
const build = '[onclick="calculate()"]';
const copy = '#resultActions [onclick="copyLobolaBrief(this)"]';
const share = '[onclick="shareLobolaBrief(this)"]';
const txt = '[data-lobola-txt]';
const reset = '[onclick="resetCalc()"]';
test.setTimeout(120000);

async function setup(page, width, theme) {
  await page.setViewportSize({ width, height:850 });
  await page.emulateMedia({ colorScheme:theme });
  const errors = [];
  const origin = new URL(test.info().project.use.baseURL).origin;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', request => {
    const url = new URL(request.request().url());
    return url.origin === origin && ['GET','HEAD'].includes(request.request().method())
      ? request.continue() : request.abort('blockedbyclient');
  });
  await page.addInitScript(({ theme }) => {
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.__qa = { writes:[], legacy:[], events:[], shares:[], prints:0, opens:[], mode:'success', legacyMode:'false', shareMode:'absent', pending:[] };
    Object.defineProperty(navigator, 'clipboard', { configurable:true, get() {
      if (window.__qa.mode === 'absent') return undefined;
      return { writeText(text) {
        const qa = window.__qa; qa.writes.push(text);
        if (qa.mode === 'sync') throw new Error('Synthetic clipboard failure');
        if (qa.mode === 'reject') return Promise.reject(new Error('Synthetic clipboard denial'));
        if (qa.mode === 'held') return new Promise((resolve,reject) => qa.pending.push({ resolve,reject }));
        return Promise.resolve();
      } };
    } });
    Object.defineProperty(navigator, 'share', { configurable:true, get() {
      if (window.__qa.shareMode === 'absent') return undefined;
      return data => {
        const qa = window.__qa; qa.shares.push(data);
        const error = new Error('Synthetic share outcome');
        if (qa.shareMode === 'cancel') error.name = 'AbortError';
        if (qa.shareMode === 'sync') throw error;
        if (qa.shareMode === 'cancel' || qa.shareMode === 'reject') return Promise.reject(error);
        if (qa.shareMode === 'held') return new Promise((resolve,reject) => qa.pending.push({ resolve,reject }));
        return Promise.resolve();
      };
    } });
    document.execCommand = command => {
      const qa = window.__qa;
      qa.legacy.push({ command, text:document.activeElement.value });
      if (qa.legacyMode === 'throw') throw new Error('Synthetic legacy failure');
      return qa.legacyMode === 'true';
    };
    window.print = () => { window.__qa.prints += 1; };
    window.open = (...args) => { window.__qa.opens.push(args); return null; };
    for (const type of ['mousedown','mouseup','click']) document.addEventListener(type, event => {
      const target=event.target.closest('button,summary');
      if (!target) return;
      const record={ type, trusted:event.isTrusted, action:target.getAttribute('onclick') || 'summary:'+target.textContent.trim() };
      if (record.action==='calculate()') {
        const field=document.getElementById('customCattle'),r=field.getBoundingClientRect(),host=document.querySelector('afro-navbar');
        record.invalidField={top:r.top,bottom:r.bottom,header:(host.shadowRoot?.querySelector('nav') || host).getBoundingClientRect().bottom};
      }
      window.__qa.events.push(record);
    }, true);
  }, { theme });
  await page.goto(route, { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => typeof calculate === 'function' && document.querySelector('afro-navbar')?.shadowRoot);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  return errors;
}

async function settled(page) {
  let previous='', equal=0;
  await expect.poll(async () => {
    const next=await page.evaluate(() => JSON.stringify({y:scrollY,h:document.documentElement.scrollHeight,focus:document.activeElement?.getBoundingClientRect().toJSON()}));
    equal=next===previous ? equal+1 : 0; previous=next;
    return equal>=4;
  }, {intervals:[40]}).toBe(true);
}

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const r = node.getBoundingClientRect(), host = document.querySelector('afro-navbar');
    const nav = host?.shadowRoot?.querySelector('nav') || host;
    const header = nav?.getBoundingClientRect().bottom || 0;
    const hit = document.elementFromPoint((r.left+r.right)/2, (r.top+r.bottom)/2);
    return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, header,
      active:document.activeElement === node, hit:node === hit || node.contains(hit),
      visible:r.width > 0 && r.height > 0 && r.top >= header && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
  });
}

async function usefulFocus(page, selector) {
  await expect.poll(async () => { const g = await geometry(page, selector); return g.active && g.visible && g.hit; }).toBe(true);
}

async function nativePointer(page, selector) {
  await page.mouse.move(page.viewportSize().width-10, 450);
  await settled(page);
  for (let attempt=0; attempt<12; attempt++) {
    const g = await geometry(page, selector);
    if (g.visible && g.hit) break;
    await page.mouse.wheel(0, (g.top+g.bottom)/2 - 450);
    await settled(page);
  }
  await settled(page);
  const g = await geometry(page, selector);
  expect(g.visible && g.hit, 'Native pointer geometry: '+JSON.stringify(g)).toBe(true);
  const action = await page.locator(selector).getAttribute('onclick') || 'summary:'+await page.locator(selector).textContent().then(text=>text.trim());
  await page.evaluate(() => { window.__qa.events=[]; });
  await page.mouse.click((g.left+g.right)/2, (g.top+g.bottom)/2);
  await expect.poll(() => page.evaluate(action => ['mousedown','mouseup','click'].every(type => window.__qa.events.some(event => event.action === action && event.type === type && event.trusted)), action)).toBe(true);
}

async function detailsState(page, open) {
  if ((await page.locator('.planner-more').getAttribute('open')!==null)!==open) await nativePointer(page,'.planner-more summary');
  await expect(page.locator('.planner-more')).toHaveJSProperty('open',open);
}

async function keyboardBuild(page) {
  const open=await page.locator('.planner-more').getAttribute('open');
  await page.locator(open===null ? '.planner-more summary' : '#familyNotes').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(build)).toBeFocused();
  await page.keyboard.press('Enter');
}

async function makePlan(page, total='R 198,000') {
  await nativePointer(page, build);
  await expect(page.locator('#results')).toHaveClass(/show/);
  await expect(page.locator('#rTotal')).toHaveText(total);
  await settled(page);
}

async function downloadText(page, testInfo) {
  const promised = page.waitForEvent('download');
  await nativePointer(page, txt);
  const download = await promised;
  expect(download.suggestedFilename()).toBe('afrotools-lobola-family-summary.txt');
  const file = testInfo.outputPath('family-summary-' + Date.now() + '.txt');
  await download.saveAs(file);
  return fs.readFileSync(file, 'utf8');
}

async function mode(page, clipboard, legacy='false', shareMode='absent') {
  await page.evaluate(values => Object.assign(window.__qa, values), { mode:clipboard, legacyMode:legacy, shareMode });
}

async function snapshot(page) {
  await settled(page);
  return page.evaluate(() => ({ y:scrollY, focus:document.activeElement.id || document.activeElement.getAttribute('onclick') || document.activeElement.tagName,
    result:document.getElementById('results').className, status:document.getElementById('resultActionStatus')?.textContent,
    planStatus:document.getElementById('planStatus').textContent, brief:lastLobolaBrief,
    legacy:window.__qa.legacy.length, writes:window.__qa.writes.length, prints:window.__qa.prints,
    areas:document.querySelectorAll('textarea:not(#giftItems):not(#familyNotes)').length,
    print:document.body.hasAttribute('data-lobola-printing') }));
}

async function release(page, outcome) {
  await page.evaluate(outcome => {
    const pending = window.__qa.pending.shift();
    if (outcome === 'success') pending.resolve();
    else { const error = new Error('Synthetic held denial'); if (outcome === 'cancel') error.name='AbortError'; pending.reject(error); }
  }, outcome);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

for (const width of [320,390]) for (const theme of ['light','dark']) {
  test(`Lobola mobile invalid focus and current exports at ${width}px ${theme}`, async ({ page }, testInfo) => {
    const errors = await setup(page,width,theme);
    await page.locator('#customCattle').fill('1.5');
    await page.mouse.move(width/2,450);
    for(let i=0;i<6;i++) {
      const g = await geometry(page,'#customCattle');
      if (Math.abs(g.top-10)<1) break;
      await page.mouse.wheel(0,g.top-10); await settled(page);
    }
    const before = await geometry(page,'#customCattle');
    expect(before.top).toBeLessThan(before.header);
    await nativePointer(page, build);
    const received=await page.evaluate(() => window.__qa.events.find(event=>event.action==='calculate()' && event.type==='click'));
    expect(received.trusted).toBe(true);
    expect(received.invalidField.top).toBeLessThan(received.invalidField.header);
    await testInfo.attach('actual-build-trigger-field',{body:JSON.stringify(received),contentType:'application/json'});
    await expect(page.locator('#customCattle')).toHaveAttribute('aria-invalid','true');
    await usefulFocus(page,'#customCattle');
    await testInfo.attach('invalid-livestock-pointer-geometry',{body:JSON.stringify({before,after:await geometry(page,'#customCattle')}),contentType:'application/json'});
    await page.screenshot({ path:testInfo.outputPath('invalid-focus.png') });
    await page.locator('#customCattle').fill('101');
    await keyboardBuild(page);
    await usefulFocus(page,'#customCattle');
    await testInfo.attach('invalid-livestock-keyboard-geometry',{body:JSON.stringify(await geometry(page,'#customCattle')),contentType:'application/json'});
    await page.locator('#customCattle').fill('');
    await detailsState(page,true);
    await page.locator('#timelineMonths').fill('0');
    await detailsState(page,false);
    await keyboardBuild(page);
    await expect(page.locator('.planner-more')).toHaveAttribute('open','');
    await usefulFocus(page,'#timelineMonths');
    await testInfo.attach('invalid-collapsed-timing-geometry',{body:JSON.stringify(await geometry(page,'#timelineMonths')),contentType:'application/json'});
    await page.locator('#timelineMonths').fill('6');
    await page.locator('#familyExpectation').fill('-1');
    await keyboardBuild(page);
    await usefulFocus(page,'#familyExpectation');
    await page.locator('#familyExpectation').fill('0');
    await detailsState(page,false);
    await makePlan(page);
    await expect(page.locator('#customCattle')).not.toHaveAttribute('aria-invalid','true');
    await nativePointer(page,copy);
    await expect(page.locator('#resultActionStatus')).toHaveText('Summary copied.');
    const text = await downloadText(page,testInfo);
    expect(text).toContain('R 198,000'); expect(text).toContain('South Africa'); expect(text).toContain('ZAR');
    expect(text).toContain('Budget breakdown:'); expect(text).toContain('Value per head: R 18,000');
    expect(text).toContain('planning'); expect(text).toContain('https://afrotools.com/tools/lobola-calculator/');
    expect(await page.evaluate(() => window.__qa.writes[0] + '\n')).toBe(text);
    await page.locator('#customCattle').fill('0'); await page.keyboard.press('Tab'); await makePlan(page,'R 0');
    await page.locator('#customCattle').fill(''); await page.locator('#cattlePrice').fill('');
    await page.keyboard.press('Tab'); await makePlan(page);
    await page.locator('#country').selectOption('zw'); await expect(page.locator('#currency')).toHaveValue('USD');
    for (const [id,value] of Object.entries({customCattle:'6',cattlePrice:'500',zwCustom:'500',giftValue:'300',ceremonyCost:'200'})) await page.locator('#'+id).fill(value);
    await detailsState(page,true);
    await page.locator('#giftItems').fill('Synthetic blankets and groceries'); await page.locator('#familyNotes').fill('Synthetic meeting question');
    await page.keyboard.press('Tab'); await makePlan(page,'$4,400');
    const zim = await downloadText(page,testInfo);
    for(const expected of ['Zimbabwe','USD','$4,400','Synthetic blankets and groceries','Synthetic meeting question','Gifts / custom items: $300','Ceremony / meeting budget: $200']) expect(zim).toContain(expected);
    await nativePointer(page,'[onclick="saveLobolaPlan()"]');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1')));
    expect(saved.country).toBe('Zimbabwe'); expect(saved.currency).toBe('USD'); expect(saved.totalValue).toBe(4400);
    expect(Object.keys(saved).sort()).toEqual(['version','country','currency','symbol','region','cattleCount','cattlePrice','totalValue','giftValue','ceremonyCost','lowScenario','highScenario','savedAt'].sort());
    await page.locator('#giftBuffer').fill(''); await page.keyboard.press('Tab'); await makePlan(page,'$4,000');
    await page.locator('#giftBuffer').fill('10');
    await page.locator('#familyExpectation').fill('1000'); await page.keyboard.press('Tab'); await makePlan(page,'$1,650');
    const brief=await page.evaluate(() => lastLobolaBrief);
    await nativePointer(page,'[onclick="shareLobolaWhatsApp()"]');
    const opened=await page.evaluate(() => window.__qa.opens.at(-1));
    expect(new URL(opened[0]).origin).toBe('https://wa.me');
    expect(new URL(opened[0]).searchParams.get('text')).toBe(brief+'\n\nPlan yours: https://afrotools.com/tools/lobola-calculator/');
    expect(opened.slice(1)).toEqual(['_blank','noopener']);
    await nativePointer(page,reset); await usefulFocus(page,'#country');
    for(const[id,value]of Object.entries({customCattle:'',familyExpectation:'0',giftValue:'0',giftItems:'',familyNotes:''})) await expect(page.locator('#'+id)).toHaveValue(value);
    await expect(page.locator('#results')).not.toHaveClass(/show/);
    const downloads=[]; page.on('download', value => downloads.push(value));
    await page.evaluate(() => { downloadLobolaBrief(); printLobolaBrief(); });
    expect(downloads).toEqual([]); expect(await page.evaluate(() => window.__qa.prints)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.goto(route+'?country=zw&currency=USD#lobola-planner');
    await expect(page.locator('#country')).toHaveValue('zw'); await expect(page.locator('#currency')).toHaveValue('USD');
    await page.goto('/tools/lobola-gift-list/');
    const handoff=page.getByRole('button',{name:'Use saved Zimbabwe plan'});
    await expect(handoff).toBeEnabled(); await handoff.click();
    await expect(page.locator('#statusMsg')).toContainText('Saved calculator context added');
    expect(errors).toEqual([]);
  });
}

for (const [width,theme] of [[320,'dark'],[390,'light']]) {
  test(`Lobola TXT denial cleans up and offers current print at ${width}px ${theme}`, async ({page},testInfo) => {
    const errors=await setup(page,width,theme);
    await page.evaluate(() => {
      window.__qa.txt={mode:'create-denied',created:[],revoked:[],clicks:0};
      const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),click=HTMLAnchorElement.prototype.click;
      URL.createObjectURL=blob=>{
        if(window.__qa.txt.mode==='create-denied') throw new Error('Synthetic local URL denial');
        if(window.__qa.txt.mode==='unavailable') throw new TypeError('Synthetic local URL unsupported');
        const url=create(blob);window.__qa.txt.created.push(url);
        if(window.__qa.txt.mode==='create-edit') {
          const field=document.getElementById('giftValue');field.value='100';field.dispatchEvent(new Event('input',{bubbles:true}));
          field.focus({preventScroll:true});field.scrollIntoView({block:'center',behavior:'instant'});
        }
        return url;
      };
      URL.revokeObjectURL=url=>{window.__qa.txt.revoked.push(url);revoke(url);};
      HTMLAnchorElement.prototype.click=function(){
        if(this.download!=='afrotools-lobola-family-summary.txt') return click.call(this);
        window.__qa.txt.clicks++;
        if(window.__qa.txt.mode==='click-reset-throw') resetCalc();
        throw new Error('Synthetic local anchor denial');
      };
    });
    const downloads=[];page.on('download',download=>downloads.push(download));
    for(const failure of ['create-denied','unavailable','click-throw','create-edit','click-reset-throw']) {
      await page.evaluate(() => resetCalc());await makePlan(page);
      await page.evaluate(mode=>{window.__qa.txt.mode=mode;window.__qa.txt.created=[];window.__qa.txt.revoked=[];window.__qa.txt.clicks=0;},failure);
      await nativePointer(page,txt);
      if(failure==='create-edit') {
        await expect(page.locator('#results')).not.toHaveClass(/show/);await usefulFocus(page,'#giftValue');
        await expect(page.locator('#planStatus')).toContainText('Inputs changed');
        await expect(page.locator('#resultActionStatus')).toHaveText('');
      } else if(failure==='click-reset-throw') {
        await expect(page.locator('#results')).not.toHaveClass(/show/);await usefulFocus(page,'#country');
        await expect(page.locator('#resultActionStatus')).toHaveText('');
      } else {
        await expect(page.locator('#resultActionStatus')).toHaveText('TXT download failed. Use Copy family summary or Print summary to keep the current plan.');
        await usefulFocus(page,txt);
        const printBefore=await page.evaluate(() => window.__qa.prints);
        await nativePointer(page,'[onclick="printLobolaBrief(this)"]');
        expect(await page.evaluate(() => window.__qa.prints)).toBe(printBefore+1);
        await usefulFocus(page,'[onclick="printLobolaBrief(this)"]');
      }
      const state=await page.evaluate(()=>window.__qa.txt);
      expect(state.created).toEqual(state.revoked);
      expect(await page.locator('a[download="afrotools-lobola-family-summary.txt"]').count()).toBe(0);
      expect(downloads).toEqual([]);
      await testInfo.attach(failure+'-cleanup',{body:JSON.stringify(state),contentType:'application/json'});
    }
    expect(errors).toEqual([]);
  });

  test(`Lobola honest clipboard and share fallbacks at ${width}px ${theme}`, async ({ page },testInfo) => {
    const errors=await setup(page,width,theme); await makePlan(page);
    const summary=await downloadText(page,testInfo);
    for (const [clipboard,legacy,success] of [['success','false',true],['absent','true',true],['reject','true',true],['sync','true',true],['absent','false',false],['reject','false',false],['sync','false',false],['absent','throw',false],['reject','throw',false]]) {
      await mode(page,clipboard,legacy); await nativePointer(page,copy);
      await expect(page.locator('#resultActionStatus')).toHaveText(success ? 'Summary copied.' : 'Copy failed. Download summary TXT to keep the complete family plan.');
      if(clipboard !== 'success') await usefulFocus(page,copy);
      expect(await page.locator('textarea:not(#giftItems):not(#familyNotes)').count()).toBe(0);
      const data=await page.evaluate(() => window.__qa);
      if(clipboard !== 'success') expect(data.legacy.at(-1).text + '\n').toBe(summary);
    }
    await mode(page,'reject','false'); await nativePointer(page,share);
    await expect(page.locator('#resultActionStatus')).toContainText('Copy failed. Download summary TXT'); await usefulFocus(page,share);
    for(const [shareMode,message] of [['success','Summary shared using your device.'],['cancel','Share cancelled.'],['reject','Sharing failed. Download summary TXT to keep the complete family plan.'],['sync','Sharing failed. Download summary TXT to keep the complete family plan.']]) {
      await mode(page,'success','false',shareMode); await nativePointer(page,share);
      await expect(page.locator('#resultActionStatus')).toHaveText(message); await usefulFocus(page,share);
    }
    expect(await downloadText(page,testInfo)).toBe(summary);
    await page.screenshot({path:testInfo.outputPath('copy-txt-recovery.png')});
    expect(errors).toEqual([]);
  });

  for(const outcome of ['success','denial']) test(`Lobola copy ${outcome} races preserve current state at ${width}px ${theme}`, async ({ page },testInfo) => {
    const errors=await setup(page,width,theme);
    for(const action of ['edit','reset','rebuild','sameplan','newcopy','newheldcopy']) {
      await page.evaluate(() => resetCalc()); await makePlan(page); await mode(page,'held');
      await nativePointer(page,copy); await expect.poll(() => page.evaluate(() => window.__qa.pending.length)).toBe(1);
      if(action==='reset') await nativePointer(page,reset);
      else if(action==='edit'||action==='rebuild') {
        await page.locator('#giftValue').fill('100'); await page.keyboard.press('Tab');
        if(action==='rebuild') await makePlan(page,'R 198,110');
      } else if(action==='sameplan') await makePlan(page);
      else if(action==='newheldcopy') { await nativePointer(page,copy); await expect.poll(() => page.evaluate(() => window.__qa.pending.length)).toBe(2); }
      else { await mode(page,'success'); await nativePointer(page,copy); await expect(page.locator('#resultActionStatus')).toHaveText('Summary copied.'); }
      const before=await snapshot(page); await release(page,outcome); expect(await snapshot(page)).toEqual(before);
      await testInfo.attach(`${outcome}-${action}`,{body:JSON.stringify(before),contentType:'application/json'});
      if(action==='newheldcopy') { await release(page,'success'); await expect(page.locator('#resultActionStatus')).toHaveText('Summary copied.'); }
    }
    if(outcome==='denial') {
      await page.evaluate(() => resetCalc()); await makePlan(page); await mode(page,'held','false');
      await page.locator(copy).focus(); await page.keyboard.press('Enter');
      await page.keyboard.press('Tab'); await expect(page.locator(share)).toBeFocused();
      await settled(page); await release(page,'denial');
      await usefulFocus(page,share);
      await expect(page.locator('#resultActionStatus')).toContainText('Copy failed. Download summary TXT');
    }
    expect(errors).toEqual([]);
  });

  for(const outcome of ['success','denial','cancel']) test(`Lobola share ${outcome} stale callbacks at ${width}px ${theme}`, async ({ page },testInfo) => {
    const errors=await setup(page,width,theme); await makePlan(page);
    for(const action of ['edit','reset','rebuild','newcopy']) {
      await page.evaluate(() => resetCalc()); await makePlan(page); await mode(page,'success','false','held');
      await nativePointer(page,share); await expect.poll(() => page.evaluate(() => window.__qa.pending.length)).toBe(1);
      if(action==='reset') await nativePointer(page,reset);
      else if(action==='edit'||action==='rebuild') {
        await page.locator('#giftValue').fill('100'); await page.keyboard.press('Tab');
        if(action==='rebuild') await makePlan(page,'R 198,110');
      } else { await mode(page,'success'); await nativePointer(page,copy); await expect(page.locator('#resultActionStatus')).toHaveText('Summary copied.'); }
      const before=await snapshot(page); await release(page,outcome); expect(await snapshot(page)).toEqual(before);
      await testInfo.attach(`${outcome}-${action}`,{body:JSON.stringify(before),contentType:'application/json'});
    }
    if(outcome==='success') {
      await page.evaluate(() => resetCalc()); await makePlan(page); await mode(page,'success','false','held');
      await page.locator(share).focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab');
      await expect(page.locator(txt)).toBeFocused(); await settled(page); await release(page,'success');
      await usefulFocus(page,txt); await expect(page.locator('#resultActionStatus')).toHaveText('Summary shared using your device.');
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [320,390]) for (const theme of ['light','dark']) {
  test(`Lobola actual PDF contains only current summary at ${width}px ${theme}`, async ({ page },testInfo) => {
    const pdfParse = require('pdf-parse');
    const errors=await setup(page,width,theme);
    await page.locator('#country').selectOption('zw');
    for(const [id,value] of Object.entries({customCattle:'6',cattlePrice:'500',zwCustom:'500',giftValue:'300',ceremonyCost:'200'})) await page.locator('#'+id).fill(value);
    await detailsState(page,true);
    await page.locator('#giftItems').fill('Synthetic print <blankets> & groceries'); await page.locator('#familyNotes').fill('Synthetic print meeting');
    await page.keyboard.press('Tab'); await makePlan(page,'$4,400');
    const print='[onclick="printLobolaBrief(this)"]';
    await nativePointer(page,print); await usefulFocus(page,print);
    expect(await page.evaluate(() => window.__qa.prints)).toBe(1);
    expect(await page.locator('body').getAttribute('data-lobola-printing')).toBeNull();
    await page.screenshot({path:testInfo.outputPath('screen-after-print.png')});
    const pdfFile=testInfo.outputPath('current-family-summary.pdf');
    const data=await page.pdf({path:pdfFile,format:'A4',printBackground:true});
    const parsed=await pdfParse(data);
    fs.writeFileSync(testInfo.outputPath('current-family-summary-parsed.txt'),parsed.text);
    expect(parsed.numpages).toBeGreaterThan(0); expect(parsed.numpages).toBeLessThanOrEqual(3);
    for(const text of ['Lobola family planning summary','Zimbabwe','USD','$4,400','Synthetic print <blankets> & groceries','Synthetic print meeting','Budget breakdown:','Gifts / custom items: $300','Ceremony / meeting budget: $200','Monthly saving target','Initial contribution target','planning','https://afrotools.com/tools/lobola-calculator/']) expect(parsed.text).toContain(text);
    await testInfo.attach('actual-pdf-content',{body:JSON.stringify({pages:parsed.numpages,textLength:parsed.text.length}),contentType:'application/json'});
    for(const text of ['Build my family plan','Copy family summary','Share summary text','Download summary TXT','Frequently Asked Questions','Country quick planners','How to use this calculator','Choose the family context']) expect(parsed.text).not.toContain(text);
    await expect(page.locator('#results')).toBeVisible(); await usefulFocus(page,print);
    expect(await page.locator('body').getAttribute('data-lobola-printing')).toBeNull();
    await page.locator('#giftValue').fill('400'); await page.keyboard.press('Tab'); await makePlan(page,'$4,510');
    await nativePointer(page,print); await usefulFocus(page,print);
    const second=await pdfParse(await page.pdf({path:testInfo.outputPath('second-family-summary.pdf'),format:'A4'}));
    expect(second.text).toContain('$4,510'); expect(second.text).not.toContain('$4,400');
    await usefulFocus(page,print);
    // Synthetic cancelled/throwing dialog still restores the screen and actual initiating control.
    await page.evaluate(() => { window.print=()=>{ throw new Error('Synthetic print cancellation'); }; });
    await nativePointer(page,print); await usefulFocus(page,print);
    await expect(page.locator('#resultActionStatus')).toContainText('Printing failed. Download summary TXT');
    expect(await page.locator('[data-lobola-print-summary]').textContent()).toBe('');
    await page.locator('#giftValue').fill('500'); await page.keyboard.press('Tab');
    const before=await snapshot(page); await page.evaluate(() => { printLobolaBrief(); downloadLobolaBrief(); });
    expect(await snapshot(page)).toEqual(before);
    expect(errors).toEqual([]);
  });
}

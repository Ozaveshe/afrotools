const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const pages = [
  { slug:'amount-words-gh', words:'#wordsResult', figure:'#fmtResult', copy:'[onclick="copyWords()"]', status:'#copyStatus', ref:'#docRef', max:'999999999999', zero:'Zero Ghana Cedis Only', sub:'Pesewa One Only', one:'Ghana Cedi One and Pesewa One Only', code:'GHS' },
  { slug:'naira-to-words', words:'#result', figure:'#formatted', copy:'[onclick="copyResult()"]', status:'#toast', ref:'#docReference', max:'999999999999999', zero:'Zero Naira Only', sub:'One Kobo Only', one:'One Naira and One Kobo Only', code:'NGN' }
];
const copyDocument = '[onclick="copyDocumentLine()"]';
const clear = '[onclick="clearAll()"]';
test.setTimeout(120000);

async function setup(page, row, width, theme, blockedEngine=false) {
  await page.setViewportSize({width, height:850});
  await page.emulateMedia({colorScheme:theme});
  const errors=[];
  const origin=new URL(test.info().project.use.baseURL).origin;
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('**/*', route=>{
    const url=new URL(route.request().url());
    if(blockedEngine && url.pathname==='/assets/js/engines/amount-words-input.js') return route.abort('failed');
    return url.origin===origin && ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort('blockedbyclient');
  });
  await page.addInitScript(theme=>{
    localStorage.setItem('aft_theme',theme);
    localStorage.setItem('afrotools_cookie_consent','declined');
    window.__qa={mode:'success',writes:[],prompts:[],pending:[],events:[],prints:0,promptThrows:false};
    Object.defineProperty(navigator,'clipboard',{configurable:true,get(){
      if(window.__qa.mode==='absent') return undefined;
      return {writeText(text){
        const qa=window.__qa; qa.writes.push(text);
        if(qa.mode==='sync') throw new Error('Synthetic synchronous clipboard denial');
        if(qa.mode==='reject') return Promise.reject(new Error('Synthetic asynchronous clipboard denial'));
        if(qa.mode==='held') return new Promise((resolve,reject)=>qa.pending.push({resolve,reject}));
        return Promise.resolve();
      }};
    }});
    window.prompt=(message,text)=>{
      window.__qa.prompts.push({message,text});
      if(window.__qa.promptThrows) throw new Error('Synthetic copy dialog failure');
      return null;
    };
    window.print=()=>{
      window.__qa.prints++;
      window.dispatchEvent(new Event('beforeprint'));
      window.__qa.printText=document.querySelector('[data-amount-print-sheet]')?.textContent;
      window.dispatchEvent(new Event('afterprint'));
    };
    window.open=()=>null;
    document.execCommand=()=>{throw new Error('Real clipboard is forbidden');};
    for(const type of ['mousedown','mouseup','click']) document.addEventListener(type,event=>{
      const node=event.target.closest('button,summary'); if(!node) return;
      const field=document.getElementById('amount'),r=field?.getBoundingClientRect();
      const host=document.querySelector('afro-navbar'),nav=host?.shadowRoot?.querySelector('nav') || host;
      window.__qa.events.push({type,trusted:event.isTrusted,detail:event.detail,action:node.getAttribute('onclick') || (node.hasAttribute('data-afw-pdf') ? 'pdf' : node.textContent.trim()),fieldTop:r?.top,fieldBottom:r?.bottom,header:nav?.getBoundingClientRect().bottom || 0});
    },true);
  },theme);
  await page.goto(`/tools/${row.slug}/`,{waitUntil:'domcontentloaded'});
  if(blockedEngine) await expect(page.locator('#amount')).toBeDisabled();
  else await expect(page.locator('#amount')).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await page.waitForFunction(()=>document.querySelector('afro-navbar')?.shadowRoot);
  return errors;
}

async function settle(page) {
  let previous='',same=0;
  await expect.poll(async()=>{
    const next=await page.evaluate(()=>JSON.stringify({y:scrollY,h:document.documentElement.scrollHeight,focus:document.activeElement?.getBoundingClientRect().toJSON()}));
    same=next===previous ? same+1 : 0; previous=next;
    return same>=4;
  },{intervals:[40]}).toBe(true);
}

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node=>{
    const r=node.getBoundingClientRect(),host=document.querySelector('afro-navbar');
    const nav=host?.shadowRoot?.querySelector('nav') || host;
    const header=nav?.getBoundingClientRect().bottom || 0;
    const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,header,focus:document.activeElement===node,
      hit:hit===node || node.contains(hit),fits:r.width>0 && r.height>0 && r.top>=header && r.bottom<=innerHeight && r.left>=0 && r.right<=innerWidth};
  });
}

async function usefulFocus(page,selector) {
  await expect.poll(async()=>{const g=await geometry(page,selector);return g.focus && g.fits && g.hit;}).toBe(true);
}

async function pointer(page,selector) {
  await page.mouse.move(page.viewportSize().width-8,430); await settle(page);
  for(let i=0;i<12;i++){
    const g=await geometry(page,selector); if(g.fits && g.hit) break;
    await page.mouse.wheel(0,(g.top+g.bottom)/2-430); await settle(page);
  }
  const g=await geometry(page,selector);
  expect(g.fits && g.hit,'Real pointer readiness '+JSON.stringify(g)).toBe(true);
  const action=await page.locator(selector).evaluate(node=>node.getAttribute('onclick') || (node.hasAttribute('data-afw-pdf') ? 'pdf' : node.textContent.trim()));
  await page.evaluate(()=>window.__qa.events=[]);
  await page.mouse.click((g.left+g.right)/2,(g.top+g.bottom)/2);
  await expect.poll(()=>page.evaluate(action=>['mousedown','mouseup','click'].every(type=>window.__qa.events.some(e=>e.type===type && e.action===action && e.trusted)),action)).toBe(true);
}

async function words(page,row) {
  return page.locator(row.words).evaluate(node=>{const copy=node.cloneNode(true);copy.querySelector('.currency-label')?.remove();return copy.textContent;});
}

async function details(page) {
  if(!await page.locator('.document-options').evaluate(node=>node.open)) await pointer(page,'.document-options summary');
}

async function prepare(page,row,amount='12500.75') {
  await page.locator('#amount').fill(amount);
  await details(page);
  await page.locator('#caseMode').selectOption('title');
  await page.locator('#docMode').selectOption('invoice');
  await page.locator('#payeeName').fill('Synthetic Payee <b>literal</b> & Co');
  await page.locator(row.ref).fill('SYNTHETIC-REF');
}

async function snapshot(page,row) {
  await settle(page);
  return page.evaluate(row=>({status:document.querySelector(row.status).textContent,preview:document.getElementById('docPreview').textContent,
    error:document.getElementById('amountError').textContent,visible:document.getElementById('resultCard').getBoundingClientRect().height>0,
    focus:document.activeElement.id || document.activeElement.getAttribute('onclick') || document.activeElement.tagName,
    y:scrollY,prompts:window.__qa.prompts.length,writes:window.__qa.writes.length,printing:document.body.hasAttribute('data-amount-printing')}),row);
}

async function release(page,outcome,index=0) {
  await page.evaluate(({outcome,index})=>{
    const p=window.__qa.pending.splice(index,1)[0];
    if(outcome==='success') p.resolve(); else p.reject(new Error('Synthetic held denial'));
  },{outcome,index});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

for(const row of pages) for(const width of [320,390]) for(const theme of ['light','dark']) {
  test(`${row.slug} current copy, numbers and native recovery at ${width}px ${theme}`,async({page},testInfo)=>{
    const errors=await setup(page,row,width,theme);
    await prepare(page,row);
    expect(await page.locator('#amount').getAttribute('aria-describedby')).toBe('amountHelp amountError');
    expect(await page.locator('#amount').evaluate(node=>node.labels[0].textContent)).toMatch(/Amount/);
    const currentWords=await words(page,row),documentLine=await page.locator('#docPreview').textContent();
    await pointer(page,row.copy);
    await expect(page.locator(row.status)).toContainText('Copied');
    await pointer(page,copyDocument);
    expect(await page.evaluate(()=>window.__qa.writes)).toEqual([currentWords,documentLine]);
    expect(documentLine).toContain('Synthetic Payee <b>literal</b> & Co');
    expect(documentLine).toContain(row.code+' 12,500.75');
    expect(await page.locator('#resultCard b').count()).toBe(0);
    for(const [value,expected,figure] of [['0',row.zero,'0.00'],['.01',row.sub,'0.01'],['1.005',row.one,'1.01']]) {
      await page.locator('#amount').fill(value);
      expect(await words(page,row)).toBe(expected);
      await expect(page.locator(row.figure)).toHaveText(row.code+' '+figure);
    }
    await page.locator('#amount').fill(row.max+'.99');
    expect(await words(page,row)).toContain('Ninety-Nine');
    expect(await words(page,row)).toContain(row.code==='NGN' ? 'Trillion' : 'Billion');
    await expect(page.locator(row.figure)).toHaveText(row.code+' '+Number(row.max).toLocaleString('en')+'.99');
    for(const value of ['-1','1e3','12,34','1.2.3',row.max+'.995']) {
      await page.locator('#amount').fill(value);
      await expect(page.locator('#amount')).toHaveAttribute('aria-invalid','true');
      await expect(page.locator('#resultCard')).toBeHidden();
      await expect(page.locator('#docPreview')).toHaveText('');
      await expect(page.locator('#amountError')).not.toBeEmpty();
    }
    await page.locator('#amount').fill('');
    await expect(page.locator('#amountError')).toHaveText('');
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid','false');
    await page.locator('#amount').fill('12500.75');
    if(row.code==='NGN') {
      const contrast=await page.locator('.currency-label').evaluate(node=>{
        const parse=v=>v.match(/[\d.]+/g).slice(0,3).map(Number);
        let parent=node,bg;
        while(parent){const s=getComputedStyle(parent).backgroundColor;if(s!=='rgba(0, 0, 0, 0)' && s!=='transparent'){bg=parse(s);break;}parent=parent.parentElement;}
        const color=parse(getComputedStyle(node).color);
        const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const a=lum(color),b=lum(bg);
        return {color,bg,font:getComputedStyle(node).fontSize,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
      });
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      await testInfo.attach('currency-label-contrast',{body:JSON.stringify(contrast),contentType:'application/json'});
      await page.locator('#amount').focus();
      await page.keyboard.press('Tab'); await expect(page.locator(row.copy)).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.locator(copyDocument)).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.locator(clear)).toBeFocused();
      await settle(page); await usefulFocus(page,clear);
      await page.keyboard.press('Enter'); await usefulFocus(page,'#amount');
      await expect(page.locator('#amount')).toHaveValue('');
      await testInfo.attach('keyboard-clear-focus',{body:JSON.stringify(await geometry(page,'#amount')),contentType:'application/json'});
      await page.locator('#amount').fill('12500.75');
      await page.mouse.move(width-8,430); await settle(page);
      for(let i=0;i<8;i++){const g=await geometry(page,'#amount');if(Math.abs(g.top-10)<1)break;await page.mouse.wheel(0,g.top-10);await settle(page);}
      await pointer(page,clear);
      const trigger=await page.evaluate(()=>window.__qa.events.find(e=>e.type==='click' && e.action==='clearAll()'));
      expect(trigger.fieldTop).toBeLessThan(trigger.header);
      await usefulFocus(page,'#amount');
      await expect(page.locator('#payeeName')).toHaveValue('');
      await expect(page.locator(row.ref)).toHaveValue('');
      await expect(page.locator('#currency')).toHaveValue('NGN');
      await expect(page.locator('#caseMode')).toHaveValue('title');
      await expect(page.locator('#docMode')).toHaveValue('invoice');
      await testInfo.attach('pointer-clear-focus',{body:JSON.stringify({trigger,after:await geometry(page,'#amount')}),contentType:'application/json'});
      await page.screenshot({path:testInfo.outputPath('pointer-clear-focus.png')});
      await page.locator('#amount').fill('1.005');
      await page.locator('#currency').selectOption('GHS');
      expect(await words(page,row)).toBe('One Cedi and One Pesewa Only');
      await expect(page.locator(row.figure)).toHaveText('GHS 1.01');
      await pointer(page,copyDocument);
      expect(await page.evaluate(()=>window.__qa.writes.at(-1))).toBe('Invoice amount: GHS 1.01 (One Cedi and One Pesewa Only)');
      await page.locator('#currency').selectOption('NGN');
    } else {
      await page.locator('#amount').focus();await page.keyboard.press('Control+A');await page.keyboard.press('Backspace');
      await expect(page.locator('#resultCard')).toBeHidden();
    }
    await page.locator('#amount').fill('12500.75'); await pointer(page,row.copy);
    await page.screenshot({path:testInfo.outputPath('current-mobile.png')});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

for(const row of pages) {
  test(`${row.slug} clipboard failures keep the exact current manual-copy recovery`,async({page},testInfo)=>{
    const errors=await setup(page,row,320,'dark');await prepare(page,row);
    const line=await page.locator('#docPreview').textContent();
    for(const mode of ['absent','reject','sync']) {
      const count=await page.evaluate(()=>window.__qa.prompts.length);
      await page.evaluate(mode=>window.__qa.mode=mode,mode);
      await pointer(page,copyDocument);
      await expect.poll(()=>page.evaluate(()=>window.__qa.prompts.length)).toBe(count+1);
      expect(await page.evaluate(()=>window.__qa.prompts.at(-1))).toEqual({message:'Copy amount text',text:line});
      await expect(page.locator(row.status)).toContainText('Automatic copy is unavailable');
      await expect(page.locator(row.status)).not.toContainText('Copied');
    }
    await page.evaluate(()=>{window.__qa.promptThrows=true;window.__qa.mode='sync';});
    await pointer(page,copyDocument);
    await expect(page.locator(row.status)).toContainText('Select and copy the result shown');
    await page.evaluate(()=>{window.__qa.promptThrows=false;window.__qa.mode='held';window.__qa.events=[];});
    await page.locator(row.copy).focus();await settle(page);await usefulFocus(page,row.copy);
    await page.keyboard.press('Enter');
    await expect.poll(()=>page.evaluate(()=>window.__qa.pending.length)).toBe(1);
    const keyboard=await page.evaluate(()=>window.__qa.events.find(e=>e.type==='click' && e.trusted && e.detail===0));
    expect(keyboard.action).toBe(row.copy.includes('copyWords') ? 'copyWords()' : 'copyResult()');
    await page.keyboard.press('Tab');await expect(page.locator(copyDocument)).toBeFocused();
    await settle(page);await usefulFocus(page,copyDocument);
    const before=await snapshot(page,row);await release(page,'denial');const after=await snapshot(page,row);
    expect(after.status).toContain('Select and copy the result shown');
    const {status:beforeStatus,...expectedState}=before;
    const {status:afterStatus,...actualState}=after;
    expect(actualState).toEqual(expectedState);await usefulFocus(page,copyDocument);
    await testInfo.attach('native-keyboard-and-moved-focus',{body:JSON.stringify({keyboard,before,after,beforeStatus,afterStatus,geometry:await geometry(page,copyDocument)}),contentType:'application/json'});
    await page.screenshot({path:testInfo.outputPath('manual-copy-recovery.png')});
    expect(errors).toEqual([]);
  });

  test(`${row.slug} blocked converter preserves honest wording PDF retry state`,async({page},testInfo)=>{
    const errors=await setup(page,row,320,'dark',true);
    await expect(page.locator('#amountError')).toContainText('Reload to try again');
    await pointer(page,'[data-afw-pdf]');
    expect(await page.evaluate(()=>window.__qa.prints)).toBe(0);
    await expect(page.locator('#amount')).toBeDisabled();
    await expect(page.locator('#amountError')).toContainText('Reload to try again');
    await expect(page.locator('[data-amount-print-sheet]')).toHaveCount(0);
    await expect(page.locator('#resultCard')).toBeHidden();
    await page.screenshot({path:testInfo.outputPath('blocked-converter-pdf-recovery.png')});
    expect(errors).toEqual([]);
  });

  for(const outcome of ['success','denial']) test(`${row.slug} obsolete ${outcome} cannot change result, prompt, feedback or focus`,async({page},testInfo)=>{
    const errors=await setup(page,row,390,'light');await prepare(page,row);
    const records=[];
    const actions=['amount','invalid','blank','case','format','payee','reference','new-copy-same-value','new-held-copy'];
    if(row.code==='NGN')actions.push('currency','clear');
    for(const action of actions) {
      await page.locator('#amount').fill('12500.75');await page.locator('#caseMode').selectOption('title');
      await page.evaluate(()=>window.__qa.mode='held');await pointer(page,copyDocument);
      await expect.poll(()=>page.evaluate(()=>window.__qa.pending.length)).toBe(1);
      if(action==='amount')await page.locator('#amount').fill('9.25');
      else if(action==='invalid')await page.locator('#amount').fill('-1');
      else if(action==='blank')await page.locator('#amount').fill('');
      else if(action==='case')await page.locator('#caseMode').selectOption('upper');
      else if(action==='format')await page.locator('#docMode').selectOption('cheque');
      else if(action==='payee')await page.locator('#payeeName').fill('Synthetic New Payee');
      else if(action==='reference')await page.locator(row.ref).fill('SYNTHETIC-NEW-REF');
      else if(action==='currency')await page.locator('#currency').selectOption('GHS');
      else if(action==='clear')await pointer(page,clear);
      else if(action==='new-copy-same-value'){await page.evaluate(()=>window.__qa.mode='success');await pointer(page,copyDocument);await expect(page.locator(row.status)).toContainText('Copied');}
      else {await pointer(page,copyDocument);await expect.poll(()=>page.evaluate(()=>window.__qa.pending.length)).toBe(2);await release(page,'denial',1);await expect(page.locator(row.status)).toContainText('Automatic copy is unavailable');}
      const before=await snapshot(page,row);await release(page,outcome);const after=await snapshot(page,row);
      expect(after,action).toEqual(before);records.push({action,before,after});
      if(action==='clear')await details(page);
    }
    await testInfo.attach('obsolete-outcomes',{body:JSON.stringify(records),contentType:'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${row.slug} wording PDF lifecycle uses current result and blocks empty export`,async({page},testInfo)=>{
    const errors=await setup(page,row,320,'dark');await prepare(page,row);
    const line=await page.locator('#docPreview').textContent();
    await pointer(page,'[data-afw-pdf]');
    const printed=await page.evaluate(()=>({count:window.__qa.prints,text:window.__qa.printText}));
    expect(printed.count).toBe(1);expect(printed.text).toContain(line);
    expect(printed.text).toContain('Synthetic Payee <b>literal</b> & Co');
    expect(printed.text).toContain('SYNTHETIC-REF');expect(printed.text).toContain('Check that the written amount matches the figures');
    expect(printed.text).not.toMatch(/Frequently Asked|Common Questions|Copy action brief|Extra decimal places/);
    await expect(page.locator('[data-amount-print-sheet]')).toHaveCount(0);
    expect(await page.locator('body').getAttribute('data-amount-printing')).toBeNull();
    const before=await snapshot(page,row);
    await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    await expect(page.locator('[data-amount-print-sheet] b')).toHaveCount(0);
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    expect(await snapshot(page,row)).toEqual(before);
    await page.locator('#amount').fill('9.25');await pointer(page,'[data-afw-pdf]');
    expect(await page.evaluate(()=>window.__qa.prints)).toBe(2);
    const next=await page.evaluate(()=>window.__qa.printText);expect(next).toContain('9.25');expect(next).not.toContain('12,500.75');
    for(const value of ['-1','']) {
      await page.locator('#amount').fill(value);await pointer(page,'[data-afw-pdf]');
      expect(await page.evaluate(()=>window.__qa.prints)).toBe(2);
      await expect(page.locator('#amountError')).toContainText('Enter a valid amount');await usefulFocus(page,'#amount');
      await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await expect(page.locator('[data-amount-print-sheet]')).toHaveCount(0);
    }
    await testInfo.attach('print-lifecycle',{body:JSON.stringify({printed,next}),contentType:'application/json'});
    expect(errors).toEqual([]);
  });

  for(const theme of ['light','dark']) test(`${row.slug} actual current wording PDF at 390px ${theme}`,async({page,browserName},testInfo)=>{
    test.skip(browserName!=='chromium','Real page.pdf parsing is Chromium-only; print lifecycle is checked in all engines.');
    const errors=await setup(page,row,390,theme);await prepare(page,row);
    // page.pdf invokes the real beforeprint/afterprint browser events.
    const firstBytes=await page.pdf({format:'A4',printBackground:true});
    fs.writeFileSync(testInfo.outputPath('current-wording.pdf'),firstBytes);
    const first=await pdfParse(firstBytes);const text=first.text.replace(/\s+/g,' ');
    expect(first.numpages).toBe(1);expect(text).toContain(row.code+' 12,500.75');
    expect(text).toContain('Synthetic Payee <b>literal</b> & Co');expect(text).toContain('SYNTHETIC-REF');
    expect(text).toContain(await words(page,row));expect(text).toContain('Check that the written amount matches the figures');
    expect(text).not.toMatch(/Frequently Asked|Common Questions|Copy action brief|Extra decimal places|Try a common amount|Loading converter/);
    await expect(page.locator('[data-amount-print-sheet]')).toHaveCount(0);
    expect(await page.locator('body').getAttribute('data-amount-printing')).toBeNull();
    await expect(page.locator('#amount')).toHaveValue('12500.75');
    await page.locator('#amount').fill('9.25');
    const secondBytes=await page.pdf({format:'A4',printBackground:true});fs.writeFileSync(testInfo.outputPath('updated-wording.pdf'),secondBytes);
    const second=await pdfParse(secondBytes);expect(second.numpages).toBe(1);expect(second.text).toContain(row.code+' 9.25');expect(second.text).not.toContain('12,500.75');
    await testInfo.attach('parsed-real-pdfs',{body:JSON.stringify({first:{pages:first.numpages,text:first.text},second:{pages:second.numpages,text:second.text}}),contentType:'application/json'});
    expect(errors).toEqual([]);
  });
}

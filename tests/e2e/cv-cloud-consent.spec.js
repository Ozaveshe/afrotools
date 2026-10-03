'use strict';
const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function open(page, route, selected = false) {
  const requests=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('afrotools_cookie_consent','declined');
    window.__cvTestUser={id:'synthetic-account-a'};
    const auth={getUser:()=>window.__cvTestUser,isLoggedIn:()=>Boolean(window.__cvTestUser),getSessionTokenAsync:async()=> 'synthetic-test-token'};
    Object.defineProperty(window,'AfroAuth',{configurable:true,get:()=>auth,set:()=>{}});
  });
  await page.route('**/api/workspace**',async route=>{
    const request=route.request(),body=request.postData()?JSON.parse(request.postData()):null;
    requests.push({method:request.method(),hasPayload:Boolean(body),hasCv:Boolean(body?.payload?.data),itemKey:body?.item_key||null,itemType:body?.item_type||null});
    const remote={item_type:'cv-draft',payload:{data:{fn:'Cloud',ln:'Synthetic',summary:'Cloud synthetic draft',altPhone:'SYNTHETIC_ALT_PHONE',github:'https://synthetic.example.test/github',portfolio:'https://synthetic.example.test/portfolio',futureProfile:{roles:['Synthetic role']},skills:{futureSkill:'Synthetic extension'}},country:'NG',template:'ats-classic'}};
    const targeted=new URL(request.url()).searchParams.get('item_key')==='selected-synthetic';
    if(selected&&targeted){remote.item_type='cv';remote.item_key='selected-synthetic';remote.payload.id='selected-synthetic';}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[remote],item:{}})});
  });
  await page.route(/https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|www\.googletagmanager\.com)\//,route=>route.fulfill({status:200,body:''}));
  const response=await page.goto(route,{waitUntil:'domcontentloaded'});expect(response.status()).toBe(200);
  await page.waitForFunction(()=>window.CVApp&&window.AfroWorkspace);
  await page.waitForLoadState('load');
  await expect(page.locator('#cv-cloud-consent')).toBeEnabled();
  await page.evaluate(()=>{
    const state=window.CVApp.getState();Object.assign(state.data,{fn:'Local',ln:'Synthetic',title:'Synthetic role',summary:'Local synthetic draft',email:'synthetic@example.test'});
    state.savedCVs=[{id:'synthetic-saved-cv',title:'Synthetic saved CV',data:JSON.parse(JSON.stringify(state.data)),country:'NG',template:'ats-classic'}];window.CVApp.renderAll();
  });
  return {requests,errors};
}
for(const [locale,route] of [['en','/tools/cv-builder/'],['fr','/fr/tools/generateur-cv/']]){
  test(`${locale}: served PDF and ATS fallback failures retain feedback and unlock controls without private diagnostics`,async({page})=>{
    const proof=await open(page,route),diagnostics=[];
    // Re-load the served canonical module to exercise both its fallback catches.
    // The normal ATS path is overridden by cv-ats-plain-pdf-fix.js and proved by the export suite.
    const moduleUrl=await page.locator('script[src*="/cv-export-pdf-quality.js"]').first().getAttribute('src');
    const moduleResponse=await page.request.get(new URL(moduleUrl,page.url()).href);
    expect(moduleResponse.status()).toBe(200);
    // Capture the served module's callbacks in its own execution turn, before the normal ATS shim rebinds them.
    await page.addScriptTag({content:await moduleResponse.text()+'\n;window.__cvFallbackPdf=window.CVExportPdfQuality.exportPdf;window.__cvFallbackAts=window.CVExportPdfQuality.exportAtsPdf;'});
    page.on('console',message=>{if(message.type()==='error')diagnostics.push(message.text());});
    await page.evaluate(()=>{
      window.__cvOriginalPdfLoader=window.loadPdfLibs;
      window.loadPdfLibs=()=>Promise.reject(new Error('PRIVATE_EXPORT_FAILURE_SENTINEL synthetic-token'));
      window.__cvFallbackPdf();
    });
    await expect.poll(()=>diagnostics.length).toBe(1);
    await expect.poll(()=>page.evaluate(()=>Array.from(document.querySelectorAll('[data-cv-export], [data-action="pdf"], [data-action="print"]')).every(button=>!button.disabled))).toBe(true);
    await page.evaluate(()=>{window.loadPdfLibs=()=>Promise.reject(new Error('PRIVATE_EXPORT_FAILURE_SENTINEL synthetic-token'));return window.__cvFallbackAts('Synthetic local ATS content');});
    await expect.poll(()=>diagnostics.length).toBe(2);
    expect(await page.evaluate(()=>Array.from(document.querySelectorAll('[data-cv-export], [data-action="pdf"], [data-action="print"]')).every(button=>!button.disabled))).toBe(true);
    await page.evaluate(()=>window.loadPdfLibs=window.__cvOriginalPdfLoader);
    expect(diagnostics.some(value=>value.includes('PRIVATE_EXPORT_FAILURE_SENTINEL')||value.includes('synthetic-token'))).toBe(false);
    expect(proof.requests).toEqual([]);expect(proof.errors).toEqual([]);
  });
  test(`${locale}: default-local CV permission is visible, accessible and never granted by sign-in or focus`,async({page},testInfo)=>{
    const proof=await open(page,route),panel=page.locator('.cv-cloud-backup'),choice=page.locator('#cv-cloud-consent');
    await page.waitForLoadState('load');
    await expect(choice).not.toBeChecked();await expect(panel).toBeVisible();
    await expect(panel).toContainText(locale==='fr'?'coordonnées':'contact details');
    await expect(panel).toContainText(locale==='fr'?'photo':'photo');
    await expect(panel).toContainText(locale==='fr'?'autorisation':'Permission');
    for(const width of [320,390,1365]){
      await page.setViewportSize({width,height:900});
      expect(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;})).toBe(true);
      const layout=await page.evaluate(()=>({fits:document.documentElement.scrollWidth<=innerWidth+1,innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,ready:document.readyState,offenders:Array.from(document.querySelectorAll('body *')).map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName,id:el.id,classes:typeof el.className==='string'?el.className:'',right:r.right,left:r.left,width:r.width,position:getComputedStyle(el).position};}).filter(r=>r.width&&r.right>innerWidth+1).slice(0,12)}));
      if(!layout.fits)await testInfo.attach('overflow-metadata-'+width,{body:Buffer.from(JSON.stringify(layout)),contentType:'application/json'});
      expect(layout.fits).toBe(true);
    }
    await page.setViewportSize({width:640,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.evaluate(()=>document.documentElement.style.fontSize='');
    for(const theme of ['light','dark']){
      await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
      await page.addScriptTag({content:fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')});
      const violations=await page.evaluate(async()=>{const r=await axe.run(document.querySelector('.cv-cloud-backup'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>v.id);});
      expect(violations).toEqual([]);
    }
    await choice.focus();await expect(choice).toBeFocused();
    expect(await choice.evaluate(el=>{const s=getComputedStyle(el.closest('label'));return parseFloat(s.outlineWidth)>=2;})).toBe(true);
    expect(await page.locator('.cv-cloud-choice').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(5500);expect(proof.requests).toEqual([]);expect(proof.errors).toEqual([]);
  });
  test(`${locale}: actual consent, restore cancellation, revocation, account change and reload preserve the local draft`,async({page})=>{
    const proof=await open(page,route),choice=page.locator('#cv-cloud-consent');
    const authorizedKeys=await page.evaluate(()=>['current',...window.CVApp.getState().savedCVs.map(cv=>cv.id)].sort());
    await choice.focus();await page.keyboard.press('Space');await expect(choice).toBeChecked();
    await expect.poll(()=>proof.requests.filter(r=>r.method==='POST').map(r=>r.itemKey).sort()).toEqual(authorizedKeys);
    expect(proof.requests[1].hasCv).toBe(true);
    expect(proof.requests.filter(r=>r.method==='POST').every(r=>r.hasCv&&['cv','cv-draft'].includes(r.itemType))).toBe(true);
    expect(await page.evaluate(()=>window.CVApp.getState().data.summary==='Local synthetic draft')).toBe(true);
    await expect(page.locator('#cv-cloud-status')).toContainText(locale==='fr'?'activée':'on for this session');
    const dialogPromise=page.waitForEvent('dialog').then(async dialog=>{expect(dialog.message()).toContain(locale==='fr'?'Remplacer':'Replace');await dialog.dismiss();});
    await page.locator('#cv-cloud-restore').click();await dialogPromise;
    expect(await page.evaluate(()=>window.CVApp.getState().data.summary==='Local synthetic draft')).toBe(true);
    await choice.uncheck();const count=proof.requests.length;
    await page.evaluate(()=>{window.CVApp.getState().data.summary='Local edit after revocation';window.dispatchEvent(new Event('focus'));});
    await page.waitForTimeout(5500);expect(proof.requests.length).toBe(count);
    await choice.check();await expect.poll(()=>proof.requests.length).toBeGreaterThan(count);
    await page.evaluate(()=>{window.__cvTestUser={id:'synthetic-account-b'};window.dispatchEvent(new Event('afro-auth-change'));});
    await expect(choice).not.toBeChecked();const accountCount=proof.requests.length;
    await page.reload({waitUntil:'domcontentloaded'});await expect(choice).not.toBeChecked();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));expect(proof.requests.length).toBe(accountCount);expect(proof.errors).toEqual([]);
  });
  for(const selected of [false,true]) test(`${locale}: confirmed ${selected?'selected-CV link':'partial cloud draft'} restoration renders complete empty defaults without retaining local details`,async({page})=>{
      const proof=await open(page,route+(selected?'?cv=selected-synthetic':''),selected);
      expect(proof.requests).toEqual([]);
      await page.locator('#cv-cloud-consent').check();
      await expect(page.locator('#cv-cloud-restore')).toBeEnabled();
      if(selected){
        await expect(page.locator('#cv-cloud-restore')).toHaveText(locale==='fr'?'Ouvrir le CV cloud sélectionné':'Open selected cloud CV');
        expect(proof.requests.filter(r=>r.method==='GET').length).toBe(2);
      }
      expect(await page.evaluate(()=>window.CVApp.getState().data.summary==='Local synthetic draft')).toBe(true);
      const confirmed=page.waitForEvent('dialog').then(dialog=>dialog.accept());
      await page.locator('#cv-cloud-restore').click();await confirmed;
      await expect.poll(()=>page.evaluate(()=>window.CVApp.getState().data.summary==='Cloud synthetic draft')).toBe(true);
      expect(await page.evaluate(expected=>{
        const cv=window.CVApp.getState(),stored=JSON.parse(localStorage.getItem('afro_cv_data'));
        return cv.data.email===''&&cv.data.exps.length===1&&cv.data.edus.length===1&&cv.data.skills.h===''&&cv.currentCVId===expected&&stored.data.email===''&&stored.data.exps.length===1&&cv.data.altPhone==='SYNTHETIC_ALT_PHONE'&&stored.data.github==='https://synthetic.example.test/github'&&stored.data.portfolio==='https://synthetic.example.test/portfolio'&&stored.data.futureProfile.roles[0]==='Synthetic role'&&stored.data.skills.futureSkill==='Synthetic extension';
      },selected?'selected-synthetic':null)).toBe(true);
      await expect(page.locator('#cvpreview')).toContainText('Cloud Synthetic');
      await expect(page.locator('#cvpreview')).toBeVisible();
      expect(proof.errors).toEqual([]);
      const permission=page.locator('#cv-cloud-consent');await permission.focus();await expect(permission).toBeFocused();
      await page.keyboard.press('Space');await expect(permission).not.toBeChecked();
  });
  test(`${locale}: imported dates remain text and cannot create HTML attributes`,async({page})=>{
    const proof=await open(page,route);
    const attribute='" onmouseover="window.__cvSyntheticAttributeProbe=true';
    const text='<img src="data:image/png;base64,AA" onerror="window.__cvSyntheticAttributeProbe=true">';
    await page.evaluate(({attribute,text})=>{
      const cv=window.CVApp.getState();cv.template='slate';cv.data.sp=true;cv.data.dob=attribute;
      cv.data.exps=[{t:'Synthetic role',c:'Synthetic employer',l:'',s:text,e:attribute,cur:false,d:''}];
      window.__cvSyntheticAttributeProbe=false;window.CVApp.renderAll();
    },{attribute,text});
    await expect(page.locator('.cv-app [onmouseover], .cv-app [onerror]')).toHaveCount(0);
    await expect(page.locator('[data-path="dob"]')).toHaveAttribute('value',attribute);
    await expect(page.locator('#cvpreview')).toContainText(text);
    expect(await page.evaluate(()=>window.__cvSyntheticAttributeProbe)).toBe(false);
    await page.evaluate(()=>{
      const cv=window.CVApp.getState();cv.data.dob='1996-02-03';cv.data.exps[0].s='2024-01';cv.data.exps[0].e='2025-03';window.CVApp.renderAll();
    });
    await expect(page.locator('[data-path="dob"]')).toHaveValue('1996-02-03');
    await expect(page.locator('#cvpreview')).toContainText('Jan 2024');
    await expect(page.locator('#cvpreview')).toContainText('Mar 2025');
    expect(proof.requests).toEqual([]);expect(proof.errors).toEqual([]);
  });
  test(`${locale}: opaque saved identifiers remain safe and deletion still works`,async({page})=>{
    const proof=await open(page,route);
    const id='synthetic-id" onmouseover="window.__cvSyntheticAttributeProbe=true';
    await page.evaluate(id=>{
      const cv=window.CVApp.getState();
      cv.savedCVs=[{id,title:'Synthetic saved CV',data:JSON.parse(JSON.stringify(cv.data)),country:'NG',template:'slate',updatedAt:Date.now()}];
      localStorage.setItem('afro_cv_list',JSON.stringify(cv.savedCVs));
      window.__cvSyntheticAttributeProbe=false;window.CVApp.renderAll();
    },id);
    await expect(page.locator('.cv-saved-card[onmouseover], .cv-saved-card [onmouseover]')).toHaveCount(0);
    for(const attribute of ['data-cv-id','data-load','data-dup','data-del'])
      await expect(page.locator('['+attribute+']').first()).toHaveAttribute(attribute,id);
    const confirmed=page.waitForEvent('dialog').then(dialog=>dialog.accept());
    await page.locator('[data-del]').click();await confirmed;
    await expect.poll(()=>page.evaluate(()=>window.CVApp.getState().savedCVs.length)).toBe(0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_list')).length)).toBe(0);
    await expect(page.locator('.cv-saved-section')).not.toHaveClass(/\bshow\b/);
    await expect(page.locator('.cv-saved-section')).not.toBeVisible();
    expect(await page.evaluate(()=>window.__cvSyntheticAttributeProbe)).toBe(false);
    expect(proof.requests).toEqual([]);expect(proof.errors).toEqual([]);
  });
  for(const template of ['slate','portfolio','franco','diaspora','creative-portfolio','lagosCorporate','accraGraduate']) test(`${locale}/${template}: photo values stay inside image attributes and normal photos remain visible`,async({page},testInfo)=>{
    const proof=await open(page,route);
    await page.evaluate(()=>Object.assign(window.CVApp.getState().data,{fn:'Synthetic "Quoted"',ln:"O'Candidate"}));
    const malformed='data:image/png;base64,AA" onerror="window.__cvSyntheticPhotoProbe=true';
    const valid='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1cAAAAASUVORK5CYII=';
      await page.evaluate(({template,photo})=>{
        const cv=window.CVApp.getState();cv.template=template;cv.data.showPhoto=true;cv.data.photo=photo;window.__cvSyntheticPhotoProbe=false;window.CVApp.renderAll();
      },{template,photo:malformed});
      const image=page.locator('#cvpreview img').first();await expect(image).toBeVisible();
      expect(await image.evaluate(el=>el.hasAttribute('onerror'))).toBe(false);
      await expect(page.locator('.cv-app [onerror]')).toHaveCount(0);
      await expect(page.locator('.cv-inp[data-path="fn"]')).toHaveValue('Synthetic "Quoted"');
      expect(await page.evaluate(()=>window.__cvSyntheticPhotoProbe)).toBe(false);
      await page.evaluate(photo=>{window.CVApp.getState().data.photo=photo;window.CVApp.renderAll();},valid);
      try {
        await page.waitForFunction(valid=>{const el=document.querySelector('#cvpreview img');return el&&el.getAttribute('src')===valid&&el.complete&&el.naturalWidth===1;},valid,{timeout:10000});
        await expect(page.locator('#cvpreview img').first()).toHaveAttribute('src',valid);
      } catch(error) {
        const metadata=await page.evaluate(({template,valid})=>({template,ready:document.readyState,templateMatches:window.CVApp.getState().template===template,dataMatches:window.CVApp.getState().data.photo===valid,images:Array.from(document.querySelectorAll('#cvpreview img')).map(el=>({sourceMatches:el.getAttribute('src')===valid,complete:el.complete,naturalWidth:el.naturalWidth,handler:el.hasAttribute('onerror')}))}),{template,valid});
        await testInfo.attach('photo-decode-metadata',{body:Buffer.from(JSON.stringify(metadata)),contentType:'application/json'});throw error;
      }
      await expect(page.locator('#cvpreview img').first()).toBeVisible();
      await expect(page.locator('#cvpreview')).toContainText("Synthetic \"Quoted\" O'Candidate");
    expect(proof.requests).toEqual([]);expect(proof.errors).toEqual([]);
  });
}

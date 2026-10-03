const {test,expect}=require('@playwright/test');
async function settleRenderedContent(page) {
  // Visit deferred sections so theme transitions finish before the whole-page
  // audit reads them. Hidden disclosures can retain pending Firefox animations.
  for (const section of await page.locator('section, main, article, aside').all()) {
    if (await section.evaluate(element => getComputedStyle(element).contentVisibility === 'auto')) {
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(() => {
    const roots = [document];
    for (let index = 0; index < roots.length; index++) {
      for (const element of roots[index].querySelectorAll('*')) {
        if (element.shadowRoot) roots.push(element.shadowRoot);
      }
    }
    const animations = new Set(roots.flatMap(root => root.getAnimations()));
    return [...animations].filter(animation =>
      animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime) &&
      (animation.effect.target?.checkVisibility?.({ contentVisibilityAuto: true, visibilityProperty: true }) ?? true)
    ).length;
  })).toBe(0);
}

for(const width of [320,1280]){
 test(`Uganda calculated results stay readable and unchanged across themes at${width}`,async({page,baseURL},testInfo)=>{
  const origin=new URL(baseURL).origin,errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:'dark',reducedMotion:'no-preference'});
  await page.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method())){writes.push({path:url.pathname,method:req.method()});return route.abort();}if(url.origin===origin&&!/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname))return route.continue();if(url.href==='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'||url.href.startsWith('https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/'))return route.continue();return route.fulfill({status:204,body:'',contentType:url.pathname.endsWith('.js')?'application/javascript':'text/plain'});});
  await page.addInitScript(()=>{localStorage.setItem('aft_theme','light');localStorage.setItem('afrotools_cookie_consent','declined');window.AFROTOOLS_TEST_DISABLE_ANALYTICS=true;});
  await page.goto('/uganda/ug-paye');await expect(page.locator('afro-navbar #themeToggle')).toBeAttached();
  await expect.poll(()=>page.evaluate(()=>window.Chart?.version)).toBe('4.4.1');
  await page.getByRole('button',{name:/Calculate Take-Home Pay/}).press('Enter');
  await expect(page.locator('#resAmount')).toContainText('1,086,750');
  const before=await page.evaluate(()=>({result:JSON.stringify(RESULT),ledger:document.getElementById('resContent').textContent,amount:document.getElementById('resAmount').textContent}));
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['dark','light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme){if(width===320)await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('button',{name:`Switch to ${theme} mode`,exact:true}).press('Space');await expect(page.locator('html')).toHaveAttribute('data-theme',theme);if(width===320){await page.keyboard.press('Escape');await expect(page.locator('afro-navbar .mob')).toBeHidden();}}
   await settleRenderedContent(page);
   await expect.poll(()=>page.evaluate(()=>{const chart=window.Chart.getChart(document.getElementById('mainChart'));return chart&&!window.Chart.animator.running(chart);})).toBe(true);
   const result=await page.evaluate(async()=>{const audit=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{theme:document.documentElement.getAttribute('data-theme'),violations:audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),width:innerWidth,documentWidth:document.documentElement.scrollWidth};});
   await testInfo.attach(`${theme}-calculated-full-page`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
   expect(result.violations).toEqual([]);expect(result.documentWidth).toBeLessThanOrEqual(result.width+1);
   expect(await page.evaluate(()=>({result:JSON.stringify(RESULT),ledger:document.getElementById('resContent').textContent,amount:document.getElementById('resAmount').textContent}))).toEqual(before);
   await page.locator('.ng-faq-title').scrollIntoViewIfNeeded();
   const gap=await page.evaluate(()=>{const a=document.querySelector('.ng-faq-header .eyebrow').getBoundingClientRect(),b=document.querySelector('.ng-faq-title').getBoundingClientRect();return b.top-a.bottom;});expect(gap).toBeGreaterThanOrEqual(7.5);
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 });
}

for(const systemTheme of ['light','dark'])for(const width of [320,1280]){
 test(`Uganda full-page selected themes at${width} on${systemTheme} device`,async({page,baseURL},testInfo)=>{
  const origin=new URL(baseURL).origin,errors=[],writes=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:systemTheme,reducedMotion:'reduce'});
  await page.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(!['GET','HEAD'].includes(req.method())){writes.push({path:url.pathname,method:req.method()});return route.abort();}if(url.origin===origin&&!/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname))return route.continue();if(url.href==='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'||url.href.startsWith('https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/'))return route.continue();return route.fulfill({status:204,body:'',contentType:url.pathname.endsWith('.js')?'application/javascript':'text/plain'});});
  await page.addInitScript(()=>{localStorage.setItem('aft_theme','light');localStorage.setItem('afrotools_cookie_consent','declined');window.AFROTOOLS_TEST_DISABLE_ANALYTICS=true;});
  await page.goto('/uganda/ug-paye');await expect(page.locator('afro-navbar #themeToggle')).toBeAttached();
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['light','dark','light']){
   if(await page.locator('html').getAttribute('data-theme')!==theme){if(width===320)await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('button',{name:`Switch to ${theme} mode`,exact:true}).press('Space');await expect(page.locator('html')).toHaveAttribute('data-theme',theme);if(width===320){await page.keyboard.press('Escape');await expect(page.locator('afro-navbar .mob')).toBeHidden();}}
   await settleRenderedContent(page);
   const result=await page.evaluate(async()=>{const audit=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{theme:document.documentElement.getAttribute('data-theme'),violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:audit.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),width:innerWidth,documentWidth:document.documentElement.scrollWidth};});
   await testInfo.attach(`${theme}-full-page-audit`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
   expect.soft(result.violations,`${theme}:${JSON.stringify(result.violations)}`).toEqual([]);expect.soft(result.documentWidth).toBeLessThanOrEqual(result.width+1);
   await page.locator('.ng-faq-title').scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath(`${theme}-faq.png`)});
   await page.locator('#sources-verification').scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath(`${theme}-sources.png`)});
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 });
}

for (const width of [320, 1280]) {
 test(`Uganda sign-in card is painted and readable after scrolling at${width}`, async ({page,baseURL},testInfo) => {
  const origin=new URL(baseURL).origin;
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'no-preference'});
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if (!['GET','HEAD'].includes(route.request().method())) return route.abort();
   if(url.origin===origin&&!/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) return route.continue();
   return route.fulfill({status:204,body:'',contentType:url.pathname.endsWith('.js')?'application/javascript':'text/plain'});
  });
  await page.addInitScript(()=>{localStorage.setItem('aft_theme','light');localStorage.setItem('afrotools_cookie_consent','declined');window.AFROTOOLS_TEST_DISABLE_ANALYTICS=true;});
  await page.goto('/uganda/ug-paye');
  await expect(page.locator('afro-navbar #themeToggle')).toBeAttached();
  if(width===320) await page.getByRole('button',{name:'Open menu',exact:true}).click();
  await page.getByRole('button',{name:'Switch to dark mode',exact:true}).press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  if(width===320) await page.keyboard.press('Escape');
  await page.locator('.ng-save-card').scrollIntoViewIfNeeded();
  await settleRenderedContent(page);
  await page.locator('.ng-save-card').scrollIntoViewIfNeeded();
  const paint=await page.locator('.ng-save-title').evaluate(e=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform}));
  await testInfo.attach('sign-in-heading-paint',{body:JSON.stringify(paint),contentType:'application/json'});
  expect(Number(paint.opacity)).toBe(1);
  const contrast=await page.locator('.ng-save-card').evaluate(card=>{
   const colors=value=>[...value.matchAll(/rgba?\(([^)]+)\)/g)].map(m=>m[1].split(',').map(Number));
   const luminance=rgb=>rgb.slice(0,3).map(c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0);
   const style=getComputedStyle(card),backgrounds=colors(style.backgroundImage==='none'?style.backgroundColor:style.backgroundImage);
   return {background:style.backgroundImage==='none'?style.backgroundColor:style.backgroundImage,text:['.ng-save-title','.ng-save-desc'].map(selector=>{
    const color=getComputedStyle(card.querySelector(selector)).color,fg=luminance(colors(color)[0]);
    return {selector,color,ratios:backgrounds.map(rgb=>{const bg=luminance(rgb);return (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05);})};
   })};
  });
  await testInfo.attach('visible-card-contrast',{body:JSON.stringify(contrast,null,2),contentType:'application/json'});
  await page.screenshot({path:testInfo.outputPath('dark-sign-in-card.png')});
  for(const text of contrast.text){expect(text.ratios.length).toBeGreaterThan(0);for(const ratio of text.ratios)expect(ratio,`${text.selector} on ${contrast.background}`).toBeGreaterThanOrEqual(4.5);}
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const audit=await page.evaluate(async()=>{const a=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
  await testInfo.attach('scrolled-full-page-audit',{body:JSON.stringify(audit,null,2),contentType:'application/json'});
  expect(audit).toEqual([]);
 });
}

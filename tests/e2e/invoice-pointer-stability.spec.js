const {test,expect}=require('@playwright/test');
for(const width of [320,390])for(const dark of [false,true])for(const app of ['freelance','invoice'])test(`${app} ${width}px ${dark?'dark':'light'} late styles keep pointer targets stable`,async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.emulateMedia({colorScheme:dark?'dark':'light'});
 await page.goto(app==='freelance'?'/sw/zana/ankara-ya-freelancer/':'/sw/zana/kizalishaji-ankara/');
 const selector=app==='freelance'?'#saveInvoiceBtn':'#btnAddItem';
 const baseline=app==='invoice'?await page.locator('.line-item').count():0;
 await page.evaluate(selector=>{
  const link=[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href.includes('/sw-document-pdf-a11y.css'));
  window.__a11yLink=link;window.__sheet=link.sheet;window.__removed=0;window.__pointerGeometry=[];
  new MutationObserver(ms=>{for(const m of ms)for(const n of m.removedNodes)if(n===link)window.__removed++;}).observe(document.head,{childList:true});
  document.addEventListener('pointerdown',()=>{const style=document.createElement('style');style.dataset.invoiceLateStyle='true';style.textContent=':root{--invoice-late-style:1}';document.head.appendChild(style);},{once:true,capture:true});
  for(const type of ['pointerdown','mousedown','mouseup'])document.addEventListener(type,()=>{const r=document.querySelector(selector).getBoundingClientRect();window.__pointerGeometry.push({type,x:r.x,y:r.y,width:r.width,height:r.height});},true);
 },selector);
 await page.locator(selector).click();
 if(app==='freelance')await expect(page.locator('[data-open-saved]')).toHaveCount(1);
 else await expect(page.locator('.line-item')).toHaveCount(baseline+1);
 const state=await page.evaluate(()=>({removed:window.__removed,sameSheet:window.__a11yLink.sheet===window.__sheet,geometry:window.__pointerGeometry,priority:!Array.from(document.head.children).slice(Array.from(document.head.children).indexOf(window.__a11yLink)+1).some(e=>e.matches('style,link[rel=stylesheet]'))}));
 expect(state.removed).toBe(0);expect(state.sameSheet).toBe(true);expect(state.priority).toBe(true);
 expect(state.geometry.map(x=>x.type)).toEqual(['pointerdown','mousedown','mouseup']);
 for(const point of state.geometry.slice(1))for(const key of ['x','y','width','height'])expect(Math.abs(point[key]-state.geometry[0][key])).toBeLessThan(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

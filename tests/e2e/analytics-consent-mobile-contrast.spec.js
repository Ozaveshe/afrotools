const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
for(const [locale,route]of Object.entries({en:'/tools/pdf-form-filler/',fr:'/fr/tools/remplir-formulaire-pdf/',sw:'/sw/zana/kujaza-fomu-pdf/'}))test(`${locale} consent contrast and keyboard at320`,async({page},info)=>{
 await page.setViewportSize({width:320,height:740});await page.goto(route);const panel=page.locator('#afro-cookie-consent');await expect(panel).toBeVisible();
 const evidence=await panel.evaluate(panel=>{
  function rgb(s){return (s.match(/[\d.]+/g)||[]).map(Number)}
  function lum(c){return c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
  return Array.from(panel.querySelectorAll('.afro-cc-message,button,a')).map(el=>{const css=getComputedStyle(el);let parent=el,bg;while(parent){const c=getComputedStyle(parent).backgroundColor;if(rgb(c)[3]!==0){bg=c;break}parent=parent.parentElement}const a=lum(rgb(css.color)),b=lum(rgb(bg||'rgb(255,255,255)'));return {id:el.id||el.className,color:css.color,background:bg,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),rect:el.getBoundingClientRect().toJSON(),rules:Array.from(document.styleSheets).flatMap(sheet=>{try{return Array.from(sheet.cssRules)}catch{return[]}}).filter(r=>{try{return r.selectorText&&el.matches(r.selectorText)&&(r.style.background||r.style.backgroundColor)}catch{return false}}).map(r=>r.cssText)};});
 });fs.writeFileSync(info.outputPath('contrast.json'),JSON.stringify(evidence,null,2));await page.screenshot({path:info.outputPath(`consent-${locale}.png`)});
 for(const row of evidence){expect(row.contrast,row.id).toBeGreaterThanOrEqual(4.5);expect(row.rect.left).toBeGreaterThanOrEqual(0);expect(row.rect.right).toBeLessThanOrEqual(320);expect(row.rect.bottom).toBeLessThanOrEqual(740);if(row.id!=='afro-cc-message')expect(row.rect.height).toBeGreaterThanOrEqual(44);}
 expect(await page.evaluate(()=>localStorage.getItem('afrotools_cookie_consent'))).toBeNull();
 await page.evaluate(()=>{window.__consentEvents=[];addEventListener('afrotools:cookie-consent',e=>window.__consentEvents.push(e.detail.status));});
 await page.locator('#afro-analytics-consent-accept').focus();await page.keyboard.press('Tab');await expect(page.locator('#afro-cc-decline')).toBeFocused();expect(await page.locator('#afro-cc-decline').evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);await page.keyboard.press('Enter');await expect(panel).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');expect(await page.evaluate(()=>window.__consentEvents)).toEqual(['declined']);await page.reload();await expect(panel).toHaveCount(0);
});

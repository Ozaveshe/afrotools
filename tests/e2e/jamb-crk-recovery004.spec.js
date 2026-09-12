const {test,expect}=require('@playwright/test');
const {renderYear}=require('../../scripts/build-jamb-reviewed-pages');
const batch=require('../../ops/jamb/review-candidates/crk/crk-recovery004.json');
const originals=require('../../ops/jamb/source-pool.json').questions;
for(const width of [320,390])test(`CRK recovery004 held items stay absent at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.context().addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ids=new Set(batch.selection_ids),rows=originals.filter(q=>ids.has(q.id));expect(rows).toHaveLength(40);
 const html=renderYear('crk','1995',rows,{sources:{},questions:{}},['1995']).html;
 await page.route('**/jamb/crk/1995/',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('/jamb/crk/1995/');
 await expect(page.locator('[data-reviewed-question]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

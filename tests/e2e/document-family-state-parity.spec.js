const { test, expect } = require('@playwright/test');
const routes = {
  'business-plan': { en:'/tools/business-plan/app',fr:'/fr/tools/plan-affaires/app',sw:'/sw/zana/mpango-wa-biashara/' },
  'receipt-generator': { en:'/tools/receipt-generator/',fr:'/fr/tools/generateur-recu/',sw:'/sw/zana/kizalishaji-risiti/' },
  'meeting-minutes': { en:'/tools/meeting-minutes/app',fr:'/fr/tools/compte-rendu-reunion/app',sw:'/sw/zana/kumbukumbu-za-mkutano/' }
};
const marker = 'DOCUMENT_CONTRACT_2026';
async function prepare(page, app, locale) {
  await page.goto(routes[app][locale], {waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  if (app === 'business-plan') {
    await page.locator('[data-section-field]').first().fill(marker);
    return { field:page.locator('[data-section-field]').first(), input:'#importJson' };
  }
  if (app === 'receipt-generator') {
    await page.locator('#businessName').fill(marker);
    return { field:page.locator('#businessName'), input:'#importJson' };
  }
  await page.locator('#meetingTitle').fill(marker);
  await page.locator('#attendeeName').fill('Synthetic Participant');
  await page.locator('[data-action="add-attendee"]').click();
  return {field:page.locator('#meetingTitle'),input:'#importInput'};
}
for (const locale of ['en','fr','sw']) for (const app of Object.keys(routes)) {
  test(`${locale}: ${app} rejects unrelated JSON without destroying draft`,async ({page})=>{
    await page.setViewportSize({width:390,height:844});
    const state=await prepare(page,app,locale);
    await expect(state.field).toHaveValue(marker);
    const storageKey = 'afrotools-' + (app === 'receipt-generator' ? 'receipt' : app) + '-current-v2';
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toContain(marker);
    const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
    const backup = JSON.parse(before);
    const malformedShape = JSON.parse(before);
    if (app === 'business-plan') malformedShape.sections.company = null;
    else if (app === 'receipt-generator') malformedShape.items = [null];
    else malformedShape.attendees = [null];
    const poisoned = before.slice(0,1) + '"__proto__":{"polluted":true},' + before.slice(1);
    for (const invalid of ['{"unrelated":"not a document backup"}', '{}', '{malformed', poisoned, JSON.stringify(malformedShape)]) {
      await page.locator(state.input).setInputFiles({name:'unrelated.json',mimeType:'application/json',buffer:Buffer.from(invalid)});
      await page.waitForTimeout(350);
      await expect(state.field).toHaveValue(marker);
      expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
      expect(await page.evaluate(() => ({}).polluted)).toBeUndefined();
      if(app==='meeting-minutes') await expect(page.locator('#attendeeList')).toContainText('Synthetic Participant');
    }
    await state.field.fill('Changed draft');
    const payload = app === 'meeting-minutes' ? backup : {version:2,data:backup};
    await page.locator(state.input).setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
    await expect(state.field).toHaveValue(marker);
    if(app==='meeting-minutes') await expect(page.locator('#attendeeList')).toContainText('Synthetic Participant');
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toContain(marker);
    await page.reload();
    await expect(state.field).toHaveValue(marker);
    if (app === 'business-plan') {
      const legacy = {businessName:marker,overview:'Legacy business plan',fin_revenue_y1:'1000'};
      await page.locator(state.input).setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
      await expect(state.field).toHaveValue(marker);
      await expect(page.locator('#metricRevenue')).toContainText('1,000');
    } else if (app === 'receipt-generator') {
      const legacy = JSON.parse(before);
      legacy.items[0].description = 'Legacy item'; delete legacy.items[0].desc;
      legacy.items[0].price = 125; delete legacy.items[0].rate;
      await page.locator(state.input).setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
      await expect(page.locator('[data-item-field="desc"]').first()).toHaveValue('Legacy item');
      await expect(page.locator('[data-item-field="rate"]').first()).toHaveValue('125');
    }
  });
}

const {test,expect}=require('@playwright/test');
const fs=require('fs');
const pdfParse=require('pdf-parse');
const routes=['/tools/itax-guide/','/sw/zana/mwongozo-wa-itax/'];
async function prepare(page){await page.locator('[name="task"]').selectOption('return');await page.locator('[name="context"]').selectOption('resident-individual');await page.locator('[name="obligation"]').selectOption('income-individual');await page.locator('[name="filingYear"]').fill('2025');await page.locator('[name="asOfDate"]').fill('2026-08-09');for(const name of ['factsConfirmed','privacyConfirmed','receiptPlanConfirmed'])await page.locator(`[name="${name}"]`).check();}

for(const route of routes)test(`${route} builds a private checklist and reopens all advertised exports`,async({page})=>{
  const errors=[],external=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{const url=request.url();if(/^https?:/.test(url)&&!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))external.push(url);});
  await page.goto(route);await expect(page.locator('[data-itax-workspace]')).toHaveAttribute('data-workflow-ready','true');await prepare(page);
  const invalid=await page.locator('[data-itax-workspace] form').evaluate(form=>Array.from(form.elements).filter(control=>control.willValidate&&!control.checkValidity()).map(control=>control.name));expect(invalid).toEqual([]);
  await page.locator('[data-itax-workspace] button[type="submit"]').click();await expect(page.locator('[data-result]')).toBeVisible();await expect(page.locator('[data-checklist] input')).toHaveCount(4);await expect(page.locator('[data-official-link]')).toBeVisible();
  await page.locator('[data-checklist] input').nth(0).check();await page.locator('[data-checklist] input').nth(2).check();await expect(page.locator('[data-progress]')).toContainText('2 / 4');
  const jsonEvent=page.waitForEvent('download');await page.locator('[data-action="json"]').click();const jsonPath=await(await jsonEvent).path();const record=JSON.parse(fs.readFileSync(jsonPath,'utf8'));expect(record.englishId).toBe('itax-guide');expect(record.completed).toEqual([true,false,true,false]);expect(record.plan.decision).toBe('prepare-and-open-official-route');
  const txtEvent=page.waitForEvent('download');await page.locator('[data-action="txt"]').click();const txt=fs.readFileSync(await(await txtEvent).path(),'utf8');expect(txt).toContain('2026-08-09');expect(txt).toContain(route.includes('/sw/')?'Mpango wa maandalizi':'KRA iTax preparation plan');
  const pdfEvent=page.waitForEvent('download');await page.locator('[data-action="pdf"]').click();const pdfBuffer=fs.readFileSync(await(await pdfEvent).path());expect(pdfBuffer.subarray(0,5).toString()).toBe('%PDF-');const parsed=await pdfParse(pdfBuffer);expect(parsed.text).toContain(route.includes('/sw/')?'Mpango wa maandalizi':'KRA iTax preparation plan');
  await page.locator('[data-action="reset"]').click();await page.locator('[data-action="import"]').click();await page.locator('[name="importFile"]').setInputFiles(jsonPath);await expect(page.locator('[data-result]')).toBeVisible();await expect(page.locator('[data-checklist] input').nth(0)).toBeChecked();await expect(page.locator('[data-checklist] input').nth(1)).not.toBeChecked();
  expect(external).toEqual([]);expect(errors).toEqual([]);
});

test('NIL and unknown-obligation routes stop until official facts are confirmed',async({page})=>{
  await page.goto('/sw/zana/mwongozo-wa-itax/');await prepare(page);await page.locator('[name="task"]').selectOption('nil');await page.locator('[name="obligation"]').selectOption('pwo-none');await page.locator('[name="noIncomeConfirmed"]').check();await page.locator('[data-itax-workspace] button[type="submit"]').click();await expect(page.locator('[data-stop-reasons]')).toContainText('PIN Without Obligation');await expect(page.locator('[data-official-link]')).toBeHidden();
  await page.locator('[name="obligation"]').selectOption('income-individual');await page.locator('[name="noIncomeConfirmed"]').uncheck();await page.locator('[data-itax-workspace] button[type="submit"]').click();await expect(page.locator('[data-stop-reasons]')).toContainText('hakujathibitishwa');
  await page.locator('[name="noIncomeConfirmed"]').check();await page.locator('[data-itax-workspace] button[type="submit"]').click();await expect(page.locator('[data-official-link]')).toBeVisible();
  await page.locator('[data-action="save"]').click();await page.locator('[name="filingYear"]').fill('2024');await page.locator('[data-action="load"]').click();await expect(page.locator('[name="filingYear"]')).toHaveValue('2025');
});

for(const width of [320,375])test(`Swahili iTax guide reflows at ${width}px, 200% text and both themes`,async({page})=>{
  await page.setViewportSize({width,height:900});for(const scheme of ['light','dark']){await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});await page.goto('/sw/zana/mwongozo-wa-itax/');await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});const size=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));expect(size.scroll).toBeLessThanOrEqual(size.viewport+2);await expect(page.locator('[name="task"]')).toBeVisible();const unnamed=await page.locator('[data-itax-workspace] input:not([type=hidden]),[data-itax-workspace] select,[data-itax-workspace] button').evaluateAll(nodes=>nodes.filter(node=>!node.labels?.length&&!node.getAttribute('aria-label')&&!node.textContent.trim()).length);expect(unnamed).toBe(0);await page.locator('[name="task"]').focus();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement!==document.body)).toBeTruthy();}
});

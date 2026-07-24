const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');
const routes = [
  ['/tools/profit-margin/', 'Profit margin calculator', 'Calculation boundary'],
  ['/fr/tools/marge-beneficiaire/', 'Calculateur de marge bénéficiaire', 'Périmètre du calcul'],
  ['/sw/zana/kikokotoo-margin-ya-faida/', 'Kikokotoo cha margin ya faida', 'Mipaka ya hesabu'],
  ['/ha/kayan-aiki/tazarar-riba/', 'Kalkuletan tazarar riba', 'Iyakar lissafi']
];
async function overflowReport(page) {
  return page.evaluate(() => {
    const limit=document.documentElement.clientWidth,zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    return [...document.querySelectorAll('body *')].map(node=>{const r=node.getBoundingClientRect();return{node:`${node.tagName.toLowerCase()}${node.id?`#${node.id}`:''}${node.classList.length?`.`+[...node.classList].join('.'):''}`,left:r.left/zoom,right:r.right/zoom,scrollWidth:node.scrollWidth};}).filter(x=>!x.node.includes('skip-link')&&(x.right>limit+1||x.left< -1||x.left+x.scrollWidth>limit+1)).slice(0,20);
  });
}
for (const [route,title,boundary] of routes) {
  test(`${route} calculates margins without defaults or stale output`, async ({ page }) => {
    const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
    await page.goto(route);await expect(page.locator('.gnv-hero h1')).toHaveText(title);await expect(page.getByRole('heading',{name:boundary})).toBeVisible();
    await expect(page.locator('#pmRevenue')).toHaveValue('');await expect(page.locator('#pmResult')).not.toHaveClass(/on/);
    await page.locator('#pmUnit').fill('USD');await page.locator('#pmRevenue').fill('150');await page.locator('#pmCogs').fill('100');await page.locator('#pmForm button[type=submit]').click();
    await expect(page.locator('#pmProfit')).toContainText(/USD\s*50(?:\.|,)00/);await expect(page.locator('#pmMargin')).toHaveText('33.33%');await expect(page.locator('#pmMarkup')).toHaveText('50.00%');
    await page.locator('#pmRevenue').fill('');await expect(page.locator('#pmResult')).not.toHaveClass(/on/);await expect(page.locator('#pmProfit')).toHaveText('');
    expect(errors).toEqual([]);
  });
}
test('operating, net, loss and zero-COGS states are explicit', async ({ page }) => {
  await page.goto('/tools/profit-margin/');
  await page.getByRole('button',{name:'Operating margin'}).click();
  await page.locator('#pmRevenue').fill('1000');await page.locator('#pmCogs').fill('400');await page.locator('#pmOpex').fill('300');await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmProfit')).toContainText('300.00');await expect(page.locator('#pmMargin')).toHaveText('30.00%');
  await page.getByRole('button',{name:'Net margin'}).click();
  await page.locator('#pmRevenue').fill('1000');await page.locator('#pmCogs').fill('400');await page.locator('#pmOpex').fill('300');await page.locator('#pmInterest').fill('50');await page.locator('#pmTax').fill('20');await page.locator('#pmOther').fill('30');await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmProfit')).toContainText('200.00');await expect(page.locator('#pmMargin')).toHaveText('20.00%');
  await page.getByRole('button',{name:'Gross margin'}).click();await page.locator('#pmRevenue').fill('100');await page.locator('#pmCogs').fill('140');await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmProfit')).toContainText('-40.00');await expect(page.locator('#pmMargin')).toHaveText('-40.00%');
  await page.locator('#pmCogs').fill('0');await expect(page.locator('#pmMarkup')).toHaveText('N/A');
});
test('profit margin supports mobile, 200% zoom, dark modes and keyboard', async ({ page }) => {
  for(const width of [320,375,768]){await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:width===375?'light':'dark',reducedMotion:'reduce'});await page.goto('/tools/profit-margin/');if(width===320)await page.evaluate(()=>document.documentElement.style.zoom='2');expect(await overflowReport(page),`overflow ${width}`).toEqual([]);}
  await page.evaluate(()=>{document.documentElement.style.zoom='1';document.documentElement.setAttribute('data-theme','dark');});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('body').press('Home');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();
});
test('profit margin exports parseable PDF and CSV', async ({ page }) => {
  await page.goto('/tools/profit-margin/');await page.locator('#pmUnit').fill('USD');await page.locator('#pmRevenue').fill('150');await page.locator('#pmCogs').fill('100');await page.locator('#pmForm button[type=submit]').click();
  let pending=page.waitForEvent('download');await page.locator('#pmPdf').click();let download=await pending;let buffer=fs.readFileSync(await download.path());expect(buffer.subarray(0,5).toString()).toBe('%PDF-');let parsed=await pdfParse(buffer);expect(parsed.text).toContain('Profit margin calculator');expect(parsed.text).toContain('Gross margin: 33.33%');expect(parsed.text).toContain('Markup: 50%');
  pending=page.waitForEvent('download');await page.locator('#pmCsv').click();download=await pending;const csv=fs.readFileSync(await download.path(),'utf8');expect(csv).toContain('"Gross margin","33.33%"');expect(csv).toContain('"Markup","50%"');
});
test('dedicated widget uses the same engine contract', async ({ page }) => {
  await page.goto('/widgets/iframe/financial-profit-margin');await page.locator('#aw-unit').fill('USD');await page.locator('#aw-revenue').fill('150');await page.locator('#aw-cogs').fill('100');await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-res')).toContainText('33.33%');await expect(page.locator('#aw-res')).toContainText('50.00%');
  await page.locator('#aw-cogs').fill('0');await expect(page.locator('#aw-res')).toContainText('N/A');
  await page.locator('#aw-revenue').fill('');await expect(page.locator('#aw-res')).toBeHidden();await expect(page.locator('#aw-status')).toContainText('greater than zero');
});
test('profit margin durable visual proof', async ({ browser }) => {
  const dir=path.resolve('artifacts/day3-profit-margin-20260723');fs.mkdirSync(dir,{recursive:true});
  for(const item of [{width:320,theme:'system-dark'},{width:375,theme:'light'},{width:768,theme:'manual-dark'}]){const context=await browser.newContext({viewport:{width:item.width,height:900},colorScheme:item.theme==='system-dark'?'dark':'light',reducedMotion:'reduce'});const page=await context.newPage();await page.goto('/tools/profit-margin/');if(item.theme==='manual-dark')await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await page.screenshot({path:path.join(dir,`profit-margin-${item.width}-${item.theme}.png`),fullPage:true});await context.close();}
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const routes = [
  '/tools/amount-words-gh/', '/tools/naira-to-words/', '/tools/lobola-calculator/', '/tools/market-days/',
  '/tools/electricity-tariff/ethiopia/', '/tools/water-bill/ethiopia/', '/blog/construction-material-prices-nigeria/',
  '/blog/ghana-cedi-words/', '/fr/blog/frais-orange-money-guide-2026/', '/nigeria/ng-salary-tax'
];
test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    if (window.top === window) localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.setViewportSize({width:390,height:844});
});
for (const width of [320, 390]) test(`ten demand entries render without horizontal overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: route }).toBeLessThanOrEqual(1);
  }
});
for (const ghana of [true, false]) test(`${ghana ? 'Ghana' : 'Naira'} amount wording, invalid input and real clipboard`, async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(ghana ? routes[0] : routes[1]);
  await page.locator('#amount').fill('12,500.75');
  await page.locator('#caseMode').selectOption('title');
  const expected = ghana ? 'Ghana Cedis Twelve Thousand Five Hundred and Pesewas Seventy-Five Only' : 'Twelve Thousand Five Hundred Naira and Seventy-Five Kobo Only';
  const button = page.getByRole('button', { name: ghana ? 'Copy Words' : 'Copy to Clipboard', exact: true });
  await button.focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  await page.locator('#amount').fill('-2');
  await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#amountError')).not.toBeEmpty();
  await page.locator('#amount').fill('');
  await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'false');
});
test('Ethiopia water requires source inputs, calculates independently, reopens TXT and clears stale results', async ({ page }) => {
  await page.goto(routes[5]);
  await page.locator('#calcBtn').click();
  await expect(page.locator('#waterError')).not.toBeEmpty();
  for (const [id,value] of Object.entries({monthlyUsage:'15',householdSize:'4',customRate:'12.5',customFee:'7.25'})) await page.locator('#'+id).fill(value);
  await page.locator('#calcBtn').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#rBill')).toHaveText('ETB 194.75');
  await expect(page.locator('#rPerson')).toHaveText('125.0 L/person');
  const downloaded = page.waitForEvent('download'); await page.locator('#downloadWater').click();
  const text = fs.readFileSync(await (await downloaded).path(), 'utf8');
  expect(text).toContain('ETB 194.75'); expect(text).toContain('15 m³ × ETB 12.5 + ETB 7.25');
  expect(text).toContain('not a verified provider tariff');
  await page.locator('#customFee').fill('-1'); await page.locator('#calcBtn').click();
  await expect(page.locator('#waterError')).not.toBeEmpty();
  await expect(page.locator('#results')).not.toHaveClass(/\bon\b/);
});
test('retired Ethiopia electricity links to custom ETB journey with no automatic tariff claim', async ({ page }) => {
  await page.goto(routes[4]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.getByRole('link', { name: 'Open Electricity Cost & Prepaid Units' }).click();
  await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY);
  await page.locator('#electricityCountry').selectOption('ET');
  await expect(page.locator('#electricityCustomCurrency')).toHaveValue('ETB');
  await expect(page.locator('#electricitySourceTitle')).toHaveText('Custom-rate mode');
  await page.locator('#electricityAmount').fill('1000'); await page.locator('#electricityCustomRate').fill('5');
  await page.locator('#electricityForm button[type="submit"]').click();
  await expect(page.locator('#electricityPrimary')).toHaveText('200 kWh');
  await page.locator('#electricityCustomRate').fill('0'); await page.locator('#electricityForm button[type="submit"]').click();
  await expect(page.locator('#electricityStatus')).toContainText('greater than zero');
});
test('Ghana guide reaches working converter and construction guide reaches quote worksheet', async ({ page }) => {
  await page.goto(routes[7]);
  await page.locator('a[href="/tools/amount-words-gh/"]').first().click();
  await page.locator('#amount').fill('500000');
  await expect(page.locator('#wordsResult')).toContainText('FIVE HUNDRED THOUSAND');
  await page.goto(routes[6]);
  await expect(page.locator('.article-body')).toContainText('no verified current retail price list');
  await page.locator('a[href="/tools/building-materials/"]').first().click();
  for (const [name,value] of Object.entries({currency:'NGN',quantity:'100',unitCost:'10000',fixed:'25000',contingency:'10'})) await page.locator(`[name="${name}"]`).fill(value);
  await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
  await expect(page.locator('body')).toContainText('1,127,500'); // (100 × 10,000 + 25,000) × 1.10
});
test('Lobola arithmetic and saved handoff reopen', async ({ page }) => {
  await page.goto('/tools/lobola-calculator/?country=zw&currency=USD');
  for (const [id,value] of Object.entries({customCattle:'6',cattlePrice:'500',zwCustom:'500',giftValue:'300',ceremonyCost:'200'})) await page.locator('#'+id).fill(value);
  await page.getByRole('button', { name: 'Build my family plan' }).click();
  await expect(page.locator('#rTotal')).toHaveText('$4,400'); // 3,000 cattle + 500 family + 400 preset tokens + 300 gifts + 200 ceremony.
  await page.getByRole('button', {name:'Save on this device'}).click();
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1')).country)).toBe('Zimbabwe');
  await page.goto('/tools/lobola-gift-list/');
  await page.getByRole('button',{name:'Use saved Zimbabwe plan'}).click();
  await expect(page.locator('#statusMsg')).toContainText('Saved calculator context added');
});
test('market-day date, town filter and copied trip brief', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/tools/market-days/');
  await page.locator('#lookupDate').fill('2026-01-05');
  await expect(page.locator('#selectedDayName')).toContainText('Orie');
  await page.locator('#marketSearch').fill('Emene');
  await expect(page.locator('body')).toContainText('Orie Emene');
  await page.locator('#buildTripPlan').click();
  await page.getByRole('button',{name:'Copy trip brief'}).click();
  await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain('Market');
});
test('French Orange Money guide supports entered-quote comparison and reopened JSON', async ({ page }) => {
  await page.goto('/fr/blog/frais-orange-money-guide-2026/');
  await expect(page.locator('.article-body')).toContainText('104 FCFA'); // Official Cameroon formula 10,000 × 1% + 4.
  await page.locator('a[href="/fr/tools/frais-mobile-money/#mm-form"]').first().click();
  for(const [prefix,fee] of [['a','104'],['b','150']]) {
    for(const [field,value] of Object.entries({label:'Synthetic '+prefix,market:'Cameroun',currency:'XAF',amount:'10000',sender:'0',recipient:fee,observed:'2026-09-09T12:00'})) await page.locator(`#mm-${prefix}-${field}`).fill(value);
  }
  await page.locator('#mm-form button[type="submit"]').click();
  await expect(page.locator('#mm-result-list')).toContainText('104');
  await expect(page.locator('#mm-result-list')).toContainText('46');
  const download = page.waitForEvent('download');await page.locator('#mm-json').click();
  const saved=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
  expect(JSON.stringify(saved)).toContain('104');
  await page.locator('#mm-b-currency').fill('USD');await page.locator('#mm-form button[type="submit"]').click();
  await expect(page.locator('#mm-result-list')).not.toContainText('46 XAF');
});
test('Nigeria representative NTA calculation uses independent schedule arithmetic', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax');
  await page.locator('#tabNta').click();
  // Focus first: this page removes grouping separators in its focus handler.
  await page.locator('#grossSalary').focus();
  await page.locator('#grossSalary').fill('3000000');
  await expect(page.locator('#grossSalary')).toHaveValue('3000000');
  for(const id of ['pension','nhf','nhis']) await page.locator(`[data-tog="${id}"]`).click();
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsCard')).toContainText('222,500'); // (3m - (3m - 800k) × .15) / 12.
  await page.locator('#annualRent').focus();await page.locator('#annualRent').fill('1000000');await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsCard')).toContainText('225,000'); // 200k relief, 300k annual tax, 2.7m net.
  await page.locator('#calcSaveName').fill('Synthetic cohort');await page.locator('#calcSaveBtn').click();
  await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');
  await page.reload();
  // Existing saved-list placement is inside the initially hidden result panel.
  await page.locator('#calcBtn').click();
  await page.locator('#calcSavedList').getByRole('button',{name:'Load',exact:true}).click();
  await expect(page.locator('#resultsCard')).toContainText('225,000');
  const downloaded = page.waitForEvent('download');await page.locator('#pdfBtn').click();
  const pdf = await require('pdf-parse')(fs.readFileSync(await (await downloaded).path()));
  expect(pdf.text).toContain('2,700,000');expect(pdf.text).toContain('300,000');
  await page.locator('#grossSalary').focus();await page.locator('#grossSalary').fill('');await page.locator('#calcBtn').click();
  await expect(page.locator('#salaryHint')).not.toBeEmpty();
  await expect(page.locator('#resultsCard')).toBeHidden();
  await page.locator('#grossSalary').fill('3000000');await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#resAmount')).toHaveText('₦225,000');
});
for (const regime of ['pita','nta']) test(`Nigeria ${regime} saved non-default modes round-trip`, async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax');
  await page.locator(regime==='nta'?'#tabNta':'#tabPita').click();
  await page.getByRole('radio',{name:'Net → Gross'}).click();
  await page.locator('#periodMonthly').click();
  await page.locator('#grossSalary').focus();await page.locator('#grossSalary').fill('200000');
  await page.locator('#calcBtn').click();
  await page.locator('.per-btn').getByText('Annual',{exact:true}).click();
  await page.locator('#calcSaveName').fill('Synthetic modes');await page.locator('#calcSaveBtn').click();
  await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');
  const payload=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools-saved-ng-salary-tax'))[0].data);
  expect(payload.inputs).toMatchObject({regime,period:'annual',salaryPeriod:'monthly',calcMode:'net',salaryValue:200000});
  expect(payload.snapshot.regime).toBe(regime);
  await page.reload();await page.locator('#calcBtn').click();
  await page.locator('#calcSavedList').getByRole('button',{name:'Load',exact:true}).click();
  expect(await page.evaluate(()=>({regime:window.REGIME,period:window.PERIOD,salaryPeriod:window.SALARY_PERIOD,calcMode:window.CALC_MODE}))).toEqual({regime,period:'annual',salaryPeriod:'monthly',calcMode:'net'});
  await page.locator('#calcBtn').click();
  expect(await page.evaluate(()=>window.RESULT.regime)).toBe(regime);
  const download=page.waitForEvent('download');await page.locator('#pdfBtn').click();
  const pdf=await require('pdf-parse')(fs.readFileSync(await(await download).path()));
  expect(pdf.text).toContain(regime==='nta'?'NTA':'PITA');
  expect(Math.abs(payload.snapshot.netAnnual - 2400000)).toBeLessThan(1); // Existing reverse solver tolerance, not a new tax oracle.
  expect(pdf.text).toContain(Math.round(payload.snapshot.netAnnual).toLocaleString('en-NG'));
});

'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs/promises');
const route = '/fr/tools/frais-mobile-money/';

test.use({timezoneId:'UTC', trace:'off'});
test.beforeEach(async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent','declined'));
});

async function quotes(page) {
  for (const letter of ['a','b']) {
    const fields = {label:'Devis '+letter.toUpperCase(),market:'Sénégal',currency:'XOF',amount:'10000',sender:letter==='a'?'100':'50',recipient:'0',observed:'2026-09-07T12:00'};
    for (const [field,value] of Object.entries(fields)) await page.locator(`#mm-${letter}-${field}`).fill(value);
  }
}
async function compare(page) {await page.locator('#mm-form button[type=submit]').click();}

test('French results, clipboard and JSON summary retain amount, country and expiry meaning', async ({page}) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(route);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const contrast=await page.evaluate(async()=>await axe.run(document.querySelector('.rm-hero'),{runOnly:['color-contrast']}));
  expect(contrast.violations).toEqual([]);
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedSummary=value;}}}));
  await quotes(page);
  await page.locator('#mm-a-expires').fill('2026-09-09T12:00');
  await compare(page);
  await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
  await expect(page.locator('#mm-result-list')).toContainText('Non expiré');
  await expect(page.locator('#mm-result-list')).toContainText('Expiration non renseignée');
  await expect(page.locator('#mm-result-list')).not.toContainText(/unknown|not-expired|expired/);
  await page.locator('#mm-copy').click();
  await expect(page.locator('#mm-status')).toHaveText('Résumé copié.');
  const summary=await page.evaluate(()=>window.copiedSummary);
  expect(summary).toContain('Sénégal');expect(summary).toContain('Montant de la transaction');expect(summary).toContain('Vérifié le');
  expect(summary).not.toMatch(/unknown|not-expired|expired/);
  const downloadPromise=page.waitForEvent('download');await page.locator('#mm-json').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('comparaison-devis-mobile-money.json');
  const json=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(json.resume).toBe(summary);expect(json.locale).toBe('fr');
  expect(json.result.quotes[0].expiryState).toBe('not-expired'); // Stable machine schema.
  expect(json.result.quotes[1].totalFee).toBe(50);
  await page.locator('#mm-b-expires').fill('2026-09-08T11:00');await compare(page);
  await expect(page.locator('#mm-result-list')).toContainText('Expiré');
  await expect(page.locator('#mm-primary-value')).toHaveText('Aucun devis admissible et comparable.');
  expect(errors).toEqual([]);
});

test('French validation, reset and denied clipboard recover without stale results', async ({page}) => {
  await page.goto(route);await compare(page);
  await expect(page.locator('#mm-error')).toContainText('Renseignez chaque devis');
  await expect(page.locator('#mm-a-label')).toBeFocused();
  await quotes(page);await page.locator('#mm-b-observed').fill('2026-09-09T12:00');await compare(page);
  await expect(page.locator('#mm-error')).toContainText('ne peut pas être dans le futur');
  await page.locator('#mm-b-observed').fill('2026-09-07T12:00');
  await page.locator('#mm-b-expires').fill('2026-09-06T12:00');await compare(page);
  await expect(page.locator('#mm-error')).toContainText('doit suivre la date de vérification');
  await page.locator('#mm-b-expires').fill('');await compare(page);
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));
  await page.locator('#mm-copy').click();await expect(page.locator('#mm-status')).toContainText('La copie a été refusée');
  await page.locator('#mm-third').check();await expect(page.locator('#mm-c-label')).toBeEnabled();
  await page.locator('#mm-form button[type=reset]').click();
  await expect(page.locator('#mm-quote-c')).toBeHidden();await expect(page.locator('#mm-c-label')).toBeDisabled();
  await expect(page.locator('#mm-error')).toHaveText('');
  await quotes(page);await compare(page);await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
});

test('country, currency and transaction comparisons remain independent of French language', async ({page}) => {
  await page.goto(route);await quotes(page);
  await page.locator('#mm-b-market').fill('inconnu');await compare(page);
  await expect(page.locator('#mm-error')).toContainText('Pays non reconnu');
  await expect(page.locator('#mm-b-market')).toHaveValue('inconnu');
  await expect(page.locator('#mm-b-market')).toBeFocused();
  await page.locator('#mm-b-market').fill('SN');await compare(page);
  await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
  await page.locator('#mm-b-market').fill('Mali');await compare(page);
  await expect(page.locator('#mm-error')).toContainText('même pays ou marché');
  await page.locator('#mm-b-market').fill('Sénégal');await page.locator('#mm-b-currency').fill('XAF');await compare(page);
  await expect(page.locator('#mm-primary-value')).toHaveText('Aucun devis admissible et comparable.');
  await page.locator('#mm-b-currency').fill('XOF');await page.locator('#mm-b-type').selectOption('withdraw');await compare(page);
  await expect(page.locator('#mm-primary-value')).toHaveText('Aucun devis admissible et comparable.');
});

test('French tariff errors, source labels and unavailable catalog stay readable', async ({page}) => {
  await page.goto(route);
  await page.locator('#mm-tariff-form button').click();await expect(page.locator('#mm-tariff-status')).toContainText('Saisissez un montant positif');
  await page.locator('#mm-amount').fill('500');await page.locator('#mm-tariff-form button').click();
  await expect(page.locator('#mm-tariff-result')).toContainText('100 UGX');
  await expect(page.locator('#mm-tariff-result')).toContainText('Barème MTN Mobile Money en Ouganda');
  await page.locator('#mm-provider').selectOption('airtel-tanzania');await expect(page.locator('#mm-tariff-result')).toBeEmpty();
  await expect(page.locator('#mm-currency')).toHaveText('TZS');
  await page.route('**/data/fintech/mobile-money-tariffs.json',route=>route.fulfill({status:503,body:''}));
  await page.reload();await expect(page.locator('#mm-tariff-status')).toContainText('catalogue de tarifs vérifiés est indisponible');
  await expect(page.locator('#mm-amount')).toBeDisabled();
  await quotes(page);await compare(page);await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
});

test('French tariff references and form limitation remain readable without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto(baseURL+route);
  // Playwright's text matcher deliberately omits noscript nodes from collected text.
  expect(await page.locator('noscript').textContent()).toContain('Le formulaire nécessite JavaScript');
  await expect(page.locator('noscript')).toBeVisible();
  await expect(page.locator('[data-provider-table]')).toHaveCount(2);
  await expect(page.locator('[data-provider-table]').first()).toContainText('Barème MTN Mobile Money en Ouganda');
  await context.close();
});

for (const article of ['frais-orange-money-guide-2026','mobile-money-fees-africa-compared']) {
  test(`mobile discovery from ${article} reaches the honest French comparison form`,async({page})=>{
    await page.setViewportSize({width:375,height:812});
    await page.goto('/fr/blog/'+article+'/');
    await expect(page.locator('.article-body')).toContainText('MTN en Ouganda et Airtel en Tanzanie');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('.article-body a[href="'+route+'#mm-form"]').first().click();
    await expect(page.locator('#mm-a-label')).toBeVisible();
    await expect(page.locator('#mm-form')).toContainText('résumé en français');
    await quotes(page);await compare(page);await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

for (const [locale,path] of [['en','/tools/mobile-money-fees/'],['sw','/sw/zana/ada-pesa-simu/']]) {
  test(`${locale} keeps its result codes and JSON export contract`,async({page})=>{
    await page.goto(path);await quotes(page);await compare(page);
    await expect(page.locator('#mm-primary-value')).toHaveText('50 XOF');
    await expect(page.locator('#mm-result-list')).toContainText('unknown');
    const promise=page.waitForEvent('download');await page.locator('#mm-json').click();const download=await promise;
    expect(download.suggestedFilename()).toBe('mobile-money-quote-comparison.json');
    const json=JSON.parse(await fs.readFile(await download.path(),'utf8'));
    expect(Object.keys(json)).toEqual(['schemaVersion','methodology','result']);
  });
}

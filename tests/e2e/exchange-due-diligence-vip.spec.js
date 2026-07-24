const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pdf = require('pdf-parse');

async function fill(page, route) {
  await page.goto(route);
  const french = route.startsWith('/fr/');
  const today = new Date().toISOString().slice(0,10);
  await page.fill('#provider-1-name', french ? 'Prestataire Alpha' : 'Provider Alpha');
  await page.fill('#provider-1-country', french ? 'Nigeria' : 'Nigeria');
  await page.fill('#provider-1-date', today);
  await page.fill('#provider-2-name', french ? 'Prestataire Bêta' : 'Provider Beta');
  await page.fill('#provider-2-country', french ? 'Afrique du Sud' : 'South Africa');
  await page.fill('#provider-2-date', today);
  const first = page.locator('[data-evidence-rows]').first().locator('.exchange-evidence-row').first();
  await first.locator('select').selectOption('confirmed');
  await first.locator('input').fill('https://example.com/official');
  await first.locator('textarea').fill(french ? 'Source vérifiée par l’utilisateur.' : 'Source checked by the user.');
  await page.locator('#exchangeWorkbookForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#exchangeWorkbookResult .exchange-summary')).toHaveCount(2);
}

async function geometry(page) {
  const state = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('#exchangeWorkbookForm input,#exchangeWorkbookForm select,#exchangeWorkbookForm textarea,#exchangeWorkbookForm button,.exchange-actions button')];
    const cookie = document.querySelector('#afro-cookie-consent'), assistant = document.querySelector('afro-site-assistant');
    return { overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, targets:controls.every(n=>n.getBoundingClientRect().height>=44), contained:controls.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}), cookieContained:cookie?[...cookie.querySelectorAll('.afro-cc-actions>*')].every(n=>{const a=cookie.getBoundingClientRect(),b=n.getBoundingClientRect();return b.left>=a.left&&b.right<=a.right;}):true, assistantSuppressed:cookie&&assistant?assistant.getBoundingClientRect().width===0:true };
  });
  expect(state).toEqual({overflow:0,targets:true,contained:true,cookieContained:true,assistantSuppressed:true});
}

test('English workbook remains local, mobile-safe and stale-aware', async ({ page }) => {
  await page.setViewportSize({width:375,height:900});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const requests=[]; page.on('request', r=>{if(['fetch','xhr','websocket'].includes(r.resourceType())) requests.push(r.url());});
  await page.goto('/crypto/exchange-ratings/');
  const initialStatuses = await page.locator('[data-evidence-rows] select').evaluateAll(nodes => nodes.map(node => node.value));
  expect(initialStatuses).toEqual(Array(20).fill('not-checked'));
  await fill(page, '/crypto/exchange-ratings/');
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('1 / 10');
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('No trust score');
  expect(requests).toEqual([]);
  expect(JSON.stringify(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}})))).not.toMatch(/Provider Alpha|Provider Beta|example\.com\/official|Nigeria|South Africa/);
  await geometry(page);
  await page.screenshot({path:path.join(os.tmpdir(),'exchange-workbook-375-dark.png'),fullPage:true});
  await page.fill('#provider-1-name','Changed');
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await expect(page.locator('#exchangeWorkbookStatus')).toContainText('changed');
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('prior record is stale');
  await expect(page.locator('#exchangeWorkbookResult')).not.toContainText('Provider Alpha');
  await expect(page.locator('#exchangeWorkbookResult .exchange-summary')).toHaveCount(0);
});

test('French route is native and fail-closed for invalid source URLs', async ({ page }) => {
  await page.setViewportSize({width:768,height:900});
  await fill(page, '/fr/crypto/exchange-ratings/');
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('éléments documentés');
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('Aucun score de confiance');
  await page.locator('[data-evidence-rows]').first().locator('.exchange-evidence-row').first().locator('input').fill('javascript:alert(1)');
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await expect(page.locator('#exchangeWorkbookStatus')).toContainText('URL invalide');
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('Aucun dossier valide');
  await expect(page.locator('#exchangeWorkbookResult .exchange-summary')).toHaveCount(0);
  await geometry(page);
  await page.screenshot({path:path.join(os.tmpdir(),'exchange-workbook-fr-768-light.png'),fullPage:true});
});

test('invalid, future, stale, insecure and credential-bearing evidence fails closed', async ({ page }) => {
  await fill(page, '/crypto/exchange-ratings/');
  const firstSource = page.locator('[data-evidence-rows]').first().locator('.exchange-evidence-row').first().locator('input');
  await firstSource.fill('');
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('No valid record');
  await firstSource.fill('http://example.com/evidence');
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await firstSource.fill('https://user:secret@example.com/evidence');
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await firstSource.fill('https://example.com/evidence');
  await page.fill('#provider-1-date','2999-01-01');
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  await page.locator('#provider-1-date').evaluate(node=>{node.type='text';node.value='2026-02-30';node.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('[data-workbook-export=pdf]')).toBeDisabled();
  const staleDate = new Date(Date.now() - 91*86400000).toISOString().slice(0,10);
  await page.locator('#provider-1-date').evaluate((node,value)=>{node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));}, staleDate);
  await page.locator('#exchangeWorkbookForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('#exchangeWorkbookResult')).toContainText('refresh the sources');
  await expect(page.locator('#exchangeWorkbookResult .exchange-summary').first()).toContainText('0 / 10');
});

test('JSON, text, parser-readable PDF and print exports remain local', async ({ page }) => {
  await fill(page, '/crypto/exchange-ratings/');
  for (const type of ['json','txt']) { const [item]=await Promise.all([page.waitForEvent('download'),page.locator(`[data-workbook-export=${type}]`).evaluate(button=>button.click())]); expect(item.suggestedFilename()).toContain('.'+type); }
  const pending=page.waitForEvent('download'); await page.click('[data-workbook-export=pdf]'); const item=await pending; const buffer=fs.readFileSync(await item.path()); expect(buffer.subarray(0,4).toString()).toBe('%PDF'); const parsed=await pdf(buffer); expect(parsed.text).toContain('Crypto exchange due-diligence record'); expect(parsed.text).toContain('Provider Alpha'); expect(parsed.text).toContain('No trust score');
  await page.evaluate(()=>{window.__printed=false;window.print=()=>{window.__printed=true;};}); await page.click('[data-workbook-export=print]'); expect(await page.evaluate(()=>window.__printed)).toBe(true);
});

test('manual theme choice overrides system preference at 320px', async ({ page }) => {
  await page.setViewportSize({width:320,height:800}); await page.emulateMedia({colorScheme:'light'}); await page.goto('/crypto/exchange-ratings/'); await page.getByRole('button',{name:'Switch to dark mode'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await geometry(page); await page.emulateMedia({colorScheme:'dark'}); await page.getByRole('button',{name:'Switch to light mode'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

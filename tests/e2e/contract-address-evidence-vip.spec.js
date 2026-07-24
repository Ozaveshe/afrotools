const { test, expect } = require('@playwright/test');
const os = require('node:os');
const path = require('node:path');
const ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

async function geometry(page) {
  const state = await page.evaluate(() => {
    const controls=[...document.querySelectorAll('#contractEvidenceForm input,#contractEvidenceForm select,#contractEvidenceForm button,.contract-actions button')];
    const cookie=document.querySelector('#afro-cookie-consent'),assistant=document.querySelector('afro-site-assistant');
    return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,targets:controls.every(n=>n.getBoundingClientRect().height>=44),contained:controls.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}),cookieContained:cookie?[...cookie.querySelectorAll('.afro-cc-actions>*')].every(n=>{const a=cookie.getBoundingClientRect(),b=n.getBoundingClientRect();return b.left>=a.left&&b.right<=a.right}):true,assistantSuppressed:cookie&&assistant?assistant.getBoundingClientRect().width===0:true};
  });
  expect(state).toEqual({overflow:0,targets:true,contained:true,cookieContained:true,assistantSuppressed:true});
}

test('invalid and empty-registry states are neutral, local and mobile-safe', async ({ page }) => {
  await page.setViewportSize({width:375,height:860}); await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  const requests=[]; page.on('request',r=>{if(['fetch','xhr','websocket'].includes(r.resourceType()))requests.push(r.url())});
  await page.goto('/crypto/contract-scanner/');
  await page.fill('#contractAddress','0x1234'); await page.click('#scanBtn');
  await expect(page.locator('#resultsContent')).toContainText('exactly 40 hexadecimal');
  await page.fill('#contractAddress',ROUTER); await page.click('#scanBtn');
  await expect(page.locator('#resultsContent')).toContainText('No exact reviewed record');
  await expect(page.locator('#resultsContent')).toContainText('does not prove safety');
  await expect(page.locator('#resultsContent')).not.toContainText(/scam|fraud|high risk/i);
  await expect(page.locator('.contract-explorer')).toHaveAttribute('href',new RegExp('^https://etherscan\\.io/address/'));
  expect(requests).toEqual(['http://127.0.0.1:4173/data/crypto/scam-reports.json']);
  expect(requests.join(' ')).not.toContain(ROUTER);
  expect(JSON.stringify(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}})))).not.toContain(ROUTER);
  await geometry(page); await page.screenshot({path:path.join(os.tmpdir(),'contract-address-evidence-375-dark.png'),fullPage:true});
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('#downloadContractEvidence')]);
  expect(download.suggestedFilename()).toBe('contract-address-evidence.txt');
});

test('selected chain controls the sole explorer link and stale results clear', async ({ page }) => {
  await page.goto('/crypto/contract-scanner/');
  await page.selectOption('#networkSelect','bsc'); await page.fill('#contractAddress',ROUTER); await page.click('#scanBtn');
  await expect(page.locator('.contract-explorer')).toHaveCount(1);
  await expect(page.locator('.contract-explorer')).toHaveAttribute('href',new RegExp('^https://bscscan\\.com/address/'));
  await expect(page.locator('#resultsContent')).not.toContainText(/Etherscan|PolygonScan/);
  await page.fill('#contractAddress','0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
  await expect(page.locator('#downloadContractEvidence')).toBeDisabled();
  await expect(page.locator('#resultsContent')).toContainText('Inputs changed');
});

test('registry load failure is explicit and makes no no-record claim', async ({ page }) => {
  await page.route('**/data/crypto/scam-reports.json',route=>route.abort());
  await page.goto('/crypto/contract-scanner/');
  await expect(page.locator('#registryStatus')).toContainText('Registry unavailable');
  await page.fill('#contractAddress',ROUTER); await page.click('#scanBtn');
  await expect(page.locator('#resultsContent')).toContainText('Record lookup unavailable');
  await expect(page.locator('#resultsContent')).not.toContainText('No exact reviewed record');
});

test('safe cited fixture is exact-match only and escaped in English and French', async ({ page }) => {
  const fixture={schemaVersion:2,registryType:'curated-contract-address-evidence',reviewedAt:'2026-07-23',provenance:'Reviewed browser test fixture.',records:[{chain:'polygon',address:ROUTER,title:'<img src=x onerror=alert(1)>',summary:'<script>window.pwned=1</script>',sourceLabel:'Reviewed source',sourcePublisher:'Example authority',sourceUrl:'https://example.org/notice',reviewedAt:'2026-07-23',evidenceStatus:'reviewed-record',confidence:'limited'}]};
  await page.route('**/data/crypto/scam-reports.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  await page.setViewportSize({width:768,height:900}); await page.goto('/fr/crypto/contract-scanner/');
  await expect(page.locator('html')).toHaveAttribute('lang','fr'); await expect(page.locator('iframe')).toHaveCount(0);
  await page.selectOption('#networkSelect','polygon'); await page.fill('#contractAddress',ROUTER.toLowerCase()); await page.click('#scanBtn');
  await expect(page.locator('#resultsContent')).toContainText('Enregistrement exact révisé trouvé');
  await expect(page.locator('.contract-record')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.contract-record img,.contract-record script')).toHaveCount(0);
  expect(await page.evaluate(()=>window.pwned)).toBeUndefined();
  await expect(page.locator('.contract-record a')).toHaveAttribute('href','https://example.org/notice');
  await expect(page.locator('.contract-explorer').last()).toHaveAttribute('href',new RegExp('^https://polygonscan\\.com/address/'));
  await geometry(page); await page.screenshot({path:path.join(os.tmpdir(),'contract-address-evidence-fr-768-light.png'),fullPage:true});
});

test('manual theme choice overrides system preference at 320px', async ({ page }) => {
  await page.setViewportSize({width:320,height:800}); await page.emulateMedia({colorScheme:'light'}); await page.goto('/crypto/contract-scanner/');
  await page.getByRole('button',{name:'Switch to dark mode'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await geometry(page);
  await page.emulateMedia({colorScheme:'dark'}); await page.getByRole('button',{name:'Switch to light mode'}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

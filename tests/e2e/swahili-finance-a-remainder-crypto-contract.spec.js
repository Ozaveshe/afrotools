const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const route = '/sw/zana/ukaguzi-ushahidi-anwani-mkataba/';

async function open(page, context, width = 375) {
  await page.setViewportSize({ width, height: 860 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  const telemetry = { errors: [], data: [], bodies: [] };
  page.on('console', (m) => { if (m.type() === 'error') telemetry.errors.push(m.text()); });
  page.on('pageerror', (e) => telemetry.errors.push(e.message));
  page.on('request', (r) => {
    if (['fetch', 'xhr', 'websocket'].includes(r.resourceType())) telemetry.data.push(r.url());
    if (r.postData()) telemetry.bodies.push(r.postData());
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  return telemetry;
}

async function geometry(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const controls = page.locator('#contractEvidenceForm input,#contractEvidenceForm select,#contractEvidenceForm button,.contract-actions button');
  for (let i = 0; i < await controls.count(); i += 1) expect((await controls.nth(i).boundingBox()).height).toBeGreaterThanOrEqual(44);
}

test('invalid, neutral exact-record lookup, stale state and TXT reopen are native and private', async ({ page, context }) => {
  const telemetry = await open(page, context);
  await expect(page.locator('#registryStatus')).toContainText('rekodi 0');
  await expect(page.locator('#registryStatus')).toContainText('2026-07-23');
  await page.locator('#contractAddress').fill('0x1234');
  await page.locator('#scanBtn').click();
  await expect(page.locator('#resultsContent')).toContainText('40 hasa');
  await page.locator('#contractAddress').fill(ROUTER);
  await page.locator('#scanBtn').click();
  await expect(page.locator('#resultsContent')).toContainText('Hakuna rekodi sahihi iliyokaguliwa');
  await expect(page.locator('#resultsContent')).toContainText('haithibitishi usalama');
  await expect(page.locator('#resultsContent')).not.toContainText(/scam|fraud|high risk/i);
  await expect(page.locator('.contract-explorer')).toHaveAttribute('href', /^https:\/\/etherscan\.io\/address\//);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadContractEvidence').click()]);
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Rekodi ya ndani ya ushahidi wa anwani ya mkataba');
  expect(text).toContain(ROUTER);
  expect(text).toContain('haithibitishi usalama');
  await page.locator('#contractAddress').fill('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
  await expect(page.locator('#downloadContractEvidence')).toBeDisabled();
  await expect(page.locator('#resultsContent')).toContainText('Maingizo yamebadilika');
  const network = JSON.stringify(telemetry);
  expect(network).not.toContain(ROUTER);
  expect(network).not.toContain('deadbeef');
  expect(telemetry.errors).toEqual([]);
});

test('registry failure and reviewed fixture stay fail-closed and safe-DOM', async ({ page, context }) => {
  await page.route('**/data/crypto/scam-reports.json', (r) => r.abort());
  await open(page, context);
  await expect(page.locator('#registryStatus')).toContainText('Sajili haipatikani');
  await page.locator('#contractAddress').fill(ROUTER); await page.locator('#scanBtn').click();
  await expect(page.locator('#resultsContent')).toContainText('Utafutaji wa rekodi haupatikani');
  await expect(page.locator('#resultsContent')).not.toContainText('Hakuna rekodi sahihi');
});

test('exact reviewed fixture is escaped and selected chain owns explorer', async ({ page, context }) => {
  const fixture={schemaVersion:2,registryType:'curated-contract-address-evidence',reviewedAt:'2026-07-23',provenance:'Browser fixture.',records:[{chain:'polygon',address:ROUTER,title:'<img src=x onerror=alert(1)>',summary:'<script>window.pwned=1</script>',sourceLabel:'Chanzo rasmi',sourcePublisher:'Mamlaka ya mfano',sourceUrl:'https://example.org/notice',reviewedAt:'2026-07-23',evidenceStatus:'reviewed-record',confidence:'limited'}]};
  await page.route('**/data/crypto/scam-reports.json', (r) => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(fixture) }));
  await open(page, context, 768);
  await page.locator('#networkSelect').selectOption('polygon'); await page.locator('#contractAddress').fill(ROUTER); await page.locator('#scanBtn').click();
  await expect(page.locator('#resultsContent')).toContainText('Rekodi sahihi iliyokaguliwa imepatikana');
  await expect(page.locator('.contract-record')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.contract-record img,.contract-record script')).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
  await expect(page.locator('.contract-explorer').last()).toHaveAttribute('href', /^https:\/\/polygonscan\.com\/address\//);
});

for (const width of [320, 375]) test(`${width}px dark/reduced-motion keyboard surface`, async ({ page, context }) => {
  await page.emulateMedia({ colorScheme:'dark', reducedMotion:'reduce' }); await open(page, context, width); await geometry(page);
  await page.locator('#networkSelect').focus(); await expect(page.locator('#networkSelect')).toBeFocused();
});

test('200% reflow, metadata, reciprocal hreflang and artwork', async ({ page, context }) => {
  await open(page, context, 640); await page.evaluate(() => { document.documentElement.style.zoom='2'; }); await geometry(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://afrotools.com/sw/zana/ukaguzi-ushahidi-anwani-mkataba/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content','https://afrotools.com/sw/zana/ukaguzi-ushahidi-anwani-mkataba/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href','https://afrotools.com/crypto/contract-scanner/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href','https://afrotools.com/fr/crypto/contract-scanner/');
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents(); expect(JSON.parse(schemas[0]).inLanguage).toBe('sw');
  const art=await page.request.get('/assets/img/tools/crypto-contract.webp'); expect(art.status()).toBe(200); expect((await art.body()).length).toBeGreaterThan(1000);
});

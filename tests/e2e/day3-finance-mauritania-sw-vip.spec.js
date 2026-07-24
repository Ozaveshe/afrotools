const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const route = '/sw/mauritania/kikokotoo-kodi-mshahara/';

async function calculate(page, gross) {
  await page.locator('#salaryInput').fill(String(gross));
  await page.locator('.calc-btn').click();
  return page.evaluate(() => ({ ...window.lastResult }));
}

test('Swahili Mauritania ITS uses the reviewed DGI and CNSS formula', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('#salaryInput')).toHaveValue('');
  await expect(page.locator('#resultsCard')).toBeHidden();

  expect(await calculate(page, 6000)).toMatchObject({ cnss: 60, roundedTaxable: 0, tax: 0, net: 5940 });
  expect(await calculate(page, 15000)).toMatchObject({ cnss: 150, roundedTaxable: 8850, tax: 1327.5, net: 13522.5, employerCharge: 2250, employerCost: 17250 });
  expect(await calculate(page, 15150)).toMatchObject({ cnss: 150, roundedTaxable: 9000, tax: 1350, net: 13650 });
  expect(await calculate(page, 27150)).toMatchObject({ cnss: 150, roundedTaxable: 21000, tax: 4350, net: 22650 });
  expect(await calculate(page, 27160)).toMatchObject({ cnss: 150, roundedTaxable: 21010, tax: 4354, net: 22656 });
  expect(await calculate(page, 500000)).toMatchObject({ cnss: 150, roundedTaxable: 493850, tax: 193490, net: 306360, employerCharge: 2250, employerCost: 502250 });

  const toggle = page.locator('#tog-cnss');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await calculate(page, 15150)).toMatchObject({ cnss: 0, roundedTaxable: 9150, tax: 1387.5, net: 13762.5 });

  await page.locator('#salaryInput').fill('-1');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#resultsCard')).toBeHidden();
  await expect(page.locator('#calcStatus')).toContainText('zaidi ya sifuri');
  expect(await page.evaluate(() => window.lastResult)).toBeNull();
});

test('Swahili Mauritania exports locally and shares only the canonical route', async ({ page }) => {
  const nonGetRequests = [];
  page.on('request', request => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.goto(route);
  await calculate(page, 15000);

  const pdfPayload = await page.evaluate(async () => {
    let payload;
    const original = window.AfroTools.pdf;
    window.AfroTools.pdf = { generate: async value => { payload = value; } };
    await window.openPdfModal();
    window.AfroTools.pdf = original;
    return payload;
  });
  expect(pdfPayload.skipGate).toBe(true);
  expect(JSON.stringify(pdfPayload)).toContain('MRU 13,522.5');

  const generatedPdf = await page.evaluate(async () => {
    const result = new Promise(resolve => {
      window.addEventListener('afro-pdf-generated', async event => {
        const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
        resolve({ fileName: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
      }, { once: true });
    });
    await window.openPdfModal();
    return result;
  });
  expect(generatedPdf.fileName).toMatch(/mauritania.*\.pdf/i);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  const shared = await page.evaluate(async () => {
    let payload;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async value => { payload = value; } });
    window.shareCalc();
    await new Promise(resolve => setTimeout(resolve, 0));
    return payload;
  });
  expect(shared.url).toBe('https://afrotools.com/sw/mauritania/kikokotoo-kodi-mshahara/');
  expect(JSON.stringify(shared)).not.toContain('15000');
  expect(shared.url).not.toContain('?');
  expect(nonGetRequests).toEqual([]);
});

test('Swahili Mauritania remains mobile, dark and accessible', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto(route);
  await calculate(page, 15000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#calcStatus')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#resultsCard')).toHaveAttribute('aria-live', 'polite');

  const bandToggle = page.locator('#bandsCard > button');
  await bandToggle.focus();
  await page.keyboard.press('Enter');
  await expect(bandToggle).toHaveAttribute('aria-expanded', 'false');
  const colors = await page.locator('#r-net').evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(document.body).backgroundColor }));
  expect(colors.foreground).not.toBe(colors.background);
  expect(consoleErrors).toEqual([]);
});

test('Swahili Mauritania source has no stale bands, false schema or network AI', async () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'sw/mauritania/kikokotoo-kodi-mshahara/index.html'), 'utf8');
  expect(source).not.toContain('FAQPage');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toMatch(/\bfetch\s*\(/);
  expect(source).not.toContain('30%');
  expect(source).not.toContain('USD 1');
  expect(source).toContain('MRU 6,000');
  expect(source).toContain('MRU 15,000');
  expect(source).toContain('https://impots.gov.mr/DGI/files/CGI-Fr-2023.pdf');
  expect(source).toContain('22 Julai 2026');
});

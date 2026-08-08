const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const engine = require('../../assets/js/engines/crypto-mining-margin.js');

const values = {
  grossCoinPerDay: 2.123456,
  coinPrice: 123.4567,
  powerWatts: 987.65,
  uptimeHours: 11.5,
  electricityRate: 3.21,
  poolFeePercent: 4.56,
  otherDailyCost: 7.89,
  hardwareCost: 456.78,
  periodDays: 30,
};

function parseCsv(content) {
  const rows = content.trim().split(/\r?\n/).map(line => line.split(','));
  return Object.fromEntries(rows.slice(1).map(row => [row[0], { daily: row[1], period: row[2] }]));
}

test('native Swahili crypto mining worksheet matches its engine and parses every advertised export', async ({ page }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push({ url: request.url(), body: request.postData() || '' }));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/sw/zana/kikokotoo-margin-uchimbaji-crypto/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-margin-uchimbaji-crypto/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/crypto/mining-calculator/');
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/crypto/mining-calculator/');
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-margin-uchimbaji-crypto/');
  await expect(page.locator('iframe')).toHaveCount(0);

  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  const lightCard = await page.locator('.mining-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const darkCard = await page.locator('.mining-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
  expect(darkCard).not.toBe(lightCard);

  const unnamed = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content input, #main-content select, #main-content button')).filter(control => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.closest('label') && !control.getAttribute('aria-label') && !control.textContent.trim();
  }).map(control => control.id || control.tagName));
  expect(unnamed).toEqual([]);
  await page.locator('#currencyCode').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#coinLabel')).toBeFocused();

  await page.locator('#uptimeHours').fill('25');
  await page.locator('.mining-submit').click();
  await expect(page.locator('#miningMarginStatus')).toContainText('Kagua sehemu');
  await expect(page.locator('[data-mining-export="pdf"]')).toBeDisabled();

  await page.locator('#currencyCode').fill('XTS');
  await page.locator('#coinLabel').fill('TSTCOIN');
  for (const [id, value] of Object.entries(values)) {
    if (id === 'periodDays') await page.locator(`#${id}`).selectOption(String(value));
    else await page.locator(`#${id}`).fill(String(value));
  }
  await page.locator('.mining-submit').click();
  const expected = engine.calculate(values);
  await expect(page.locator('#miningMarginResults')).toHaveAttribute('data-result-settled', 'true');
  await expect(page.locator('#miningMarginResults')).toContainText('XTS');
  await expect(page.locator('#miningMarginResults')).toContainText('205.85');
  await expect(page.locator('#miningMarginResults')).toContainText('78.52%');
  await expect(page.locator('#miningMarginResults')).toBeFocused();

  const csvPromise = page.waitForEvent('download');
  await page.locator('[data-mining-export="csv"]').click();
  const csvDownload = await csvPromise;
  expect(csvDownload.suggestedFilename()).toBe('crypto-mining-margin.csv');
  const csv = parseCsv(fs.readFileSync(await csvDownload.path(), 'utf8'));
  expect(Number(csv.net_result.daily)).toBe(expected.netResultDaily);
  expect(Number(csv.net_result.period)).toBe(expected.netResultPeriod);
  expect(Number(csv.hardware_payback_days.daily)).toBe(expected.hardwarePaybackDays);

  const jsonPromise = page.waitForEvent('download');
  await page.locator('[data-mining-export="json"]').click();
  const jsonDownload = await jsonPromise;
  const json = JSON.parse(fs.readFileSync(await jsonDownload.path(), 'utf8'));
  expect(json.language).toBe('sw');
  expect(json.currency).toBe('XTS');
  expect(json.coinLabel).toBe('TSTCOIN');
  expect(json.results).toEqual(expected);
  expect(json.method).toContain('huingizwa na mtumiaji');

  const pdfPromise = page.waitForEvent('download');
  await page.locator('[data-mining-export="pdf"]').click();
  const pdfDownload = await pdfPromise;
  expect(pdfDownload.suggestedFilename()).toBe('crypto-mining-margin.pdf');
  const pdfText = (await pdfParse(fs.readFileSync(await pdfDownload.path()))).text;
  expect(pdfText).toContain('Margin ya Uendeshaji wa Uchimbaji wa Crypto');
  expect(pdfText).toContain('XTS');
  expect(pdfText).toContain('205.85');

  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await page.locator('[data-mining-export="print"]').click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  await page.emulateMedia({ media: 'print', colorScheme: 'dark', reducedMotion: 'reduce' });
  const printText = (await pdfParse(await page.pdf({ format: 'A4', printBackground: true }))).text;
  expect(printText).toContain('Matokeo');
  expect(printText).toContain('205.85');
  await page.emulateMedia({ media: 'screen', colorScheme: 'dark', reducedMotion: 'reduce' });

  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const reflow = await page.evaluate(() => ({
    delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: Array.from(document.body.querySelectorAll('*')).filter(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 &&
        (box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5);
    }).map(element => ({ tag: element.tagName, id: element.id, className: String(element.className || '') })).slice(0, 20),
  }));
  expect(reflow.delta, JSON.stringify(reflow.offenders)).toBeLessThanOrEqual(1);
  expect(reflow.offenders).toEqual([]);

  await page.locator('[data-mining-reset]').click();
  await expect(page.locator('#currencyCode')).toHaveValue('KES');
  await expect(page.locator('#grossCoinPerDay')).toHaveValue('0.00005');
  await expect(page.locator('#currencyCode')).toBeFocused();
  await expect(page.locator('[data-mining-export="csv"]')).toBeDisabled();
  await expect(page.locator('#miningMarginStatus')).toContainText('imefutwa');

  for (const privateValue of ['2.123456', '123.4567', '987.65', '456.78', 'TSTCOIN']) {
    expect(requests.filter(request => `${request.url}\n${request.body}`.includes(privateValue))).toEqual([]);
  }
  expect(errors.filter(message => !/favicon|ERR_ABORTED|Failed to load resource/i.test(message))).toEqual([]);
});

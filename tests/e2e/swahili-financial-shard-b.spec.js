'use strict';

const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');
const nigeriaCgt = require('../../assets/js/engines/ng-cgt.js');
const nigeriaCit = require('../../assets/js/engines/ng-cit.js');
const nigeriaWht = require('../../assets/js/engines/ng-wht.js');
const southAfricaCgt = require('../../assets/js/engines/za-cgt.js');
const southAfricaDividendTax = require('../../assets/js/engines/za-dividend-tax.js');
const southAfricaGepf = require('../../engines/src/za-gepf-engine.js');
const southAfricaTransferDuty = require('../../engines/src/za-transfer-duty-engine.js');
const southAfricaUif = require('../../engines/src/za-uif-engine.js');

const routes = [
  ['/sw/liberia/kikokotoo-kodi-mshahara', 'lr-paye'],
  ['/sw/mauritania/kikokotoo-kodi-mshahara', 'mr-paye'],
  ['/sw/zana/microfinance-riba-tambarare-dhidi-ya-salio', 'microfinance-calc'],
  ['/sw/zana/uwezo-wa-mkopo-wa-nyumba', 'mortgage-affordability'],
  ['/sw/zana/kikokotoo-mkopo-wa-nyumba', 'mortgage-calculator'],
  ['/sw/zana/kizalishaji-payslip', 'payslip-generator'],
  ['/sw/zana/makadirio-ya-pensheni', 'pension-proj'],
  ['/sw/zana/faida-ya-uwekezaji-wa-nyumba', 'property-roi'],
  ['/sw/zana/gharama-za-uhamisho-wa-mali', 'property-transfer-cost'],
  ['/sw/zana/kukodi-dhidi-ya-kununua', 'rent-vs-buy'],
  ['/sw/zana/mpango-wa-kustaafu-mapema', 'retirement-planner'],
  ['/sw/zana/nauli-za-ruti', 'route-fares'],
  ['/sw/zana/kilinganisha-mishahara', 'salary-compare'],
  ['/sw/zana/daftari-la-ushahidi-wa-mishahara', 'salary-intelligence'],
  ['/sw/zana/kikokotoo-cgt-nigeria', 'ng-cgt'],
  ['/sw/zana/kikokotoo-cit-nigeria', 'ng-cit'],
  ['/sw/zana/kikokotoo-wht-nigeria', 'ng-wht'],
  ['/sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada', 'side-hustle-tax'],
  ['/sw/somalia/kikokotoo-kodi-mshahara', 'so-paye'],
  ['/sw/south-sudan/kikokotoo-kodi-mshahara', 'ss-paye'],
  ['/sw/sao-tome/kikokotoo-kodi-mshahara', 'st-paye'],
  ['/sw/zana/bajeti-ya-gharama-za-wafanyakazi', 'staff-cost'],
  ['/sw/zana/thamani-ya-startup', 'startup-valuation'],
  ['/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi', 'student-loan'],
  ['/sw/togo/kikokotoo-kodi-mshahara', 'tg-paye'],
  ['/sw/zana/ulinganisho-wa-bei-za-uhamisho', 'transfer-pricing'],
  ['/sw/zana/kikokotoo-cgt-afrika-kusini', 'za-cgt'],
  ['/sw/zana/kikokotoo-kodi-gawio-afrika-kusini', 'za-dividend-tax'],
  ['/sw/zana/kikokotoo-gepf-afrika-kusini', 'za-gepf'],
  ['/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini', 'za-transfer-duty'],
  ['/sw/zana/kikokotoo-uif-afrika-kusini', 'za-uif'],
];

test('ng-cgt delegates to the English engine and keeps its TXT estimate private', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() }); });
  await page.addInitScript(() => { window.__copiedText = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } }); });
  await page.goto('/sw/zana/kikokotoo-cgt-nigeria/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Kokotoa makadirio ya faida' }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Thibitisha upeo');

  const input = { scopeConfirmed: true, sellerType: 'individual', assetType: 'general', proceeds: 20000000, acquisitionCost: 10000000, disposalCosts: 1000000, otherChargeableIncome: 0 };
  const expected = nigeriaCgt.calculate(input);
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya faida' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-tax]')).toHaveAttribute('data-amount', String(expected.tax));
  await expect(page.locator('[data-gain]')).toContainText(expected.rawGain.toLocaleString('sw-NG'));
  await expect(page.locator('[data-taxable]')).toContainText(expected.taxableGain.toLocaleString('sw-NG'));
  await expect(page.locator('[data-rate]')).toHaveText('Viwango vya hatua 0–25%');

  await page.locator('[data-copy]').click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Makadirio ya AfroTools ya faida inayotozwa kodi Nigeria');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-cgt-nigeria.txt');
  const txt = fs.readFileSync(await download.path(), 'utf8');
  expect(txt).toContain(`Ongezeko la kodi lililokadiriwa: NGN ${expected.tax.toLocaleString('sw-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  expect(txt).toContain('Makadirio ya kupanga tu');
  expect(txt).not.toMatch(/\b(?:Estimated|Planning estimate|Rate treatment|Relief)\b/);

  await page.locator('[name="proceeds"]').fill('21000000');
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Data imebadilika');
  await page.locator('[name="proceeds"]').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya faida' }).click();
  await expect(page.locator('[data-error]')).toContainText('namba chanya');
  await expect(page.locator('[name="proceeds"]')).toBeFocused();
  await expect(page.locator('[data-result]')).toBeHidden();

  await page.getByRole('button', { name: 'Futa data' }).click();
  await expect(page.locator('[name="proceeds"]')).toHaveValue('20000000');
  await expect(page.locator('[name="scopeConfirmed"]')).not.toBeChecked();
  await expect(page.locator('[data-status]')).toContainText('Data na matokeo yamefutwa');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /cgt|capital|gain|tax/i.test(key)))).toEqual([]);
  expect(writes).toEqual([]);
});

test('ng-cit delegates to the reviewed English engine and reopens its private TXT estimate', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__copiedText = value; } },
    });
  });
  await page.goto('/sw/zana/kikokotoo-cit-nigeria/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Kokotoa makadirio ya CIT' }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Thibitisha upeo');

  const input = {
    turnover: 80000000,
    fixedAssets: 200000000,
    totalProfits: 7000000,
    assessableProfits: 10000000,
    professionalServices: false,
    mneGroup: false,
    scopeConfirmed: true,
  };
  const expected = nigeriaCit.calculate(input);
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya CIT' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-total]')).toHaveAttribute('data-amount', String(expected.total));
  await expect(page.locator('[data-classification]')).toHaveText('Kampuni nyingine');
  await expect(page.locator('[data-cit]')).toContainText('30%');
  await expect(page.locator('[data-levy]')).toContainText('4%');
  await expect(page.locator('[data-cit-base]')).toContainText(expected.totalProfits.toLocaleString('sw-NG'));
  await expect(page.locator('[data-levy-base]')).toContainText(expected.assessableProfits.toLocaleString('sw-NG'));

  await page.locator('[data-copy]').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kupanga CIT ya Nigeria ya AfroTools');
  expect(copied).toContain('Nigeria Tax Act 2025 (kuanzia 1 Januari 2026)');
  expect(copied).not.toContain('Planning estimate only');

  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-cit-nigeria.txt');
  const txt = fs.readFileSync(await download.path(), 'utf8');
  expect(txt).toContain('Jumla ya kodi iliyokadiriwa');
  expect(txt).toContain('Makadirio ya kupanga tu');
  expect(txt).toContain('Development levy');
  expect(txt).not.toContain('Planning estimate only');

  await page.locator('[name="turnover"]').fill('90000000');
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-export-status]')).toContainText('Data imebadilika');
  await page.locator('[name="totalProfits"]').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya CIT' }).click();
  await expect(page.locator('[data-error]')).toContainText('namba chanya');
  await expect(page.locator('[name="totalProfits"]')).toBeFocused();
  await expect(page.locator('[data-result]')).toBeHidden();

  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('[name="turnover"]')).toHaveValue('80000000');
  await expect(page.locator('[name="totalProfits"]')).toHaveValue('7000000');
  await expect(page.locator('[name="scopeConfirmed"]')).not.toBeChecked();
  await expect(page.locator('[data-export-status]')).toContainText('yamerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /cit|company|profit|tax/i.test(key)))).toEqual([]);
  expect(writes).toEqual([]);
});

test('ng-wht delegates to the reviewed engine and reopens every local advertised export', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:5000000|250000|4750000)/.test(body)) writes.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    window.__printed = false;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__copiedText = value; } },
    });
    window.print = () => { window.__printed = true; };
  });
  await page.goto('/sw/zana/kikokotoo-wht-nigeria/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Kokotoa makadirio ya WHT' }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Thibitisha');

  const input = {
    transactionType: 'professional', recipientClass: 'corporate', residency: 'resident',
    grossAmount: 5000000, transactionDate: '2026-08-08', taxIdAvailable: true,
    treatment: 'schedule', documentationConfirmed: false, treatyRatePercent: 7.5, scopeConfirmed: true,
  };
  const expected = nigeriaWht.calculate(input);
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya WHT' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-rate]')).toHaveText(`${expected.appliedRatePercent.toFixed(2)}%`);
  await expect(page.locator('[data-deduction]')).toContainText('250,000');
  await expect(page.locator('[data-net]')).toContainText('4,750,000');

  await page.locator('[data-copy]').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kupanga WHT ya Nigeria ya AfroTools');
  expect(copied).toContain('Kiasi kinachokadiriwa kukatwa');
  expect(copied).not.toContain('Planning estimate only');

  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-wht-nigeria.txt');
  const txt = fs.readFileSync(await download.path(), 'utf8');
  expect(txt).toContain('NGN 250,000.00');
  expect(txt).toContain('NGN 4,750,000.00');
  expect(txt).toContain('Makadirio ya kupanga tu');

  await page.locator('[data-print]').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const parsed = await pdfParse(pdf);
  expect(parsed.text).toContain('Kikokotoo cha kodi ya zuio ya Nigeria');
  expect(parsed.text).toContain('Kiasi kinachokadiriwa kukatwa');

  await page.locator('[name="grossAmount"]').fill('6000000');
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Data imebadilika');
  await page.locator('[name="grossAmount"]').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya WHT' }).click();
  await expect(page.locator('[name="grossAmount"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Kagua kiasi');

  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('[name="grossAmount"]')).toHaveValue('5000000');
  await expect(page.locator('[name="scopeConfirmed"]')).not.toBeChecked();
  await expect(page.locator('[data-status]')).toContainText('yamerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /wht|tax|payment|recipient/i.test(key)))).toEqual([]);
  expect(writes).toEqual([]);
});

test('za-cgt delegates to the SARS 2027 engine and reopens every advertised local export', async ({ page }) => {
  const sensitiveWrites = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:2500000|1500000|101816)/.test(body)) sensitiveWrites.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/kikokotoo-cgt-afrika-kusini/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Kokotoa makadirio ya CGT' }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Thibitisha upeo');

  const expected = southAfricaCgt.calculate({
    taxpayerType: 'individual', disposalDate: '2026-08-08', assetType: 'general', proceeds: 2500000,
    acquisitionCost: 1500000, acquisitionCosts: 0, improvementCosts: 200000, disposalCosts: 50000,
    otherCapitalGains: 0, currentCapitalLosses: 0, assessedCapitalLoss: 0, otherTaxableIncome: 500000,
    residenceEligible: false, qualifyingResidencePercent: 100, ownershipPercent: 100, scopeConfirmed: true,
  });
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya CGT' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-tax]')).toHaveText('ZAR\u00a0101,816.00');
  await expect(page.locator('[data-taxable]')).toHaveText('ZAR\u00a0280,000.00');
  expect(expected.tax).toBe(101816);

  await page.locator('[data-copy]').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kupanga ya CGT ya Afrika Kusini ya AfroTools');
  expect(copied).toContain('Makadirio ya ongezeko la kodi ya kawaida');
  expect(copied).not.toContain('Planning estimate');

  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-cgt-afrika-kusini-2027.txt');
  const txt = fs.readFileSync(await download.path(), 'utf8');
  expect(txt).toContain('ZAR\u00a0101,816.00');
  expect(txt).toContain('ZAR\u00a0280,000.00');
  expect(txt).toContain('Si fomu ya SARS');
  await expect(page.getByText(/PDF haitolewi/)).toBeVisible();
  await expect(page.getByRole('button', { name: /PDF/i })).toHaveCount(0);

  await page.locator('[name="proceeds"]').fill('2600000');
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Data imebadilika');
  await page.locator('[name="proceeds"]').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya CGT' }).click();
  await expect(page.locator('[name="proceeds"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('kila kiasi');

  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('[name="proceeds"]')).toHaveValue('2500000');
  await expect(page.locator('[name="scopeConfirmed"]')).not.toBeChecked();
  await expect(page.locator('[data-status]')).toContainText('imerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /cgt|capital|gain|tax|proceeds/i.test(key)))).toEqual([]);
  expect(sensitiveWrites).toEqual([]);
});

test('za-dividend-tax delegates to the SARS engine and reopens every advertised local export', async ({ page }) => {
  const sensitiveWrites = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:100000|7500|20000)/.test(body)) sensitiveWrites.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    window.__printed = false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
    window.print = () => { window.__printed = true; };
  });
  await page.goto('/sw/zana/kikokotoo-kodi-gawio-afrika-kusini/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Kokotoa makadirio ya kodi ya gawio' }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Thibitisha');

  const expected = southAfricaDividendTax.calculate({
    grossDividend: 100000, paymentCount: 1, paymentDate: '2026-08-08', treatment: 'standard',
    reducedRatePercent: 15, documentationConfirmed: false, scopeConfirmed: true,
  });
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya kodi ya gawio' }).click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-tax]')).toContainText('20,000.00');
  await expect(page.locator('[data-net]')).toContainText('80,000.00');
  await expect(page.locator('[data-rate]')).toHaveText('20.00%');
  expect(expected.taxPerPayment).toBe(20000);

  await page.locator('[data-copy]').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kupanga ya kodi ya gawio ya Afrika Kusini');
  expect(copied).toContain('Kodi inayokadiriwa kuzuiwa kwa kila malipo');
  expect(copied).not.toContain('Planning estimate');

  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-kodi-gawio-afrika-kusini.txt');
  const txt = fs.readFileSync(await download.path(), 'utf8');
  expect(txt).toContain('ZAR\u00a020,000.00');
  expect(txt).toContain('ZAR\u00a080,000.00');
  expect(txt).toContain('Si marejesho ya SARS');

  await page.locator('[data-print]').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const parsed = await pdfParse(pdf);
  expect(parsed.text).toContain('Tengeneza makadirio ya kodi inayozuiwa');
  expect(parsed.text).toContain('Kodi inayokadiriwa kuzuiwa kwa kila malipo');

  await page.locator('[name="treatment"]').selectOption('reduced');
  await page.locator('[name="reducedRatePercent"]').fill('7.5');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya kodi ya gawio' }).click();
  await expect(page.locator('[data-error]')).toContainText('tamko');
  await page.locator('[name="documentationConfirmed"]').check();
  await page.getByRole('button', { name: 'Kokotoa makadirio ya kodi ya gawio' }).click();
  await expect(page.locator('[data-tax]')).toContainText('7,500.00');

  await page.locator('[name="grossDividend"]').fill('110000');
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Data imebadilika');
  await page.locator('[name="grossDividend"]').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya kodi ya gawio' }).click();
  await expect(page.locator('[name="grossDividend"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Kagua');

  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('[name="grossDividend"]')).toHaveValue('100000');
  await expect(page.locator('[name="scopeConfirmed"]')).not.toBeChecked();
  await expect(page.locator('[data-status]')).toContainText('kimerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /dividend|gawio|tax|amount/i.test(key)))).toEqual([]);
  expect(sensitiveWrites).toEqual([]);
});

test('za-gepf delegates to the GEPF engine and reopens every advertised local export', async ({ page }) => {
  const sensitiveWrites = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:300000|550523|12245)/.test(body)) sensitiveWrites.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/kikokotoo-gepf-afrika-kusini/', { waitUntil: 'domcontentloaded' });

  const expected = southAfricaGepf.calculate({ finalAnnualSalary: 300000, vestedService: 25, savingsService: 0.667, retirementService: 1.333, retirementAge: 60, earlyBasis: 'standard', employerType: 'other' });
  await page.getByRole('button', { name: 'Kokotoa makadirio ya GEPF' }).click();
  await expect(page.locator('#gp-results')).toBeVisible();
  await expect(page.locator('#gp-gratuity')).toContainText('550,523.25');
  await expect(page.locator('#gp-monthly')).toContainText('12,245.94');
  expect(expected.gratuityEstimate).toBe(550523.25);

  await page.locator('#gp-copy').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kustaafu ya GEPF Afrika Kusini');
  expect(copied).toContain('Gratuity inayokadiriwa');

  let downloadEvent = page.waitForEvent('download');
  await page.locator('#gp-csv').click();
  let download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-gepf-afrika-kusini.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"kipengele","thamani"');
  expect(csv).toContain('"gratuity_estimate","550523.25"');

  downloadEvent = page.waitForEvent('download');
  await page.locator('#gp-json').click();
  download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('makadirio-gepf-afrika-kusini.json');
  const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(json.schemaVersion).toBe(1);
  expect(json.privacy).toContain('ndani ya kifaa');
  expect(json.estimate).toMatchObject({ ok: true, gratuityEstimate: 550523.25, monthlyAnnuityEstimate: 12245.94 });

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true }));
    document.getElementById('gp-pdf').click();
    return generated;
  });
  const pdf = await pdfParse(Buffer.from(pdfBytes));
  expect(pdf.text).toContain('Makadirio ya kustaafu ya GEPF Afrika Kusini');
  expect(pdf.text).toMatch(/gratuity inayokadiriwa/i);
  expect(pdf.text).toContain('550,523.25');

  await page.locator('#gp-salary').fill('310000');
  await expect(page.locator('#gp-results')).toBeHidden();
  await expect(page.locator('#gp-status')).toContainText('Data imebadilika');
  await page.locator('#gp-vested').fill('8');
  await page.getByRole('button', { name: 'Kokotoa makadirio ya GEPF' }).click();
  await expect(page.locator('#gp-vested')).toBeFocused();
  await expect(page.locator('#gp-error')).toContainText('angalau miaka 10');

  await page.getByRole('button', { name: 'Weka upya' }).click();
  await expect(page.locator('#gp-salary')).toHaveValue('300000');
  await expect(page.locator('#gp-status')).toContainText('kimerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /gepf|pension|salary|service/i.test(key)))).toEqual([]);
  expect(sensitiveWrites).toEqual([]);
});

test('za-transfer-duty delegates to the SARS engine and reopens every advertised local export', async ({ page }) => {
  const sensitiveWrites = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:2000000|2200000|45786)/.test(body)) sensitiveWrites.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/', { waitUntil: 'domcontentloaded' });

  await page.locator('#td-consideration').fill('2000000');
  await page.locator('#td-other').fill('100000');
  await page.locator('#td-fair').fill('2200000');
  await page.locator('#td-date').fill('2026-08-09');
  const expected = southAfricaTransferDuty.calculate({ consideration: 2000000, otherConsideration: 100000, fairValue: 2200000, agreementDate: '2026-08-09', vatStatus: 'not-vat' });
  await page.getByRole('button', { name: 'Kokotoa ushuru' }).click();
  await expect(page.locator('#td-results')).toBeVisible();
  await expect(page.locator('#td-results')).toBeFocused();
  await expect(page.locator('#td-basis')).toContainText('2,200,000');
  await expect(page.locator('#td-duty')).toContainText('45,786');
  expect(expected.duty).toBe(45786);

  await page.locator('#td-copy').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya ushuru wa uhamisho Afrika Kusini');
  expect(copied).toContain('45,786');

  let pending = page.waitForEvent('download');
  await page.locator('#td-csv').click();
  let download = await pending;
  expect(download.suggestedFilename()).toBe('makadirio-ushuru-uhamisho-afrika-kusini.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"kipengele","thamani"');
  expect(csv).toContain('"taxable_basis","2200000"');
  expect(csv).toContain('"transfer_duty","45786"');

  pending = page.waitForEvent('download');
  await page.locator('#td-json').click();
  download = await pending;
  expect(download.suggestedFilename()).toBe('makadirio-ushuru-uhamisho-afrika-kusini.json');
  const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(json.schemaVersion).toBe(1);
  expect(json.privacy).toContain('binafsi');
  expect(json.estimate).toMatchObject({ ok: true, taxableBasis: 2200000, duty: 45786, vatStatus: 'not-vat' });

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true }));
    document.getElementById('td-pdf').click();
    return generated;
  });
  const pdf = await pdfParse(Buffer.from(pdfBytes));
  expect(pdf.text).toContain('Makadirio ya ushuru wa uhamisho Afrika Kusini');
  expect(pdf.text).toContain('45,786');
  expect(pdf.text).toContain('2,200,000');

  await page.locator('#td-consideration').fill('2100000');
  await expect(page.locator('#td-results')).toBeHidden();
  await expect(page.locator('#td-status')).toContainText('Taarifa imebadilika');
  await page.locator('#td-date').fill('2026-03-31');
  await page.getByRole('button', { name: 'Kokotoa ushuru' }).click();
  await expect(page.locator('#td-date')).toBeFocused();
  await expect(page.locator('#td-error')).toContainText('1 Aprili');
  await expect(page.locator('#td-csv')).toBeDisabled();

  await page.getByRole('button', { name: 'Rudisha mwanzo' }).click();
  await expect(page.locator('#td-date')).toBeFocused();
  await expect(page.locator('#td-consideration')).toHaveValue('2500000');
  await expect(page.locator('#td-status')).toContainText('kimerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /transfer|duty|property|consideration/i.test(key)))).toEqual([]);
  expect(sensitiveWrites).toEqual([]);
});

test('za-uif delegates to the reviewed engine and reopens its advertised private summary', async ({ page }) => {
  const sensitiveWrites = [];
  page.on('request', (request) => {
    const body = request.postData();
    if (request.method() !== 'GET' && body && /(?:25000|177\.12|19890)/.test(body)) sensitiveWrites.push({ url: request.url(), body });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/kikokotoo-uif-afrika-kusini/', { waitUntil: 'domcontentloaded' });

  const contribution = southAfricaUif.calculateContribution({ monthlyRemuneration: 25000, employees: 8, months: 2 });
  await page.locator('#uif-employees').fill('8');
  await page.locator('#uif-months').fill('2');
  await page.getByRole('button', { name: 'Kokotoa mchango' }).click();
  await expect(page.locator('#uif-contribution-results')).toBeFocused();
  await expect(page.locator('#uif-contribution-results')).toContainText('177.12');
  await expect(page.locator('#uif-contribution-results')).toContainText('5,667.84');
  expect(contribution.teamPeriodTotal).toBe(5667.84);

  await page.getByRole('tab', { name: 'Mpango wa ukosefu wa ajira' }).click();
  const benefit = southAfricaUif.calculateBenefitPlan({ averageMonthlyRemuneration: 17712, availableCreditDays: 365, requestedDays: 239 });
  await page.locator('#uif-average').fill('17712');
  await page.locator('#uif-credits').fill('365');
  await page.locator('#uif-requested').fill('239');
  await page.getByRole('button', { name: 'Kokotoa makadirio' }).click();
  await expect(page.locator('#uif-benefit-results')).toBeFocused();
  await expect(page.locator('#uif-benefit-results')).toContainText(String(benefit.payableDays));
  await expect(page.locator('#uif-benefit-results')).toContainText(String(benefit.secondTierDays));

  await page.getByRole('tab', { name: 'Mpango wa uzazi' }).click();
  const maternity = southAfricaUif.calculateMaternityPlan({ averageMonthlyRemuneration: 30000, employerMonthlyPay: 25000, requestedDays: 121 });
  await page.locator('#uif-maternity-average').fill('30000');
  await page.locator('#uif-employer-pay').fill('25000');
  await page.getByRole('button', { name: 'Kokotoa mpango wa uzazi' }).click();
  await expect(page.locator('#uif-maternity-results')).toBeFocused();
  await expect(page.locator('#uif-maternity-results')).toContainText('19,890.41');
  expect(Math.round(maternity.estimatedBenefit * 100) / 100).toBe(19890.41);

  await page.locator('#uif-copy').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('Makadirio ya kupanga mafao ya UIF Afrika Kusini');
  expect(copied).toContain('19,890.41');
  expect(copied).toContain('9 Agosti 2026');
  expect(copied).not.toContain('South Africa UIF benefit planning estimate');

  await page.locator('#uif-employer-pay').fill('24000');
  await expect(page.locator('#uif-maternity-results')).toBeEmpty();
  await expect(page.locator('#uif-status')).toContainText('Taarifa imebadilika');
  await page.locator('#uif-employer-pay').fill('-1');
  await page.getByRole('button', { name: 'Kokotoa mpango wa uzazi' }).click();
  await expect(page.locator('#uif-employer-pay')).toBeFocused();
  await expect(page.locator('#uif-status')).toContainText('Weka kiasi halali');
  await page.locator('[data-uif-reset="uif-maternity-form"]').click();
  await expect(page.locator('#uif-maternity-average')).toBeFocused();
  await expect(page.locator('#uif-employer-pay')).toHaveValue('0');
  await expect(page.locator('#uif-status')).toContainText('kimerudishwa mwanzo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /uif|salary|claim|benefit/i.test(key)))).toEqual([]);
  expect(sensitiveWrites).toEqual([]);
});

test('salary-intelligence keeps evidence private and reopens every advertised export', async ({ page }) => {
  const writes = []; page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => { window.__copiedText = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } }); });
  await page.goto('/sw/zana/daftari-la-ushahidi-wa-mishahara/', { waitUntil: 'domcontentloaded' });
  await page.locator('#si-country').fill('KE'); await page.locator('#si-city').fill('Nairobi'); await page.locator('#si-role').fill('Uhandisi wa programu'); await page.locator('#si-experience').fill('Kati'); await page.locator('#si-currency').fill('KES'); await page.locator('#si-basis').selectOption('gross'); await page.locator('#si-period').selectOption('annual'); await page.locator('#si-date').fill('2026-07-20');
  for (const [index, amount] of [100000, 200000, 300000, 400000, 500000].entries()) { await page.locator('#si-amount').fill(String(amount)); await page.locator('#si-source').fill(index === 0 ? '=Jedwali la majaribio' : `Jedwali ${index + 1}`); await page.getByRole('button', { name: 'Ongeza safu ya ushahidi' }).click(); }
  await expect(page.locator('.si-row')).toHaveCount(5); await page.locator('#si-analyze').click(); await expect(page.locator('#si-q1')).toContainText('150,000'); await expect(page.locator('#si-median')).toContainText('300,000'); await expect(page.locator('#si-q3')).toContainText('450,000');
  await page.locator('#si-copy').click(); expect(await page.evaluate(() => window.__copiedText)).toContain('Muhtasari wa ushahidi wa mishahara');
  let download = page.waitForEvent('download'); await page.locator('#si-csv').click(); const csv = fs.readFileSync(await (await download).path(), 'utf8'); expect(csv.split('\n')).toHaveLength(6); expect(csv).toContain("\"'=Jedwali la majaribio\"");
  download = page.waitForEvent('download'); await page.locator('#si-json').click(); const jsonText = fs.readFileSync(await (await download).path(), 'utf8'); const json = JSON.parse(jsonText); expect(json.schemaVersion).toBe(1); expect(json.rows).toHaveLength(5); expect(json.privacy).toContain('faragha');
  await page.locator('#si-clear').click(); await expect(page.locator('.si-row')).toHaveCount(0); await page.locator('#si-import').setInputFiles({ name: 'ushahidi.json', mimeType: 'application/json', buffer: Buffer.from(jsonText) }); await expect(page.locator('.si-row')).toHaveCount(5); await page.locator('#si-analyze').click(); await expect(page.locator('#si-median')).toContainText('300,000');
  const pdfBytes = await page.evaluate(async () => { const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true })); document.getElementById('si-pdf').click(); return generated; }); const pdf = await pdfParse(Buffer.from(pdfBytes)); expect(pdf.text).toContain('Muhtasari wa ushahidi wa mishahara'); expect(pdf.text).toContain('300,000');
  await page.locator('#si-clear').click(); await page.locator('#si-country').fill('KE'); await page.locator('#si-city').fill('Nairobi'); await page.locator('#si-role').fill('Uhandisi'); await page.locator('#si-experience').fill('Kati'); await page.locator('#si-currency').fill('KES'); await page.locator('#si-date').fill('2027-01-01'); await page.locator('#si-amount').fill('100000'); await page.locator('#si-source').fill('Tarehe ya majaribio'); await page.getByRole('button', { name: 'Ongeza safu ya ushahidi' }).click(); await expect(page.locator('#si-error')).toContainText('baadaye'); await expect(page.locator('.si-row')).toHaveCount(0); await page.locator('#si-clear').click(); await expect(page.locator('#si-country')).toHaveValue(''); expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /salary|evidence/i.test(key)))).toEqual([]); expect(writes).toEqual([]);
});

test('side-hustle-tax preserves the user-rate reserve engine and local exports', async ({ page }) => {
  const writes = []; page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => { window.__copiedText = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } }); });
  await page.goto('/sw/zana/mpango-wa-akiba-ya-kodi-ya-mapato-ya-ziada/', { waitUntil: 'domcontentloaded' });
  await page.locator('#sir-currency').fill('KES'); await page.locator('#sir-jurisdiction').fill('Nchi ya majaribio'); await page.locator('#sir-period').fill('2026'); await page.locator('#sir-gross').fill('100000'); await page.locator('#sir-refunds').fill('5000'); await page.locator('#sir-platform-fees').fill('10000'); await page.locator('#sir-expenses').fill('15000'); await page.locator('#sir-credits').fill('2000'); await page.locator('#sir-rate').fill('20'); await page.locator('#sir-instalments').fill('4'); await page.locator('#sir-source').fill('=Taarifa ya majaribio'); await page.locator('#sir-date').fill('2026-07-22'); await page.getByRole('button', { name: 'Tengeneza mpango wa akiba' }).click();
  await expect(page.locator('#sir-profit')).toContainText('70,000'); await expect(page.locator('#sir-reserve')).toContainText('12,000'); await expect(page.locator('#sir-instalment')).toContainText('3,000'); await expect(page.locator('#sir-cash')).toContainText('58,000'); await expect(page.locator('#sir-cost-ratio')).toHaveText('30.00%'); await expect(page.locator('#sir-reserve-ratio')).toHaveText('12.00%');
  await page.locator('#sir-copy').click(); expect(await page.evaluate(() => window.__copiedText)).toContain('Mpango wa akiba ya kodi ya mapato ya ziada');
  let download = page.waitForEvent('download'); await page.locator('#sir-csv').click(); const csv = fs.readFileSync(await (await download).path(), 'utf8'); expect(csv).toContain("\"Evidence\",\"'=Taarifa ya majaribio\"");
  download = page.waitForEvent('download'); await page.locator('#sir-json').click(); const json = JSON.parse(fs.readFileSync(await (await download).path(), 'utf8')); expect(json.plan).toMatchObject({ planningProfit: 70000, reserveAfterCredits: 12000, reservePerInstalment: 3000 });
  const pdfBytes = await page.evaluate(async () => { const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true })); document.getElementById('sir-pdf').click(); return generated; }); const pdf = await pdfParse(Buffer.from(pdfBytes)); expect(pdf.text).toContain('Mpango wa akiba ya kodi ya mapato ya ziada'); expect(pdf.text).toContain('12,000');
  await page.locator('#sir-date').fill('2025-01-01'); await page.getByRole('button', { name: 'Tengeneza mpango wa akiba' }).click(); await expect(page.locator('#sir-error')).toContainText('siku 365'); await expect(page.locator('#sir-results')).toBeHidden(); await page.locator('#sir-reset').click(); await expect(page.locator('#sir-currency')).toHaveValue(''); expect(writes).toEqual([]);
});

test('transfer-pricing preserves the user-range engine and local exports', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => { window.__copiedText = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } }); window.print = () => { document.documentElement.dataset.printed = 'yes'; }; });
  await page.goto('/sw/zana/ulinganisho-wa-bei-za-uhamisho/', { waitUntil: 'domcontentloaded' });
  await page.locator('[name="jurisdiction"]').fill('Nchi ya majaribio'); await page.locator('[name="period"]').fill('FY2025'); await page.locator('[name="currency"]').fill('KES'); await page.locator('[name="comparableSource"]').fill('Masafa ya majaribio FY2025, yalikaguliwa 2026-07-22'); await page.locator('[name="scopeConfirmed"]').check(); await page.getByRole('button', { name: 'Linganisha kiashiria' }).click();
  await expect(page.locator('[data-position]')).toHaveText('Ndani ya masafa uliyoingiza'); await expect(page.locator('[data-indicator]')).toHaveText('5%'); await expect(page.locator('[data-source]')).toContainText('Masafa ya majaribio');
  await page.locator('[data-copy]').click(); expect(await page.evaluate(() => window.__copiedText)).toContain('Karatasi ya ulinganisho wa bei za uhamisho');
  let download = page.waitForEvent('download'); await page.locator('[data-txt]').click(); const txt = fs.readFileSync(await (await download).path(), 'utf8'); expect(txt).toContain('Nafasi: Ndani ya masafa uliyoingiza');
  download = page.waitForEvent('download'); await page.locator('[data-json]').click(); const json = JSON.parse(fs.readFileSync(await (await download).path(), 'utf8')); expect(json.result).toMatchObject({ ok: true, method: 'tnmm', indicator: 5, status: 'inside' }); expect(json.input.comparableSource).toContain('FY2025');
  await page.locator('[data-print]').click(); await expect(page.locator('html')).toHaveAttribute('data-printed', 'yes');
  await page.locator('[name="rangeLow"]').fill('8'); await page.locator('[name="rangeMedian"]').fill('5'); await page.locator('[name="rangeHigh"]').fill('3'); await page.getByRole('button', { name: 'Linganisha kiashiria' }).click(); await expect(page.locator('[data-error]')).toContainText('chini, kati, kisha juu'); await expect(page.locator('[data-result]')).toBeHidden(); await page.getByRole('button', { name: 'Futa data' }).click(); await expect(page.locator('[name="jurisdiction"]')).toHaveValue(''); expect(writes).toEqual([]);
});

test('pension-proj preserves the user-assumption engine and local exports', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => { window.__copiedText = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } }); });
  await page.goto('/sw/zana/makadirio-ya-pensheni/', { waitUntil: 'domcontentloaded' });
  await page.locator('#currency').fill('KES'); await page.locator('#current-balance').fill('1000000'); await page.locator('#personal-contribution').fill('50000'); await page.locator('#employer-contribution').fill('50000'); await page.locator('#voluntary-contribution').fill('0'); await page.locator('#years').fill('2'); await page.locator('#source-label').fill('Taarifa ya majaribio'); await page.locator('#source-date').fill('2026-07-22'); await page.locator('#annual-return').fill('8'); await page.locator('#annual-fee').fill('1'); await page.locator('#inflation').fill('6'); await page.locator('#contribution-growth').fill('0'); await page.locator('#scheme-confirmed').check(); await page.locator('#assumptions-confirmed').check();
  await page.getByRole('button', { name: 'Kokotoa ndani ya kifaa' }).click();
  await expect(page.locator('#ending-balance')).toContainText('3,707,621.51'); await expect(page.locator('#real-value')).toContainText('3,299,769.94'); await expect(page.locator('#future-contributions')).toContainText('2,400,000'); await expect(page.locator('#investment-growth')).toContainText('307,621.51'); await expect(page.locator('#net-return')).toHaveText('7.00%'); await expect(page.locator('#year-body tr')).toHaveCount(2);
  await page.locator('#copy-result').click(); expect(await page.evaluate(() => window.__copiedText)).toContain('Muhtasari wa makadirio ya pensheni');
  const csvEvent = page.waitForEvent('download'); await page.locator('#csv-result').click(); const csv = fs.readFileSync(await (await csvEvent).path(), 'utf8'); expect(csv.split('\n')).toHaveLength(3); expect(csv).toContain('Mwaka,Salio lililokadiriwa (KES)');
  const pdfBytes = await page.evaluate(async () => { const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true })); document.getElementById('pdf-result').click(); return generated; }); const pdf = await pdfParse(Buffer.from(pdfBytes)); expect(pdf.text).toContain('Muhtasari wa Makadirio ya Pensheni'); expect(pdf.text).toContain('3,707,621');
  await page.locator('#source-date').fill('2025-01-01'); await page.getByRole('button', { name: 'Kokotoa ndani ya kifaa' }).click(); await expect(page.locator('#pension-error')).toContainText('siku 366'); await expect(page.locator('#pension-result')).toBeHidden(); await page.getByRole('button', { name: 'Futa data' }).click(); await expect(page.locator('#currency')).toHaveValue(''); expect(writes).toEqual([]);
});

test('staff-cost preserves the user-evidenced engine and local export boundary', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/bajeti-ya-gharama-za-wafanyakazi/', { waitUntil: 'domcontentloaded' });
  await page.locator('#scp-currency').fill('KES');
  await page.locator('#scp-headcount').fill('5');
  await page.locator('#scp-horizon').fill('12');
  await page.locator('#scp-salary').fill('500000');
  await page.locator('#scp-obligations').fill('60000');
  await page.locator('#scp-benefits').fill('40000');
  await page.locator('#scp-recurring').fill('25000');
  await page.locator('#scp-recruitment').fill('100000');
  await page.locator('#scp-equipment').fill('350000');
  await page.locator('#scp-annual-extras').fill('500000');
  await page.locator('#scp-contingency').fill('5');
  await page.locator('#scp-source-label').fill('=Ratiba ya majaribio');
  await page.locator('#scp-source-date').fill('2026-07-22');
  await page.locator('#scp-status-confirm').check();
  await page.locator('#scp-source-confirm').check();
  await page.getByRole('button', { name: 'Tengeneza bajeti' }).click();
  await expect(page.locator('#scp-total')).toContainText('44,362,500');
  await expect(page.locator('#scp-metrics')).toContainText('3,696,875');
  await expect(page.locator('#scp-metrics')).toContainText('47.88%');
  await expect(page.locator('#scp-evidence')).toContainText('=Ratiba ya majaribio');

  await page.locator('#scp-copy').click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Muhtasari wa gharama za wafanyakazi');
  const csvEvent = page.waitForEvent('download');
  await page.locator('#scp-csv').click();
  const csv = fs.readFileSync(await (await csvEvent).path(), 'utf8');
  expect(csv).toContain('"Idadi ya wafanyakazi","5"');
  expect(csv).toContain("\"Chanzo cha ushahidi\",\"'=Ratiba ya majaribio\"");

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true }));
    document.getElementById('scp-pdf').click();
    return generated;
  });
  const pdf = await pdfParse(Buffer.from(pdfBytes));
  expect(pdf.text).toContain('Muhtasari wa Gharama za Wafanyakazi');
  expect(pdf.text).toContain('44,362,500');

  await page.locator('#scp-source-date').fill('2025-01-01');
  await page.getByRole('button', { name: 'Tengeneza bajeti' }).click();
  await expect(page.locator('#scp-total')).toHaveText('Hakuna bajeti');
  await expect(page.locator('#scp-status')).toContainText('zaidi ya mwaka mmoja');
  await page.getByRole('button', { name: 'Futa data' }).click();
  await expect(page.locator('#scp-currency')).toHaveValue('');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /staff|salary|payroll|employee/i.test(key)))).toEqual([]);
  expect(writes).toEqual([]);
});

test('student-loan preserves the shared engine and all local export contracts', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__copiedText = value; } },
    });
  });
  await page.goto('/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi/', { waitUntil: 'domcontentloaded' });
  await page.locator('#sl-currency').fill('KES');
  await page.locator('#sl-balance').fill('10000');
  await page.locator('#sl-financed-fees').fill('500');
  await page.locator('#sl-rate').fill('0');
  await page.locator('#sl-months').fill('10');
  await page.locator('#sl-grace').fill('2');
  await page.locator('#sl-grace-accrual').check();
  await page.locator('#sl-monthly-fee').fill('10');
  await page.locator('#sl-extra').fill('0');
  await page.locator('#sl-income').fill('5000');
  await page.locator('#sl-debts').fill('500');
  await page.locator('#sl-source').fill('Taarifa ya majaribio');
  await page.locator('#sl-date').fill('2026-07-22');
  await page.getByRole('button', { name: 'Kokotoa mpango wa malipo' }).click();

  await expect(page.locator('#sl-start')).toContainText('10,500');
  await expect(page.locator('#sl-payment')).toContainText('1,050');
  await expect(page.locator('#sl-cash-payment')).toContainText('1,060');
  await expect(page.locator('#sl-interest')).toContainText('0');
  await expect(page.locator('#sl-fees')).toContainText('600');
  await expect(page.locator('#sl-total')).toContainText('10,600');
  await expect(page.locator('#sl-timeline')).toHaveText('12 miezi');
  await expect(page.locator('#sl-debt-load')).toHaveText('31.2%');
  await expect(page.locator('#sl-cash-after')).toContainText('3,440');
  await expect(page.locator('#sl-schedule tr')).toHaveCount(12);

  await page.locator('#sl-copy').click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Mpango wa malipo ya mkopo wa mwanafunzi');

  const csvEvent = page.waitForEvent('download');
  await page.locator('#sl-csv').click();
  const csv = fs.readFileSync(await (await csvEvent).path(), 'utf8');
  expect(csv.split('\n')).toHaveLength(13);
  expect(csv).toContain('"month","phase","payment","fee","interest","principal","balance"');
  expect(csv).not.toMatch(/(?:^|,)"[=+@-]/m);

  const jsonEvent = page.waitForEvent('download');
  await page.locator('#sl-json').click();
  const payload = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), 'utf8'));
  expect(payload.schemaVersion).toBe(1);
  expect(payload.plan).toMatchObject({ currency: 'KES', balanceAtRepaymentStart: 10500, scheduledPayment: 1050, totalPaid: 10600 });

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.getElementById('sl-pdf').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Mpango wa malipo ya mkopo wa mwanafunzi');
  expect(parsed.text).toContain('10,600');

  await page.locator('#sl-date').fill('2025-01-01');
  await page.getByRole('button', { name: 'Kokotoa mpango wa malipo' }).click();
  await expect(page.locator('#sl-error')).toContainText('siku 365');
  await expect(page.locator('#sl-results')).toBeHidden();
  await page.locator('#sl-reset').click();
  await expect(page.locator('#sl-currency')).toHaveValue('');
  expect(writes).toEqual([]);
});

test('lr-paye uses the reviewed engine and creates a private parser-readable PDF', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/sw/liberia/kikokotoo-kodi-mshahara', { waitUntil: 'domcontentloaded' });
  await page.locator('#salaryInput').fill('500000');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#r-tax')).toContainText('116,375');
  await expect(page.locator('#r-nasscorp')).toContainText('20,000');
  await expect(page.locator('#r-net')).toContainText('363,625');
  await page.locator('#tog-nasscorp').click();
  await expect(page.locator('#r-tax')).toContainText('116,375');
  await expect(page.locator('#r-nasscorp')).toContainText('0');
  await expect(page.locator('#r-net')).toContainText('383,625');
  await page.locator('#tog-nasscorp').click();

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.getElementById('pdfBtn').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Makadirio ya Kodi ya Mshahara Liberia');
  expect(parsed.text).toContain('116,375');
  expect(parsed.text).toContain('363,625');

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikokotoo cha Kodi ya Mshahara Liberia',
    url: 'https://afrotools.com/sw/liberia/kikokotoo-kodi-mshahara/',
  });
  await page.locator('#resetBtn').click();
  await expect(page.locator('#salaryInput')).toHaveValue('');
  await expect(page.locator('#calcStatus')).toContainText('Imefutwa');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#calcStatus')).toContainText('zaidi ya sifuri');
  expect(writes).toEqual([]);
  const source = await page.locator('html').evaluate((node) => node.outerHTML);
  expect(source).not.toMatch(/ai-advisor|openPdfModal|afrotools-language-fallback|data-explicit-language-fallback|\?gross=/);
});

test('mr-paye uses the reviewed engine and creates a private parser-readable PDF', async ({ page }) => {
  const writes = [];
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.goto('/sw/mauritania/kikokotoo-kodi-mshahara', { waitUntil: 'domcontentloaded' });
  await page.locator('#salaryInput').fill('30000');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#r-tax')).toContainText('5,490');
  await expect(page.locator('#r-cnss')).toContainText('150');
  await expect(page.locator('#r-net')).toContainText('24,360');
  await page.locator('#tog-cnss').click();
  await expect(page.locator('#r-tax')).toContainText('5,550');
  await expect(page.locator('#r-cnss')).toContainText('0');
  await expect(page.locator('#r-net')).toContainText('24,450');
  await page.locator('#tog-cnss').click();

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.querySelector('.result-actions .action-btn').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Makadirio ya ITS Mauritania');
  expect(parsed.text).toContain('5,490');
  expect(parsed.text).toContain('24,360');

  await page.getByRole('button', { name: 'Shiriki' }).click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikokotoo cha Kodi Mauritania',
    text: 'Kikokotoo cha ITS na CNSS cha AfroTools.',
    url: 'https://afrotools.com/sw/mauritania/kikokotoo-kodi-mshahara/',
  });
  await page.locator('#resetBtn').click();
  await expect(page.locator('#salaryInput')).toHaveValue('');
  await expect(page.locator('#calcStatus')).toContainText('Imefutwa');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#calcStatus')).toContainText('zaidi ya sifuri');
  expect(writes).toEqual([]);
  const source = await page.locator('html').evaluate((node) => node.outerHTML);
  expect(source).not.toMatch(/ai-advisor|pdf-leads|data-explicit-language-fallback|\?gross=/);
});

for (const [route, id] of routes) {
  test(`${id} has native Swahili mobile, metadata, privacy and interaction boundaries`, async ({ page }) => {
    const errors = [];
    const sensitiveWrites = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      const body = request.postData();
      if (request.method() !== 'GET' && body) sensitiveWrites.push({ url: request.url(), body });
    });

    await page.setViewportSize({ width: 320, height: 820 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toBeVisible();
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.some((node) => /"inLanguage"\s*:\s*"sw"/.test(node.textContent || '')))).toBe(true);
    expect(await page.locator('iframe').count()).toBe(0);

    const controls = page.locator('input:not([type="hidden"]), select, textarea, button');
    const unnamed = await controls.evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      if (node.disabled || node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden' || node.getClientRects().length === 0) return false;
      const label = node.labels && node.labels.length;
      return !label && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') && !String(node.textContent || '').trim() && !node.getAttribute('title');
    }).map((node) => node.id || node.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);

    const firstFocusable = page.locator('a[href]:visible, button:visible, input:visible, select:visible, textarea:visible').first();
    await firstFocusable.focus();
    const focus = await page.evaluate(() => {
      const node = document.activeElement;
      const style = node ? getComputedStyle(node) : null;
      return { tag: node && node.tagName, outline: style && style.outlineStyle, width: style && style.outlineWidth };
    });
    expect(focus.tag).not.toBe('BODY');
    expect(focus.outline === 'none' && focus.width === '0px').toBe(false);

    const normalReflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      containers: [...document.querySelectorAll('body *')]
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth })),
    }));
    expect(normalReflow.delta, JSON.stringify(normalReflow.containers)).toBeLessThanOrEqual(1);
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    const reflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll('body *')].filter((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== 'none' && node.getClientRects().length && box.right > viewport + 4;
      }).sort((left, right) => right.getBoundingClientRect().right - left.getBoundingClientRect().right)
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), right: Math.round(node.getBoundingClientRect().right) }));
      return {
        delta: document.documentElement.scrollWidth - viewport,
        offenders,
        metrics: {
          viewport,
          htmlScroll: document.documentElement.scrollWidth,
          bodyClient: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth,
          bodyRight: Math.round(document.body.getBoundingClientRect().right),
          htmlMinWidth: getComputedStyle(document.documentElement).minWidth,
          bodyMinWidth: getComputedStyle(document.body).minWidth,
        },
        scrollContainers: [...document.querySelectorAll('body *')]
          .filter((node) => node.scrollWidth > node.clientWidth + 4)
          .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
          .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth, overflow: getComputedStyle(node).overflowX })),
      };
    });
    expect(reflow.delta, JSON.stringify({ offenders: reflow.offenders, metrics: reflow.metrics, scrollContainers: reflow.scrollContainers })).toBeLessThanOrEqual(4);

    const reset = page.locator('button[type="reset"]:visible, [id*="reset"]:visible, [id*="clear"]:visible').first();
    if (await reset.count()) {
      await reset.focus();
      await expect(reset).toBeFocused();
    }

    await page.setViewportSize({ width: 375, height: 820 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    expect(sensitiveWrites).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('accepted routes expose only local advertised result actions', async ({ page }) => {
  for (const [route, id] of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const actions = await page.locator('button, a[download]').evaluateAll((nodes) => nodes
      .filter((node) => /PDF|CSV|JSON|TXT|Pakua|Nakili|Shiriki|Chapisha/i.test(node.textContent || node.getAttribute('aria-label') || ''))
      .map((node) => ({
        label: String(node.textContent || node.getAttribute('aria-label') || '').trim(),
        href: node.getAttribute('href') || '',
      })));
    for (const action of actions) {
      expect(action.href, `${id}: ${action.label}`).not.toMatch(/^https?:\/\//i);
    }
  }
});

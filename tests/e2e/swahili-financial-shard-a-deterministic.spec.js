const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const forex = {
  base: 'USD',
  rates: { USD: 1, NGN: 1400, KES: 130, GHS: 12, ZAR: 18, EUR: 0.9, GBP: 0.78 },
  source: 'synthetic-fixture',
  timestamp: new Date().toISOString()
};

function collectRuntime(page) {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push({
    method: request.method(),
    url: request.url(),
    body: request.postData() || ''
  }));
  return { errors, requests };
}

async function expectTwoHundredPercentReflow(page) {
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const offenders = await page.evaluate(() => Array.from(document.body.querySelectorAll('*')).filter(element => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 &&
      (box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5);
  }).map(element => ({
    tag: element.tagName,
    id: element.id,
    className: String(element.className || ''),
    box: element.getBoundingClientRect().toJSON()
  })).slice(0, 20));
  expect(offenders).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
}

test('Swahili currency converter calculates locally and exports a parsed CSV at 200%', async ({ page }) => {
  const runtime = collectRuntime(page);
  await page.route('**/api/forex?base=USD', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(forex) }));
  await page.route('**/data/forex/latest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(forex) }));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/sw/zana/kibadilishaji-sarafu/?from=USD&to=NGN');

  await expect(page.locator('#fxStatus')).toHaveText('Snapshot yenye tarehe iko tayari');
  await page.locator('#fxAmount').fill('0');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxAmountError')).not.toBeEmpty();
  await expect(page.locator('#fxAmount')).toBeFocused();

  await page.locator('#fxAmount').fill('125.5');
  await page.locator('#fxConvert').click();
  await expect(page.locator('#fxResultValue')).toContainText(/175[\s,]?700/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#fxCsv').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afrotools-ubadilishaji-sarafu.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');
  const rows = csv.split(/\r?\n/).map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '')));
  expect(rows).toHaveLength(2);
  expect(rows[0]).toEqual(['kiasi', 'sarafu_ya_mwanzo', 'sarafu_ya_mwisho', 'kiwango', 'kiasi_kilichobadilishwa', 'msingi_wa_kiwango', 'tarehe_ya_kiwango', 'chanzo', 'maelezo_ya_ada']);
  expect(rows[1].slice(0, 5)).toEqual(['125.5', 'USD', 'NGN', '1400', '175700']);

  await page.locator('#fxAmount').fill('250');
  await expect(page.locator('#fxResult')).toBeHidden();
  await expectTwoHundredPercentReflow(page);
  expect(runtime.requests.filter(request => request.method !== 'GET' && `${request.url}\n${request.body}`.includes('125.5'))).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

test('Swahili import-duty calculator preserves engine semantics and exports a parsed local PDF at 200%', async ({ page }) => {
  const runtime = collectRuntime(page);
  const privateToken = 'Synthetic-Parcel-Alpha-9472';
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/sw/zana/ushuru-forodha/');

  await page.locator('#fob').fill('');
  await page.getByRole('button', { name: 'Kokotoa gharama iliyofika' }).click();
  await expect(page.locator('#fob')).toBeFocused();
  expect(await page.locator('#fob').evaluate(element => element.matches(':invalid'))).toBe(true);

  await page.locator('#itemName').fill(privateToken);
  await page.locator('#hsCode').fill('847130');
  await page.locator('#fob').fill('1000');
  await page.locator('#freight').fill('100');
  await page.locator('#insurance').fill('20');
  await page.locator('#dutyRate').selectOption('20');
  await page.locator('#otherImportCharges').fill('50');
  await page.locator('#portCharges').fill('30');
  await page.locator('#clearingFee').fill('40');
  await page.locator('#fxRate').fill('1600');
  await page.locator('#classificationConfirmed').check();
  await page.locator('#quoteConfirmed').check();
  await page.getByRole('button', { name: 'Kokotoa gharama iliyofika' }).click();
  await expect(page.locator('#importDutyResult')).toContainText('1,568.55');
  await expect(page.locator('#importDutyResult')).toContainText(/2,509,680/);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#pdfImportDuty').click();
  const pdf = await downloadPromise;
  const parsed = await pdfParse(fs.readFileSync(await pdf.path()));
  expect(parsed.text).toContain('Nigeria');
  expect(parsed.text).toContain('1568.55');
  expect(parsed.text).toContain('847130');
  expect(parsed.text).toContain(privateToken);

  await page.locator('#clearImportDuty').click();
  await expect(page.locator('#importDutyResult')).toBeHidden();
  await expect(page.locator('#importDutyStatus')).toContainText('Imefutwa');
  await expect(page.locator('#fob')).toHaveValue('');
  await expectTwoHundredPercentReflow(page);
  expect(runtime.requests.filter(request => `${request.url}\n${request.body}`.includes(privateToken))).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

test('Swahili first-home planner keeps bounded math local and reopens TXT and print PDF at 200%', async ({ page }) => {
  const runtime = collectRuntime(page);
  const privateValue = '2345678.91';
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/sw/zana/mnunuzi-wa-kwanza-wa-nyumba/');

  await page.locator('#deposit').fill('1000000000001');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-error')).toHaveClass(/on/);
  await expect(page.locator('#fh-result')).not.toHaveClass(/on/);

  await page.locator('#deposit').fill(privateValue);
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).toHaveClass(/on/);
  await expect(page.locator('#fh-goal')).toContainText('3,145,679');
  await expect(page.locator('#fh-gap')).toContainText('2,345,679');
  await expect(page.locator('#fh-result-title')).toContainText('16');

  const textPromise = page.waitForEvent('download');
  await page.locator('#fh-download').click();
  const textDownload = await textPromise;
  const exportedText = fs.readFileSync(await textDownload.path(), 'utf8');
  expect(exportedText).toContain('3,145,679');
  expect(exportedText).toContain('16');
  expect(exportedText).toContain('Si idhini ya mkopo');

  await page.emulateMedia({ media: 'print', colorScheme: 'dark', reducedMotion: 'reduce' });
  const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');
  const parsedPdf = await pdfParse(pdfBytes);
  expect(parsedPdf.text).toContain('3,145,679');
  expect(parsedPdf.text).toContain('16');
  await page.emulateMedia({ media: 'screen', colorScheme: 'dark', reducedMotion: 'reduce' });

  await expectTwoHundredPercentReflow(page);
  expect(runtime.requests.filter(request => `${request.url}\n${request.body}`.includes(privateValue))).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

test('Swahili job-offer evaluator parses PDF, CSV and JSON exports and clears locally at 200%', async ({ page }) => {
  const runtime = collectRuntime(page);
  const privateUnit = 'ZXQ9472';
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/sw/zana/tathmini-ya-ofa-ya-kazi/');

  await page.locator('#joe-calc').click();
  await expect(page.locator('#joe-status')).not.toBeEmpty();
  await expect(page.locator('#joe-results')).not.toHaveClass(/on/);
  await page.locator('[name="currency"]').fill(privateUnit);
  const offers = page.locator('[data-offer]');
  await offers.nth(0).locator('[name="monthlyPay"]').fill('1000');
  await offers.nth(1).locator('[name="monthlyPay"]').fill('1200');
  for (const offer of [offers.nth(0), offers.nth(1)]) {
    for (const name of ['roleFit', 'learning', 'flexibility', 'stability', 'team']) {
      await offer.locator(`[name="${name}"]`).fill('7');
    }
  }
  await page.locator('#joe-calc').click();
  await expect(page.locator('#joe-results')).toHaveClass(/on/);
  await expect(page.locator('#joe-delta')).toContainText(privateUnit);
  await expect(page.locator('#joe-delta')).toContainText('2,400');

  const pdfPromise = page.waitForEvent('download');
  await page.locator('#joe-pdf').click();
  const pdf = await pdfPromise;
  const pdfText = (await pdfParse(fs.readFileSync(await pdf.path()))).text;
  expect(pdfText).toContain(`Currency / unit: ${privateUnit}`);

  const csvPromise = page.waitForEvent('download');
  await page.locator('#joe-csv').click();
  const csv = fs.readFileSync(await (await csvPromise).path(), 'utf8');
  const csvRows = csv.trim().split(/\r?\n/);
  expect(csvRows[0]).toBe('currency_unit,offer,annual_value,weighted_score');
  expect(csvRows).toHaveLength(3);
  expect(csvRows[1]).toContain(privateUnit);

  const jsonPromise = page.waitForEvent('download');
  await page.locator('#joe-json').click();
  const exported = JSON.parse(fs.readFileSync(await (await jsonPromise).path(), 'utf8'));
  expect(exported.currencyUnit).toBe(privateUnit);
  expect(exported.result.annualDelta).toBe(2400);

  await page.locator('#joe-clear').click();
  await expect(page.locator('#joe-results')).not.toHaveClass(/on/);
  await expect(page.locator('#joe-status')).toContainText('yamefutwa');
  await expect(page.locator('[name="currency"]')).toHaveValue('');
  await expectTwoHundredPercentReflow(page);
  expect(runtime.requests.filter(request => `${request.url}\n${request.body}`.includes(privateUnit))).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

for (const route of ['/tools/job-offer-evaluator/', '/fr/tools/evaluateur-offre-emploi/']) {
  test(`${route} shares the corrected complete-clear controller contract`, async ({ page }) => {
    await page.goto(route);
    await page.locator('[name="currency"]').fill('PARITY');
    await page.locator('[data-offer]').first().locator('[name="monthlyPay"]').fill('9876');
    await page.locator('#joe-clear').click();
    await expect(page.locator('[name="currency"]')).toHaveValue('');
    await expect(page.locator('[data-offer]').first().locator('[name="monthlyPay"]')).toHaveValue('');
    await expect(page.locator('#joe-results')).not.toHaveClass(/on/);
  });
}

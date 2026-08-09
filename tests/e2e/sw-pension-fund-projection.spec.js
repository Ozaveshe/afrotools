const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = ['/tools/pension-projection/', '/sw/zana/makadirio-ya-mfuko-wa-pensheni/'];

async function fillValid(page) {
  await page.locator('[name="monthlySalary"]').fill('1000000');
  await page.locator('[name="currentBalance"]').fill('5000000');
  await page.locator('[name="sourceLabel"]').fill('Synthetic current fund statement');
  await page.locator('[name="sourceCheckedDate"]').fill('2026-08-09');
  await page.locator('[name="asOfDate"]').fill('2026-08-09');
  await page.locator('[name="schemeInputsConfirmed"]').check();
  await page.locator('[name="assumptionsConfirmed"]').check();
}

for (const route of routes) {
  test(`${route} calculates locally and reopens every advertised export`, async ({ page }) => {
    const errors = [], external = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = request.url();
      if (/^https?:/.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) external.push(url);
    });
    await page.goto(route);
    await expect(page.locator('[data-pension-fund-app]')).toHaveAttribute('data-workflow-ready', 'true');
    await fillValid(page);
    const invalidControls = await page.locator('[data-pension-fund-app] form').evaluate(form => Array.from(form.elements).filter(control => control.willValidate && !control.checkValidity()).map(control => ({ name: control.name, value: control.value, message: control.validationMessage })));
    expect(invalidControls).toEqual([]);
    await page.locator('[data-pension-fund-app] button[type="submit"]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-result] table tbody tr')).toHaveCount(31);
    await expect(page.locator('[data-status]')).toContainText(route.includes('/sw/') ? 'kivinjari' : 'browser');

    const jsonDownload = page.waitForEvent('download');
    await page.locator('[data-action="json"]').click();
    const json = await jsonDownload;
    const jsonPath = await json.path();
    const record = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(record.englishId).toBe('pension-projection');
    expect(record.result.base.endingBalance).toBeGreaterThan(record.result.base.totalContributed);

    const csvDownload = page.waitForEvent('download');
    await page.locator('[data-action="csv"]').click();
    const csvPath = await (await csvDownload).path();
    const csv = fs.readFileSync(csvPath, 'utf8');
    expect(csv.split(/\r?\n/).filter(Boolean)).toHaveLength(32);
    expect(csv).toContain('total_contributed');

    const txtDownload = page.waitForEvent('download');
    await page.locator('[data-action="txt"]').click();
    const txt = fs.readFileSync(await (await txtDownload).path(), 'utf8');
    expect(txt).toContain(route.includes('/sw/') ? 'Makadirio ya mfuko' : 'Pension Fund Projection');
    expect(txt).toContain('2026-08-09');

    const pdfDownload = page.waitForEvent('download');
    await page.locator('[data-action="pdf"]').click();
    const pdfBuffer = fs.readFileSync(await (await pdfDownload).path());
    expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
    const parsed = await pdfParse(pdfBuffer);
    expect(parsed.text).toContain(route.includes('/sw/') ? 'Makadirio ya mfuko' : 'Pension Fund Projection');

    await page.locator('[data-action="reset"]').click();
    await expect(page.locator('[data-result]')).toBeHidden();
    await page.locator('[data-action="import"]').click();
    await page.locator('[name="importFile"]').setInputFiles(jsonPath);
    await expect(page.locator('[name="monthlySalary"]')).toHaveValue('1000000');
    await expect(page.locator('[data-status]')).toContainText(route.includes('/sw/') ? 'JSON' : 'JSON reopened');
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('invalid and stale inputs fail closed; local draft round-trips', async ({ page }) => {
  await page.goto('/sw/zana/makadirio-ya-mfuko-wa-pensheni/');
  await fillValid(page);
  await page.locator('[name="sourceCheckedDate"]').fill('2024-01-01');
  await page.locator('[data-pension-fund-app] button[type="submit"]').click();
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('imepitwa');
  await page.locator('[name="sourceCheckedDate"]').fill('2026-08-09');
  await page.locator('[data-action="save"]').click();
  await page.locator('[name="monthlySalary"]').fill('25');
  await page.locator('[data-action="load"]').click();
  await expect(page.locator('[name="monthlySalary"]')).toHaveValue('1000000');
});

for (const width of [320, 375]) {
  test(`Swahili owner reflows at ${width}px in both themes and 200% text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto('/sw/zana/makadirio-ya-mfuko-wa-pensheni/');
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.width + 2);
      await expect(page.locator('[name="countryCode"]')).toBeVisible();
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement !== document.body)).toBeTruthy();
    }
  });
}

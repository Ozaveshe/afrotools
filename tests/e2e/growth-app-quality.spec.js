const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const evidence = path.join(__dirname, '../../reports/growth-recovery/2026-09-08/app-quality');
const baseline = process.env.APP_QUALITY_BASELINE === '1';

test.use({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});

for (const slug of ['amount-words-gh', 'naira-to-words']) {
  test(`${slug}: exact decimal, invalid input, copy and offline completion`, async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    if (baseline) {
      const html = execFileSync('git', ['show', `9b29eab0408eedd9442c98c2cabf567098da80ab:tools/${slug}/index.html`], { encoding: 'utf8' });
      await page.route(`**/tools/${slug}/`, route => route.fulfill({ contentType: 'text/html', body: html }));
    }
    await page.goto(`/tools/${slug}/`);
    const result = page.locator(slug === 'amount-words-gh' ? '#wordsResult' : '#result');
    await page.locator('#amount').fill('1.005');
    await page.locator('#amount').scrollIntoViewIfNeeded();
    fs.mkdirSync(evidence, { recursive: true });
    await page.screenshot({ path: path.join(evidence, `${baseline ? 'before' : 'after'}-${slug}.png`) });
    await page.locator('#resultCard').screenshot({ path: path.join(evidence, `${baseline ? 'before' : 'after'}-${slug}-result.png`) });
    if (baseline) {
      fs.writeFileSync(path.join(evidence, `before-${slug}.txt`), await page.locator('#resultCard').innerText());
      return;
    }
    await expect(result).toContainText(/One.*(?:Pesewa|Kobo)|ONE.*PESEWA/);
    const maximum = slug === 'amount-words-gh' ? '999999999999' : '999999999999999';
    await page.locator('#amount').fill(maximum + '.99');
    await expect(result).toContainText(/Ninety-Nine|NINETY-NINE/);
    await page.getByRole('button', { name: 'Copy Document Line', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(maximum.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.99');
    await page.locator('#amount').fill(maximum + '.995');
    await expect(page.locator('#resultCard')).toBeHidden();
    for (const invalid of ['-50', '1.2.3', '12,34', '1e3', '1000000000000000']) {
      await page.locator('#amount').fill(invalid);
      await expect(page.locator('#resultCard')).toBeHidden();
      await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#amountError')).not.toBeEmpty();
    }
    await page.locator('#amount').fill('');
    await expect(page.locator('#amountError')).toBeEmpty();
    await page.locator('#amount').fill('0');
    await expect(result).toContainText(/Zero|ZERO/);
    await context.setOffline(true);
    await page.locator('#amount').fill('12,500.75');
    await page.locator('#caseMode').selectOption('title');
    await expect(result).toContainText('Twelve Thousand Five Hundred');
    await page.getByRole('button', { name: slug === 'amount-words-gh' ? 'Copy Words' : 'Copy to Clipboard', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Seventy-Five');
    await page.getByRole('button', { name: 'Copy Document Line', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('12,500.75');
    await page.locator('#amount').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('BODY');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.setOffline(false);
    // Synthetic private text must stay out of network requests and analytics.
    const leaked = [];
    page.on('request', request => {
      if ((request.url() + (request.postData() || '')).includes('PRIVATE_SYNTHETIC')) leaked.push(request.method());
    });
    await page.locator('#payeeName').fill('PRIVATE_SYNTHETIC');
    await page.locator('#payeeName').press('Tab');
    expect(leaked).toEqual([]);
    // A browser without the Clipboard API still offers a truthful manual-copy path.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    let manualCopyOffered = false;
    page.once('dialog', async dialog => { manualCopyOffered = true; await dialog.dismiss(); });
    await page.getByRole('button', { name: 'Copy Document Line', exact: true }).click();
    expect(manualCopyOffered).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('lobola: user counts, changed-input invalidation and local handoff', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/tools/lobola-calculator/?country=zw&currency=USD');
  await page.locator('#customCattle').fill('0');
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await page.locator('#rTotal').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, `${baseline ? 'before' : 'after'}-lobola-calculator.png`) });
  if (baseline) {
    fs.writeFileSync(path.join(evidence, 'before-lobola-calculator.txt'), await page.locator('#breakdownList').innerText());
    return;
  }
  await expect(page.locator('#rTotal')).toHaveText('$0');
  await page.locator('#customCattle').fill('');
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await expect(page.locator('#rTotal')).toHaveText('$4,400');
  await page.locator('#customCattle').fill('1');
  await expect(page.locator('#results')).not.toHaveClass(/show/);
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await expect(page.locator('#rTotal')).toHaveText('$550');
  await page.locator('#customCattle').fill('6');
  await page.locator('#zwCustom').fill('500');
  await page.locator('#giftValue').fill('300');
  await page.locator('#ceremonyCost').fill('200');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await expect(page.locator('#rTotal')).toHaveText('$4,400');
  await page.getByRole('button', { name: 'Copy family summary', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('$4,400');
  await page.getByRole('button', { name: 'Save on this device', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1')).totalValue)).toBe(4400);
  await expect(page.locator('#resultActionStatus')).toContainText('saved on this device');
  await page.locator('#giftValue').fill('400');
  await expect(page.locator('#results')).not.toHaveClass(/show/);
  expect(await page.evaluate(() => { copyLobolaBrief(); saveLobolaPlan(); return JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1')).totalValue; })).toBe(4400);
  await page.locator('#customCattle').fill('-1');
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await expect(page.locator('#customCattle')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#planStatus')).toContainText('between 0 and 100');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('market days: anchor, keyboard, directory empty state and trip copy', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/tools/market-days/?date=2026-01-01');
  await expect(page.locator('#selectedDayName')).toHaveText('Orie');
  await page.locator('#lookupDate').fill('2026-01-04');
  await page.locator('#lookupDate').press('Tab');
  await expect(page.locator('#selectedDayName')).toHaveText('Eke');
  await page.locator('#marketSearch').fill('no-such-market-fixture');
  await expect(page.locator('#directoryResults')).toContainText('No named markets match');
  await page.locator('#resetFilters').click();
  await page.locator('#buildTripPlan').click();
  await expect(page.locator('#tripPlannerOutput')).toContainText('Eke Awka');
  await page.locator('#tripPlannerOutput').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, `${baseline ? 'before' : 'after'}-market-days.png`) });
  await page.getByRole('button', { name: 'Copy trip brief', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Eke');
  await context.setOffline(true);
  await page.locator('#lookupDate').fill('2026-01-05');
  await page.locator('#lookupDate').press('Tab');
  await expect(page.locator('#selectedDayName')).toHaveText('Orie');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('legacy Lobola planner attributes still work without shared personalization', async ({ page }) => {
  await page.goto('/tools/lobola-calculator/');
  await page.setContent('<div data-lobola-quick-planner data-country-code="zw" data-country-name="Zimbabwe" data-currency="USD" data-symbol="$" data-cattle="2" data-per-head="500"></div>');
  await page.addScriptTag({ path: path.join(__dirname, '../../assets/js/pages/lobola-country-quick-planner.js') });
  await expect(page.locator('.lc-quick-total')).toHaveText('$1,000');
  await expect(page.getByRole('link', { name: 'Open full family planner' })).toHaveAttribute('href', /country=zw&currency=USD/);
});

test('existing amount workflow save and print actions stay available to guests', async ({ page }) => {
  for (const slug of ['amount-words-gh', 'naira-to-words']) {
    await page.goto(`/tools/${slug}/`);
    await page.locator('#amount').fill('12500.75');
    await page.locator('[data-afw-save]').click();
    await expect(page.locator('.afw-status')).toContainText('Saved');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('african_workflow_items')).length)).toBeGreaterThan(0);
    await page.evaluate(() => { window.testPrintCalls = 0; window.print = () => { window.testPrintCalls++; }; });
    await page.locator('[data-afw-pdf]').click();
    await expect.poll(() => page.evaluate(() => window.testPrintCalls)).toBe(1);
  }
});

test('desktop completion and Lobola print handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  for (const slug of ['amount-words-gh', 'naira-to-words']) {
    await page.goto(`/tools/${slug}/`);
    await page.locator('#amount').fill('12500.75');
    await expect(page.locator('#resultCard')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/tools/lobola-calculator/');
  await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
  await expect(page.locator('#rTotal')).toHaveText('R 198,000');
  await page.evaluate(() => { window.testPrintCalls = 0; window.print = () => { window.testPrintCalls++; }; });
  await page.getByRole('button', { name: 'Print summary', exact: true }).click();
  expect(await page.evaluate(() => window.testPrintCalls)).toBe(1);
  await page.goto('/tools/market-days/?date=2026-01-04');
  await expect(page.locator('#selectedDayName')).toHaveText('Eke');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

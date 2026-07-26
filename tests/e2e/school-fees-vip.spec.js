const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const landing = '/tools/school-fees/';
const app = '/tools/school-fees/app.html';

test.describe('School Fees VIP', () => {
  test('validates inputs, calculates disclosed reserve pressure and keeps saving explicit', async ({ page }) => {
    const privateName = 'Private Household School 7813';
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push((request.postData() || '') + request.url());
    });
    await page.goto(landing, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.schoolFeesEngine);
    await page.locator('#sfCurrency').fill('NG');
    await page.getByRole('button', { name: 'Run pressure check' }).click();
    await expect(page.locator('#sfQuickStatus')).toContainText('not calculated');
    await expect(page.locator('#sfQuickResult')).toContainText('three-letter currency code');

    await page.locator('#sfCurrency').fill('NGN');
    await page.locator('#sfSchoolName').fill(privateName);
    await page.locator('#sfTuition').fill('1200000');
    await page.locator('#sfExtras').fill('240000');
    await page.locator('#sfMonthlySupport').fill('200000');
    await page.getByRole('button', { name: 'Run pressure check' }).click();
    await expect(page.locator('#sfQuickResult')).toContainText('NGN 1,440,000');
    await expect(page.locator('#sfQuickResult')).toContainText('60% of support');
    await expect(page.locator('#sfQuickResult')).toContainText('planning heuristics');
    expect(await page.evaluate(() => localStorage.getItem('afrotools_school_fees_pressure_pack'))).toBeNull();
    expect(writes.every(value => !decodeURIComponent(value).includes(privateName))).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });

  test('exports TXT and invokes print without uploading private quick-check values', async ({ page }) => {
    const fixture = 'Example Family School';
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push((request.postData() || '') + request.url());
    });
    await page.goto(landing, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.schoolFeesEngine);
    await page.locator('#sfSchoolName').fill(fixture);
    await page.getByRole('button', { name: 'Run pressure check' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain(fixture);
    expect(text).toContain('Planning estimate only');

    await page.evaluate(() => {
      window.__schoolFeesPrintCalled = false;
      window.print = () => { window.__schoolFeesPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__schoolFeesPrintCalled)).toBe(true);
    const pdf = await page.pdf({ printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(10_000);
    expect(writes.every(value => !value.includes(fixture))).toBe(true);
  });

  test('labels live records honestly and keeps non-annual handoffs non-annual', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('**/api/school-fees?**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        fees: [
          {
            institution_name: 'Example Academy',
            city: 'Accra',
            education_level: 'Secondary',
            institution_type: 'Private',
            annual_tuition: 1000,
            extras_total: 100,
            fee_period: 'Term',
            currency_code: 'GHS',
            source_type: 'official_notice',
            proof_url: 'https://school.example/fees',
            observed_at: '2026-07-01T00:00:00Z',
            verification_state: 'pending',
            review_status: 'pending'
          }
        ]
      })
    }));
    await page.goto(app, { waitUntil: 'commit' });
    await expect(page.locator('#mdList')).toContainText('Example Academy');
    await expect(page.locator('#mdList')).toContainText('Published with proof link');
    await expect(page.locator('#mdList')).toContainText('not labelled annual');
    const handoff = await page.locator('#mdList a', { hasText: 'Plan in Student Budget' }).getAttribute('href');
    expect(handoff).toContain('reportedFee=1100');
    expect(handoff).not.toContain('annualFee=');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    expect(runtimeErrors).toEqual([]);
  });

  test('shows a usable failure state when the public feed is unavailable', async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('**/api/school-fees?**', route => route.abort());
    await page.goto(app, { waitUntil: 'commit' });
    await expect(page.locator('#mdList')).toContainText('temporarily unavailable');
    await expect(page.locator('#mdList')).toHaveAttribute('aria-busy', 'false');
  });

  test('app reflows in real dark mode at 375px with 200% text and keeps controls named', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.route('**/api/school-fees?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"fees":[]}' }));
    await page.goto(app, { waitUntil: 'commit' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const audit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      foreground: getComputedStyle(document.querySelector('.md-panel-title')).color,
      background: getComputedStyle(document.querySelector('.md-panel')).backgroundColor,
      unnamed: Array.from(document.querySelectorAll('.md-shell input, .md-shell select, .md-shell button')).filter(element => {
        const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        return !explicit && !element.getAttribute('aria-label') && !element.textContent.trim();
      }).map(element => element.id || element.outerHTML.slice(0, 80))
    }));
    expect(audit.overflow).toBeLessThanOrEqual(1);
    expect(audit.foreground).not.toBe(audit.background);
    expect(audit.unnamed).toEqual([]);
    await expect(page.locator('#sfNextSteps')).toContainText('Confirm with the school');
  });

  for (const width of [320, 360]) {
    test(`quick check has no app-level overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(landing, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AfroTools && window.AfroTools.schoolFeesEngine);
      await page.getByRole('button', { name: 'Run pressure check' }).click();
      const overflow = await page.locator('.fees-check-card').evaluate(element => element.scrollWidth - element.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
    });
  }

  test('uses self-hosted DM Sans and remains usable in dark mode at 375px with 200% text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(landing, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.schoolFeesEngine);
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('button', { name: 'Run pressure check' }).click();
    const metrics = await page.evaluate(() => ({
      hasGoogleFont: Array.from(document.styleSheets).some(sheet => String(sheet.href || '').includes('fonts.googleapis.com')),
      overflow: document.querySelector('.fees-check-card').scrollWidth - document.querySelector('.fees-check-card').clientWidth,
      foreground: getComputedStyle(document.querySelector('.fees-check-copy h2')).color,
      background: getComputedStyle(document.querySelector('.fees-check')).backgroundColor
    }));
    expect(metrics.hasGoogleFont).toBe(false);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.foreground).not.toBe(metrics.background);
  });

  test('gives all app-local form controls accessible names', async ({ page }) => {
    await page.goto(landing, { waitUntil: 'commit' });
    const unnamed = await page.evaluate(() => Array.from(document.querySelectorAll('.fees-check input, .fees-check select, .fees-check button')).filter(element => {
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !explicit && !element.getAttribute('aria-label') && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});

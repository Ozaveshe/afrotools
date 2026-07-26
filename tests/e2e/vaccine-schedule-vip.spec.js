const fs = require('node:fs');
const { expect, test } = require('@playwright/test');

test.describe('Vaccination programme finder VIP route', () => {
  for (const scenario of [
    { name: '320px dark', width: 320, height: 844, theme: 'dark' },
    { name: '375px light', width: 375, height: 844, theme: 'light' },
    { name: 'desktop light', width: 1280, height: 900, theme: 'light' }
  ]) {
    test(`${scenario.name} has no overflow, page CDN fonts or unnamed controls`, async ({ page }) => {
      const errors = [];
      const remoteAssets = [];
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/npm\/chart\.js/i.test(request.url())) remoteAssets.push(request.url());
      });
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' });
      await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), scenario.theme);
      const response = await page.goto('/tools/vaccine-schedule/', { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), scenario.theme);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Start with the official programme, then confirm at the clinic');
      await expect(page.getByText('Possible severe reaction after vaccination?')).toBeVisible();
      const audit = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('main input, main select, main button')].filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamed: controls.filter(control => {
            if (control.labels && [...control.labels].some(label => label.textContent.trim())) return false;
            return !control.textContent.trim() && !control.getAttribute('aria-label');
          }).map(control => `${control.tagName}#${control.id}`)
        };
      });
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamed).toEqual([]);
      expect(remoteAssets).toEqual([]);
      expect(errors).toEqual([]);
      if (scenario.theme === 'dark') {
        expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(247, 250, 252)');
      }
    });
  }

  test('requires country, age band and clarification reason', async ({ page }) => {
    await page.goto('/tools/vaccine-schedule/');
    await page.getByRole('button', { name: 'Prepare official handoff' }).click();
    await expect(page.getByRole('heading', { name: 'Check the selected fields' })).toBeVisible();
    await expect(page.locator('#country')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#age-band')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#record-status')).toHaveAttribute('aria-invalid', 'true');
  });

  test('country handoff never renders a vaccine table, due date or completion verdict', async ({ page }) => {
    await page.goto('/tools/vaccine-schedule/');
    await page.locator('#country').selectOption('NG');
    await page.locator('#age-band').selectOption('infant');
    await page.locator('#record-status').selectOption('missed');
    await page.getByRole('button', { name: 'Prepare official handoff' }).click();
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://nphcda.gov.ng/nericc/');
    await expect(page.locator('#question-list')).toContainText('create the catch-up plan from the exact record');
    await expect(page.locator('#handoff')).toContainText('No schedule or completion verdict was generated');
    await expect(page.locator('#handoff table, #handoff input[type="checkbox"], #handoff time')).toHaveCount(0);
    await expect(page.locator('#handoff')).not.toContainText(/overdue|fully vaccinated|up to date|restart the series/i);
  });

  test('unverified country source fails closed to WHO and a local provider', async ({ page }) => {
    await page.goto('/tools/vaccine-schedule/');
    await page.locator('#country').selectOption('ET');
    await page.locator('#age-band').selectOption('school-age');
    await page.locator('#record-status').selectOption('unclear');
    await page.getByRole('button', { name: 'Prepare official handoff' }).click();
    await expect(page.locator('#official-link')).toBeHidden();
    await expect(page.locator('#source-status')).toContainText('No current country schedule page safely verified');
    await expect(page.locator('#source-status')).toContainText('Fail-closed');
    await expect(page.locator('#who-link')).toBeVisible();
  });

  test('local export and print are ungated and do not leak family inputs', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url() + ' ' + (request.postData() || ''));
    });
    await page.goto('/tools/vaccine-schedule/');
    await page.locator('#country').selectOption('ZA');
    await page.locator('#age-band').selectOption('adolescent');
    await page.locator('#record-status').selectOption('unclear');
    await page.locator('#record-product').fill('Synthetic-Record-Only-39217');
    await page.getByRole('button', { name: 'Prepare official handoff' }).click();
    await expect(page.locator('#handoff input[type="email"], #handoff form, #handoff a[href*="login"], #handoff a[href*="pro"]')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download text brief' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('vaccination-programme-visit-brief.txt');
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Synthetic-Record-Only-39217');
    expect(text).toContain('NO COMPLETION VERDICT');
    expect(text).toContain('not a vaccination card');
    expect(writes.filter(request => request.includes('Synthetic-Record-Only-39217'))).toEqual([]);
    await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__printed)).toBe(true);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(15000);
  });
});

const { expect, test } = require('@playwright/test');

test.describe('Medication arithmetic VIP route', () => {
  for (const scenario of [
    { name: '320px dark', width: 320, height: 844, theme: 'dark' },
    { name: '375px light', width: 375, height: 844, theme: 'light' },
    { name: 'desktop light', width: 1280, height: 900, theme: 'light' }
  ]) {
    test(`${scenario.name} is usable without overflow or remote fonts`, async ({ page }) => {
      const errors = [];
      const remoteFonts = [];
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (/fonts\.(googleapis|gstatic)\.com/i.test(request.url())) remoteFonts.push(request.url());
      });
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' });
      await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), scenario.theme);
      const response = await page.goto('/tools/drug-dosage/', { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), scenario.theme);

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('Medication dose arithmetic checker');
      await expect(page.getByText('Possible overdose, poisoning, wrong medicine, or severe reaction?')).toBeVisible();
      const audit = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('main button, main input, main select')].filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
        });
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamed: controls.filter(control => {
            if (control.labels && [...control.labels].some(label => label.textContent.trim())) return false;
            return !control.getAttribute('aria-label') && !control.textContent.trim();
          }).map(control => `${control.tagName}#${control.id}`)
        };
      });
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamed).toEqual([]);
      expect(remoteFonts).toEqual([]);
      expect(errors).toEqual([]);
      if (scenario.theme === 'dark') {
        const darkBackground = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
        expect(darkBackground).toMatch(/^rgb\((?:[0-3]?\d), (?:[0-3]?\d), (?:[0-3]?\d)\)$/);
      }
    });
  }

  test('requires a clinician instruction and blocks invalid liquid arithmetic', async ({ page }) => {
    await page.goto('/tools/drug-dosage/');
    await page.getByRole('button', { name: 'Check arithmetic' }).click();
    await expect(page.getByRole('heading', { name: 'Check the highlighted fields' })).toBeVisible();
    await expect(page.locator('#instruction-confirmed')).toHaveAttribute('aria-invalid', 'true');

    await page.locator('#instruction-confirmed').check();
    await page.locator('#prescribed-dose').fill('250');
    await page.locator('#output-mode').selectOption('liquid');
    await page.locator('#concentration-mass').fill('125');
    await page.locator('#concentration-volume').fill('5');
    await page.getByRole('button', { name: 'Check arithmetic' }).click();
    await expect(page.locator('#result-value')).toHaveText('10 mL');
    await expect(page.locator('#result-caution')).toContainText('does not confirm');
  });

  test('weight conversion is deterministic and fractional solid count is not rounded', async ({ page }) => {
    await page.goto('/tools/drug-dosage/');
    await page.locator('#instruction-confirmed').check();
    await page.locator('#dose-basis').selectOption('weight');
    await page.locator('#prescribed-dose').fill('10');
    await page.locator('#body-weight').fill('10');
    await page.locator('#weight-unit').selectOption('kg');
    await page.locator('#output-mode').selectOption('solid');
    await page.locator('#unit-strength').fill('80');
    await page.getByRole('button', { name: 'Check arithmetic' }).click();
    await expect(page.locator('#result-value')).toHaveText('1.25 whole tablet/capsule unit(s)');
    await expect(page.locator('#result-caution')).toContainText('Do not split, crush, open, or substitute');
  });

  test('local print and download actions have no email or account gate', async ({ page }) => {
    await page.goto('/tools/drug-dosage/');
    await page.locator('#instruction-confirmed').check();
    await page.locator('#prescribed-dose').fill('250');
    await page.getByRole('button', { name: 'Check arithmetic' }).click();
    await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download text worksheet' })).toBeVisible();
    await expect(page.locator('#result-panel input[type="email"]')).toHaveCount(0);
    await expect(page.locator('#result-panel a[href*="login"], #result-panel a[href*="pro"], #result-panel form')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download text worksheet' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('medication-arithmetic-worksheet.txt');
  });
});

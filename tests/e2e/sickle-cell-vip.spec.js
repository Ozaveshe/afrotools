const fs = require('node:fs');
const { expect, test } = require('@playwright/test');

test.describe('Sickle cell inheritance VIP route', () => {
  for (const scenario of [
    { name: '320px dark', width: 320, height: 844, theme: 'dark' },
    { name: '375px light', width: 375, height: 844, theme: 'light' },
    { name: 'desktop light', width: 1280, height: 900, theme: 'light' }
  ]) {
    test(`${scenario.name} has no overflow, remote fonts or unnamed controls`, async ({ page }) => {
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
      const response = await page.goto('/tools/sickle-cell/', { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), scenario.theme);

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('See how two confirmed results can combine');
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
        const background = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
        expect(background).not.toBe('rgb(247, 250, 252)');
      }
    });
  }

  test('requires confirmed results and renders AS x AS without a verdict', async ({ page }) => {
    await page.goto('/tools/sickle-cell/');
    await page.getByRole('button', { name: 'Show inheritance probabilities' }).click();
    await expect(page.getByRole('heading', { name: 'Check the selected results' })).toBeVisible();
    await page.locator('#lab-confirmed').check();
    await page.locator('#result-one').selectOption('AS');
    await page.locator('#result-two').selectOption('AS');
    await page.getByRole('button', { name: 'Show inheritance probabilities' }).click();
    await expect(page.locator('#outcomes .sc-outcome')).toHaveCount(3);
    await expect(page.locator('#outcomes')).toContainText('25%');
    await expect(page.locator('#outcomes')).toContainText('50%');
    await expect(page.locator('#outcomes')).toContainText('Sickle cell trait');
    await expect(page.locator('#outcomes')).toContainText('HbSS sickle cell disease');
    await expect(page.locator('#results')).not.toContainText(/compatible|safe combination|danger|avoid/i);
  });

  test('order-independent SC/AC math keeps every probability tied to each pregnancy', async ({ page }) => {
    await page.goto('/tools/sickle-cell/');
    await page.locator('#lab-confirmed').check();
    await page.locator('#result-one').selectOption('SC');
    await page.locator('#result-two').selectOption('AC');
    await page.getByRole('button', { name: 'Show inheritance probabilities' }).click();
    await expect(page.locator('#outcomes')).toContainText('AS');
    await expect(page.locator('#outcomes')).toContainText('AC');
    await expect(page.locator('#outcomes')).toContainText('SC');
    await expect(page.locator('#outcomes')).toContainText('CC');
    await expect(page.locator('#outcomes .sc-outcome-value')).toHaveText(['25%', '25%', '25%', '25%']);
    await expect(page.getByText('Read every percentage as “for each pregnancy”')).toBeVisible();
  });

  test('local print and text export are ungated and contain the model limits', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(request.url() + ' ' + (request.postData() || ''));
      }
    });
    await page.goto('/tools/sickle-cell/');
    await page.locator('#lab-confirmed').check();
    await page.locator('#result-one').selectOption('AS');
    await page.locator('#result-two').selectOption('AC');
    await page.getByRole('button', { name: 'Show inheritance probabilities' }).click();
    await expect(page.locator('#results input[type="email"], #results form, #results a[href*="login"], #results a[href*="pro"]')).toHaveCount(0);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download text summary' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sickle-cell-inheritance-summary.txt');
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('AS: 25%');
    expect(text).toContain('SC: 25%');
    expect(text).toContain('Each pregnancy is independent');
    expect(text).toContain('does not confirm a genotype');
    const genotypeLeaks = writes.filter(request => /parent1|parent2|result-one|result-two|%22AS%22|%22AC%22|=AS(?:&|$)|=AC(?:&|$)/i.test(request));
    expect(genotypeLeaks).toEqual([]);
    await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__printed)).toBe(true);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(15000);
  });
});

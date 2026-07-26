const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const screenshotDir = path.resolve(__dirname, '../../artifacts/day5-health-app5-genotype-verification');

async function captureProof(page, filename) {
  if (!process.env.VIP_SCREENSHOTS) return;
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
}

test.describe('Haemoglobin result verification guide VIP', () => {
  test('builds a one-result verification checklist and exports locally', async ({ page }) => {
    const consoleErrors = [];
    const requestBodies = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', (request) => {
      if (request.postData()) requestBodies.push(request.postData());
    });
    await page.goto('/tools/genotype-checker/');
    await expect(page.locator('h1')).toContainText('haemoglobin result');
    await expect(page.locator('#reported-result')).toHaveCount(1);
    await expect(page.locator('#result-one, #result-two')).toHaveCount(0);

    await page.locator('#reported-result').fill('Hb A/S');
    await page.locator('#test-method').selectOption('hplc');
    await page.locator('#test-date').fill('2026-07-20');
    await page.locator('#confirmation-status').selectOption('final');
    await page.getByRole('button', { name: 'Build verification checklist' }).click();

    const results = page.locator('#verification-results');
    await expect(results).toBeVisible();
    await expect(results).toContainText('A / S notation');
    await expect(results).toContainText('High-performance liquid chromatography');
    await expect(results).toContainText('Final laboratory report');
    await expect(page.locator('body')).not.toContainText(/four allele|punnett|25%|50%|100%|compatibility checker|safe match|danger/i);
    await captureProof(page, 'desktop-result-light.png');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('haemoglobin-result-verification-checklist.txt');
    await page.evaluate(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    expect(requestBodies).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('flags unsupported notation without guessing', async ({ page }) => {
    await page.goto('/tools/genotype-checker/');
    await page.locator('#reported-result').fill('Sβ+');
    await page.locator('#test-method').selectOption('unknown');
    await page.locator('#confirmation-status').selectOption('unsure');
    await page.getByRole('button', { name: 'Build verification checklist' }).click();
    await expect(page.locator('#verification-results')).toBeVisible();
    await expect(page.locator('#notation-label')).toContainText('laboratory clarification');
    await expect(page.locator('#flags-panel')).toContainText('Do not translate, reorder or guess');
    await expect(page.locator('#questions-list')).toContainText('What does every letter');
    await expect(page.locator('#verification-results')).not.toContainText(/AS —|sickle cell trait/i);
  });

  for (const width of [320, 375]) {
    test(`fits ${width}px in dark mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.goto('/tools/genotype-checker/');
      await page.locator('#reported-result').fill('SC');
      await page.locator('#test-method').selectOption('electrophoresis');
      await page.locator('#confirmation-status').selectOption('preliminary');
      await page.getByRole('button', { name: 'Build verification checklist' }).click();
      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth
      }));
      expect(overflow.document).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);
      await expect(page.locator('#verification-results')).toBeVisible();
      await captureProof(page, `mobile-${width}-result-dark.png`);
      const buttonHeight = await page.getByRole('button', { name: 'Download TXT' }).evaluate((node) => node.getBoundingClientRect().height);
      expect(buttonHeight).toBeGreaterThanOrEqual(48);
    });
  }

  test('moves focus to a clear error for missing notation', async ({ page }) => {
    await page.goto('/tools/genotype-checker/');
    await page.getByRole('button', { name: 'Build verification checklist' }).click();
    await expect(page.locator('#form-error')).toContainText('exactly as it appears');
    await expect(page.locator('#form-error')).toBeFocused();
    await expect(page.locator('#verification-results')).toBeHidden();
  });
});

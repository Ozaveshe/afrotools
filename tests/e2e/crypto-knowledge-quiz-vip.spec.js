'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

for (const route of [
  { path: '/crypto/quiz/', lang: 'en', set: 'Fundamentals', score: 'Exact score', topic: 'Networks' },
  { path: '/fr/crypto/quiz/', lang: 'fr', set: 'Fondamentaux', score: 'Score exact', topic: 'Reseaux' }
]) {
  test(`${route.lang} completes locally and exports parser-readable reviews`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); });

    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(page.locator('[data-quiz-set]')).toHaveCount(2);
    await expect(page.locator('#downloadText')).toBeHidden();
    await expect(page.locator('#downloadPdf')).toBeHidden();
    await expect(page.locator('#quizFeedback')).toHaveAttribute('aria-live', 'polite');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    await page.locator('[data-quiz-set="fundamentals"]').click();
    await expect(page.locator('#nextQuestion')).toBeDisabled();
    for (let index = 0; index < 6; index += 1) {
      const answer = await page.evaluate((questionIndex) => window.AfroToolsCryptoQuizBank.sets[0].questions[questionIndex].answer, index);
      const selected = page.locator('.quiz-option').nth(answer);
      await selected.click();
      await expect(selected).toHaveAttribute('data-state', 'correct');
      await expect(page.locator('#quizFeedback')).toBeVisible();
      await expect(page.locator('#nextQuestion')).toBeEnabled();
      await page.locator('#nextQuestion').click();
    }
    await expect(page.locator('#scoreValue')).toContainText('6 / 6');
    await expect(page.locator('#sharePreview')).toContainText(`${page.url().replace(/\/$/, '')}/`);
    await expect(page.locator('#sharePreview')).not.toContainText('peer-to-peer');
    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /quiz|crypto/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]);

    const textPending = page.waitForEvent('download');
    await page.locator('#downloadText').click();
    const textDownload = await textPending;
    const textContent = fs.readFileSync(await textDownload.path(), 'utf8');
    expect(textContent).toContain(`${route.score}: 6 / 6`);
    expect(textContent).toContain('https://bitcoin.org/en/bitcoin-paper');

    const pdfPending = page.waitForEvent('download');
    await page.locator('#downloadPdf').click();
    const pdfDownload = await pdfPending;
    const parsed = await pdfParse(fs.readFileSync(await pdfDownload.path()));
    expect(parsed.text).toContain(`${route.score}: 6 / 6`);
    expect(parsed.text).toContain(route.topic);
    expect(parsed.text).toContain('https://bitcoin.org/en/bitcoin-paper');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await expect(page.locator('#quizResult')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    expect(errors).toEqual([]);
  });
}

test('malformed bank fails closed before quiz interaction', async ({ page }) => {
  await page.route(/\/assets\/js\/data\/crypto-quiz-bank\.js(?:\?.*)?$/, (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.AfroToolsCryptoQuizBank={schemaVersion:1,reviewedAt:"2026-02-30",boundary:{en:"x",fr:"x"},sets:[]};'
  }));
  await page.goto('/crypto/quiz/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#quizIntro')).toContainText('unavailable');
  await expect(page.locator('[data-quiz-set]')).toHaveCount(0);
});

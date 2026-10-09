'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const pdfLib = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin && route.request().method() === 'GET' && !/^\/(?:api\/|\.netlify\/)/.test(url.pathname)) return route.continue();
    return route.abort();
  });
});

async function clipboard(page, mode) {
  await page.evaluate(mode => {
    window.testCopiedText = null;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: mode === 'missing' ? undefined : { writeText(text) {
        if (mode === 'throw') throw new Error('Synthetic clipboard denial');
        if (mode === 'reject') return Promise.reject(new Error('Synthetic clipboard denial'));
        if (mode === 'pending') return new Promise((resolve, reject) => { window.finishTestCopy = resolve; window.rejectTestCopy = reject; });
        window.testCopiedText = text;
        return Promise.resolve();
      } }
    });
  }, mode);
}

test('PDF Chat copy failures and late completions preserve local transcript state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/pdf-chat/');
  const pdf = await pdfLib.PDFDocument.create();
  pdf.addPage().drawText('Synthetic workshop note. The community workshop opens on Tuesday. Bring a blue notebook.', { x: 40, y: 700, size: 12 });
  await page.locator('#fileInput').setInputFiles({ name: 'synthetic-workshop.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#aiAssistConsent')).not.toBeChecked();
  async function ask() {
    await page.locator('#chatInput').fill('When does the community workshop open?');
    await page.locator('#sendBtn').click();
    await expect(page.locator('#chatFooter')).toContainText('Answered locally');
    await expect(page.locator('#messages')).toContainText('Tuesday');
  }
  await ask();
  for (const mode of ['missing', 'throw', 'reject', 'success']) {
    await clipboard(page, mode);
    await page.evaluate(() => { document.getElementById('chatFooter').textContent = 'Waiting for copy'; });
    await page.locator('#copyChatBtn').click();
    await expect(page.locator('#chatFooter')).toHaveText(mode === 'success' ? 'Transcript copied to clipboard.' : 'Copy failed. Use Download instead.');
    if (mode === 'success') expect(await page.evaluate(() => window.testCopiedText)).toContain('Tuesday');
  }
  for (const rejected of [false, true]) {
    await clipboard(page, 'pending');
    await page.locator('#copyChatBtn').click();
    await page.waitForFunction(() => typeof window.finishTestCopy === 'function');
    await page.locator('#clearChatBtn').click();
    const cleared = await page.locator('#chatFooter').textContent();
    await page.evaluate(async rejected => {
      if (rejected) window.rejectTestCopy(new Error('Synthetic delayed denial'));
      else window.finishTestCopy();
      await new Promise(resolve => setTimeout(resolve, 0));
    }, rejected);
    await expect(page.locator('#chatFooter')).toHaveText(cleared);
    await ask();
  }
  const pending = page.waitForEvent('download');
  await page.locator('#downloadChatBtn').click();
  const bytes = await fs.readFile(await (await pending).path());
  expect(bytes.toString()).toContain('Tuesday');
  expect(bytes.toString()).toContain('When does the community workshop open?');
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

for (const [locale, route] of [['en', '/tools/japa-calculator/'], ['sw', '/sw/zana/kikokotoo-uhamishaji/']]) {
  test(`${locale} relocation copy failures retain downloadable and editable results`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const values = { 'jb-pre': 100, 'jb-official': 200, 'jb-travel': 300, 'jb-housing': 400, 'jb-arrival': 50, 'jb-monthly': 500, 'jb-runway': 3, 'jb-buffer': 10, 'jb-savings': 1000, 'jb-saving-months': 6 };
    for (const [id, value] of Object.entries(values)) await page.locator('#' + id).fill(String(value));
    await page.locator('#jb-form button[type="submit"]').click();
    for (const mode of ['missing', 'throw', 'reject', 'success']) {
      await clipboard(page, mode);
      await page.locator('#jb-copy').click();
      await expect(page.locator('#jb-status')).toContainText(mode === 'success' ? (locale === 'sw' ? 'umenakiliwa' : 'Summary copied') : (locale === 'sw' ? 'Pakua TXT' : 'Download TXT'));
    }
    await clipboard(page, 'pending');
    await page.locator('#jb-copy').click();
    await page.waitForFunction(() => typeof window.finishTestCopy === 'function');
    await page.locator('#jb-monthly').fill('600');
    await page.evaluate(async () => { window.rejectTestCopy(new Error('Synthetic late denial')); await new Promise(resolve => setTimeout(resolve, 0)); });
    await expect(page.locator('#jb-status')).toHaveText('');
    const pending = page.waitForEvent('download');
    await page.locator('#jb-json').click();
    const parsed = JSON.parse(await fs.readFile(await (await pending).path(), 'utf8'));
    expect(parsed.result.total).toBe(3135);
    expect(parsed.result.gap).toBe(2135);
    expect(parsed.result.monthlySavingsTarget).toBe(2135 / 6);
    const txtPending = page.waitForEvent('download');
    await page.locator('#jb-txt').click();
    expect((await fs.readFile(await (await txtPending).path(), 'utf8'))).toContain('USD');
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

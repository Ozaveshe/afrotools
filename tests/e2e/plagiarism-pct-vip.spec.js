const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const route = '/tools/plagiarism-pct/';
const sensitivePhrase = 'private zebra copper lantern';
const draft = [
  `${sensitivePhrase} supports this argument with a local example.`,
  `${sensitivePhrase} supports another paragraph with different detail.`,
  'This sentence repeats exactly.',
  'This sentence repeats exactly.',
  'Additional words complete the sample without claiming plagiarism originality authorship or source matching.'
].join(' ');

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_DRAFT_REPETITION_VIP)).toBe(true);
});

async function analyzeDraft(page) {
  await page.locator('#ppDraft').fill(draft);
  await page.getByRole('button', { name: 'Inspect this draft' }).click();
}

test('reports only observable local draft repetition and writing counts', async ({ page }) => {
  await analyzeDraft(page);
  await expect(page.locator('#ppStats')).toContainText('Words');
  await expect(page.locator('#ppSummary')).toContainText('exact 4-word phrase');
  await expect(page.locator('#ppSummary')).toContainText('repeated exact sentence');
  await expect(page.locator('#ppSummary')).toContainText('not plagiarism, originality, AI-authorship or quality findings');
  await expect(page.locator('#ppPhrases')).toContainText(sensitivePhrase);
  await expect(page.locator('#ppSentences')).toContainText('this sentence repeats exactly');
});

test('rejects drafts too short for the selected repetition check', async ({ page }) => {
  await page.locator('#ppDraft').fill('This text is too short.');
  await page.getByRole('button', { name: 'Inspect this draft' }).click();
  await expect(page.locator('#ppStatus')).toContainText('at least 20 words');
  await expect(page.locator('#ppResults')).not.toHaveClass(/show/);
});

test('contains no plagiarism score, originality verdict, AI detector or external corpus claim', async ({ page }) => {
  const body = page.locator('body');
  await expect(body).not.toContainText('Looks Original');
  await expect(body).not.toContainText('Originality Score');
  await expect(body).not.toContainText('Plagiarism Score');
  await expect(body).not.toContainText('High Similarity Signals');
  await expect(page.locator('.pp-boundary')).toContainText('Not detectable here');
});

test('does not store the sensitive draft', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('afrotools-originality-self-check'));
  await analyzeDraft(page);
  expect(await page.evaluate(() => localStorage.getItem('afrotools-originality-self-check'))).toBe(null);
  await page.reload();
  await expect(page.locator('#ppDraft')).toHaveValue('');
});

test('omits examples from export by default and includes them only after explicit opt-in', async ({ page }) => {
  await analyzeDraft(page);
  const defaultDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const defaultDownload = await defaultDownloadPromise;
  const defaultText = fs.readFileSync(await defaultDownload.path(), 'utf8');
  expect(defaultText).not.toContain(sensitivePhrase);
  expect(defaultText).toContain('Draft text is not included.');

  await page.locator('#ppIncludeExamples').check();
  const optedDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const optedDownload = await optedDownloadPromise;
  const optedText = fs.readFileSync(await optedDownload.path(), 'utf8');
  expect(optedText).toContain(sensitivePhrase);
  expect(optedText).toContain('explicitly included by user');
});

test('escapes any locally displayed phrase content', async ({ page }) => {
  const hostile = Array(3).fill('img src x onerror window draftXss alpha beta gamma delta repeats safely.').join(' ') + ' extra words complete this harmless draft for local analysis.';
  await page.locator('#ppDraft').fill(hostile);
  await page.getByRole('button', { name: 'Inspect this draft' }).click();
  expect(await page.evaluate(() => window.draftXss)).toBeUndefined();
  await expect(page.locator('#ppResults img')).toHaveCount(0);
});

test('keeps phrase examples out of default print and produces a valid PDF', async ({ page }) => {
  await analyzeDraft(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.pp-phrase-list')).toHaveCSS('display', 'none');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
  await page.locator('#ppIncludeExamples').evaluate((checkbox) => { checkbox.checked = true; });
  await page.evaluate(() => document.body.classList.add('pp-include-examples'));
  await expect(page.locator('.pp-phrase-list')).not.toHaveCSS('display', 'none');
});

test('is mobile-safe, dark-capable, fully labelled and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.pp-card').first()).toHaveCSS('background-color', 'rgb(16, 35, 55)');
  await expect(page.getByLabel('Essay or draft text')).toBeVisible();
  expect(await page.locator('.pp-form-card textarea, .pp-form-card select, .pp-form-card input').count()).toBe(4);
  expect(await page.locator('.pp-form-card label[for]').count()).toBe(4);
  await expect(page.locator('#ppActionStatus')).toHaveAttribute('aria-live', 'polite');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});

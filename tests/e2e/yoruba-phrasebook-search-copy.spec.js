const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

const route = '/yo/awon-ise/olufassara-yoruba/';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.copiedValues = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => { window.copiedValues.push(value); }
    } });
  });
  await page.goto(route);
});

test('accent-insensitive search preserves NFC display and copied Yoruba', async ({ page }) => {
  const query = page.getByLabel('Tẹ ohun tí o n wa');
  for (const value of ['e se', 'Ẹ ṣé', 'Ẹ ṣé'.normalize('NFD'), ' E SE ']) {
    await query.fill(value);
    await expect(page.locator('#phraseResult strong')).toHaveText('Ẹ ṣé');
    await page.getByRole('button', { name: 'Dà gbólóhùn kọ́' }).click();
    await expect(page.locator('#phraseCopyStatus')).toHaveText('A ti dàkọ gbólóhùn.');
  }
  const expected = 'Ẹ ṣé\nỌrọ ìmoore.';
  expect(await page.evaluate(() => window.copiedValues)).toEqual(Array(4).fill(expected));
  expect(expected.normalize('NFC')).toBe(expected);
  // Search folding is temporary: the authored phrase data remains intact.
  expect(await page.evaluate(() => window.phrases[2][1])).toBe('Ẹ ṣé');
  await query.fill('phrase-that-does-not-exist');
  await expect(page.getByRole('button', { name: 'Dà gbólóhùn kọ́' })).toBeDisabled();
  await query.fill('');
  await expect(page.getByRole('button', { name: 'Dà gbólóhùn kọ́' })).toBeDisabled();
});

test('keyboard selection and draft copying report success and denial', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const phrase = page.locator('#phraseGrid button').first();
  await phrase.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Dà gbólóhùn kọ́' })).toBeEnabled();
  await page.getByRole('button', { name: 'Ìrìnàjò', exact: true }).click();
  await page.getByRole('button', { name: 'Dà àkọsílẹ̀ kọ́' }).click();
  await expect(page.locator('#draftCopyStatus')).toHaveText('A ti dàkọ àkọsílẹ̀.');
  expect(await page.evaluate(() => window.copiedValues.at(-1))).toBe(await page.locator('#draftResult').textContent());
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new DOMException('Synthetic permission denial', 'NotAllowedError'); };
  });
  await page.getByRole('button', { name: 'Dà gbólóhùn kọ́' }).click();
  await expect(page.locator('#phraseCopyStatus')).toContainText('Kò ṣeé dàkọ');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await page.getByRole('button', { name: 'Dà àkọsílẹ̀ kọ́' }).click();
  await expect(page.locator('#draftCopyStatus')).toContainText('Kò ṣeé dàkọ');
  expect(errors).toEqual([]);
});

test('small-width workflow keeps locale identity, labels and accessibility', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.getByLabel('Tẹ ohun tí o n wa').fill('e se');
  await expect(page.locator('#phraseResult strong')).toHaveText('Ẹ ṣé');
  await expect(page.locator('html')).toHaveAttribute('lang', 'yo');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + route);
  await expect(page.locator('main aside a.fallback[href="/tools/yoruba-translator/"] small')).toHaveText('Ojú ìwé Gẹẹsi');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
  })).violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target), details: nodes.map(node => node.failureSummary) })));
  if (process.env.AFROTOOLS_ROTATION_SCREENSHOT) {
    await page.screenshot({ path: process.env.AFROTOOLS_ROTATION_SCREENSHOT, fullPage: true });
  }
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

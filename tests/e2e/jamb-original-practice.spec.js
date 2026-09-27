const { test, expect } = require('@playwright/test');
const source = require('../../ops/nigeria-exams/jamb-original-practice-v1.json');

for (const width of [320, 390, 1280]) {
  test(`original practice is usable at ${width}px without mixing mock history`, async ({ page }) => {
    const attempts = [];
    await page.setViewportSize({ width, height: 850 });
    await page.route('**/.netlify/functions/jamb-attempt', route => { attempts.push(route.request().postDataJSON()); return route.fulfill({ status: 200, json: {} }); });
    await page.goto('/jamb/original-practice/?subject=mathematics');
    await expect(page.getByRole('heading', { name: /Practise a topic/ })).toBeVisible();
    await expect(page.locator('#setup-status')).toContainText('24 reviewed original questions');
    await expect(page.locator('#start-btn')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

    await page.locator('#start-btn').click();
    await expect(page.locator('#quiz-heading')).toHaveText('Mathematics');
    await expect(page.locator('#nav-grid button')).toHaveCount(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const firstPrompt = await page.locator('#question').textContent();
    const first = source.questions.find(q => q.question === firstPrompt);
    expect(first).toBeTruthy();
    await page.locator(`#options input[value="${first.answer}"]`).check();
    await expect(page.locator('#progress')).toContainText('1 of 12 answered');
    await page.locator('#next-btn').click();
    await page.locator('#prev-btn').click();
    await expect(page.locator(`#options input[value="${first.answer}"]`)).toBeChecked();
    const storage = await page.evaluate(() => ({ original: localStorage.getItem('afrojamb-original-cbt-state-v1'),
      mock: localStorage.getItem('afrojamb-cbt-state') }));
    expect(storage.original).toBeTruthy();
    expect(storage.mock).toBeNull();

    if (width === 1280) {
      for (let i = 0; i < 12; i++) {
        await page.locator('#nav-grid button').nth(i).click();
        const prompt = await page.locator('#question').textContent();
        const item = source.questions.find(q => q.question === prompt);
        expect(item).toBeTruthy();
        await page.locator(`#options input[value="${item.answer}"]`).check();
      }
      page.once('dialog', dialog => dialog.accept());
      await page.locator('#submit-btn').click();
      await expect(page.locator('#raw-score')).toHaveText('12 / 12');
      await expect(page.locator('#result-note')).toContainText('not a JAMB aggregate');
      await expect(page.locator('#review-list details')).toHaveCount(12);
      await expect(page.locator('#review-list details').first()).not.toHaveAttribute('open');
      await page.locator('#review-list summary').first().click();
      await expect(page.locator('#review-list details').first()).toHaveAttribute('open', '');
      expect(attempts).toHaveLength(0);
      const local = await page.evaluate(() => ({ original: JSON.parse(localStorage.getItem('afrojamb-original-history-v1')),
        mock: localStorage.getItem('afrojamb-history') }));
      expect(local.original[0]).toMatchObject({ subject: 'mathematics', correct: 12, total: 12 });
      expect(local.mock).toBeNull();
    }
  });
}

test('Use of English presents the authored passage and can resume only its original session', async ({ page }) => {
  await page.goto('/jamb/original-practice/?subject=english');
  await expect(page.locator('#setup-status')).toContainText('24 reviewed original questions');
  await page.locator('#start-btn').click();
  await expect(page.locator('#quiz-heading')).toHaveText('Use of English');
  for (let i = 0; i < 12; i++) {
    await page.locator('#nav-grid button').nth(i).click();
    const prompt = await page.locator('#question').textContent();
    const item = source.questions.find(q => q.question === prompt);
    expect(item).toBeTruthy();
    await expect(page.locator('#passage')).toHaveJSProperty('hidden', !item.passage);
  }
  await page.reload();
  await expect(page.locator('#resume-btn')).toBeVisible();
  await page.locator('#resume-btn').click();
  await expect(page.locator('#quiz-heading')).toHaveText('Use of English');
  await expect(page.locator('#nav-grid button')).toHaveCount(12);
});

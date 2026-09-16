const { test, expect } = require('@playwright/test');

for (const width of [390, 1280]) {
  test(`recent collection works in the main question browser at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/jamb/past-questions/');
    await expect(page.locator('#f-year')).toBeEnabled();
    await page.locator('#f-subject').selectOption('mathematics');
    await page.locator('#f-year').selectOption('2023');
    const cards = page.locator('[data-reviewed-question]');
    await expect(cards).toHaveCount(8);
    for (const card of await cards.all()) {
      await expect(card).toContainText('2023 collection');
      await expect(card).not.toContainText('Qnull');
      await expect(card.getByRole('link', { name: 'Myschool collection source' })).toHaveAttribute('href', /^https:\/\/myschool\.ng\/classroom\/mathematics\//);
      await card.getByRole('button', { name: 'Reveal answer', exact: true }).click();
      await card.locator('summary').click();
      await expect(card.locator('.reviewed-explanation')).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto('/jamb/mathematics/2023/');
    await expect(page.locator('[data-reviewed-question]')).toHaveCount(8);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/jamb/mathematics/2023/');
    await expect(page.locator('body')).toContainText('Original sitting and question number unconfirmed');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('recent questions retain collection attribution through timed quiz scoring', async ({ page }) => {
  await page.goto('/jamb/cbt/');
  const result = await page.evaluate(async () => {
    const pool = await AfroJAMB.QuestionTrust.loadPool();
    const state = AfroJAMB.CBT.init({ pool: pool.questions, poolRevision: pool.review_revision,
      subjects: ['mathematics'], year: 2023, questionsPerSubject: 8, mode: 'quick' });
    renderQuestion();
    const sourceText = document.getElementById('cbt-q-source').textContent;
    for (let i = 0; i < state.questions.length; i++) {
      AfroJAMB.CBT.goto(i);
      AfroJAMB.CBT.selectAnswer(state.questions[i].answer);
    }
    const score = AfroJAMB.CBT.submit();
    return { sourceText, score, count: state.questions.length };
  });
  expect(result.count).toBe(8);
  expect(result.sourceText).toContain('Myschool 2023 collection');
  expect(result.score.pctCorrect).toBe(100);
  const rows = Object.values(result.score).find(value => Array.isArray(value) && value[0]?.correctAnswer);
  expect(rows).toHaveLength(8);
  for (const row of rows) expect(row.source_provenance.year_basis).toBe('publisher-collection');
});

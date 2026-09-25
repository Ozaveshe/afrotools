const { test, expect } = require('@playwright/test');
const mathematicsPool = require('../../data/jamb/pools/mathematics.json');

const reviewed2023Questions = mathematicsPool.questions.filter(question =>
  question.year === 2023 && question.review?.status === 'reviewed');
const reviewed2023Ids = reviewed2023Questions.map(question => question.id).sort();

function renderedQuestionIds(cards) {
  return cards.evaluateAll(elements => elements.map(element => element.dataset.reviewedQuestion).sort());
}

for (const width of [390, 1280]) {
  test(`recent collection works in the main question browser at ${width}px`, async ({ page }) => {
    expect(reviewed2023Questions.length).toBeGreaterThanOrEqual(60);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/jamb/past-questions/');
    await expect(page.locator('#f-year')).toBeEnabled();
    await page.locator('#f-subject').selectOption('mathematics');
    await page.locator('#f-year').selectOption('2023');
    const cards = page.locator('[data-reviewed-question]');
    await expect(page.locator('#result-meta')).toContainText(`${reviewed2023Questions.length} reviewed questions`);
    await expect(cards).toHaveCount(20);
    for (let shown = 20; shown < reviewed2023Questions.length; shown += 20) {
      await page.locator('#load-more').click();
    }
    await expect(cards).toHaveCount(reviewed2023Questions.length);
    await expect(page.locator('#load-more-wrap')).toBeHidden();
    expect(await renderedQuestionIds(cards)).toEqual(reviewed2023Ids);
    for (const card of await cards.all()) {
      await expect(card).toContainText('2023 collection');
      await expect(card).not.toContainText('Qnull');
      await expect(card.getByRole('link', { name: 'Myschool collection source' })).toHaveAttribute('href', /^https:\/\/myschool\.ng\/classroom\/mathematics\//);
    }
    for (const index of [0, Math.floor(reviewed2023Questions.length / 2), reviewed2023Questions.length - 1]) {
      const card = cards.nth(index);
      await card.getByRole('button', { name: 'Reveal answer', exact: true }).click();
      await card.locator('summary').click();
      await expect(card.locator('.reviewed-explanation')).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto('/jamb/mathematics/2023/');
    const yearPageCards = page.locator('[data-reviewed-question]');
    await expect(yearPageCards).toHaveCount(reviewed2023Questions.length);
    expect(await renderedQuestionIds(yearPageCards)).toEqual(reviewed2023Ids);
    expect(await page.locator('.qcard ol').first().evaluate(list => getComputedStyle(list).listStyleType)).toBe('upper-alpha');
    expect(await page.locator('.qcard li').first().evaluate(item => ({ style: getComputedStyle(item).listStyleType, display: getComputedStyle(item).display }))).toEqual({ style: 'upper-alpha', display: 'list-item' });
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

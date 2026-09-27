const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { publications } = require('../../scripts/build-jamb-original-practice');
const source = require('../../ops/nigeria-exams/jamb-original-practice-v1.json');

async function serveReviewedOriginal(page) {
  const generated = publications(source).outputs;
  await page.route('**/data/jamb/pools/original-practice*.json', route => {
    const file = new URL(route.request().url()).pathname.slice(1);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(generated[file]) });
  });
  await page.route('**/engines/jamb-cbt-engine.js', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: fs.readFileSync(path.resolve(__dirname, '../../engines/src/jamb-cbt-engine.js'), 'utf8')
  }));
}

test('320px result retries only missed questions locally without changing the saved attempt', async ({ page }) => {
  const posts = [];
  const prompts = [];
  await page.setViewportSize({ width: 320, height: 800 });
  await serveReviewedOriginal(page);
  await page.route('**/.netlify/functions/jamb-attempt', route => {
    posts.push(route.request().postData());
    return route.fulfill({ status: 200, json: {} });
  });
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await expect(page.locator('#start-btn')).toBeEnabled();
  await page.locator('#start-btn').click();
  for (let i = 0; i < 12; i++) {
    await page.locator('#nav-grid button').nth(i).click();
    const prompt = await page.locator('#question').textContent();
    prompts.push(prompt);
    const item = source.questions.find(question => question.question === prompt);
    expect(item).toBeTruthy();
    if (i === 1) continue;
    const choice = i === 0 ? Object.keys(item.options).find(key => key !== item.answer) : item.answer;
    await page.locator(`#options input[value="${choice}"]`).check();
  }
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#submit-btn').click();
  await expect(page.locator('#raw-score')).toHaveText('10 / 12');
  await expect(page.locator('#retry-btn')).toHaveText('Retry 2 missed or skipped questions');
  await expect(page.locator('#retry-btn')).toBeVisible();
  const savedHistory = await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'));
  await page.locator('#retry-btn').click();
  await expect(page.locator('#retry-question')).toHaveText(prompts[0]);
  await expect(page.locator('#retry-question')).toBeFocused();
  await expect(page.locator('#retry-position')).toContainText('Original question 1 · retry 1 of 2');
  await page.locator('#retry-check-btn').click();
  await expect(page.locator('#retry-feedback')).toHaveText('Choose an answer first.');
  const first = source.questions.find(question => question.question === prompts[0]);
  await page.locator(`#retry-options input[value="${first.answer}"]`).check();
  await page.locator('#retry-check-btn').click();
  await expect(page.locator('#retry-feedback')).toContainText('Correct on this retry');
  await expect(page.locator('#retry-options input').first()).toBeDisabled();
  await expect(page.locator('#raw-score')).toHaveText('10 / 12');
  await page.locator('#retry-next-btn').click();
  await expect(page.locator('#retry-question')).toHaveText(prompts[1]);
  await expect(page.locator('#retry-question')).toBeFocused();
  const second = source.questions.find(question => question.question === prompts[1]);
  const wrong = Object.keys(second.options).find(key => key !== second.answer);
  await page.locator(`#retry-options input[value="${wrong}"]`).check();
  await page.locator('#retry-check-btn').click();
  await expect(page.locator('#retry-feedback')).toContainText('Not quite');
  await expect(page.locator('#retry-feedback')).toContainText(second.explanation);
  await page.locator('#retry-next-btn').click();
  await expect(page.locator('#retry-complete')).toContainText('reviewed 2 missed or skipped questions');
  await expect(page.locator('#review-list details')).toHaveCount(12);
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'))).toBe(savedHistory);
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBeNull();
  expect(posts).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('discarding a saved original practice leaves completed history and mock storage alone', async ({ page }) => {
  const posts = [];
  await page.setViewportSize({ width: 320, height: 800 });
  await serveReviewedOriginal(page);
  await page.route('**/.netlify/functions/jamb-attempt', route => {
    posts.push(route.request().postData());
    return route.fulfill({ status: 200, json: {} });
  });
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await page.locator('#start-btn').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#submit-btn').click();
  const history = await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'));
  expect(history).toBeTruthy();
  await page.locator('#again-btn').click();
  await page.locator('#start-btn').click();
  await page.locator('#options input').first().check();
  await page.evaluate(() => localStorage.setItem('afrojamb-cbt-state', 'keep-mock-session'));
  const saved = await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'));
  expect(saved).toBeTruthy();
  await page.reload();
  await expect(page.locator('#resume-btn')).toBeVisible();
  await expect(page.locator('#discard-btn')).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#discard-btn').click();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'))).toBe(saved);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#discard-btn').click();
  await expect(page.locator('#setup-status')).toContainText('Saved practice discarded');
  await expect(page.locator('#resume-btn')).toBeHidden();
  await expect(page.locator('#discard-btn')).toBeHidden();
  await expect(page.locator('#start-btn')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'))).toBe(history);
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBe('keep-mock-session');
  expect(posts).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});


for (const questionIds of [null, []]) {
  test('damaged current saved practice is not offered for resume and preserves full CBT: ' + JSON.stringify(questionIds), async ({ page }) => {
    await serveReviewedOriginal(page);
    const pool = publications(source).outputs['data/jamb/pools/original-practice.json'];
    await page.addInitScript(({ revision, ids }) => {
      const saved = { mode: 'original-practice', poolRevision: revision, subjects: ['mathematics'] };
      if (ids !== null) saved.questionIds = ids;
      localStorage.setItem('afrojamb-original-cbt-state-v1', JSON.stringify(saved));
      localStorage.setItem('afrojamb-cbt-state', 'keep-full-cbt');
      localStorage.setItem('afrojamb-original-history-v1', '[]');
    }, { revision: pool.review_revision, ids: questionIds });
    await page.goto('/jamb/original-practice/');
    await expect(page.locator('#start-btn')).toBeEnabled();
    await expect(page.locator('#resume-btn')).toBeHidden();
    await expect(page.locator('#discard-btn')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBe('keep-full-cbt');
    expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'))).toBe('[]');
    expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'))).toBeTruthy();
  });
}

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { publications } = require('../../scripts/build-jamb-original-practice');
const source = require('../../ops/nigeria-exams/jamb-original-practice-v1.json');

for (const legacy of [
  { bank: 24, revision: '84a11be138a1e2b25d0db124f8d925290cfb00282d71021dd5d9f653c1a6d3bd', subject: 'mathematics', prefix: 'math', first: 1, width: 320 },
  { bank: 40, revision: '7fdc0826891c9b33d6f83be340f0ab4f3d14b7bec805bc53d6fe03d3534099a3', subject: 'english', prefix: 'english', first: 9, width: 390 }
]) {
  test(`unfinished ${legacy.bank}-item original bank resumes on mobile without resetting the session`, async ({ page }) => {
    const attempts = [];
    await page.setViewportSize({ width: legacy.width, height: 850 });
    await page.route('**/.netlify/functions/jamb-attempt', route => {
      attempts.push(route.request().postData());
      return route.fulfill({ status: 200, json: {} });
    });
    await page.goto('/jamb/original-practice/?subject=' + legacy.subject);
    await expect(page.locator('#start-btn')).toBeEnabled();
    const questionIds = Array.from({ length: 12 }, (_, i) =>
      'ato-' + legacy.prefix + '-v1-' + String(legacy.first + i).padStart(2, '0'));
    await page.evaluate(({ revision, subject, questionIds }) => {
      localStorage.setItem('afrojamb-original-history-v1', JSON.stringify([{ subject, correct: 7, total: 12, at: new Date().toISOString() }]));
      localStorage.setItem('afrojamb-cbt-state', '{"mode":"cbt-full"}');
      localStorage.setItem('afrojamb-original-cbt-state-v1', JSON.stringify({
        sessionId: 'saved-original-test', poolRevision: revision, mode: 'original-practice', year: null,
        subjects: [subject], currentSubject: subject, questionIds,
        answers: { 0: 'A', 11: 'B' }, marked: { 1: true }, currentIndex: 5,
        startedAt: Date.now() - 60000, durationMs: 1200000
      }));
    }, { revision: legacy.revision, subject: legacy.subject, questionIds });
    await page.reload();
    await expect(page.locator('#resume-btn')).toBeVisible();
    await page.locator('#resume-btn').click();
    await expect(page.locator('#question-position')).toContainText('Question 6 of 12');
    await expect(page.locator('#progress')).toContainText('2 of 12 answered');
    await expect(page.locator('#timer')).toContainText(/^18:|^19:/);
    await page.locator('#nav-grid button').first().click();
    await expect(page.locator('#options input[value="A"]')).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const local = await page.evaluate(() => ({ saved: JSON.parse(localStorage.getItem('afrojamb-original-cbt-state-v1')),
      history: JSON.parse(localStorage.getItem('afrojamb-original-history-v1')),
      mock: localStorage.getItem('afrojamb-cbt-state') }));
    expect(local.saved.questionIds).toEqual(questionIds);
    expect(local.saved.originalReviewSchema).toBe(2);
    expect(local.saved.questionReviewHashes).toHaveLength(12);
    expect(local.saved.poolRevision).not.toBe(legacy.revision);
    expect(local.history).toHaveLength(1);
    expect(local.mock).toBe('{"mode":"cbt-full"}');
    expect(attempts).toHaveLength(0);
  });
}

test('320px practice shows the question before navigation and submission', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  // Artifact runs exercise the emitted public pool and minified engine.
  if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') {
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
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await expect(page.getByRole('heading', { name: /Practise a subject/ })).toBeVisible();
  await expect(page.locator('#start-btn')).toBeEnabled();
  await page.locator('#start-btn').click();
  const question = await page.locator('.original-question').boundingBox();
  const navigator = await page.locator('.original-navigator').boundingBox();
  expect(question).toBeTruthy();
  expect(navigator).toBeTruthy();
  expect(navigator.y).toBeGreaterThanOrEqual(question.y + question.height - 1);
  await expect(page.locator('#question-position')).toContainText('Question 1 of 12');
  await page.locator('#next-btn').click();
  await expect(page.locator('#question-position')).toContainText('Question 2 of 12');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('390px review control stays clear of the fixed AI bubble', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await page.locator('#start-btn').click();
  const bubble = page.locator('afro-site-assistant #fab');
  await expect(bubble).toBeVisible();
  const mark = await page.locator('#mark-btn').boundingBox();
  const fab = await bubble.boundingBox();
  const horizontalOverlap = Math.max(0, Math.min(mark.x + mark.width, fab.x + fab.width) - Math.max(mark.x, fab.x));
  const verticalOverlap = Math.max(0, Math.min(mark.y + mark.height, fab.y + fab.height) - Math.max(mark.y, fab.y));
  expect(horizontalOverlap * verticalOverlap).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

for (const width of [320, 390, 1280]) {
  test(`original practice is usable at ${width}px without mixing mock history`, async ({ page }) => {
    const attempts = [];
    await page.setViewportSize({ width, height: 850 });
    await page.route('**/.netlify/functions/jamb-attempt', route => { attempts.push(route.request().postDataJSON()); return route.fulfill({ status: 200, json: {} }); });
    await page.goto('/jamb/original-practice/?subject=mathematics');
    await expect(page.getByRole('heading', { name: /Practise a subject/ })).toBeVisible();
    await expect(page.locator('#setup-status')).toContainText('64 reviewed original questions');
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
  await expect(page.locator('#setup-status')).toContainText('64 reviewed original questions');
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

test('an original cloze question keeps its full passage and choices usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto('/jamb/original-practice/?subject=english');
  await page.locator('#start-btn').click();
  let found = false;
  for (let i = 0; i < 12; i++) {
    await page.locator('#nav-grid button').nth(i).click();
    if ((await page.locator('#question').textContent()).includes('garden passage')) {
      found = true;
      await expect(page.locator('#passage')).toBeVisible();
      await expect(page.locator('#passage')).toContainText('___(1)___');
      await expect(page.locator('#passage')).toContainText('___(3)___');
      await expect(page.locator('#options label')).toHaveCount(4);
      const prompt = await page.locator('#question').textContent();
      const item = source.questions.find(q => q.question === prompt);
      await page.locator(`#options input[value="${item.answer}"]`).check();
      await expect(page.locator('#progress')).toContainText('1 of 12 answered');
      break;
    }
  }
  expect(found).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('the new comprehension and cloze passages remain readable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto('/jamb/original-practice/?subject=english');
  await page.locator('#start-btn').click();
  const found = new Set();
  for (let i = 0; i < 12; i++) {
    await page.locator('#nav-grid button').nth(i).click();
    const prompt = await page.locator('#question').textContent();
    const item = source.questions.find(q => q.question === prompt);
    if (item?.id === 'ato-english-v1-22' || item?.id === 'ato-english-v1-26') {
      await expect(page.locator('#passage')).toBeVisible();
      await expect(page.locator('#passage')).toContainText(item.id.endsWith('22') ? 'new bus timetable' : '___(4)___');
      await expect(page.locator('#options label')).toHaveCount(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      found.add(item.id);
    }
  }
  expect([...found].sort()).toEqual(['ato-english-v1-22', 'ato-english-v1-26']);
});

test('a graph question presents its plotted values as accessible text at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await page.locator('#start-btn').click();
  let found = false;
  for (let i = 0; i < 12; i++) {
    await page.locator('#nav-grid button').nth(i).click();
    const prompt = await page.locator('#question').textContent();
    const item = source.questions.find(q => q.question === prompt);
    if (item?.topic.startsWith('Graph interpretation:')) {
      found = true;
      await expect(page.locator('#passage')).toBeVisible();
      await expect(page.locator('#passage')).toContainText(/plotted points|gridline/);
      await expect(page.locator('#options label')).toHaveCount(4);
      await page.locator(`#options input[value="${item.answer}"]`).check();
      await expect(page.locator('#progress')).toContainText('1 of 12 answered');
      break;
    }
  }
  expect(found).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

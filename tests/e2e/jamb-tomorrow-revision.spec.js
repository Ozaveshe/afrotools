const { test, expect } = require('@playwright/test');
const pool = require('../../data/jamb/pools/original-practice.json');

const PLAN_KEY = 'afrotools.studentDay.v2';
const PROTECTED_KEYS = ['afrojamb-original-cbt-state-v1', 'afrojamb-cbt-state',
  'afrojamb-original-history-v1', 'afrojamb-history', 'afrotools.sscePractice.v1'];

function taskFor(questions, overrides = {}) {
  return { id: 'jamb|2099-01-01|1', subject: 'JAMB original practice: Mathematics',
    date: '2099-01-01', minutes: 20, doneAt: null, sourceId: 'jamb-original-practice',
    revision: { bankId: pool.collection_id, locale: 'en', subject: questions[0].subject,
      ids: questions.map(question => question.id),
      contentHashes: questions.map(question => question.review.content_sha256), reviewRevision: pool.review_revision },
    ...overrides };
}

async function seed(page, tasks, protectedValues = {}) {
  await page.addInitScript(({ key, tasks, protectedValues, protectedKeys }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({ version: 2, tasks, activeId: null }));
    for (const [name, value] of Object.entries(protectedValues)) {
      if (localStorage.getItem(name) === null) localStorage.setItem(name, value);
    }
    window.__revisionProtectedWrites = [];
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (name, value) {
      if (protectedKeys.includes(name)) window.__revisionProtectedWrites.push(name);
      return set.call(this, name, value);
    };
    Storage.prototype.removeItem = function (name) {
      if (protectedKeys.includes(name)) window.__revisionProtectedWrites.push(name);
      return remove.call(this, name);
    };
    window.__revisionCbtCalls = [];
    addEventListener('DOMContentLoaded', () => {
      const cbt = window.AfroJAMB && window.AfroJAMB.CBT;
      if (!cbt) return;
      for (const name of ['init', 'restore', 'clearSession', 'submit']) {
        const original = cbt[name];
        cbt[name] = function (...args) {
          window.__revisionCbtCalls.push(name);
          return original.apply(this, args);
        };
      }
    });
  }, { key: PLAN_KEY, tasks, protectedValues, protectedKeys: PROTECTED_KEYS });
}

async function protectedSnapshot(page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PROTECTED_KEYS);
}

async function reviewQuestion(page, question) {
  await expect(page.locator('#revision-question')).toHaveText(question.question);
  await expect(page.locator('#revision-question')).toBeFocused();
  await page.locator(`#revision-options input[value="${question.answer}"]`).check();
  await page.locator('#revision-check-btn').click();
  await expect(page.locator('#revision-feedback')).toContainText('Correct.');
  await expect(page.locator('#revision-feedback details')).not.toHaveAttribute('open', '');
  await page.locator('#revision-feedback summary').click();
  await expect(page.locator('#revision-feedback')).toContainText(question.explanation);
  await page.locator('#revision-next-btn').click();
}

test('finished original practice schedules only its missed subset once and reopens it untimed at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 820 });
  const posts = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('jamb-attempt')) posts.push(request.url()); });
  await page.goto('/jamb/original-practice/?subject=mathematics');
  await expect(page.locator('#start-btn')).toBeEnabled();
  await page.locator('#start-btn').click();
  const missed = [];
  for (let index = 0; index < 12; index++) {
    await page.locator('#nav-grid button').nth(index).click();
    const prompt = await page.locator('#question').textContent();
    const question = pool.questions.find(item => item.question === prompt);
    expect(question).toBeTruthy();
    if (index < 2) missed.push(question);
    if (index === 1) continue;
    const choice = index === 0 ? Object.keys(question.options).find(key => key !== question.answer) : question.answer;
    await page.locator(`#options input[value="${choice}"]`).check();
  }
  const originalDraft = await page.evaluate(() => localStorage.getItem('afrojamb-original-cbt-state-v1'));
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#submit-btn').click();
  await expect(page.locator('#raw-score')).toHaveText('10 / 12');
  const history = await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'));
  await page.locator('#save-revision-btn').click();
  await expect(page.locator('#revision-save-status')).toContainText('2 missed or skipped questions are saved for tomorrow');
  await page.locator('#save-revision-btn').click();
  const plan = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PLAN_KEY);
  expect(plan.tasks).toHaveLength(1);
  const task = plan.tasks[0];
  expect(task.revision.ids).toEqual(missed.map(question => question.id));
  expect(task.revision.contentHashes).toEqual(missed.map(question => question.review.content_sha256));
  expect(task.revision.reviewRevision).toBe(pool.review_revision);
  expect(task.date).toBe(await page.evaluate(() => AfroTools.studentDay.addDays(AfroTools.studentDay.today(), 1)));
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-original-history-v1'))).toBe(history);

  // The saved revision must coexist with both kinds of unfinished CBT and SSCE work.
  await page.evaluate(({ draft, history }) => {
    localStorage.setItem('afrojamb-original-cbt-state-v1', draft);
    localStorage.setItem('afrojamb-cbt-state', 'keep-full-cbt-draft');
    localStorage.setItem('afrojamb-history', 'keep-full-cbt-history');
    localStorage.setItem('afrotools.sscePractice.v1', 'keep-ssce-draft');
    localStorage.setItem('afrojamb-original-history-v1', history);
  }, { draft: originalDraft, history });
  const before = await protectedSnapshot(page);
  await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
  await expect(page.locator('#revision-screen')).toBeVisible();
  await expect(page.locator('#quiz-screen')).toBeHidden();
  await expect(page.locator('#revision-position')).toHaveText('Question 1 of 2');
  await page.reload();
  await expect(page.locator('#revision-question')).toHaveText(missed[0].question);
  await expect(page.locator('#revision-done-btn')).toBeHidden();
  for (const question of missed) await reviewQuestion(page, question);
  await expect(page.locator('#revision-complete')).toContainText('reviewed every question');
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PLAN_KEY)).tasks[0].doneAt).toBeNull();
  // An independent tab addition must survive completion.
  await page.evaluate(key => {
    const plan = JSON.parse(localStorage.getItem(key));
    plan.tasks.push({ id: 'another-tab', subject: 'English reading', date: '2099-01-02', minutes: 20, doneAt: null });
    localStorage.setItem(key, JSON.stringify(plan));
  }, PLAN_KEY);
  await page.locator('#revision-done-btn').click();
  await expect(page.locator('#revision-status')).toContainText('Revision marked done');
  const completed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PLAN_KEY);
  expect(completed.tasks.find(item => item.id === task.id).doneAt).toBeTruthy();
  expect(completed.tasks.some(item => item.id === 'another-tab')).toBe(true);
  expect(await protectedSnapshot(page)).toEqual(before);
  expect(posts).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

for (const subject of ['mathematics', 'english']) {
  test(`saved ${subject} review accepts an older whole-bank revision with unchanged selected hashes`, async ({ page }) => {
    const questions = pool.questions.filter(question => question.subject === subject).slice(2, 4).reverse();
    const task = taskFor(questions);
    task.revision.reviewRevision = 'a'.repeat(64);
    const protectedValues = Object.fromEntries(PROTECTED_KEYS.map(key => [key, 'keep-' + key]));
    await seed(page, [task], protectedValues);
    await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
    await expect(page.locator('#revision-screen')).toBeVisible();
    for (const question of questions) await reviewQuestion(page, question);
    await page.locator('#revision-done-btn').click();
    await expect(page.locator('#revision-status')).toContainText('Revision marked done');
    expect(await protectedSnapshot(page)).toEqual(protectedValues);
    expect(await page.evaluate(() => window.__revisionProtectedWrites)).toEqual([]);
    expect(await page.evaluate(() => window.__revisionCbtCalls)).toEqual([]);
  });
}

for (const problem of ['changed', 'missing']) {
  test(`${problem} selected question refuses saved revision and preserves every draft`, async ({ page }) => {
    const task = taskFor(pool.questions.slice(0, 2));
    if (problem === 'changed') task.revision.contentHashes[0] = 'b'.repeat(64);
    else task.revision.ids[0] = 'ato-math-v1-99';
    const protectedValues = Object.fromEntries(PROTECTED_KEYS.map(key => [key, 'keep-' + key]));
    await seed(page, [task], protectedValues);
    await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
    await expect(page.locator('#revision-status')).toContainText('no longer matches');
    await expect(page.locator('#revision-card')).toBeHidden();
    await expect(page.locator('#revision-done-btn')).toBeHidden();
    expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PLAN_KEY)).tasks[0].revision).toEqual(task.revision);
    expect(await protectedSnapshot(page)).toEqual(protectedValues);
    expect(await page.evaluate(() => window.__revisionProtectedWrites)).toEqual([]);
    expect(await page.evaluate(() => window.__revisionCbtCalls)).toEqual([]);
  });
}

test('a revision hash cannot hide an active timed quiz or stop its timer', async ({ page }) => {
  const task = taskFor(pool.questions.slice(0, 2));
  await seed(page, [task]);
  await page.goto('/jamb/original-practice/');
  await page.locator('#start-btn').click();
  await page.locator('#options input').first().check();
  const prompt = await page.locator('#question').textContent();
  await page.evaluate(id => { location.hash = 'revision=' + encodeURIComponent(id); }, task.id);
  await expect(page.locator('#quiz-status')).toContainText('practice is still running');
  await expect(page.locator('#quiz-screen')).toBeVisible();
  await expect(page.locator('#revision-screen')).toBeHidden();
  await expect(page.locator('#question')).toHaveText(prompt);
  await expect(page.locator('#options input:checked')).toHaveCount(1);
  await expect.poll(() => page.locator('#timer').textContent()).not.toBe('20:00');
  expect(await page.evaluate(() => location.hash)).toBe('');
});

test('quota-full completion keeps the pending task and allows a retry', async ({ page }) => {
  const question = pool.questions[0], task = taskFor([question]);
  await seed(page, [task]);
  await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
  await reviewQuestion(page, question);
  const initial = await page.evaluate(key => localStorage.getItem(key), PLAN_KEY);
  await page.evaluate(key => {
    const set = Storage.prototype.setItem;
    window.__allowRevisionWrite = false;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && !window.__allowRevisionWrite) throw new Error('Storage full');
      return set.call(this, name, value);
    };
  }, PLAN_KEY);
  await page.locator('#revision-done-btn').click();
  await expect(page.locator('#revision-status')).toContainText('Could not mark revision done');
  expect(await page.evaluate(key => localStorage.getItem(key), PLAN_KEY)).toBe(initial);
  await expect(page.locator('#revision-done-btn')).toBeEnabled();
  await page.evaluate(() => { window.__allowRevisionWrite = true; });
  await page.locator('#revision-done-btn').click();
  await expect(page.locator('#revision-status')).toContainText('Revision marked done');
});

for (const problem of ['corrupt', 'denied']) {
  test(`${problem} study storage reports failure without starting CBT or overwriting saved work`, async ({ page }) => {
    const task = taskFor([pool.questions[0]]);
    const protectedValues = Object.fromEntries(PROTECTED_KEYS.map(key => [key, 'keep-' + key]));
    await seed(page, [task], protectedValues);
    await page.addInitScript(({ key, problem }) => {
      if (problem === 'corrupt') localStorage.setItem(key, 'damaged-plan');
      else {
        const get = Storage.prototype.getItem;
        Storage.prototype.getItem = function (name) {
          if (name === key) throw new Error('Storage access denied');
          return get.call(this, name);
        };
      }
    }, { key: PLAN_KEY, problem });
    await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
    await expect(page.locator('#revision-status')).not.toBeEmpty();
    await expect(page.locator('#revision-card')).toBeHidden();
    await expect(page.locator('#revision-done-btn')).toBeHidden();
    expect(await protectedSnapshot(page)).toEqual(protectedValues);
    expect(await page.evaluate(() => window.__revisionProtectedWrites)).toEqual([]);
    expect(await page.evaluate(() => window.__revisionCbtCalls)).toEqual([]);
    if (problem === 'corrupt') expect(await page.evaluate(key => localStorage.getItem(key), PLAN_KEY)).toBe('damaged-plan');
  });
}

test('revision completion rejects another tab changing the selected task', async ({ page }) => {
  const question = pool.questions[0], task = taskFor([question]);
  await seed(page, [task]);
  await page.goto('/jamb/original-practice/#revision=' + encodeURIComponent(task.id));
  await reviewQuestion(page, question);
  await page.evaluate(({ key, question }) => {
    const plan = JSON.parse(localStorage.getItem(key));
    plan.tasks[0].revision.ids = [question.id];
    plan.tasks[0].revision.contentHashes = [question.review.content_sha256];
    localStorage.setItem(key, JSON.stringify(plan));
  }, { key: PLAN_KEY, question: pool.questions[1] });
  await page.locator('#revision-done-btn').click();
  await expect(page.locator('#revision-status')).toContainText('changed in another tab');
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PLAN_KEY)).tasks[0].doneAt).toBeNull();
});

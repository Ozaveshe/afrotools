const { test, expect } = require('@playwright/test');
const { bank, questions, revision, reviewed } = require('../support/jamb-reviewed-fixtures');
test.use({ viewport: { width: 390, height: 900 } });

async function declineAnalytics(page) {
  const button = page.getByRole('button', { name: 'Reject analytics', exact: true });
  if (await page.evaluate(() => localStorage.getItem('afrotools_cookie_consent')) === 'declined') {
    await expect(button).toHaveCount(0);
    return;
  }
  await button.click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
}

async function checkExplanationDisclosure(page) {
  const box = page.locator('.answer-explanation').first();
  const explanation = box.locator('.reviewed-explanation');
  const summary = box.locator('summary');
  await expect(explanation).toBeHidden();
  await expect(summary).toHaveText(/Show explanation/);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(explanation).toBeVisible();
  await expect(box.locator('.hide-explanation')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(explanation).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

async function serveBank(page, fixture) {
  const posts = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool }));
  await page.route('**/.netlify/functions/jamb-attempt', route => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  return posts;
}

test('current calculation-checked bank renders its labels and grades the actual answers', async ({ page }) => {
  const pool = require('../../data/jamb/pools/practice-pool.json');
  const index = require('../../data/jamb/pools/index.json');
  const rows = pool.questions.filter(q => q.verification?.method === 'ai-calculation-checked');
  expect(rows.length).toBeGreaterThan(0);
  const posts = await serveBank(page, {pool, index});
  await page.goto('/jamb/cbt/', {waitUntil:'load'});
  await declineAnalytics(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  const count = await page.evaluate(() => AfroJAMB.CBT.getState().questions.length);
  for (let i=0; i<count; i++) {
    const q = await page.evaluate(() => AfroJAMB.CBT.getCurrentQuestion().question);
    if (q.passage) await expect(page.locator('#cbt-passage')).toHaveText(q.passage);
    await page.getByRole('radio', {name:'Option '+q.answer+': '+q.options[q.answer], exact:true}).click();
    if(i<count-1) await page.locator('#cbt-next').click();
  }
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#result-pct')).toHaveText('100');
  await page.locator('[data-filter="all"]').click();
  await checkExplanationDisclosure(page);
  await expect(page.locator('#review-list .verification-method')).toHaveCount(count);
  await expect.poll(()=>posts.length).toBe(1);
  expect(posts[0].pool_revision).toBe(pool.review_revision);
  await expect(page.locator('#retry-practice')).toBeHidden();
  const years = [...new Set(rows.filter(q=>q.subject==='mathematics').map(q=>q.year))];
  for (const year of years) {
    await page.goto(`/jamb/mathematics/${year}/`, {waitUntil:'load'});
    const paper = rows.filter(q=>q.subject==='mathematics' && q.year===year);
    await expect(page.locator('[data-reviewed-question]')).toHaveCount(paper.length);
    for (const q of paper) await expect(page.locator(`[data-reviewed-question="${q.id}"] .qcard-text`)).toHaveText(q.question);
    const first = page.locator('[data-reviewed-question] details').first();
    await expect(first.locator('small')).toBeHidden();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first.locator('small')).toHaveText('AI-reviewed · calculation checked');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  const contextQuestion = rows.find(q=>q.passage && q.subject==='mathematics');
  if (contextQuestion) {
    await page.goto(`/jamb/${contextQuestion.subject}/${contextQuestion.year}/`, {waitUntil:'load'});
    const context = page.locator(`[data-reviewed-question="${contextQuestion.id}"] blockquote`);
    await expect(context).toHaveText(contextQuestion.passage);
    await expect(context).toHaveCSS('white-space','pre-wrap');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

for (const state of ['empty', 'unreviewed', 'stale']) {
  for (const tool of ['cbt', 'past-questions', 'score-predictor']) {
    test(`${tool} fails closed for ${state} bank without a grade`, async ({ page }) => {
      const fixture = bank(state === 'empty' ? [] : questions());
      if (state === 'unreviewed') {
        const rows = questions(); delete rows[0].review;
        fixture.pool = bank(rows).pool;
      }
      if (state === 'stale') fixture.index = bank([], 'b'.repeat(64)).index;
      const posts = await serveBank(page, fixture);
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(`/jamb/${tool}/`, { waitUntil: 'load' });
      if (tool === 'cbt') {
        await page.locator('#start-btn').click();
        await expect(page.locator('#setup-warning')).toBeVisible();
        await expect(page.locator('#cbt-shell')).toBeHidden();
        await expect(page.locator('#results-screen')).toBeHidden();
        await expect(page.locator('#start-btn')).toBeEnabled();
      } else if (tool === 'past-questions') {
        await expect(page.locator('#result-meta')).toContainText(/No reviewed|unavailable/);
        await expect(page.locator('.qcard')).toHaveCount(0);
      } else {
        await page.locator('#begin-btn').click();
        await expect(page.locator('#practice-status')).toContainText(/No reviewed|review|verified/);
        await expect(page.locator('#stage-quiz')).toBeHidden();
        await expect(page.locator('#stage-result')).toBeHidden();
        await expect(page.locator('#begin-btn')).toBeEnabled();
      }
      await expect(page.getByRole('link', { name: /Plan your.*study|Plan your next study/ }).first()).toBeVisible();
      expect(posts).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}

test('reviewed past questions reveal locally and tutor sends identity only after explicit consent', async ({ page }) => {
  await serveBank(page, bank());
  const tutorPosts = [];
  await page.route('**/.netlify/functions/ai-advisor', route => {
    tutorPosts.push(route.request().postDataJSON());
    return route.fulfill({ json: { reply: 'Synthetic explanation: six groups of seven make 42.' } });
  });
  await page.goto('/jamb/past-questions/', { waitUntil: 'load' });
  await expect(page.locator('.qcard')).toHaveCount(3);
  await page.locator('.reveal-btn').first().click();
  await expect(page.locator('.reveal-btn').first()).toContainText('Answer: B');
  await expect(page.locator('.reviewed-explanation').first()).toContainText('Six groups of seven');
  await checkExplanationDisclosure(page);
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('.explain-btn').first().click();
  expect(tutorPosts).toEqual([]);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.explain-btn').first().click();
  await expect(page.locator('.qcard-explain')).toContainText('Synthetic explanation');
  expect(tutorPosts[0]).toMatchObject({ question_id: 'first', pool_revision: revision, aiConsent: 'accepted' });
  expect(tutorPosts[0].message).not.toContain('42');
});

test('reviewed CBT answers produce an attempt tied to the same review revision', async ({ page }) => {
  const posts = await serveBank(page, bank());
  await page.goto('/jamb/cbt/', { waitUntil: 'load' });
  await declineAnalytics(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio', { name: 'Option B: 42', exact: true }).click();
    if (i < 2) await page.locator('#cbt-next').click();
  }
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#result-pct')).toHaveText('100');
  await page.locator('[data-filter="all"]').click();
  await expect(page.locator('.reviewed-explanation').first()).toContainText('Six groups of seven');
  await checkExplanationDisclosure(page);
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].pool_revision).toBe(revision);
  expect([...posts[0].question_ids].sort()).toEqual(['first', 'last', 'middle']);
});

test('short practice displays real correct count without a UTME projection or admission claims', async ({ page }) => {
  const posts = await serveBank(page, bank());
  await page.goto('/jamb/score-predictor/', { waitUntil: 'load' });
  await page.locator('#begin-btn').click();
  await expect(page.locator('#stage-quiz')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.locator('.qopt[data-letter="B"]').click();
  await expect(page.locator('#proj-score')).toHaveText('3 / 3');
  await expect(page.locator('#proj-range')).toHaveText('100% in this session');
  await expect(page.locator('#proj-breakdown')).toContainText('no reviewed questions in this session');
  expect(posts).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('jambPredictedScore');
});

for (const stale of [false, true]) {
  test(`missed-question retry ${stale ? 'rejects changed answers' : 'teaches without inflating mock history'}`, async ({ page }) => {
    const posts = await serveBank(page, bank());
    await page.goto('/jamb/cbt/', { waitUntil: 'load' });
    await declineAnalytics(page);
    await page.locator('#start-btn').click();
    await page.getByRole('radio', { name: 'Option A: 36', exact: true }).click();
    await page.locator('#cbt-submit-top').click();
    await page.locator('#confirm-submit-btn').click();
    await expect(page.locator('#results-screen')).toBeVisible();
    await expect.poll(() => posts.length).toBe(1);
    const history = await page.evaluate(() => localStorage.getItem('afrojamb-history'));
    await page.locator('#retry-start').click();
    await expect(page.locator('#retry-status')).toHaveText('Retry question 1 of 3');
    await page.getByRole('button', { name: 'Check retry answer', exact: true }).click();
    await expect(page.locator('#retry-question')).toContainText('Choose an answer first.');
    if (stale) {
      await page.route('**/data/jamb/pools/index.json', route => route.fulfill({ json: bank([], 'b'.repeat(64)).index }));
    }
    for (let i = 0; i < (stale ? 1 : 3); i++) {
      await page.locator('#retry-question').getByRole('radio', { name: 'B. 42', exact: true }).check();
      await page.getByRole('button', { name: 'Check retry answer', exact: true }).click();
      if (stale) {
        await expect(page.locator('#retry-question')).toContainText('current answers could not be verified');
        await expect(page.locator('#retry-question details')).toHaveCount(0);
      } else {
        await expect(page.locator('#retry-question [role="status"]')).toHaveText('Correct.');
        const details = page.locator('#retry-question details');
        await expect(details.locator('p')).toBeHidden();
        await details.locator('summary').focus();
        await page.keyboard.press('Enter');
        await expect(details.locator('p')).toContainText('Six groups of seven');
        await page.getByRole('button', { name: i === 2 ? 'Finish retry' : 'Next retry question', exact: true }).click();
      }
    }
    if (!stale) await expect(page.locator('#retry-status')).toContainText('Retry complete: 3 of 3 correct');
    expect(posts).toHaveLength(1);
    expect(await page.evaluate(() => localStorage.getItem('afrojamb-history'))).toBe(history);
    await expect(page.locator('#result-pct')).toHaveText('0');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('saved CBT with a removed first question is discarded without remapping answers', async ({ page }) => {
  await serveBank(page, bank(questions().slice(1)));
  await page.addInitScript(({ revision }) => localStorage.setItem('afrojamb-cbt-state', JSON.stringify({
    questionIds: ['first', 'middle', 'last'], subjects: ['mathematics'], answers: { 0: 'A', 1: 'B', 2: 'C' },
    poolRevision: revision, startedAt: Date.now(), durationMs: 600000
  })), { revision });
  await page.goto('/jamb/cbt/', { waitUntil: 'load' });
  await page.locator('#resume-btn').click();
  await expect(page.locator('#cbt-shell')).toBeHidden();
  await expect(page.locator('#setup-warning')).toContainText('saved questions changed');
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBe(null);
});

for (const tool of ['cbt', 'past-questions', 'score-predictor']) {
  test(`${tool} excludes an image-bearing ordinary question and preserves reviewed passage context`, async ({ page }) => {
    const { review: ignored, ...base } = questions()[0];
    const visual = reviewed({ ...base, id: 'synthetic-visual', question: 'Which answer is correct for this exercise?',
      image: '/assets/img/synthetic-question.svg', image_alt: 'A synthetic supporting exercise', has_diagram: false });
    const passage = 'A pupil arranged six rows of seven counters.';
    const textQuestion = reviewed({ ...base, id: 'synthetic-passage', passage,
      question: 'According to the passage, how many counters were arranged?' });
    const posts = await serveBank(page, bank([visual, textQuestion]));
    await page.goto(`/jamb/${tool}/`, { waitUntil: 'load' });
    if (tool === 'cbt') {
      await page.locator('#start-btn').click();
      await expect(page.locator('#cbt-passage')).toHaveText(passage);
      expect(await page.evaluate(() => AfroJAMB.CBT.getState().questions.map(q => q.id))).toEqual(['synthetic-passage']);
      await page.getByRole('radio', { name: 'Option B: 42', exact: true }).click();
      await page.locator('#cbt-submit-top').click();
      await page.locator('#confirm-submit-btn').click();
      await expect.poll(() => posts.length).toBe(1);
      expect(posts[0].question_ids).toEqual(['synthetic-passage']);
    } else if (tool === 'past-questions') {
      await expect(page.locator('.qcard')).toHaveCount(1);
      await expect(page.locator('.qcard')).toContainText(passage);
      await expect(page.locator('.qcard')).not.toContainText(visual.question);
    } else {
      await page.locator('#begin-btn').click();
      await expect(page.locator('#quiz-card')).toContainText(passage);
      await expect(page.locator('#quiz-progress')).toHaveText('1 / 1');
      await page.locator('.qopt[data-letter="B"]').click();
      await expect(page.locator('#proj-score')).toHaveText('1 / 1');
    }
  });
}

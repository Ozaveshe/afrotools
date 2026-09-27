const { test, expect } = require('@playwright/test');
const { bank, questions, reviewed } = require('../support/jamb-reviewed-fixtures');

test('2025 English collection opens scoped CBT, resumes safely, then shows a raw practice result', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const { review, ...base } = questions()[0];
  const fixture = bank([
    reviewed({ ...base, id: 'english-2025-first', subject: 'english', year: 2025 }),
    reviewed({ ...base, id: 'english-2025-second', subject: 'english', year: 2025 }),
    reviewed({ ...base, id: 'english-2024-other', subject: 'english', year: 2024 })
  ]);
  const posts = [];
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool }));
  await page.route('**/.netlify/functions/jamb-attempt', route => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jamb/english/2025/', { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('afrojamb-cbt-state', JSON.stringify({ year: null, mode: 'full', subjects: ['english','mathematics'],
      questionIds: ['old-mock'], startedAt: Date.now(), durationMs: 120 * 60 * 1000 }));
  });
  const yearLink = page.getByRole('link', { name: 'Start 2025 Use of English CBT practice' });
  await expect(yearLink).toHaveAttribute('href', '/jamb/cbt/?subject=english&year=2025');
  await yearLink.click();
  await expect(page.locator('#collection-setup')).toBeVisible();
  await expect(page.locator('#subject-setup')).toBeHidden();
  await expect(page.locator('#mode-setup')).toBeHidden();
  await expect(page.locator('#resume-conflict')).toContainText('different CBT session');
  await expect(page.locator('#resume-card')).toBeHidden();
  await expect(page.locator('#start-btn')).toContainText('2025 Use of English practice');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

  await page.evaluate(() => { window.__mockEvents = []; window.fbq = (...args) => window.__mockEvents.push(args); });
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  await expect(page.locator('#cbt-session-context')).toContainText('2025 Use of English collection practice');
  expect(await page.evaluate(() => window.__mockEvents)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.evaluate(() => {
    const state = AfroJAMB.CBT.getState();
    return { year: state.year, years: state.questions.map(q => q.year), subjects: state.questions.map(q => q.subject) };
  })).toEqual({ year: 2025, years: [2025, 2025], subjects: ['english', 'english'] });
  await expect(page.locator('#cbt-q-text')).toBeFocused();
  await page.locator('#cbt-options [aria-label^="Option B:"]').click();
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#resume-card')).toBeVisible();
  await expect(page.locator('#resume-meta')).toContainText('2025 collection');
  await expect(page.locator('#resume-conflict')).toBeHidden();
  await page.locator('#resume-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  expect(await page.evaluate(() => AfroJAMB.CBT.getCurrentQuestion().selectedAnswer)).toBe('B');
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#result-badge')).toContainText('Practice complete');
  await expect(page.locator('#result-heading')).toBeFocused();
  await expect(page.locator('#result-aggregate')).toHaveText('1/2');
  await expect(page.locator('#result-score-detail')).toContainText('50% correct');
  await expect(page.locator('#result-subjects')).toContainText('1 / 2');
  await expect(page.locator('#result-subjects')).not.toContainText('/100');
  await expect(page.locator('#result-intro')).toContainText('not an official UTME score');
  await expect(page.locator('#review-list')).toContainText('Six groups of seven');
  await page.setViewportSize({ width: 375, height: 812 });
  const explanation = page.locator('#review-list .answer-explanation').first();
  await explanation.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(explanation).toHaveAttribute('open', '');
  await expect(explanation.locator('.reviewed-explanation')).toBeVisible();
  await expect(page.locator('#result-again')).toHaveAttribute('href', '/jamb/cbt/?subject=english&year=2025');
  expect(posts).toHaveLength(0);
  expect(await page.evaluate(() => ({ generic: localStorage.getItem('afrojamb-history'),
    collection: JSON.parse(localStorage.getItem('afrojamb-collection-history') || '[]') }))).toMatchObject({ generic: null,
    collection: [{ year: 2025, subject: 'english', correct: 1, graded: 2, percent: 50 }] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('2025 Mathematics collection opens a subject-only CBT with raw score and explanations', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const { review, ...base } = questions()[0];
  const fixture = bank([
    reviewed({ ...base, id: 'mathematics-2025-first', subject: 'mathematics', year: 2025 }),
    reviewed({ ...base, id: 'mathematics-2025-second', subject: 'mathematics', year: 2025 }),
    reviewed({ ...base, id: 'mathematics-2024-other', subject: 'mathematics', year: 2024 }),
    reviewed({ ...base, id: 'english-2025-other', subject: 'english', year: 2025 })
  ]);
  const posts = [];
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool }));
  await page.route('**/.netlify/functions/jamb-attempt', route => {
    posts.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jamb/mathematics/2025/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  const yearLink = page.getByRole('link', { name: 'Start 2025 Mathematics CBT practice' });
  await expect(yearLink).toHaveAttribute('href', '/jamb/cbt/?subject=mathematics&year=2025');
  await yearLink.click();
  await expect(page.locator('#collection-setup')).toContainText('2025 Mathematics reviewed collection');
  await expect(page.locator('#start-btn')).toContainText('2025 Mathematics practice');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-session-context')).toContainText('2025 Mathematics collection practice');
  expect(await page.evaluate(() => {
    const state = AfroJAMB.CBT.getState();
    return { year: state.year, years: state.questions.map(q => q.year), subjects: state.questions.map(q => q.subject) };
  })).toEqual({ year: 2025, years: [2025, 2025], subjects: ['mathematics', 'mathematics'] });
  await page.locator('#cbt-options [aria-label^="Option B:"]').click();
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#result-heading')).toHaveText('2025 Mathematics practice result');
  await expect(page.locator('#result-heading')).toBeFocused();
  await expect(page.locator('#result-aggregate')).toHaveText('1/2');
  await expect(page.locator('#result-score-detail')).toContainText('50% correct');
  await expect(page.locator('#result-subjects')).toContainText('1 / 2');
  await expect(page.locator('#result-subjects')).not.toContainText('/100');
  await expect(page.locator('#result-intro')).toContainText('not an official UTME score');
  await page.setViewportSize({ width: 375, height: 812 });
  const explanation = page.locator('#review-list .answer-explanation').first();
  await explanation.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(explanation.locator('.reviewed-explanation')).toBeVisible();
  await expect(page.locator('#result-again')).toHaveAttribute('href', '/jamb/cbt/?subject=mathematics&year=2025');
  expect(posts).toHaveLength(0);
  expect(await page.evaluate(() => ({ generic: localStorage.getItem('afrojamb-history'),
    collection: JSON.parse(localStorage.getItem('afrojamb-collection-history') || '[]') }))).toMatchObject({ generic: null,
    collection: [{ year: 2025, subject: 'mathematics', correct: 1, graded: 2, percent: 50 }] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('invalid scoped link cannot silently start an all-year CBT', async ({ page }) => {
  await page.goto('/jamb/cbt/?subject=english&year=wrong', { waitUntil: 'load' });
  await expect(page.locator('#setup-warning')).toContainText('link is invalid');
  await expect(page.locator('#start-btn')).toBeDisabled();
  await expect(page.locator('#cbt-shell')).toBeHidden();
});

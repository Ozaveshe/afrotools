const { test, expect } = require('@playwright/test');
const { bank, questions, reviewed } = require('../support/jamb-reviewed-fixtures');

// Keep external tracker availability deterministic; the consent UI remains real.
test.beforeEach(async ({ page }) => {
  await page.route('https://connect.facebook.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
});

test('saved collection conflict initializes while an optional async script is stalled', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  let tracker;
  // Consent may prevent optional trackers from loading. Inject a local mocked
  // async resource only into this fixture so the page load reliably remains pending.
  await page.route('**/__test__/cbt-optional-ready.js', route => { tracker = route; });
  await page.route('**/jamb/cbt/**', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({ response, body: source.replace('</head>', '<script async src="/__test__/cbt-optional-ready.js"></script></head>') });
  });
  await page.goto('/jamb/english/2025/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('afrojamb-cbt-state', JSON.stringify({ year: null, mode: 'full', subjects: ['english', 'mathematics'], questionIds: ['synthetic-saved-mock'], startedAt: Date.now(), durationMs: 7200000 })));
  try {
    await page.getByRole('link', { name: 'Start 2025 Use of English CBT practice' }).click();
    await expect.poll(() => Boolean(tracker)).toBe(true);
    await expect(page.locator('#resume-conflict')).toContainText('different CBT session');
    expect(await page.evaluate(() => document.readyState)).toBe('interactive');
    expect(await page.evaluate(() => AfroJAMB.CBT.tryRestore().questionIds)).toEqual(['synthetic-saved-mock']);
  } finally {
    if (tracker) await tracker.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  }
});


async function expectHeadingInViewport(page, selector) {
  await expect.poll(() => page.locator(selector).evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= innerHeight;
  })).toBe(true);
}

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
  await expect(page.locator('#setup-badge-label')).toHaveText('Reviewed collection practice');
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
  await expectHeadingInViewport(page, '#cbt-q-text');
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
  await expectHeadingInViewport(page, '#result-heading');
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

test('mobile CBT keeps question navigation reachable before analytics consent is chosen', async ({ page }) => {
  // Exercise a visitor who has not chosen consent, including artifact owner runs.
  await page.addInitScript(() => localStorage.removeItem('afrotools_cookie_consent'));
  if (process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS === '1') {
    const path = require('path');
    const root = path.resolve(__dirname, '../..', process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1' ? 'dist' : '.');
    await page.route('**/assets/js/lazy-analytics.js*', route => route.fulfill({
      path: path.join(root, 'assets/js/lazy-analytics.js'), contentType: 'application/javascript'
    }));
  }
  const { review, ...base } = questions()[0];
  const fixture = bank([1, 2, 3].map(number => reviewed({
    ...base, id: `english-2025-consent-${number}`, subject: 'english', year: 2025
  })));
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({
    json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool
  }));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/jamb/cbt/?subject=english&year=2025', { waitUntil: 'load' });
  await expect(page.locator('#afro-cookie-consent')).toBeVisible();
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-q-num')).toHaveText('Q1');
  await expect(page.locator('#afro-cookie-consent')).toBeHidden();
  await page.evaluate(() => {
    if (!document.getElementById('afro-pwa-banner')) {
      const prompt = document.createElement('div');
      prompt.id = 'afro-pwa-banner';
      prompt.textContent = 'Install AfroTools';
      document.body.appendChild(prompt);
    }
  });
  await expect(page.locator('#afro-pwa-banner')).toBeHidden();
  await page.keyboard.press('PageDown');
  await page.locator('#cbt-next').click();
  await expect(page.locator('#cbt-q-num')).toHaveText('Q2');
  await expect(page).toHaveURL(/\/jamb\/cbt\//);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press('PageDown');
  await page.locator('#cbt-next').click();
  await expect(page.locator('#cbt-q-num')).toHaveText('Q3');
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#afro-cookie-consent')).toBeVisible();
  await expect(page.locator('#afro-pwa-banner')).toBeVisible();
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
  await expect(page.locator('#setup-badge-label')).toHaveText('Reviewed collection practice');
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
  await expectHeadingInViewport(page, '#result-heading');
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

for (const { year, width } of [{ year: 2023, width: 320 }, { year: 2024, width: 390 }]) {
  test(`${year} Mathematics reviewed collection runs a 40-question mobile CBT from the published bank`, async ({ page }) => {
    const errors = [];
    const posts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/.netlify/functions/jamb-attempt', route => {
      posts.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true } });
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/jamb/mathematics/${year}/`, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com/jamb/mathematics/${year}/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('[data-reviewed-question]')).not.toHaveCount(0);
    const yearLink = page.getByRole('link', { name: `Start ${year} Mathematics CBT practice` });
    await expect(yearLink).toHaveAttribute('href', `/jamb/cbt/?subject=mathematics&year=${year}`);
    await expect(page.locator('.jamb-reviewed-practice')).toContainText('not a confirmed complete UTME paper');
    await yearLink.click();
    await expect(page.locator('#setup-badge-label')).toHaveText('Reviewed collection practice');
    await expect(page.locator('#collection-setup')).toContainText(`${year} Mathematics reviewed collection`);
    await page.locator('#start-btn').click();
    await expect(page.locator('#cbt-q-text')).toBeFocused();
    await expectHeadingInViewport(page, '#cbt-q-text');
    const session = await page.evaluate(() => {
      const state = AfroJAMB.CBT.getState();
      return { year: state.year, years: state.questions.map(q => q.year),
        subjects: state.questions.map(q => q.subject), answer: state.questions[0].answer };
    });
    expect(session.year).toBe(year);
    expect(session.years).toHaveLength(40);
    expect(session.years.every(value => value === year)).toBe(true);
    expect(session.subjects.every(value => value === 'mathematics')).toBe(true);
    await page.locator(`#cbt-options [aria-label^="Option ${session.answer}:"]`).click();
    await page.locator('#cbt-submit-top').click();
    await page.locator('#confirm-submit-btn').click();
    await expect(page.locator('#result-heading')).toHaveText(`${year} Mathematics practice result`);
    await expect(page.locator('#result-heading')).toBeFocused();
    await expectHeadingInViewport(page, '#result-heading');
    await expect(page.locator('#result-aggregate')).toHaveText('1/40');
    await expect(page.locator('#result-score-detail')).toContainText('3% correct');
    await expect(page.locator('#result-intro')).toContainText('not an official UTME score');
    await page.locator('.rev-filter[data-filter="all"]').click();
    const explanation = page.locator('#review-list .answer-explanation').first();
    await explanation.locator('summary').click();
    await expect(explanation.locator('.reviewed-explanation')).not.toBeEmpty();
    await expect(page.locator('#result-again')).toHaveAttribute('href', `/jamb/cbt/?subject=mathematics&year=${year}`);
    expect(posts).toHaveLength(0);
    expect(await page.evaluate(() => ({ generic: localStorage.getItem('afrojamb-history'),
      collection: JSON.parse(localStorage.getItem('afrojamb-collection-history') || '[]') }))).toMatchObject({ generic: null,
      collection: [{ year, subject: 'mathematics', correct: 1, graded: 40, percent: 3 }] });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('a timed-out collection scrolls its result heading into view', async ({ page }) => {
  const { review, ...base } = questions()[0];
  const fixture = bank([reviewed({ ...base, id: 'mathematics-2025-expiry', subject: 'mathematics', year: 2025 })]);
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/jamb/cbt/?subject=mathematics&year=2025', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-q-text')).toBeFocused();
  await page.evaluate(() => {
    const session = AfroJAMB.CBT.getState();
    session.startedAt = Date.now() - session.durationMs - 1000;
    window.scrollTo(0, document.body.scrollHeight);
  });
  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#result-heading')).toHaveText('2025 Mathematics practice result');
  await expect(page.locator('#result-heading')).toBeFocused();
  await expectHeadingInViewport(page, '#result-heading');
  await expect(page.locator('#result-aggregate')).toHaveText('0/1');
});

test('invalid scoped link cannot silently start an all-year CBT', async ({ page }) => {
  await page.goto('/jamb/cbt/?subject=english&year=wrong', { waitUntil: 'load' });
  await expect(page.locator('#setup-warning')).toContainText('link is invalid');
  await expect(page.locator('#start-btn')).toBeDisabled();
  await expect(page.locator('#cbt-shell')).toBeHidden();
  await page.goto('/jamb/cbt/', { waitUntil: 'load' });
  await expect(page.locator('#setup-badge-label')).toHaveText('Free Mock Exam');
});


test('active historical CBT cleanup stops both timers and preserves other practice storage', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { review, ...base } = questions()[0];
  const fixture = bank([1, 2].map(number => reviewed({
    ...base, id: 'english-2025-cleanup-' + number, subject: 'english', year: 2025
  })));
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({
    json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool
  }));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.clock.install({ time: new Date('2026-09-28T08:00:00Z') });
  await page.goto('/jamb/cbt/?subject=english&year=2025', { waitUntil: 'load' });

  const sentinels = {
    'afrojamb-original-cbt-state-v1': 'keep-original-session',
    'afrojamb-original-history-v1': '[]',
    'afrojamb-history': '[]',
    'afrojamb-collection-history': '[]'
  };
  await page.evaluate(values => {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
    window.__cbtRuns = { tick: 0, save: 0 };
    const schedule = window.setInterval.bind(window);
    const init = AfroJAMB.CBT.init;
    let observingInit = false;
    AfroJAMB.CBT.init = function (config) {
      observingInit = true;
      try { return init.call(this, config); }
      finally { observingInit = false; }
    };
    window.setInterval = function (callback, delay, ...args) {
      const kind = observingInit && (delay === 1000 ? 'tick' : delay === 15000 ? 'save' : null);
      if (!kind) return schedule(callback, delay, ...args);
      return schedule(function (...callbackArgs) {
        window.__cbtRuns[kind]++;
        return callback.apply(this, callbackArgs);
      }, delay, ...args);
    };
  }, sentinels);
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  await page.locator('#cbt-options [aria-label^="Option B:"]').click();
  await page.clock.runFor(16_000);
  const before = await page.evaluate(() => ({
    runs: { ...window.__cbtRuns }, saved: localStorage.getItem('afrojamb-cbt-state')
  }));
  expect(before.saved).toBeTruthy();
  expect(before.runs.tick).toBeGreaterThan(0);
  expect(before.runs.save).toBeGreaterThan(0);

  await page.evaluate(() => AfroJAMB.CBT.clearSession());
  const timer = await page.locator('#cbt-timer').textContent();
  await page.clock.runFor(16_000);
  await expect(page.locator('#cbt-timer')).toHaveText(timer);
  await expect(page.locator('#cbt-shell')).toBeVisible();
  expect(await page.evaluate(() => window.__cbtRuns)).toEqual(before.runs);
  expect(await page.evaluate(() => AfroJAMB.CBT.getState())).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBeNull();
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])),
    Object.keys(sentinels))).toEqual(sentinels);
  expect(errors).toEqual([]);
});

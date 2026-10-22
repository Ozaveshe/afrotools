const { test, expect } = require('@playwright/test');

async function readyEvents(page) {
  return page.evaluate(() => Array.from(window.dataLayer || [])
    .filter((entry) => entry[0] === 'event' && entry[1] === 'waec_result_ready')
    .map((entry) => entry[2]));
}

async function loadReadinessPage(page, consent = 'accepted') {
  await page.addInitScript((choice) => {
    localStorage.setItem('afrotools_cookie_consent', choice);
  }, consent);
  await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#examSystem')).toHaveValue('ng-waec-neco');
  await page.waitForFunction(() => window.AfroTools && window.AfroTools.analytics && typeof window.gtag === 'function');
}

async function changeConsent(page, status) {
  await page.evaluate((choice) => {
    localStorage.setItem('afrotools_cookie_consent', choice);
    window.dispatchEvent(new CustomEvent('afrotools:cookie-consent', { detail: { status: choice } }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'afrotools_cookie_consent', newValue: choice }));
  }, status);
}

test.describe('WAEC planning-ready measurement', () => {
  test('counts meaningful Nigeria results without counting empty, name-only, or repeated renders', async ({ page }) => {
    await loadReadinessPage(page);
    expect(await readyEvents(page)).toEqual([]);
    const rows = page.locator('.wc-subject-row');
    await rows.nth(0).locator('select').selectOption('A1');
    expect(await readyEvents(page)).toEqual([]);
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    await expect(page.locator('#resultAggregate')).toHaveText('10');
    expect(await readyEvents(page)).toEqual([{
      tool_id: 'waec-calculator', system: 'ng-waec-neco', planning_only: true, counted_subject_count: 5
    }]);
    await rows.nth(3).locator('input').fill('Synthetic subject label only');
    await rows.nth(3).locator('input').dispatchEvent('input');
    await page.getByRole('tab', { name: 'Official checks' }).click();
    expect(await readyEvents(page)).toHaveLength(1);
    await page.getByRole('tab', { name: 'Result planner' }).click();
    await rows.nth(0).locator('select').selectOption('F9');
    expect(await readyEvents(page)).toHaveLength(2);
    await rows.nth(0).locator('select').selectOption('B3');
    expect(await readyEvents(page)).toHaveLength(3);
    await page.evaluate(() => window.clearWaecGrades());
    expect(await readyEvents(page)).toHaveLength(3);
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    expect(await readyEvents(page)).toHaveLength(4);
    const legacy = await page.evaluate(() => Array.from(window.dataLayer || [])
      .filter((entry) => entry[0] === 'event' && entry[1] === 'calculation_completed')
      .map((entry) => entry[2]));
    expect(legacy.some((entry) => entry.complete === false)).toBe(true);
    expect(legacy.some((entry) => entry.complete === true)).toBe(true);
  });

  test('Ghana planning readiness remains useful when official credit checks fail and resets when incomplete', async ({ page }) => {
    await loadReadinessPage(page);
    await page.selectOption('#examSystem', 'gh-wassce');
    const rows = page.locator('.wc-subject-row');
    for (let index = 0; index < 4; index += 1) await rows.nth(index).locator('select').selectOption('F9');
    for (let index = 4; index < 7; index += 1) {
      await rows.nth(index).locator('input').fill('Synthetic elective ' + index);
      if (index < 6) await rows.nth(index).locator('select').selectOption('F9');
    }
    expect(await readyEvents(page)).toEqual([]);
    await rows.nth(6).locator('select').selectOption('F9');
    await expect(page.locator('#resultAggregate')).toHaveText('54');
    await expect(page.locator('#resultCredits')).toHaveText('0');
    expect(await readyEvents(page)).toEqual([{
      tool_id: 'waec-calculator', system: 'gh-wassce', planning_only: true, counted_subject_count: 6
    }]);
    await page.selectOption('#trackSelect', 'non-science');
    expect(await readyEvents(page)).toHaveLength(2);
    await rows.nth(6).locator('select').selectOption('');
    expect(await readyEvents(page)).toHaveLength(2);
    await rows.nth(6).locator('select').selectOption('F9');
    expect(await readyEvents(page)).toHaveLength(3);
    await page.selectOption('#examSystem', 'ng-waec-neco');
    expect(await readyEvents(page)).toHaveLength(3);
  });

  test('consent acceptance alone never creates tool use and denied results do not consume readiness', async ({ page }) => {
    await loadReadinessPage(page, 'declined');
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    expect(await readyEvents(page)).toEqual([]);
    await changeConsent(page, 'accepted');
    expect(await readyEvents(page)).toEqual([]);
    await page.locator('.wc-subject-row').nth(3).locator('input').dispatchEvent('input');
    expect(await readyEvents(page)).toHaveLength(1);
    await changeConsent(page, 'declined');
    await changeConsent(page, 'accepted');
    await page.locator('.wc-subject-row').nth(3).locator('input').dispatchEvent('input');
    expect(await readyEvents(page)).toHaveLength(1);
    await changeConsent(page, 'declined');
    await page.locator('.wc-subject-row').nth(0).locator('select').selectOption('F9');
    expect(await readyEvents(page)).toHaveLength(1);
    await changeConsent(page, 'accepted');
    expect(await readyEvents(page)).toHaveLength(1);
    await page.locator('.wc-subject-row').nth(3).locator('input').dispatchEvent('input');
    expect(await readyEvents(page)).toHaveLength(2);
  });

  test('missing helper waits for interaction and saved or sample output exposes only readiness metadata', async ({ page }) => {
    await loadReadinessPage(page);
    await page.evaluate(() => {
      window.__syntheticReadyAnalytics = window.AfroTools.analytics;
      delete window.AfroTools.analytics;
    });
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    expect(await readyEvents(page)).toEqual([]);
    await page.evaluate(() => { window.AfroTools.analytics = window.__syntheticReadyAnalytics; });
    expect(await readyEvents(page)).toEqual([]);
    await page.locator('.wc-subject-row').nth(3).locator('input').fill('SYNTHETIC PRIVATE SUBJECT');
    expect(await readyEvents(page)).toHaveLength(1);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#resultAggregate')).toHaveText('10');
    expect(await readyEvents(page)).toEqual([{
      tool_id: 'waec-calculator', system: 'ng-waec-neco', planning_only: true, counted_subject_count: 5
    }]);
    expect(JSON.stringify(await readyEvents(page))).not.toMatch(/SYNTHETIC PRIVATE SUBJECT|B3|A1|aggregate|signature|value|manual|admission/i);
  });

  test('shared queue withdrawal prevents replay of an accepted ready output', async ({ page }) => {
    await loadReadinessPage(page);
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    expect(await readyEvents(page)).toHaveLength(1);
    await page.evaluate(() => {
      window.__syntheticReadyGtag = window.gtag;
      delete window.gtag;
    });
    await page.locator('.wc-subject-row').nth(0).locator('select').selectOption('F9');
    expect(await readyEvents(page)).toHaveLength(1);
    await changeConsent(page, 'declined');
    await page.evaluate(() => { window.gtag = window.__syntheticReadyGtag; });
    await changeConsent(page, 'accepted');
    await page.locator('.wc-subject-row').nth(3).locator('input').dispatchEvent('input');
    await page.waitForTimeout(1100);
    expect(await readyEvents(page)).toHaveLength(1);
  });
});

test.describe('WAEC/NECO result planner VIP', () => {
  test('Nigeria planning index is transparent and exports a local action pack', async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.method() !== 'GET') {
        writes.push({ url: request.url(), body: request.postData() || '' });
      }
    });

    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Result Planner');
    await expect(page.locator('#examSystem')).toHaveValue('ng-waec-neco');
    await page.getByRole('button', { name: 'Load sample grades' }).click();

    await expect(page.locator('#resultAggregate')).toHaveText('10');
    await expect(page.locator('#resultCredits')).toHaveText('7');
    await expect(page.locator('#resultBestOf')).toHaveText('Best-five planning index');
    await expect(page.locator('[data-waec-next="study-planner"]')).toHaveAttribute('href', '/tools/study-planner/?exam=nigeria-waec-neco');
    await expect(page.locator('[data-waec-next="flashcard-maker"]')).toHaveAttribute('href', '/tools/flashcard-maker/?exam=nigeria-waec-neco');
    await expect(page.locator('[data-waec-next="exam-timetable"]')).toHaveAttribute('href', '/tools/exam-timetable/?exam=nigeria-waec-neco');
    await expect(page.locator('#eligibilityList')).toContainText('not an official Nigerian admission aggregate');
    await page.getByRole('tab', { name: 'Official checks' }).click();
    await expect(page.getByRole('link', { name: /JAMB IBASS eligibility checker/i })).toHaveAttribute('href', 'https://eligibility.jamb.gov.ng/');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    expect((await download).suggestedFilename()).toMatch(/result-verification-pack\.txt$/);
    expect(writes.filter((request) => request.url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
    expect(writes.map((request) => request.body).join(' ')).not.toMatch(/English Language|Mathematics|Civic Education/);
    expect(errors).toEqual([]);
  });

  test('Ghana aggregate uses the selected programme core and three electives', async ({ page }) => {
    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
    await page.selectOption('#examSystem', 'gh-wassce');
    await expect(page.locator('[data-waec-next="study-planner"]')).toHaveAttribute('href', '/tools/study-planner/?exam=ghana-waec');
    await expect(page.locator('[data-waec-next="flashcard-maker"]')).toHaveAttribute('href', '/tools/flashcard-maker/?exam=ghana-waec');
    await expect(page.locator('[data-waec-next="exam-timetable"]')).toHaveAttribute('href', '/tools/exam-timetable/?exam=ghana-waec');
    await expect(page.locator('[data-waec-ng-only]').first()).toBeHidden();
    await expect(page.locator('[data-waec-gh-only]').first()).toHaveJSProperty('hidden', false);

    const rows = page.locator('.wc-subject-row');
    await rows.nth(0).locator('select').selectOption('B3');
    await rows.nth(1).locator('select').selectOption('B2');
    await rows.nth(2).locator('select').selectOption('C4');
    await rows.nth(3).locator('select').selectOption('A1');
    await rows.nth(4).locator('input').fill('Physics');
    await rows.nth(4).locator('select').selectOption('B3');
    await rows.nth(5).locator('input').fill('Chemistry');
    await rows.nth(5).locator('select').selectOption('C5');
    await rows.nth(6).locator('input').fill('Biology');
    await rows.nth(6).locator('select').selectOption('A1');

    await expect(page.locator('#resultAggregate')).toHaveText('18');
    await expect(page.locator('#selectedSubjects')).toContainText('Integrated Science');
    await expect(page.locator('#selectedSubjects')).not.toContainText('Social Studies (A1)');

    await page.selectOption('#trackSelect', 'non-science');
    await expect(page.locator('#resultAggregate')).toHaveText('15');
    await expect(page.locator('#selectedSubjects')).toContainText('Social Studies');
    await expect(page.locator('#selectedSubjects')).not.toContainText('Integrated Science (C4)');
    await page.locator('button[onclick="saveWaecActionPack()"]') .click();
    const ghPack = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools_waec_action_pack')).text);
    expect(ghPack).toContain('Ghana — WASSCE');
    expect(ghPack).not.toContain('JAMB IBASS');
  });

  test('mobile dark mode stays usable without overflow and print action works', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem('aft_theme', 'dark');
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.getByRole('button', { name: /PDF/ }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Nigeria handoff arrives with Nigeria context in each study route', async ({ page }) => {
    await page.goto('/tools/waec-calculator/');
    await page.selectOption('#ngExamSelect', 'neco');
    await expect(page.locator('[data-waec-next="study-planner"]')).toHaveAttribute('href', '/tools/study-planner/?exam=nigeria-neco');
    await expect(page.locator('[data-waec-next="flashcard-maker"]')).toHaveAttribute('href', '/tools/flashcard-maker/?exam=nigeria-neco');
    await expect(page.locator('[data-waec-next="exam-timetable"]')).toHaveAttribute('href', '/tools/exam-timetable/?exam=nigeria-neco');
    await page.locator('button[onclick="saveWaecActionPack()"]') .click();
    const necoPack = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools_waec_action_pack')).text);
    expect(necoPack).toContain('Nigeria — NECO SSCE');
    await page.reload();
    await expect(page.locator('#ngExamSelect')).toHaveValue('neco');
    await page.selectOption('#ngExamSelect', 'waec');
    await expect(page.locator('[data-waec-next="study-planner"]')).toHaveAttribute('href', '/tools/study-planner/?exam=nigeria-waec');
    await page.goto('/tools/study-planner/?exam=nigeria-waec-neco');
    await expect(page.locator('#examContext')).toContainText('Nigeria WAEC or NECO');
    await page.goto('/tools/flashcard-maker/?exam=nigeria-waec-neco');
    await expect(page.locator('#examDeckContext')).toContainText('Nigeria WAEC or NECO');
    await page.goto('/tools/exam-timetable/?exam=nigeria-waec-neco');
    await expect(page.locator('#planName')).toHaveValue('Nigeria WAEC or NECO revision');
    await expect(page.locator('#examHandoffContext')).toContainText('No dates are assumed');
    await page.goto('/tools/study-planner/?exam=nigeria-neco');
    await expect(page.locator('#examContext')).toContainText('Nigeria NECO SSCE');
    await page.goto('/tools/flashcard-maker/?exam=nigeria-waec');
    await expect(page.locator('#examDeckContext')).toContainText('Nigeria WAEC WASSCE');
    await page.goto('/tools/exam-timetable/?exam=nigeria-neco');
    await expect(page.locator('#planName')).toHaveValue('Nigeria NECO SSCE revision');
    await page.goto('/tools/study-planner/?exam=ghana-waec');
    await expect(page.locator('#examContext')).toContainText('Ghana WAEC');
    await page.goto('/tools/flashcard-maker/?exam=ghana-waec');
    await expect(page.locator('#examDeckContext')).toContainText('Ghana WAEC');
    await page.goto('/tools/exam-timetable/?exam=ghana-waec');
    await expect(page.locator('#planName')).toHaveValue('Ghana WASSCE revision');
  });
});

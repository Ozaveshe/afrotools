const { test, expect } = require('@playwright/test');
const { createHash } = require('node:crypto');
const observations = new WeakMap();

const chartFixture = 'window.Chart = class { constructor() { window.__ghanaCharts = (window.__ghanaCharts || 0) + 1; } destroy() {} };';

async function setup(page, holdChart = false) {
  const errors = [], writes = [];
  const observed = { errors, writes, consoleErrors: 0, consoleWarnings: 0, consoleErrorMessages: [] };
  observations.set(page, observed);
  await page.addInitScript(() => {
    window.__ghanaInteractions = [];
    ['pointerdown', 'pointerup', 'click', 'change', 'scroll'].forEach(type => document.addEventListener(type, event => {
      const target = event.target;
      const label = target.closest && target.closest('label.tog');
      const control = label && label.querySelector('input');
      if (type !== 'scroll' && !label && target.id !== 'calcBtn') return;
      window.__ghanaInteractions.push({ type, trusted: event.isTrusted, target: target.id || target.tagName, control: control && control.id, checked: control && control.checked, y: scrollY, time: performance.now() });
    }, true));
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      observed.consoleErrors++;
      observed.consoleErrorMessages.push(message.text().replace(/\b(?:60000|72000|30000|1200)\b/g, '[synthetic value]').slice(0, 500));
    }
    if (message.type() === 'warning') observed.consoleWarnings++;
  });
  let releaseChart;
  const chartReady = new Promise(resolve => { releaseChart = resolve; });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push({ method: request.method(), pathname: url.pathname });
      return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"isolated test"}' });
    }
    if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('chart.umd')) {
      if (holdChart) await chartReady;
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: chartFixture });
    }
    if (url.pathname.startsWith('/.netlify/functions/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      const contentType = request.resourceType() === 'script' ? 'application/javascript'
        : request.resourceType() === 'stylesheet' ? 'text/css' : 'text/plain';
      return route.fulfill({ status: 200, contentType, body: '' });
    }
    return route.continue();
  });
  const response = await page.goto('/ghana/gh-paye.html', { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  observed.sourcePageSha256 = createHash('sha256').update(await response.body()).digest('hex');
  await expect(page.getByRole('button', { name: 'Calculate My Take-Home Pay', exact: true })).toBeVisible();
  return Object.assign(observed, { releaseChart });
}

test.afterEach(async ({ page }, testInfo) => {
  const observed = observations.get(page);
  if (!observed || page.isClosed()) return;
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  const interactions = await page.evaluate(() => window.__ghanaInteractions);
  const toggleTargets = await page.locator('label.tog').evaluateAll(labels => labels.map(label => {
    const box = label.getBoundingClientRect();
    return { id: label.querySelector('input').id, width: box.width, height: box.height };
  }));
  await testInfo.attach('local-browser-observations', { body: JSON.stringify({ sourcePageSha256: observed.sourcePageSha256, pageErrors: observed.errors.length, consoleErrors: observed.consoleErrors, consoleErrorMessages: observed.consoleErrorMessages, consoleWarnings: observed.consoleWarnings, interceptedWrites: observed.writes, geometry, toggleTargets, interactions }), contentType: 'application/json' });
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
  expect(observed.consoleErrorMessages).toEqual([]);
  expect(toggleTargets).toHaveLength(9);
  for (const target of toggleTargets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
});

async function calculate(page) {
  await page.getByRole('button', { name: 'Calculate My Take-Home Pay', exact: true }).click();
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.hasResult())).toBe(true);
}

async function expectUnavailable(page) {
  await expect(page.locator('#resultsCard')).toBeHidden();
  await expect(page.locator('#bonusCard')).toBeHidden();
  await expect(page.locator('#calculationStatus')).toContainText('Inputs changed. Calculate again');
  await expect.poll(() => page.evaluate(() => ({ available: window.PAYE_CALC_SYNC_ADAPTER.hasResult(), payload: window.PAYE_CALC_SYNC_ADAPTER.buildPayload() }))).toEqual({ available: false, payload: null });
}

test('input changes retire the old result and recalculation uses the current values', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const observed = await setup(page);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('60000');
  await calculate(page);
  const oldTax = await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload().snapshot.taxAnnual);
  const marriageRelief = page.getByRole('checkbox', { name: 'Marriage Relief', exact: true });
  await marriageRelief.focus();
  await expect(marriageRelief).toBeFocused();
  await marriageRelief.press('Space');
  await expect(page.locator('#togMarriage')).toBeChecked();
  await expectUnavailable(page);
  await calculate(page);
  const married = await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload());
  expect(married.inputs.toggles.marriage).toBe(true);
  expect(married.snapshot.taxAnnual).toBeLessThan(oldTax);
  await page.getByRole('button', { name: 'Net → Gross', exact: true }).click();
  await expectUnavailable(page);
  await calculate(page);
  expect((await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).inputs.mode).toBe('net');
  await page.getByLabel('Basic Salary (for SSNIT)', { exact: true }).fill('30000');
  await expectUnavailable(page);
  await calculate(page);
  expect((await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).inputs.basicSalary).toBe(30000);
  await page.locator('label.tog').filter({ hasText: 'SSNIT Tier III' }).click();
  await expectUnavailable(page);
  await calculate(page);
  await page.getByLabel('Tier III Contribution (Annual)', { exact: true }).fill('1200');
  await expectUnavailable(page);
  await calculate(page);
  expect((await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).inputs.tier3Amount).toBe(1200);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('blank salary retires result actions and Enter rebuilds visible results', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  const observed = await setup(page);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('60000');
  await calculate(page);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('');
  await expectUnavailable(page);
  await expect(page.locator('#resultsCard')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('#salaryInput').press('Enter');
  await expectUnavailable(page);
  await expect(page.locator('#calcSaveName')).toBeHidden();
  await expect(page.locator('#calcSaveBtn')).toBeHidden();
  await expect(page.locator('#calcSaveBtn')).toBeDisabled();
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('72000');
  await page.locator('#salaryInput').press('Enter');
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#resultsCard')).not.toHaveAttribute('aria-hidden', 'true');
  expect((await page.evaluate(() => window.PAYE_CALC_SYNC_ADAPTER.buildPayload())).inputs.salaryValue).toBe(72000);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('a delayed external chart cannot revive an invalidated result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const observed = await setup(page, true);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('60000');
  await calculate(page);
  await page.locator('label.tog').filter({ hasText: 'Marriage Relief' }).click();
  await expect(page.locator('#togMarriage')).toBeChecked();
  await expectUnavailable(page);
  const chartResponse = page.waitForResponse(response => response.url().includes('chart.umd'));
  observed.releaseChart();
  await chartResponse;
  await expect.poll(() => page.evaluate(() => typeof window.Chart)).toBe('function');
  await expectUnavailable(page);
  expect(await page.evaluate(() => window.__ghanaCharts || 0)).toBe(0);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('a consented synthetic AI response cannot restore advice for edited inputs', async ({ page }) => {
  const observed = await setup(page);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('60000');
  await calculate(page);
  await page.waitForFunction(() => window.AfroTools && window.AfroTools.AIConsent);
  let releaseResponse, markStarted, consentHeader = '';
  const responseReady = new Promise(resolve => { releaseResponse = resolve; });
  const requestStarted = new Promise(resolve => { markStarted = resolve; });
  await page.route('**/.netlify/functions/ai-advisor', async route => {
    observed.writes.push({ method: route.request().method(), pathname: new URL(route.request().url()).pathname, intercepted: true });
    consentHeader = route.request().headers()['x-afrotools-ai-consent'] || '';
    markStarted();
    await responseReady;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"text":"Synthetic delayed advice"}' });
  });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Get AI Tax Analysis', exact: true }).click();
  await requestStarted;
  expect(consentHeader).toBe('accepted');
  await page.locator('label.tog').filter({ hasText: 'Marriage Relief' }).click();
  await expectUnavailable(page);
  const response = page.waitForResponse(item => item.url().includes('/.netlify/functions/ai-advisor'));
  releaseResponse();
  await (await response).finished();
  // Allow response parsing and its completion callback to settle without a timed sleep.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.locator('#aiResp')).toBeHidden();
  await expect(page.locator('#aiResp')).toHaveText('');
  await expect(page.locator('#aiBtn')).toBeDisabled();
  await expect(page.locator('#aiChat')).not.toHaveClass(/\bon\b/);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([{ method: 'POST', pathname: '/.netlify/functions/ai-advisor', intercepted: true }]);
});

test('explicit scenario saving works locally and retires when calculation inputs change', async ({ page }) => {
  const observed = await setup(page);
  await page.getByLabel('Annual Gross Salary', { exact: true }).fill('60000');
  await calculate(page);
  await expect(page.getByRole('button', { name: 'Save to Dashboard', exact: true })).toBeEnabled();
  await page.getByLabel('Scenario name', { exact: true }).fill('Synthetic scenario');
  await page.getByRole('button', { name: 'Save to Dashboard', exact: true }).click();
  await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');
  await expect(page.locator('#calcSavedList')).toContainText('Synthetic scenario');
  const savedList = await page.locator('#calcSavedList').textContent();
  await page.getByLabel('Basic Salary (for SSNIT)', { exact: true }).fill('30000');
  await expectUnavailable(page);
  await expect(page.locator('#calcSaveBtn')).toBeDisabled();
  await calculate(page);
  await expect(page.locator('#calcSaveBtn')).toBeEnabled();
  await expect(page.locator('#calcSavedList')).toHaveText(savedList);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

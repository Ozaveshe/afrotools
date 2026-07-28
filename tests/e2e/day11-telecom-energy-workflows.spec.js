const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function registryRows() {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'),
    context
  );
  return context.AFRO_TOOLS.filter((tool) => {
    const language = tool.lang || 'en';
    return language === 'en'
      && ['telecom', 'energy'].includes(tool.category)
      && ['live', 'new'].includes(tool.status);
  });
}

function routeInventory() {
  const routes = [];
  for (const tool of registryRows()) {
    const owner = path.join(ROOT, tool.href.replace(/^\/|\/$/g, ''));
    const files = [path.join(owner, 'index.html')];
    if ((tool.toolCount || 1) > 1) {
      for (const entry of fs.readdirSync(owner, { withFileTypes: true })) {
        const candidate = path.join(owner, entry.name, 'index.html');
        if (entry.isDirectory() && fs.existsSync(candidate)) files.push(candidate);
      }
    }
    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']https:\/\/afrotools\.com([^"']+)["']/i);
      if (!canonical) throw new Error(`Missing canonical in ${file}`);
      routes.push({ toolId: tool.id, route: canonical[1] });
    }
  }
  return routes.sort((a, b) => a.route.localeCompare(b.route));
}

function selectedRouteInventory() {
  const routes = routeInventory();
  const shard = String(process.env.DAY11_ROUTE_SHARD || '').match(/^(\d+)\/(\d+)$/);
  if (!shard) return routes;
  const index = Number(shard[1]);
  const total = Number(shard[2]);
  if (total < 1 || index < 0 || index >= total) throw new Error('Invalid DAY11_ROUTE_SHARD');
  return routes.filter((_, routeIndex) => routeIndex % total === index);
}

const WORKFLOWS = [
  ['/telecom/data-plan-compare/', '#resultsArea', null],
  ['/telecom/ussd-directory/', '.codes-grid', null],
  ['/telecom/roaming-cost/', '#compareGrid', '#calcBtn'],
  ['/telecom/starlink-compare/', '#results', null],
  ['/telecom/tv-compare/', '#table-area', null],
  ['/telecom/data-usage-calc/', '.result-panel', null],
  ['/telecom/airtime-value/', '#resultBox', '#calcBtn'],
  ['/telecom/number-portability/', '.info-grid', null],
  ['/telecom/sim-registration/', '.info-grid', null],
  ['/telecom/internet-compare/', '#results', null],
  ['/telecom/fiber-lte-5g/', '#compare-area', null],
  ['/telecom/business-internet/', '#results', '#calc-btn'],
  ['/telecom/bulk-sms-pricing/', '#results', null],
  ['/telecom/whatsapp-vs-sms/', '#results', '#calc-btn'],
  ['/tools/electricity-tariff/', '#etResultPanel', '.et-primary'],
  ['/tools/solar-roi/nigeria/', '.solar-country-results', '#calcBtn'],
  ['/tools/prepaid-meter/', '#pmResultPanel', '.pm-primary'],
  ['/tools/solar-vs-generator/', '#results', '.svg-button.primary'],
  ['/tools/electricity-bill-verify/', '#results', '.ebv-button.primary'],
  ['/tools/water-bill/', '#results', '.wb-button.primary'],
  ['/tools/gas-lpg-cost/', '.lpg-results', '#calculateBtn'],
  ['/tools/paygo-solar/', '.pg-results', '#calculateBtn'],
  ['/tools/outage-cost/', '.oc-results', '#calculateBtn'],
  ['/tools/solar-sizing/', '#results', '#calcBtn'],
  ['/tools/battery-sizing/', '#results', '#calcBtn'],
  ['/tools/energy-audit/', '#results', '#calcBtn'],
  ['/tools/appliance-power/', '#results', '#calcBtn'],
  ['/tools/backup-duration/', '#results', '#calcBtn'],
  ['/tools/diesel-vs-solar-farm/', '#results', '#calcBtn'],
  ['/tools/mini-grid-feasibility/', '#results', '#calcBtn'],
  ['/tools/carbon-footprint-energy/', '#results', '#calcBtn'],
  ['/tools/ev-charging/', '#results', '#calcBtn'],
  ['/tools/biogas-roi/', '#results', '#calcBtn'],
  ['/tools/generator-fuel/', '#gfResults', '#gfCalculate']
];

function selectedWorkflows() {
  const shard = String(process.env.DAY11_WORKFLOW_SHARD || '').match(/^(\d+)\/(\d+)$/);
  if (!shard) return WORKFLOWS;
  const index = Number(shard[1]);
  const total = Number(shard[2]);
  if (total < 1 || index < 0 || index >= total) throw new Error('Invalid DAY11_WORKFLOW_SHARD');
  return WORKFLOWS.filter((_, workflowIndex) => workflowIndex % total === index);
}

async function keepLocalTraffic(page) {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      if (url.pathname.startsWith('/.netlify/functions/') || url.pathname.startsWith('/api/')) {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"error":"Day 11 deterministic offline fixture"}'
        });
      }
      return route.continue();
    }
    return route.abort();
  });
}

async function seedVisibleControls(page) {
  await page.evaluate(() => {
    for (const select of document.querySelectorAll('select')) {
      if (select.disabled || select.offsetParent === null || select.value) continue;
      const option = Array.from(select.options).find((item) => item.value && !item.disabled);
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    for (const input of document.querySelectorAll('input')) {
      if (input.disabled || input.offsetParent === null) continue;
      if (input.type === 'number' && (!input.value || Number(input.value) <= 0)) {
        const minimum = Number(input.min);
        input.value = Number.isFinite(minimum) && minimum > 0 ? String(minimum) : '1';
      }
      if (input.type === 'date' && !input.value) input.value = '2026-07-01';
      if (input.type === 'checkbox' && input.required) input.checked = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

async function gotoWithRetry(page, route) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      lastError = error;
      if (!/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET/.test(error.message) || attempt === 2) throw error;
      await page.waitForTimeout(250 * (attempt + 1));
    }
  }
  throw lastError;
}

async function gotoReady(page, route, selector) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await gotoWithRetry(page, route);
      if (!response || !response.ok()) throw new Error(`${route}: route failed`);
      await page.locator(selector).first().waitFor({ state: 'attached', timeout: 5000 });
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

test.describe.configure({ mode: 'serial' });

test('loads every Day 11 canonical route at 320px without route or reflow failure', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000);
  await keepLocalTraffic(page);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(routeInventory()).toHaveLength(301);
  const routes = selectedRouteInventory();
  const overflowFailures = [];

  for (const item of routes) {
    const response = await gotoWithRetry(page, item.route);
    expect(response, `${item.route}: no response`).not.toBeNull();
    expect(response.ok(), `${item.route}: HTTP ${response.status()}`).toBeTruthy();
    await expect(page.locator('h1').first(), `${item.route}: h1`).toBeVisible();
    let overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    for (const delay of [150, 300, 600, 1000, 1500, 2000]) {
      if (overflow <= 2) break;
      await page.waitForTimeout(delay);
      overflow = await page.evaluate(() => (
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      ));
    }
    if (overflow > 2) overflowFailures.push(`${item.route} (+${overflow}px)`);
  }
  expect(overflowFailures, `320px overflow routes:\n${overflowFailures.join('\n')}`).toEqual([]);
});

test('executes every canonical owner primary workflow at 375px', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000);
  await keepLocalTraffic(page);
  await page.setViewportSize({ width: 375, height: 900 });
  const failures = [];

  expect(WORKFLOWS).toHaveLength(34);
  for (const [route, resultSelector, buttonSelector] of selectedWorkflows()) {
    const pageErrors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', (error) => pageErrors.push(error.message));
    try {
      const response = await gotoWithRetry(page, route);
      if (!response || !response.ok()) throw new Error('route failed');
      await seedVisibleControls(page);
      if (route === '/tools/backup-duration/') {
        await page.fill('#batteryKWh', '5.12');
        await page.fill('#loadWatts', '800');
      }
      if (buttonSelector) {
        const button = page.locator(buttonSelector).first();
        if (await button.count()) await button.evaluate((element) => element.click());
      }
      await page.waitForTimeout(150);
      const result = page.locator(resultSelector).first();
      if (!(await result.count())) throw new Error(`primary result missing (${resultSelector})`);
      const text = (await result.innerText()).trim();
      if (text.length <= 8) throw new Error('empty primary result');
      if (/\b(?:NaN|Infinity|undefined)\b/.test(text)) throw new Error('invalid numeric output');
      if (pageErrors.length) throw new Error(`page errors: ${pageErrors.join(' | ')}`);
    } catch (error) {
      failures.push(`${route}: ${error.message.split('\n')[0]}`);
    }
  }
  expect(failures, `Owner workflow failures:\n${failures.join('\n')}`).toEqual([]);
});

test('independently verifies Telecom arithmetic and the stale fail-closed state', async ({ page }) => {
  await keepLocalTraffic(page);
  await page.setViewportSize({ width: 375, height: 900 });

  await gotoReady(page, '/telecom/airtime-value/', '#telecom-freshness-guard');
  await page.selectOption('#countrySelect', 'NG');
  await page.selectOption('#operatorSelect', { index: 1 });
  await page.fill('#amountInput', '5000');
  await page.click('#calcBtn');
  await expect(page.locator('#resRange')).toContainText('3,500');
  await expect(page.locator('#resRange')).toContainText('4,250');

  const guard = page.locator('#telecom-freshness-guard');
  await expect(guard).toContainText('Archived planning snapshot');
  const expectedAgeDays = await page.evaluate(() => (
    window.AfroTools.telecomFreshness.classify('2026-03-01').ageDays
  ));
  await expect(guard).toContainText(`${expectedAgeDays} days ago`);
  await expect(guard).toContainText('not live offers');
  await expect(guard.locator('a')).toHaveAttribute('href', '/data/telecom/official-sources.json');

  await gotoWithRetry(page, '/telecom/roaming-cost/');
  await page.selectOption('#homeCountry', 'NG');
  await page.selectOption('#destCountry', 'KE');
  await page.fill('#tripDays', '7');
  await page.fill('#callMins', '10');
  await page.fill('#smsCount', '2');
  await page.fill('#dataMB', '500');
  await page.click('#calcBtn');
  await expect(page.locator('#roamPrice')).toContainText('36,400');
});

test('keeps the Telecom fail-closed guard usable in dark mode and at 200% reflow', async ({ page }) => {
  await keepLocalTraffic(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  // A 320 CSS-pixel viewport is the reflow target for a 640px layout viewed at 200%.
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoReady(page, '/telecom/', '#telecom-freshness-guard');
  await page.waitForTimeout(300);
  const guard = page.locator('#telecom-freshness-guard');
  await expect(guard).toBeVisible();
  await expect(guard).toHaveCSS('background-color', 'rgb(43, 33, 16)');
  await guard.locator('a').focus();
  await expect(guard.locator('a')).toBeFocused();
  const reflow = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 2)
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}`)
  }));
  expect(reflow.overflow, reflow.offenders.join('\n')).toBeLessThanOrEqual(2);

  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(guard).toHaveCSS('background-color', 'rgb(43, 33, 16)');
});

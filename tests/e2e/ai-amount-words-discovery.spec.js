const { test, expect } = require('@playwright/test');

async function localOnly(page, theme, baseURL) {
  await page.addInitScript(theme => {
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.removeItem('afrotools.aiAdvisorConsent');
  }, theme);
  const requests = [];
  const errors = [];
  page.on('request', request => requests.push({ url: request.url(), body: request.postData() || '' }));
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
  return { requests, errors };
}

async function fitsViewport(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
}

async function textContrast(locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    const luminance = color => {
      const components = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722;
    };
    const foreground = luminance(style.color);
    const background = luminance(style.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`homepage finds Ghana converter locally at ${width}px in ${theme}`, async ({ page, baseURL }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      const evidence = await localOnly(page, theme, baseURL);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await fitsViewport(page);
      await page.locator('#hero-search-input').fill('Ghana amount 12345.67 to words');
      await page.locator('#hero-search-btn').click();
      await page.waitForURL(/\/ai\/\?source=homepage_input$/);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const card = page.locator('[data-workflow-card][data-tool-id="amount-words-gh"]');
      await expect(card).toContainText('Ghana cedi (GHS)');
      await expect(card).toContainText('not prefilled');
      await expect(card.locator('[data-open-tool]')).toHaveAttribute('href', '/tools/amount-words-gh/');
      expect(await textContrast(card.locator('[data-open-tool]'))).toBeGreaterThanOrEqual(4.5);
      expect(await textContrast(card.locator('.ai-browse'))).toBeGreaterThanOrEqual(4.5);
      expect((await card.locator('[data-open-tool]').boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(page.locator('#aiNoMatchState')).toBeHidden();
      await fitsViewport(page);
      await card.screenshot({ path: testInfo.outputPath('route.png') });
      const state = await page.evaluate(() => window.AfroToolsAICommandPage.getState());
      expect(state.selectedToolId).toBe('amount-words-gh');
      expect(state.toolExecution.supported).toBe(false);
      expect(state.prefillPayload).toBe(null);
      expect(await page.evaluate(() => sessionStorage.getItem('afrotools.aiPrefillDraft'))).toBe(null);
      const report = await page.evaluate(() => JSON.stringify(window.AfroToolsAIIntentAnalytics.getReport()));
      expect(report).not.toContain('12345.67');
      expect(evidence.requests.some(request => /ai-route-intent|ai-advisor/.test(request.url))).toBe(false);
      expect(evidence.requests.some(request => request.url.includes('12345') || request.body.includes('12345'))).toBe(false);
      await card.locator('[data-open-tool]').focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(/\/tools\/amount-words-gh\/$/);
      expect(page.url()).not.toContain('12345');
      await expect(page.locator('#amount')).toHaveValue('');
      await page.locator('#amount').fill('12345.67');
      await expect(page.locator('#wordsResult')).toContainText(/TWELVE THOUSAND THREE HUNDRED AND FORTY[- ]FIVE/i);
      await fitsViewport(page);
      // The shared cross-page View Transition can reject when navigation skips it.
      expect(evidence.errors.filter(message => message !== 'Transition was skipped')).toEqual([]);
    });
  }
}

test('ambiguous currency choice stays local and opens an actual supported multi-currency mode', async ({ page, baseURL }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const evidence = await localOnly(page, 'dark', baseURL);
  await page.goto('/ai/', { waitUntil: 'domcontentloaded' });
  await page.locator('#aiCommandInput').fill('Ghana USD amount to words');
  await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
  await expect(page.locator('[data-amount-words-choice]')).toBeVisible();
  await expect(page.getByLabel('Currency', { exact: true })).toHaveValue('');
  await expect(page.locator('#aiAmountWordsCurrency option')).toHaveCount(18);
  expect(await textContrast(page.getByRole('button', { name: 'Use this currency' }))).toBeGreaterThanOrEqual(4.5);
  await page.locator('[data-amount-words-choice]').screenshot({ path: testInfo.outputPath('currency-choice.png') });
  expect(await page.evaluate(() => window.AfroToolsAICommandPage.getState().selectedToolId)).toBe('');
  await page.getByLabel('Currency', { exact: true }).selectOption('USD');
  await page.getByRole('button', { name: 'Use this currency' }).click();
  const open = page.getByRole('link', { name: 'Open converter', exact: true });
  await expect(open).toBeFocused();
  await expect(page.locator('[data-workflow-card]')).toContainText('Then choose US dollar (USD) from Currency');
  await fitsViewport(page);
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/tools\/naira-to-words\/$/);
  await page.locator('#amount').fill('125.50');
  await page.locator('#currency').selectOption('USD');
  await expect(page.locator('#result')).toContainText(/One Hundred and Twenty[- ]Five Dollars and Fifty Cents Only/i);
  expect(evidence.requests.some(request => /ai-route-intent|ai-advisor/.test(request.url))).toBe(false);
  expect(evidence.errors.filter(message => message !== 'Transition was skipped')).toEqual([]);
});

test('CV and Word document queries retain their existing workflow routes', async ({ page, baseURL }) => {
  await localOnly(page, 'light', baseURL);
  await page.goto('/ai/?router=off', { waitUntil: 'domcontentloaded' });
  for (const [query, toolId] of [
    ['Write a 500 word CV for Ghana', 'cv-builder'],
    ['Convert a Word document to PDF', 'pdf-workspace']
  ]) {
    await page.locator('#aiCommandInput').fill(query);
    await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
    await expect(page.locator('[data-workflow-card]').first()).toHaveAttribute('data-tool-id', toolId);
    await expect(page.locator('[data-amount-words-choice]')).toHaveCount(0);
  }
});

for (const nextAction of ['matched', 'choose_currency', 'clear']) {
  test(`an older router response cannot overwrite a newer ${nextAction} state`, async ({ page, baseURL }) => {
    await localOnly(page, 'light', baseURL);
    await page.addInitScript(() => {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        if (String(args[0]).includes('ai-route-intent')) {
          const originalJson = response.json.bind(response);
          response.json = async function () {
            const data = await originalJson();
            window.__heldRouterResponseRead = true;
            return data;
          };
        }
        return response;
      };
    });
    let release;
    let held = false;
    const responseGate = new Promise(resolve => { release = resolve; });
    await page.route('**/.netlify/functions/ai-route-intent', async route => {
      held = true;
      await responseGate;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        source: 'deterministic',
        decision: { selectedToolId: 'cv-builder', selectedRoute: '/tools/cv-builder/', confidence: 0.9, extractedInputs: {}, missingInputs: [] }
      }) });
    });
    await page.goto('/ai/', { waitUntil: 'domcontentloaded' });
    await page.locator('#aiCommandInput').fill('Create a CV');
    await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
    await expect.poll(() => held).toBe(true);
    if (nextAction === 'clear') {
      await page.locator('#aiCommandInput').press('Escape');
    } else {
      await page.locator('#aiCommandInput').fill(nextAction === 'matched' ? 'Ghana amount to words' : 'Amount to words');
      await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
    }
    release();
    await page.waitForFunction(() => window.__heldRouterResponseRead === true);
    if (nextAction === 'matched') {
      await expect(page.locator('[data-workflow-card]').first()).toHaveAttribute('data-tool-id', 'amount-words-gh');
    } else if (nextAction === 'choose_currency') {
      await expect(page.locator('[data-amount-words-choice]')).toBeVisible();
      await expect(page.locator('#aiAmountWordsCurrency')).toHaveValue('');
    } else {
      await expect(page.locator('#aiEmptyState')).toBeVisible();
      await expect(page.locator('#aiResultState')).toBeHidden();
    }
  });
}

test('a stale router failure cannot replace the local converter result', async ({ page, baseURL }) => {
  await localOnly(page, 'light', baseURL);
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try { return await originalFetch.apply(this, args); }
      catch (error) {
        if (String(args[0]).includes('ai-route-intent')) window.__heldRouterFailed = true;
        throw error;
      }
    };
  });
  let release;
  let held = false;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/.netlify/functions/ai-route-intent', async route => {
    held = true;
    await gate;
    await route.abort();
  });
  await page.goto('/ai/', { waitUntil: 'domcontentloaded' });
  await page.locator('#aiCommandInput').fill('Create a CV');
  await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
  await expect.poll(() => held).toBe(true);
  await page.locator('#aiCommandInput').fill('Ghana amount to words');
  await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
  release();
  await page.waitForFunction(() => window.__heldRouterFailed === true);
  await expect(page.locator('[data-workflow-card]').first()).toHaveAttribute('data-tool-id', 'amount-words-gh');
});

test('an earlier delayed catalog fallback cannot replace the local converter result', async ({ page, baseURL }) => {
  await localOnly(page, 'light', baseURL);
  await page.route('**/assets/js/ai/tool-manifest.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.AfroToolsAIToolManifest = { loadDefaultToolManifest: function () { return []; }, getToolManifestForRouter: function () { return []; } };'
  }));
  await page.route('**/.netlify/functions/ai-route-intent', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ decision: { selectedToolId: 'tool-search', confidence: 0 } })
  }));
  let release;
  let held = false;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/js/ai/afro-directory.js*', async route => {
    held = true;
    await gate;
    await route.fulfill({ contentType: 'application/javascript', body: 'window.AFROTOOLS_TOOL_DIRECTORY = []; window.__heldCatalogLoaded = true;' });
  });
  await page.goto('/ai/', { waitUntil: 'domcontentloaded' });
  await page.locator('#aiCommandInput').fill('Help with Canada');
  await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
  await expect.poll(() => held).toBe(true);
  await expect(page.locator('#aiLoadingState')).toBeVisible();
  await page.locator('#aiCommandInput').fill('Ghana amount to words');
  await page.getByRole('button', { name: 'Find the right AfroTools tool' }).click();
  release();
  await page.waitForFunction(() => window.__heldCatalogLoaded === true);
  await expect(page.locator('[data-workflow-card]').first()).toHaveAttribute('data-tool-id', 'amount-words-gh');
  await expect(page.locator('#aiNoMatchState')).toBeHidden();
});

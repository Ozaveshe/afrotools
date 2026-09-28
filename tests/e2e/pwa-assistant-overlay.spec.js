const { test: base, expect } = require('@playwright/test');
const isAiRequest = url => /(?:\/ai-(?:advisor|route-intent|assist)|\/api\/ai(?:\/|$)|anthropic|openai\.com)/i.test(url);

const test = base.extend({
  observation: async ({ page, baseURL }, use, testInfo) => {
    const origin = new URL(baseURL).origin;
    const observation = { pageErrors: [], consoleErrors: [], warnings: [], blocked: [], writes: [], aiRequests: [] };
    page.on('pageerror', error => observation.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') observation.consoleErrors.push(message.text());
      if (message.type() === 'warning') observation.warnings.push(message.text());
    });
    page.on('request', request => {
      const url = new URL(request.url());
      const metadata = { method: request.method(), origin: url.origin, path: url.pathname };
      if (request.method() !== 'GET') observation.writes.push(metadata);
      if (isAiRequest(request.url())) observation.aiRequests.push(metadata);
    });
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET' || isAiRequest(request.url())) {
        observation.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
        return route.abort();
      }
      if (url.origin !== origin) {
        observation.blocked.push({ origin: url.origin, path: url.pathname });
        return route.fulfill({ status: 204, body: '',
          contentType: request.resourceType() === 'stylesheet' ? 'text/css' : 'text/plain' });
      }
      if ((url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) &&
          url.pathname !== '/api/auth/session') {
        observation.blocked.push({ origin: url.origin, path: url.pathname });
        return route.abort();
      }
      return route.continue();
    });
    try {
      await use(observation);
      expect(observation.writes).toEqual([]);
      expect(observation.aiRequests).toEqual([]);
      expect(observation.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('PWA and assistant workflow evidence', {
        body: Buffer.from(JSON.stringify(observation, null, 2)), contentType: 'application/json'
      });
    }
  }
});

async function prepare(page, route, width, theme) {
  await page.setViewportSize({ width, height: 740 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('aft_theme', selectedTheme);
    localStorage.setItem('afrobot_theme', selectedTheme === 'dark' ? 'light' : 'dark');
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.removeItem('afrobot_position');
    localStorage.removeItem('afro_pwa_dismissed');
  }, theme);
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.waitForFunction(() => performance.getEntriesByType('resource')
    .some(entry => new URL(entry.name).pathname.endsWith('/assets/js/pwa-install.js')));
}

async function offerInstall(page, outcome = 'dismissed') {
  // beforeinstallprompt is a browser capability. This local fixture proves the
  // app's own controls without installing anything or contacting a provider.
  await page.evaluate(outcome => {
    window.__pwaPromptCalls = 0;
    const prompt = new Event('beforeinstallprompt', { cancelable: true });
    prompt.prompt = () => { window.__pwaPromptCalls++; return Promise.resolve(); };
    prompt.userChoice = Promise.resolve({ outcome });
    window.dispatchEvent(prompt);
  }, outcome);
  await expect(page.locator('#afro-pwa-banner')).toBeVisible();
}

async function expectBannerTargets(page) {
  for (const id of ['afro-pwa-install', 'afro-pwa-close']) {
    const button = page.locator('#' + id);
    await expect(button).toBeVisible();
    await expect.poll(() => button.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return rect.width >= 44 && rect.height >= 44 &&
        (hit === element || element.contains(hit));
    })).toBe(true);
  }
}

async function expectPanelInViewport(panel, width) {
  await expect(panel).toHaveAttribute('aria-hidden', 'false');
  await expect(panel).toBeVisible();
  await expect.poll(async () => {
    const rect = await panel.boundingBox();
    return rect && rect.x >= 0 && rect.y >= 0 &&
      rect.x + rect.width <= width && rect.y + rect.height <= 740;
  }).toBe(true);
}

test.describe('PWA controls and mobile assistant access', () => {
  for (const route of ['/', '/tools/afrokitchen/']) for (const width of [320, 390]) {
    for (const theme of ['light', 'dark']) {
      test('PWA controls and in-flow Ask remain usable on ' + route + ' at ' + width + 'px ' + theme,
        async ({ page, observation }) => {
          await prepare(page, route, width, theme);
          await page.keyboard.press('Tab');
          const assistant = page.locator('afro-site-assistant');
          const launcher = assistant.locator('#fab'), panel = assistant.locator('#panel');
          await expect(launcher).toBeVisible();
          await expect.poll(() => assistant.evaluate(element => getComputedStyle(element).position))
            .toMatch(/^(static|relative)$/);
          await offerInstall(page);
          await expectBannerTargets(page);

          // A native modal intentionally owns interaction while open. Close it
          // before checking the browser-install controls behind it.
          await launcher.click();
          await expectPanelInViewport(panel, width);
          await page.keyboard.press('Escape');
          await expect(panel).toBeHidden();
          await expect(launcher).toBeFocused();
          await expectBannerTargets(page);
          await page.locator('#afro-pwa-close').click();
          await expect(page.locator('#afro-pwa-banner')).toHaveCount(0);

          // The menu gives access after the in-flow launcher has scrolled away.
          await page.mouse.wheel(0, 1000);
          await expect(launcher).not.toBeInViewport();
          const navbar = page.locator('afro-navbar');
          await navbar.locator('.burger').click();
          await navbar.getByRole('button', { name: 'Ask AfroTools', exact: true }).click();
          await expectPanelInViewport(panel, width);
          await page.keyboard.press('Escape');
          await expect(navbar.locator('.burger')).toBeFocused();
          await expect.poll(() => page.evaluate(() => Math.max(0,
            document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
          observation.controlsVerified = ['install', 'dismiss', 'in-flow Ask', 'menu Ask'];
        });
    }
  }

  test('a banner shown before lazy help loads keeps install reachable after menu help closes',
    async ({ page, baseURL, observation }) => {
      let release, held = false;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route(/\/(?:site-assistant(?:\.min)?|chat\.[^/]+)\.js(?:\?|$)/, async route => {
        const request = route.request();
        if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL).origin) {
          return route.fallback();
        }
        held = true;
        await gate;
        return route.fallback();
      });
      try {
        await prepare(page, '/', 390, 'dark');
        await offerInstall(page, 'accepted');
        await expectBannerTargets(page);
        const navbar = page.locator('afro-navbar');
        await navbar.locator('.burger').click();
        await navbar.getByRole('button', { name: 'Ask AfroTools', exact: true }).click();
        await expect(navbar.locator('#mobAssistantStatus')).not.toBeEmpty();
        await expect.poll(() => held).toBe(true);
        release();
        const panel = page.locator('afro-site-assistant').locator('#panel');
        await expectPanelInViewport(panel, 390);
        await page.setViewportSize({ width: 320, height: 740 });
        await expectPanelInViewport(panel, 320);
        await page.keyboard.press('Escape');
        await expect(navbar.locator('.burger')).toBeFocused();
        await expectBannerTargets(page);
        await page.locator('#afro-pwa-install').click();
        await expect(page.locator('#afro-pwa-banner')).toHaveCount(0);
        expect(await page.evaluate(() => window.__pwaPromptCalls)).toBe(1);
        expect(await page.evaluate(() => document.documentElement.style
          .getPropertyValue('--afro-pwa-banner-clearance'))).toBe('');
        observation.installPromptInvocations = 1;
      } finally {
        release();
      }
    });
});

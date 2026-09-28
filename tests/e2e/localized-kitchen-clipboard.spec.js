const fs = require('fs');
const { test, expect } = require('@playwright/test');

const locales = {
  fr: { route: '/fr/tools/afrocuisine/', copied: 'Copié', failed: 'Copie impossible', fallback: /Exporter TXT/, language: 'fr-FR' },
  sw: { route: '/sw/zana/jikoni/', copied: 'Imenakiliwa', failed: 'Kunakili kumeshindikana', fallback: /Pakua TXT/, language: 'sw-TZ' },
};

async function openKitchen(page, baseURL, settings, width, theme) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 850 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('aft_theme', selectedTheme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    const state = window.__copyHarness = { mode: 'success', legacy: 'false', writes: [], legacyAttempts: [], pending: [], settled: 0 };
    const nativeExec = document.execCommand.bind(document);
    document.execCommand = command => {
      if (command !== 'copy') return nativeExec(command);
      state.legacyAttempts.push(document.activeElement.value);
      if (state.legacy === 'throw') throw new Error('synthetic_legacy_failure');
      return state.legacy === 'true';
    };
    window.__configureCopy = (mode, legacy) => {
      state.mode = mode;
      state.legacy = legacy;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: mode === 'absent' ? undefined : { writeText(text) {
          state.writes.push(text);
          if (state.mode === 'sync') throw new Error('synthetic_synchronous_denial');
          if (state.mode === 'reject') return Promise.reject(new Error('synthetic_async_denial'));
          if (state.mode === 'held') return new Promise((resolve, reject) => state.pending.push({ resolve, reject }));
          return Promise.resolve();
        } },
      });
    };
    window.__settleCopy = (index, outcome) => {
      const pending = state.pending[index];
      if (outcome === 'success') pending.resolve();
      else pending.reject(new Error('synthetic_held_denial'));
      state.settled += 1;
    };
    window.__configureCopy('success', 'false');
  }, theme);
  await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.abort());
  await page.goto(settings.route, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('#ua-recipe option')).toHaveCount(8);
  return errors;
}

async function visibleFocus(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const navbar = host && (host.shadowRoot && host.shadowRoot.querySelector('nav') || host);
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return Boolean(navbar) && r.left >= 0 && r.top >= Math.max(0, navbar.getBoundingClientRect().bottom)
      && r.right <= innerWidth && r.bottom <= innerHeight && (hit === node || node.contains(hit));
  })).toBe(true);
  return locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const navbar = host.shadowRoot && host.shadowRoot.querySelector('nav') || host;
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { id: node.id, top: r.top, bottom: r.bottom, navbarBottom: navbar.getBoundingClientRect().bottom,
      centerHit: hit === node || node.contains(hit), focused: document.activeElement === node };
  });
}

async function calculate(page) {
  await page.locator('.ua-primary').click();
  await expect(page.locator('[data-ua-export]')).toHaveCount(3);
  await expect(page.locator('[data-ua-table] tbody tr')).toHaveCount(15);
}

async function downloadText(page, kind) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-ua-export="${kind}"]`).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return fs.readFileSync(await download.path(), 'utf8');
}

async function completeTxt(page, settings) {
  const payload = JSON.parse(await downloadText(page, 'json'));
  const txt = await downloadText(page, 'txt');
  expect(payload.result.rows).toHaveLength(15);
  expect(txt).toContain('Nigerian Jollof Rice');
  const contract = await page.locator('#uaContract').evaluate(node => JSON.parse(node.textContent));
  expect(txt).toContain(`${contract.metrics.targetServings}: ${payload.input.targetServings}`);
  for (const key of ['source', 'freshness', 'limitations']) expect(txt).toContain(contract[key]);
  const ingredientLines = txt.split('\n').filter(line => payload.result.rows.some(row => line.startsWith(row.name + ': ')));
  expect(ingredientLines).toEqual(payload.result.rows.map(row => {
    const amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString(settings.language, { maximumFractionDigits: 2 })
      : settings.language === 'fr-FR' ? 'Selon goût' : 'Kulingana na ladha';
    return `${row.name}: ${amount}${row.unit ? ' ' + row.unit : ''}`;
  }));
  return { txt, payload };
}

async function copyWithKeyboard(page) {
  const copy = page.locator('[data-ua-export="copy"]');
  await copy.focus();
  await page.keyboard.press('Enter');
  return copy;
}

async function snapshot(page) {
  return page.evaluate(() => ({
    status: document.querySelector('[data-ua-status]').textContent,
    button: document.querySelector('[data-ua-export="copy"]')?.textContent || null,
    focused: document.activeElement.id || document.activeElement.getAttribute('data-ua-export') || document.activeElement.tagName,
    scrollY,
    legacyAttempts: window.__copyHarness.legacyAttempts.length,
    writes: window.__copyHarness.writes.length,
    hiddenTextareas: [...document.querySelectorAll('textarea')].filter(node => node.style.left === '-9999px').length,
    exports: document.querySelectorAll('[data-ua-export]').length,
  }));
}

async function settleAndFlush(page, index, outcome) {
  await page.evaluate(({ index, outcome }) => window.__settleCopy(index, outcome), { index, outcome });
  // Promise handlers and the next rendering turn must finish before checking stale side effects.
  await flushLayout(page);
}

async function flushLayout(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

for (const [locale, settings] of Object.entries(locales)) {
  for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
    test(`Kitchen ${locale} clipboard failures recover honestly at ${width}px ${theme}`, async ({ page, baseURL }, testInfo) => {
      const errors = await openKitchen(page, baseURL, settings, width, theme);
      await calculate(page);
      const expected = await completeTxt(page, settings);
      const evidence = { locale, width, theme, browser: testInfo.project.name, scenarios: [] };
      const scenarios = [
        { mode: 'success', legacy: 'false', copied: true, fallback: false },
        { mode: 'absent', legacy: 'true', copied: true, fallback: true },
        { mode: 'reject', legacy: 'true', copied: true, fallback: true },
        { mode: 'sync', legacy: 'true', copied: true, fallback: true },
        { mode: 'absent', legacy: 'false', copied: false, fallback: true },
        { mode: 'reject', legacy: 'false', copied: false, fallback: true },
        { mode: 'sync', legacy: 'false', copied: false, fallback: true },
        { mode: 'absent', legacy: 'throw', copied: false, fallback: true },
      ];
      for (const scenario of scenarios) {
        const before = await snapshot(page);
        await page.evaluate(({ mode, legacy }) => window.__configureCopy(mode, legacy), scenario);
        const copy = await copyWithKeyboard(page);
        await expect(copy).toHaveText(scenario.copied ? settings.copied : settings.failed);
        if (!scenario.copied) await expect(page.locator('[data-ua-status]')).toContainText(settings.fallback);
        const focus = scenario.fallback ? await visibleFocus(copy) : null;
        const after = await snapshot(page);
        expect(after.hiddenTextareas).toBe(0);
        expect(after.legacyAttempts - before.legacyAttempts).toBe(scenario.fallback ? 1 : 0);
        const harness = await page.evaluate(() => ({ writes: window.__copyHarness.writes, attempts: window.__copyHarness.legacyAttempts }));
        if (scenario.mode !== 'absent') expect(harness.writes.at(-1).trim()).toBe(expected.txt.trim());
        if (scenario.fallback) expect(harness.attempts.at(-1).trim()).toBe(expected.txt.trim());
        // The actual advertised fallback remains downloadable, with every ingredient and caveat.
        const actualFallback = await completeTxt(page, settings);
        expect(actualFallback.txt).toBe(expected.txt);
        evidence.scenarios.push({ ...scenario, focus, after, txt: actualFallback.txt });
      }
      await page.evaluate(() => window.__configureCopy('absent', 'false'));
      await page.locator('[data-ua-result]').focus();
      const attempts = await page.evaluate(() => window.__copyHarness.legacyAttempts.length);
      const copy = page.locator('[data-ua-export="copy"]');
      await copy.evaluate(node => {
        window.__copyPointerEvents = [];
        for (const type of ['pointerdown', 'mousedown', 'click']) node.addEventListener(type, event => {
          window.__copyPointerEvents.push({ type: event.type, trusted: event.isTrusted });
        });
      });
      await copy.click();
      await expect.poll(() => page.evaluate(() => window.__copyHarness.legacyAttempts.length)).toBe(attempts + 1);
      await expect(copy).toHaveText(settings.failed);
      evidence.pointerFailureFocus = await visibleFocus(copy);
      evidence.pointerEvents = await page.evaluate(() => window.__copyPointerEvents);
      expect(evidence.pointerEvents).toContainEqual({ type: 'pointerdown', trusted: true });
      expect(evidence.pointerEvents).toContainEqual({ type: 'click', trusted: true });
      await page.screenshot({ path: testInfo.outputPath('failed-copy-visible-focus.png') });
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
      fs.writeFileSync(testInfo.outputPath('clipboard-failure-and-txt.json'), JSON.stringify(evidence, null, 2));
      await page.screenshot({ path: testInfo.outputPath('clipboard-failure-txt-available.png') });
    });
  }

  test(`Kitchen ${locale} ignores stale clipboard attempts after state and newer-copy changes`, async ({ page, baseURL }, testInfo) => {
    const errors = await openKitchen(page, baseURL, settings, 320, 'dark');
    const evidence = { locale, browser: testInfo.project.name, races: [] };
    for (const outcome of ['denial', 'success']) for (const action of ['recipe', 'target', 'reset', 'recalculate', 'newer-copy']) {
      await page.locator('[data-ua-reset]').click();
      await calculate(page);
      await page.evaluate(() => window.__configureCopy('held', 'true'));
      const pendingIndex = await page.evaluate(() => window.__copyHarness.pending.length);
      await copyWithKeyboard(page);
      await expect.poll(() => page.evaluate(() => window.__copyHarness.pending.length)).toBe(pendingIndex + 1);
      if (action === 'recipe') {
        await page.locator('#ua-recipe').selectOption('ugali-sukuma-wiki');
        await page.locator('#ua-recipe').focus();
      } else if (action === 'target') {
        await page.locator('#ua-targetServings').fill('18');
      } else if (action === 'reset') {
        await page.locator('[data-ua-reset]').click();
        await visibleFocus(page.locator('#ua-recipe'));
      } else if (action === 'recalculate') {
        // Identical inputs still produce a new payload and a new connected export button.
        await calculate(page);
        await page.locator('#ua-targetServings').focus();
      } else {
        await page.evaluate(() => window.__configureCopy('absent', 'false'));
        const currentCopy = await copyWithKeyboard(page);
        await expect(currentCopy).toHaveText(settings.failed);
        await visibleFocus(currentCopy);
      }
      // Input invalidation removes a tall table; let native layout/focus scrolling finish before release.
      await flushLayout(page);
      const before = await snapshot(page);
      await settleAndFlush(page, pendingIndex, outcome);
      const after = await snapshot(page);
      expect(after).toEqual(before);
      expect(after.hiddenTextareas).toBe(0);
      evidence.races.push({ outcome, action, before, after });
    }
    evidence.currentFocus = [];
    for (const legacy of ['false', 'true']) {
      await page.locator('[data-ua-reset]').click();
      await calculate(page);
      await page.evaluate(legacy => window.__configureCopy('held', legacy), legacy);
      const pendingIndex = await page.evaluate(() => window.__copyHarness.pending.length);
      await copyWithKeyboard(page);
      await expect.poll(() => page.evaluate(() => window.__copyHarness.pending.length)).toBe(pendingIndex + 1);
      await page.keyboard.press('Tab');
      const nextControl = page.locator('[data-ua-export="txt"]');
      await expect(nextControl).toBeFocused();
      await settleAndFlush(page, pendingIndex, 'denial');
      await expect(page.locator('[data-ua-export="copy"]')).toHaveText(legacy === 'true' ? settings.copied : settings.failed);
      const focus = await visibleFocus(nextControl);
      evidence.currentFocus.push({ legacy, focus, state: await snapshot(page) });
    }
    await page.locator('[data-ua-reset]').click();
    await calculate(page);
    evidence.finalExports = await completeTxt(page, settings);
    expect(errors).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('stale-clipboard-races.json'), JSON.stringify(evidence, null, 2));
  });
}

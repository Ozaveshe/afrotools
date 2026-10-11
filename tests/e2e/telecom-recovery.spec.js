const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const locales = [
  { lang: 'fr', prefix: '/fr/telecom/', apps: require('../../scripts/build-french-telecom-parity').APPS },
  { lang: 'sw', prefix: '/sw/zana/', apps: require('../../scripts/build-swahili-telecom-parity').APPS }
];
const cataloguePath = '/data/telecom/country-telecom-index.js';
const catalogue = 'var TELECOM_DATA=' + JSON.stringify({ lastUpdated: '2026-03-01', countries: { NG: { name: 'Nigeria', currency: 'NGN', symbol: 'NGN', operators: [{ name: 'Synthetic', dataBundles: [{ name: 'Synthetic monthly', validity: '30 days', volumeMB: 200000, volume: '200 GB', price: 2000 }] }] } } }) + ';';

for (const app of locales[0].apps) {
  test(`English ${app.toolId}: canonical route renders at 320 and 390 pixels`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    await page.setViewportSize({ width: 320, height: 844 });
    const response = await page.goto(app.english);
    expect(response.ok()).toBe(true);
    await expect(page.locator('h1').first()).toBeVisible();
    await reflow(page);
    expect(observed.errors).toEqual([]);
  });
}

async function localOnly(page, baseURL) {
  const errors = [], navigations = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.isNavigationRequest() && r.frame() === page.mainFrame()) navigations.push(r.url()); });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  return { errors, navigations };
}
async function fileText(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await pending;
  return fs.readFileSync(await download.path(), 'utf8');
}
async function range(page, name, value) {
  await page.locator(`[name="${name}"]`).evaluate((el, next) => { el.value = next; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(value));
}
async function reflow(page) {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
}

for (const locale of locales) {
  for (const app of locale.apps) {
    for (const fault of ['catalogue', 'engine', 'locale', 'controller', 'config']) {
      test(`${locale.lang} ${app.toolId}: ${fault} unavailable cannot submit fields in the URL`, async ({ page, baseURL }) => {
        const observed = await localOnly(page, baseURL);
        const route = locale.prefix + app.slug + '/';
        const paths = { catalogue: cataloguePath, engine: '/assets/js/engines/telecom-planning-engine.js', locale: `/assets/js/lib/${locale.lang}-telecom-localization.js`, controller: `/assets/js/pages/${locale.lang}-telecom-app.js` };
        if (fault === 'config') {
          await page.route('**' + route, async request => {
            const response = await request.fetch();
            const body = (await response.text()).replace(new RegExp(`(<script id="${locale.lang}-telecom-config"[^>]*>)[\\s\\S]*?(</script>)`), '$1{invalid$2');
            await request.fulfill({ response, body });
          });
        } else await page.route('**' + paths[fault] + '*', r => r.fulfill({ contentType: 'application/javascript', body: '' }));
        await page.goto(route);
        const submit = page.locator('#telecom-form button[type="submit"]');
        if (fault === 'catalogue' && app.kind === 'dataUsage') {
          await expect(submit).toBeEnabled();
          await page.selectOption('[name="youtubeQuality"]', 'medium');
          await submit.click();
          const payload = JSON.parse(await fileText(page, '#telecom-download-json'));
          expect(payload.result.totalMB).toBe(40204);
          expect(payload.result.recommendationsStatus).toBe('unavailable');
          expect(payload.datasetReviewedAt).toBeNull();
          expect(payload.result.source).toBeNull();
        } else {
          await expect(submit).toBeDisabled();
          await expect(page.locator('#telecom-errors')).not.toBeEmpty();
          await expect(page.locator('#telecom-download-json')).toBeDisabled();
          await expect(page.locator('#telecom-import')).toBeDisabled();
        }
        const field = page.locator('#telecom-form input:not([type="hidden"]):enabled, #telecom-form select:enabled').first();
        if (await field.count()) { await field.focus(); await field.press('Enter'); }
        expect(new URL(page.url()).search).toBe('');
        expect(observed.navigations.every(url => !new URL(url).search)).toBe(true);
        expect(observed.errors).toEqual([]);
        if (app.toolId === 'telecom-starlink' && fault === 'catalogue') {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          const states = await page.evaluate(() => {
            const select = document.querySelector('#telecom-form select');
            const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
              .map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
              .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
            return ['light', 'dark', 'light', 'dark'].map(theme => {
              document.documentElement.setAttribute('data-theme', theme);
              select.focus();
              const style = getComputedStyle(select);
              const text = luminance(style.color), background = luminance(style.backgroundColor);
              return { theme, contrast: (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05),
                bodyBackground: getComputedStyle(document.body).backgroundColor,
                runningTransitions: document.getAnimations().filter(animation => animation instanceof CSSTransition && animation.playState === 'running').length };
            });
          });
          for (const state of states) {
            expect(state.contrast, `${state.theme}: reduced-motion contrast must change atomically`).toBeGreaterThanOrEqual(4.5);
            expect(state.runningTransitions, `${state.theme}: reduced motion leaves no page or control transition`).toBe(0);
          }
          expect(states[0].bodyBackground).not.toBe(states[1].bodyBackground);
          expect(states[2].bodyBackground).toBe(states[0].bodyBackground);
          expect(states[3].bodyBackground).toBe(states[1].bodyBackground);
        }
      });
    }
  }

  for (const failure of ['503', 'timeout']) {
    test(`${locale.lang}: catalogue ${failure}, late response and retry preserve current local exports`, async ({ page, baseURL }) => {
      const observed = await localOnly(page, baseURL);
      let requests = 0;
      await page.route('**' + cataloguePath + '*', async route => {
        requests++;
        if (requests === 1) return route.fulfill({ contentType: 'application/javascript', body: '' });
        if (requests === 2) {
          if (failure === 'timeout') await new Promise(resolve => setTimeout(resolve, 13000));
          return route.fulfill({ status: failure === '503' ? 503 : 200, contentType: 'application/javascript', body: catalogue });
        }
        return route.fulfill({ contentType: 'application/javascript', body: catalogue });
      });
      const usage = locale.apps.find(app => app.kind === 'dataUsage');
      await page.goto(locale.prefix + usage.slug + '/');
      await range(page, 'browsing', 3);
      await page.selectOption('[name="youtubeQuality"]', 'medium');
      await page.locator('#telecom-form button[type="submit"]').click();
      const local = JSON.parse(await fileText(page, '#telecom-download-json'));
      expect(local.result.totalMB).toBe(43804);
      await page.locator('[data-telecom-retry]').first().evaluate(el => { el.click(); el.click(); });
      await expect(page.locator('[data-telecom-retry]').first()).toBeEnabled({ timeout: 14000 });
      if (failure === 'timeout') await page.waitForTimeout(1500);
      expect(requests).toBe(2);
      await expect(page.locator('[name="country"]')).toBeDisabled();
      expect(JSON.parse(await fileText(page, '#telecom-download-json')).result.totalMB).toBe(43804);
      await reflow(page);
      await page.locator('[data-telecom-retry]').first().click();
      await expect(page.locator('[name="country"]')).toBeEnabled();
      expect(requests).toBe(3);
      await expect(page.locator('[name="browsing"]')).toHaveValue('3');
      await expect(page.locator('#telecom-download-json')).toBeDisabled();
      await page.selectOption('[name="country"]', 'NG');
      await page.selectOption('[name="youtubeQuality"]', 'medium');
      await page.locator('#telecom-form button[type="submit"]').click();
      const result = JSON.parse(await fileText(page, '#telecom-download-json'));
      expect(result.result.totalMB).toBe(43804);
      expect(result.datasetReviewedAt).toBe('2026-03-01');
      expect(result.result.source.reviewedAt).toBe('2026-03-01');
      expect(result.result.recommendedPlans[0].name).toBe('Synthetic monthly');
      const txt = await fileText(page, '#telecom-download-txt');
      expect(txt).toContain('2026-03-01');
      expect(txt).toContain('Synthetic');
      expect(txt).toContain((await page.locator('#telecom-results').innerText()).trim());
      expect(observed.errors).toEqual([]);
    });
  }

  for (const fault of ['missing-false', 'missing-throw', 'write-throw', 'write-reject', 'late-success', 'late-reject']) {
    test(`${locale.lang}: ${fault} clipboard leaves current results and TXT usable`, async ({ page, baseURL }) => {
      const observed = await localOnly(page, baseURL);
      await page.addInitScript(mode => {
        let clipboard;
        if (!mode.startsWith('missing')) clipboard = { writeText() {
          if (mode === 'write-throw') throw Error('synthetic');
          if (mode === 'write-reject') return Promise.reject(Error('synthetic'));
          return new Promise((resolve, reject) => { window.finishCopy = mode === 'late-success' ? resolve : () => reject(Error('synthetic')); });
        } };
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
        document.execCommand = () => { if (mode === 'missing-throw') throw Error('synthetic'); return false; };
      }, fault);
      const usage = locale.apps.find(app => app.kind === 'dataUsage');
      await page.goto(locale.prefix + usage.slug + '/');
      await page.selectOption('[name="country"]', 'NG');
      await page.selectOption('[name="youtubeQuality"]', 'medium');
      await page.locator('#telecom-form button[type="submit"]').click();
      const copy = page.locator('#telecom-copy');
      await copy.focus(); await copy.press('Enter');
      if (fault.startsWith('late')) {
        await range(page, 'browsing', 3);
        const currentStatus = await page.locator('#telecom-export-status').textContent();
        await page.evaluate(() => window.finishCopy());
        await page.waitForTimeout(25);
        await expect(page.locator('#telecom-export-status')).toHaveText(currentStatus);
        await expect(page.locator('#telecom-download-json')).toBeDisabled();
        await page.locator('#telecom-form button[type="submit"]').click();
      } else {
        await expect(page.locator('#telecom-export-status')).toContainText('TXT');
        await expect(copy).toBeFocused();
      }
      const current = JSON.parse(await fileText(page, '#telecom-download-json'));
      expect(current.result.totalMB).toBe(fault.startsWith('late') ? 43804 : 40204);
      const txt = await fileText(page, '#telecom-download-txt');
      expect(txt).toContain('2026-03-01');
      expect(txt).toContain(usage.slug);
      expect(observed.errors).toEqual([]);
    });
  }
}

test('English usage stays local through missing catalogue, failed retry and current brief exports', async ({ page, baseURL }) => {
  const observed = await localOnly(page, baseURL);
  let requests = 0;
  await page.route('**' + cataloguePath + '*', r => { requests++; return r.fulfill({ status: requests === 2 ? 503 : 200, contentType: 'application/javascript', body: requests < 3 ? '' : catalogue }); });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/telecom/data-usage-calc/');
  await expect(page.locator('.activity input[type="range"]')).toHaveCount(7);
  await page.locator('#slider_browsing').focus(); await page.keyboard.press('ArrowRight');
  await page.selectOption('#quality_youtube', 'hd');
  const panel = '[data-telecom-focus="telecom-data-usage"]';
  await expect(page.locator(panel + ' [data-telecom-preview]')).toContainText('Web Browsing: 1.5');
  const text = await fileText(page, panel + ' [data-telecom-action="download"]');
  for (const row of ['Web Browsing: 1.5', 'Social Media: 2', 'YouTube / Video: 1 (HD)', 'Email: 20', 'recommendations are unavailable']) expect(text).toContain(row);
  await page.locator(panel + ' [data-telecom-action="copy"]').click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(text);
  await page.locator(panel + ' [data-telecom-action="save"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools.telecom.telecom-data-usage.v1')).content)).toBe(text);
  await page.locator('[data-retry-catalogue]').click();
  await expect(page.locator('[data-retry-catalogue]')).toBeEnabled();
  await expect(page.locator('#countrySelect')).toBeDisabled();
  await page.locator('[data-retry-catalogue]').click();
  await expect(page.locator('#countrySelect')).toBeEnabled();
  await page.selectOption('#countrySelect', 'NG');
  await expect(page.locator(panel + ' [data-telecom-preview]')).toContainText('Synthetic monthly');
  const recovered = await fileText(page, panel + ' [data-telecom-action="download"]');
  expect(recovered).toContain('Synthetic monthly'); expect(recovered).toContain('Web Browsing: 1.5');
  await reflow(page);
  expect(observed.errors).toEqual([]);
});

for (const [lang, route] of [['ha', '/ha/kayan-aiki/amfanin-bayanan-intanet/'], ['yo', '/yo/awon-ise/amulo-data/']]) {
  test(`${lang}: empty, negative, excessive and zero usage have distinct valid states`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    await page.goto(route);
    await expect(page.locator('#netResult')).toBeVisible();
    const calculate = lang === 'ha' ? page.locator('button[onclick="calcNet()"]') : page.locator('#calcBtn');
    if (lang === 'yo') {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const contrast = await page.evaluate(async () => window.axe.run({ include: [['#calcBtn']] }, { runOnly: { type: 'rule', values: ['color-contrast'] } }));
      expect(contrast.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
      expect(contrast.incomplete).toEqual([]);
      expect(contrast.passes.some(rule => rule.id === 'color-contrast')).toBe(true);
    }
    for (const value of ['', '-1', '25', '1e30']) {
      await page.locator('#browse').fill(value); await calculate.click();
      await expect(page.locator('#netResult')).toBeHidden();
      expect(await page.locator('#browse').evaluate(el => el.checkValidity())).toBe(false);
    }
    await page.locator('#browse').fill('2');
    await page.locator('#calls').fill('169'); await calculate.click();
    await expect(page.locator('#netResult')).toBeHidden();
    for (const selector of ['#browse', '#video', '#calls', '#study', ...(lang === 'yo' ? ['#social'] : [])]) await page.locator(selector).fill('0');
    await calculate.click(); await expect(page.locator('#netResult strong')).toHaveText('0 GB');
    await page.locator('#browse').fill('2'); await calculate.click();
    await expect(page.locator('#netResult strong')).toHaveText('6 GB');
    if (lang === 'ha') {
      const text = await fileText(page, 'button[onclick="downloadNet()"]');
      expect(text).toContain('6 GB'); expect(text).toContain('Lilo: 2h/rana');
    }
    await reflow(page);
    expect(observed.errors).toEqual([]);
  });
}

for (const slug of ['data-plan-compare', 'ussd-directory', 'data-usage-calc', 'roaming-cost', 'business-internet', 'bulk-sms-pricing', 'whatsapp-vs-sms']) {
  test(`English ${slug}: shared brief actions export current preview and disclose clipboard/storage failures`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/telecom/' + slug + '/');
    const panel = page.locator('[data-telecom-focus]');
    await expect(panel).toHaveCount(1);
    await expect(panel.locator('[data-telecom-preview]')).not.toBeEmpty();
    const preview = await panel.locator('[data-telecom-preview]').textContent();
    const downloaded = await fileText(page, '[data-telecom-focus] [data-telecom-action="download"]');
    expect(downloaded).toBe(preview);
    await panel.locator('[data-telecom-action="copy"]').click();
    await expect(panel.locator('[data-telecom-status]')).toHaveText('Copied to clipboard.');
    expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(preview);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      Storage.prototype.setItem = () => { throw Error('synthetic blocked storage'); };
    });
    await panel.locator('[data-telecom-action="copy"]').click();
    await expect(panel.locator('[data-telecom-status]')).toContainText('Copy failed');
    await panel.locator('[data-telecom-action="save"]').click();
    await expect(panel.locator('[data-telecom-status]')).toContainText('Download the TXT brief');
    expect(await fileText(page, '[data-telecom-focus] [data-telecom-action="download"]')).toBe(preview);
    expect(observed.errors).toEqual([]);
  });
}

test('English real catalogue timeout ignores late success and a subsequent retry keeps edited inputs', async ({ page, baseURL }) => {
  const observed = await localOnly(page, baseURL);
  let requests = 0;
  await page.route('**' + cataloguePath + '*', async route => {
    requests++;
    if (requests === 1) return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (requests === 2) await new Promise(resolve => setTimeout(resolve, 13000));
    return route.fulfill({ contentType: 'application/javascript', body: catalogue });
  });
  await page.goto('/telecom/data-usage-calc/');
  await page.locator('#slider_browsing').focus(); await page.keyboard.press('ArrowRight');
  await page.locator('[data-retry-catalogue]').evaluate(el => { el.click(); el.click(); });
  await expect(page.locator('[data-retry-catalogue]')).toBeEnabled({ timeout: 14000 });
  await page.waitForTimeout(1500);
  expect(requests).toBe(2);
  await expect(page.locator('#countrySelect')).toBeDisabled();
  await expect(page.locator('#slider_browsing')).toHaveValue('1.5');
  await page.locator('[data-retry-catalogue]').click();
  await expect(page.locator('#countrySelect')).toBeEnabled();
  expect(requests).toBe(3);
  await page.selectOption('#countrySelect', 'NG');
  const result = await fileText(page, '[data-telecom-focus] [data-telecom-action="download"]');
  expect(result).toContain('Synthetic monthly'); expect(result).toContain('Web Browsing: 1.5');
  expect(observed.errors).toEqual([]);
});

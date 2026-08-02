const { test, expect } = require('@playwright/test');

const apps = [
  {
    id: 'fixed-deposit', english: '/tools/fixed-deposit/', swahili: '/sw/zana/kikokotoo-amana-ya-muda/',
    values: { '#fd-country': 'KE', '#fd-tenor': '12', '#fd-amount': '500000', '#fd-rate': '12', '#fd-tax': '10', '#fd-compound': 'compound' },
    result: '#fd-results', metricIds: ['#fd-total', '#fd-interest', '#fd-tax-amt', '#fd-net-interest', '#fd-monthly', '#fd-ear', '#fd-net-ear'],
    dirty: '#fd-rate', invalid: '#fd-amount'
  },
  {
    id: 'tbill-calc', english: '/tools/tbill-calc/', swahili: '/sw/zana/kikokotoo-hati-za-hazina/',
    values: { '#tb-country': 'KE', '#tb-tenor': '182', '#tb-amount': '1000000', '#tb-rate': '13', '#tb-ratetype': 'discount', '#tb-tax': '10' },
    result: '#tb-results', metricIds: ['#tb-maturity', '#tb-price', '#tb-return', '#tb-tax-amt', '#tb-net', '#tb-actual-yield', '#tb-annualized'],
    dirty: '#tb-rate', invalid: '#tb-amount'
  },
  {
    id: 'real-return', english: '/tools/real-return/', swahili: '/sw/zana/faida-halisi-baada-ya-mfumuko/',
    values: { '#rr-country': 'KE', '#rr-nominal': '12', '#rr-inflation': '8', '#rr-amount': '1000000', '#rr-years': '5' },
    result: '#rr-results', metricIds: ['#rr-real', '#rr-nominal-val', '#rr-inflation-val', '#rr-real-val', '#rr-purchasing-power', '#rr-approx'],
    dirty: '#rr-inflation', invalid: '#rr-amount'
  }
];

async function fill(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const control = page.locator(selector);
    if (await control.evaluate((node) => node.tagName === 'SELECT')) await control.selectOption(value);
    else await control.fill(value);
  }
}

async function values(page, selectors) {
  return Promise.all(selectors.map((selector) => page.locator(selector).textContent()));
}

for (const app of apps) {
  test(`${app.id} matches the English owner and clears stale or invalid results`, async ({ page }) => {
    await page.goto(app.english);
    await fill(page, app.values);
    await page.locator('.btn-calc').click();
    await expect(page.locator(app.result)).toBeVisible();
    const oracle = await values(page, app.metricIds);

    await page.goto(app.swahili);
    await fill(page, app.values);
    await page.locator('[data-sw-fintech-savings-form]').press('Enter');
    await expect(page.locator(app.result)).toBeVisible();
    expect(await values(page, app.metricIds)).toEqual(oracle);

    await page.locator(app.dirty).fill('14');
    await expect(page.locator(app.result)).toBeHidden();
    await page.locator(app.invalid).fill('0');
    await page.locator('.btn-calc').click();
    await expect(page.locator(app.result)).toBeHidden();
    expect(await page.locator(app.invalid).evaluate((node) => node.checkValidity())).toBe(false);
    await expect(page.locator('[data-export]')).toHaveCount(0);
  });
}

test('three routes pass mobile, 200% text, themes, contrast, keyboard, metadata, artwork, privacy and candidate AI checks', async ({ page, request, browserName }) => {
  const failedRequests = [];
  const pageErrors = [];
  page.on('requestfailed', (item) => failedRequests.push(item.url()));
  page.on('pageerror', (error) => pageErrors.push(error.message));

  for (const app of apps) {
    const external = [];
    const writes = [];
    const badResources = [];
    const listener = (item) => {
      const url = new URL(item.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(item.url());
      if (!['GET', 'HEAD'].includes(item.method())) writes.push(`${item.method()} ${item.url()}`);
    };
    page.on('request', listener);
    page.on('response', (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(app.swahili, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate((img) => ({ width: img.naturalWidth, height: img.naturalHeight }))).toEqual({ width: 600, height: 400 });
    await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', `/sw/ai/?tool=${app.id}`);
    await expect(page.locator('.source-box')).toContainText('uhakika ni wa kati');
    await expect(page.locator('.source-box')).toContainText('Udhamini');
    await expect(page.locator('.privacy-box')).toContainText('Hakuna jina');

    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; node.dataset.themeChoice = value; }, theme);
      await expect(page.locator('.card').first()).toBeVisible();
      const proof = await page.evaluate(() => {
        function rgb(value) { return (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number); }
        function lum(value) { const c = rgb(value).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
        function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
        function background(node) { let current = node; while (current) { const value = getComputedStyle(current).backgroundColor; if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value; current = current.parentElement; } return 'rgb(255,255,255)'; }
        const badText = Array.from(document.querySelectorAll('body *')).filter((node) => {
          const style = getComputedStyle(node);
          const text = Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
          return text && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
        }).map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 60), value: ratio(getComputedStyle(node).color, background(node)) })).filter((item) => item.value + .01 < 4.5);
        const badBoundaries = Array.from(document.querySelectorAll('input,select,button,.ai-handoff')).map((node) => {
          const style = getComputedStyle(node); const parentBg = background(node.parentElement);
          return { tag: node.tagName, id: node.id, border: style.borderColor, parentBg, value: ratio(style.borderColor, parentBg) };
        }).filter((item) => item.value + .01 < 3);
        return { badText, badBoundaries };
      });
      expect(proof.badText, `${app.id}:${theme} text`).toEqual([]);
      expect(proof.badBoundaries, `${app.id}:${theme} boundaries`).toEqual([]);
    }

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.locator('html').evaluate((node) => { delete node.dataset.theme; node.dataset.themeChoice = 'auto'; });
    await expect(page.locator('.card').first()).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
    const focus = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement); return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.style).not.toBe('none');

    const unnamed = await page.locator('main input,main select,main button,main a').evaluateAll((nodes) => nodes.filter((node) => {
      if (node.tagName === 'A' || node.tagName === 'BUTTON') return !node.textContent.trim() && !node.getAttribute('aria-label');
      return !node.labels?.length && !node.getAttribute('aria-label');
    }).map((node) => node.outerHTML.slice(0, 160)));
    expect(unnamed).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    page.off('request', listener);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);
    expect(badResources).toEqual([]);

    const aiPage = await page.context().newPage();
    await aiPage.goto(`/sw/ai/?tool=${app.id}`);
    await expect(aiPage).toHaveURL(new RegExp(`/sw/ai/\\?tool=${app.id}$`));
    await expect(aiPage.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status', 'not-accepted');
    await aiPage.close();
  }

  expect(browserName).toBe('chromium');
  expect(failedRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect((await request.get('/sw/ai/')).ok()).toBe(true);
});

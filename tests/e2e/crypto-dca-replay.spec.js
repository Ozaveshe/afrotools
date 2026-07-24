const { test, expect } = require('@playwright/test');

const DAY = 86400000;

function lastCompletedUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - DAY);
}

function historyPayload(url) {
  const parsed = new URL(url);
  const from = parsed.searchParams.get('from');
  const to = parsed.searchParams.get('to');
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  const prices = [];
  for (let at = start; at <= end; at += DAY) {
    prices.push({ at: new Date(at).toISOString(), price: 1000000 + prices.length * 2500 });
  }
  return {
    status: 'fresh',
    asset: parsed.searchParams.get('asset'),
    currency: parsed.searchParams.get('currency'),
    request: { from, to, rangeDays: prices.length },
    source: {
      name: 'CoinGecko',
      url: 'https://www.coingecko.com/',
      endpoint: 'market_chart/range',
      attribution: 'Data provided by CoinGecko',
    },
    fetchedAt: new Date().toISOString(),
    actualRange: { from: prices[0].at, to: prices[prices.length - 1].at },
    granularity: 'provider daily reference points',
    cache: 'miss',
    prices,
  };
}

async function mockHistory(page, requests, status = 200) {
  await page.route('**/api/crypto-dca-history?**', async route => {
    requests.push(route.request().url());
    if (status !== 200) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'unavailable', error: 'provider_unavailable', message: 'CoinGecko is unavailable.', fallback: 'none' }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload(route.request().url())) });
  });
}

async function assertNoDocumentOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll('body *')).map(element => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: String(element.className || ''), left: rect.left, right: rect.right, width: rect.width };
    }).filter(rect => rect.right > document.documentElement.clientWidth + 1 || rect.left < -1).filter(rect => !['THEAD', 'TR', 'TH', 'TD'].includes(rect.tag)).slice(0, 12),
    targets: ['.dca-history-panel', '#dca-history-scroll', '.dca-table', '.dca-results', '.dca-result-stack'].map(selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { selector, left: rect.left, right: rect.right, width: rect.width, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: style.overflowX };
    }).filter(Boolean),
  }));
  const rootCanScroll = await page.evaluate(() => {
    const root = document.scrollingElement;
    const before = root.scrollLeft;
    root.scrollLeft = 10000;
    const after = root.scrollLeft;
    root.scrollLeft = before;
    return after > 0;
  });
  expect(rootCanScroll, JSON.stringify({ offenders: dimensions.offenders, targets: dimensions.targets })).toBe(false);
}

for (const locale of [
  { path: '/crypto/dca-calculator/', ready: /Replay complete/ },
  { path: '/fr/crypto/dca-calculator/', ready: /Reconstitution terminée/ },
]) {
  test(`${locale.path} mobile light/dark replay, privacy and exports`, async ({ page }, testInfo) => {
    const requests = [];
    await mockHistory(page, requests);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(locale.path);
    await expect(page.locator('h1')).toBeVisible();
    await assertNoDocumentOverflow(page);

    await page.locator('#dca-weekly').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#dca-biweekly')).toBeChecked();
    await page.locator('#dca-percent-cost').fill('1');
    await page.locator('#dca-fixed-cost').fill('25');
    await page.locator('#dca-submit').click();
    await expect(page.locator('#dca-status')).toContainText(locale.ready);
    await expect(page.locator('#dca-receipt-grid')).toContainText('CoinGecko');
    await expect(page.locator('#dca-results')).toBeVisible();
    await expect(page.locator('#dca-chart')).toHaveAttribute('role', 'img');
    expect(requests).toHaveLength(1);

    const request = new URL(requests[0]);
    expect(Array.from(request.searchParams.keys()).sort()).toEqual(['asset', 'currency', 'from', 'to']);
    expect(request.search).not.toMatch(/50000|contribution|cost|percent|fixed/i);

    await page.locator('#dca-history-toggle').click();
    await expect(page.locator('#dca-history-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#dca-history-scroll')).toBeVisible();
    await assertNoDocumentOverflow(page);

    const csvDownload = page.waitForEvent('download');
    await page.locator('#dca-export-csv').click();
    const csv = await csvDownload;
    const csvText = await require('node:fs/promises').readFile(await csv.path(), 'utf8');
    expect(csvText).toContain('CoinGecko');
    expect(csvText).toContain('Historical reference replay');

    const jsonDownload = page.waitForEvent('download');
    await page.locator('#dca-export-json').click();
    const json = JSON.parse(await require('node:fs/promises').readFile(await (await jsonDownload).path(), 'utf8'));
    expect(json.sourceReceipt.source.name).toBe('CoinGecko');
    expect(json.limitations).toHaveLength(3);

    const pdfDownload = page.waitForEvent('download');
    await page.locator('#dca-export-pdf').click();
    const pdf = await require('node:fs/promises').readFile(await (await pdfDownload).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.zoom = '200%';
    });
    await expect(page.locator('.dca-replay-page')).toHaveCSS('background-color', /rgb/);
    await assertNoDocumentOverflow(page);
    const tableScroll = await page.locator('#dca-history-scroll').evaluate(element => {
      element.scrollLeft = element.scrollWidth;
      return { scrollLeft: element.scrollLeft, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
    });
    expect(tableScroll.scrollWidth).toBeGreaterThan(tableScroll.clientWidth);
    expect(tableScroll.scrollLeft).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath(`dca-${locale.path.includes('/fr/') ? 'fr' : 'en'}-mobile-dark-200.png`), fullPage: true });
  });
}

test('desktop replay remains contained and print is local', async ({ page }, testInfo) => {
  const requests = [];
  await mockHistory(page, requests);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/crypto/dca-calculator/');
  await page.locator('#dca-submit').click();
  await expect(page.locator('#dca-results')).toBeVisible();
  await assertNoDocumentOverflow(page);
  const visualProof = await page.evaluate(() => {
    function rgb(value) {
      const parts = value.match(/\d+(?:\.\d+)?/g);
      return parts ? parts.slice(0, 3).map(Number) : [];
    }
    function luminance(parts) {
      const channels = parts.map(value => {
        const channel = value / 255;
        return channel <= .03928 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
      });
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    }
    const hero = document.querySelector('.dca-replay-hero');
    const heading = hero.querySelector('h1');
    const foreground = rgb(getComputedStyle(heading).color);
    const background = rgb(getComputedStyle(hero).backgroundColor);
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    const metrics = Array.from(document.querySelectorAll('.dca-stat-value')).map(element => ({
      text: element.textContent,
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      whiteSpace: getComputedStyle(element).whiteSpace,
    }));
    return {
      headingColor: getComputedStyle(heading).color,
      heroBackground: getComputedStyle(hero).backgroundColor,
      contrast: (lighter + .05) / (darker + .05),
      metrics,
    };
  });
  expect(visualProof.contrast, JSON.stringify(visualProof)).toBeGreaterThanOrEqual(7);
  expect(visualProof.heroBackground).toBe('rgb(7, 31, 60)');
  expect(visualProof.headingColor).toBe('rgb(255, 255, 255)');
  for (const metric of visualProof.metrics) {
    expect(metric.whiteSpace, JSON.stringify(metric)).toBe('nowrap');
    expect(metric.height, JSON.stringify(metric)).toBeLessThanOrEqual(metric.lineHeight * 1.15);
  }
  await page.evaluate(() => {
    window.__printCalled = false;
    window.print = () => { window.__printCalled = true; };
  });
  await page.locator('#dca-print').click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dca-en-desktop-light.png'), fullPage: true });
});

test('provider failure is explicit and never reveals stale results', async ({ page }) => {
  const requests = [];
  await mockHistory(page, requests, 503);
  await page.goto('/crypto/dca-calculator/');
  await page.locator('#dca-submit').click();
  await expect(page.locator('#dca-status')).toContainText('CoinGecko is unavailable.');
  await expect(page.locator('#dca-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#dca-results')).toBeHidden();
  await expect(page.locator('#dca-empty')).toBeVisible();
});

test('widget route is an accessible CTA, not a calculator', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/widgets/iframe/crypto-dca-calculator.html?theme=dark');
  await expect(page.getByRole('heading', { name: 'Crypto DCA schedule replay' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the historical replay' })).toHaveAttribute('href', /crypto\/dca-calculator/);
  await expect(page.locator('input, select, button')).toHaveCount(0);
  await assertNoDocumentOverflow(page);
});

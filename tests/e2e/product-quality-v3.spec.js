const { test, expect } = require('@playwright/test');

async function stubNoisyExternals(page) {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://www.google-analytics.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => {
    route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.supabase={createClient:function(){return{auth:{getSession:function(){return Promise.resolve({data:{session:null}})},onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}}}}}}};',
    });
  });
}

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|ERR_FAILED|CORS policy|api\/forex|api\/rates|api-telecom|api-data-freshness|googletagmanager|google-analytics|supabase/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(8);
}

async function expectNoUnnamedVisibleControls(page) {
  const unnamed = await page.evaluate(() => {
    function visible(el) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }

    function hasLabel(el) {
      if (el.matches('input[type="hidden"]')) return true;
      if (el.tagName === 'BUTTON' && (el.textContent || '').trim()) return true;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title')) return true;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
      return Boolean(el.closest('label'));
    }

    return Array.from(document.querySelectorAll('input, select, textarea, button'))
      .filter(visible)
      .filter(el => !hasLabel(el))
      .map(el => {
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
        return `${el.tagName.toLowerCase()}${id}${cls}`.trim();
      });
  });

  expect(unnamed).toEqual([]);
}

async function expectReadableDarkText(page, scopeSelector) {
  const failures = await page.evaluate((selector) => {
    const root = document.querySelector(selector) || document.body;

    function luminance([r, g, b]) {
      const values = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    }

    function color(value) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);
      if (!match) return null;
      return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
    }

    function effectiveBackground(el) {
      for (let cur = el; cur; cur = cur.parentElement) {
        const bg = color(getComputedStyle(cur).backgroundColor);
        if (bg && bg[3] > 0) return bg;
      }
      const bodyBg = color(getComputedStyle(document.body).backgroundColor);
      return bodyBg || [0, 0, 0, 1];
    }

    function hasDirectText(el) {
      return Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    }

    function contrast(fg, bg) {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const light = Math.max(l1, l2);
      const dark = Math.min(l1, l2);
      return (light + 0.05) / (dark + 0.05);
    }

    function visible(el) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    }

    const items = Array.from(root.querySelectorAll('p, span, label, button, input, select, textarea, h1, h2, h3, h4, td, th, a'))
      .filter(visible)
      .filter(el => hasDirectText(el) || el.matches('input, select, textarea'))
      .filter(el => (el.textContent || el.value || el.placeholder || '').trim().length > 0)
      .slice(0, 500);

    const out = [];
    for (const el of items) {
      const style = getComputedStyle(el);
      const fg = color(style.color);
      const bg = effectiveBackground(el);
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      const fontSize = parseFloat(style.fontSize || '16');
      const threshold = fontSize >= 18 ? 3 : 4.5;
      if (ratio < threshold) {
        out.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.value || el.placeholder || '').trim().slice(0, 80), ratio: Number(ratio.toFixed(2)) });
      }
      if (out.length >= 10) break;
    }
    return out;
  }, scopeSelector);

  expect(failures).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await stubNoisyExternals(page);
});

test('search flow returns usable VAT results without the full registry script', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('script[src*="tool-registry"]')).toHaveCount(0);
  await page.locator('#search-input').fill('vat');
  await expect(page.locator('#results-container')).toContainText(/VAT/i, { timeout: 10000 });
  const firstResult = page.locator('#results-container a[href]').first();
  await expect(firstResult).toBeVisible();
  expect(await firstResult.getAttribute('href')).toMatch(/^\//);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('salary hub search works without downloading the full tool registry', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/salary-tax/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('script[src*="tool-registry"]')).toHaveCount(0);
  await page.locator('#tool-search').fill('Nigeria PAYE');
  await expect(page.locator('#find-results')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#find-results')).toContainText(/Nigeria|PAYE/i);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('mobile money fee checker compares providers on a phone viewport', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/mobile-money-fees/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#mmAmount')).toBeVisible();
  await page.locator('#mmAmount').fill('10000');
  await page.locator('.mm-compare-btn').click();
  await expect(page.locator('#resultsSection')).toBeVisible();
  await expect(page.locator('#mmTableBody tr').first()).toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('business market-stall calculator produces a profit summary', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/market-stall-profit/', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: /food seller/i }).click();
  await page.getByRole('button', { name: /calculate profit/i }).click();
  await expect(page.locator('#resultsSection')).toBeVisible();
  await expect(page.locator('#summaryCards')).toContainText(/profit|revenue/i);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('property calculators show clear mobile results', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/tools/rent-vs-buy/', { waitUntil: 'domcontentloaded' });
  await page.locator('#homePrice').fill('2000000');
  await page.locator('#monthlyRent').fill('15000');
  await page.getByRole('button', { name: /compare renting vs buying/i }).click();
  await expect(page.locator('#results-section')).toBeVisible();
  await expect(page.locator('#verdict-title')).not.toHaveText('Result');
  await assertNoHorizontalOverflow(page);

  await page.goto('/tools/rent-affordability/', { waitUntil: 'domcontentloaded' });
  await page.locator('#country').selectOption('NG');
  await page.locator('#income').fill('500000');
  await page.locator('#rent').fill('150000');
  await page.getByRole('button', { name: /calculate affordability/i }).click();
  await expect(page.locator('#results')).toHaveClass(/show/);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('Swahili unit converter has labelled controls on mobile', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sw/zana/kubadilisha-vipimo/', { waitUntil: 'domcontentloaded' });

  await expectNoUnnamedVisibleControls(page);
  await page.locator('#lenFrom').fill('1000');
  await page.locator('#lenToU').selectOption('1000');
  await page.locator('#lenFrom').dispatchEvent('input');
  await expect.poll(() => page.locator('#lenTo').inputValue()).toMatch(/^1(\.0+)?$/);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('dark VAT calculator keeps form and result text readable', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/vat-calculator/', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => window.AfroTools && window.AfroTools.darkMode && window.AfroTools.darkMode.set('dark'));
  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#amountInput').fill('10000');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsArea')).toBeVisible();
  await expectReadableDarkText(page, 'body');
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('representative content and error pages render without console errors', async ({ page }) => {
  for (const route of ['/', '/salary-tax/', '/search/', '/privacy/', '/404.html']) {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  }
});

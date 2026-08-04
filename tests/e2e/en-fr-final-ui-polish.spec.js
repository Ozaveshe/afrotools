'use strict';

const { test, expect } = require('@playwright/test');

const routes = [
  '/',
  '/tools/',
  '/energy/',
  '/fr/energy/',
  '/tools/solar-roi/',
  '/fr/tools/tarifs-electricite/',
  '/tools/ke-stamp-duty/',
  '/fr/tools/ke-droits-timbre/'
];

async function localFailures(page, run) {
  const failures = [];
  const onPageError = (error) => failures.push(`pageerror: ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  };
  const onResponse = (response) => {
    if (/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//.test(response.url()) && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('response', onResponse);
  try {
    await run();
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('response', onResponse);
  }
  return failures;
}

async function measureOverflow(page) {
  return page.locator('body').evaluate((body) => {
    const allElements = [];
    const visit = (root) => {
      root.querySelectorAll('*').forEach((node) => {
        allElements.push(node);
        if (node.shadowRoot) visit(node.shadowRoot);
      });
    };
    visit(document.body);
    return {
      fits: body.scrollWidth <= body.clientWidth + 1,
      bodyWidth: body.clientWidth,
      scrollWidth: body.scrollWidth,
      widest: allElements
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        id: node.id,
        className: typeof node.className === 'string' ? node.className : '',
        left: Math.round(node.getBoundingClientRect().left),
        right: Math.round(node.getBoundingClientRect().right),
        width: Math.round(node.getBoundingClientRect().width)
      }))
      .filter((item) => item.right > body.clientWidth + 1 || item.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 8),
      internal: allElements
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          id: node.id,
          className: typeof node.className === 'string' ? node.className : '',
          text: String(node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
          parent: node.parentElement ? `${node.parentElement.tagName.toLowerCase()}.${typeof node.parentElement.className === 'string' ? node.parentElement.className : ''}` : '',
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowX: getComputedStyle(node).overflowX
        }))
        .sort((a, b) => (b.scrollWidth - b.clientWidth) - (a.scrollWidth - a.clientWidth))
        .slice(0, 12)
    };
  });
}

for (const route of routes) {
  test(`${route} keeps a calm, usable 375px light surface`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 820 });
    const failures = await localFailures(page, async () => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);
    });

    expect(await page.locator('html').getAttribute('lang')).toMatch(route.startsWith('/fr/') ? /^fr/i : /^en/i);
    const overflow = await measureOverflow(page);
    expect(overflow.fits, `${route}: ${JSON.stringify(overflow)}`).toBe(true);
    expect(await page.locator('body').evaluate((body) => getComputedStyle(body).fontFamily)).toMatch(/DM Sans/i);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
    expect(failures).toEqual([]);
  });
}

test('shared English and French app surfaces survive dark 320px and 200% text reflow', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('afrotools-theme', 'dark'));
  await page.setViewportSize({ width: 320, height: 800 });

  for (const route of ['/tools/solar-roi/', '/fr/tools/tarifs-electricite/']) {
    const failures = await localFailures(page, async () => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await page.waitForTimeout(250);
    });
    const overflow = await measureOverflow(page);
    expect(overflow.fits, `${route}: ${JSON.stringify(overflow)}`).toBe(true);
    expect(failures).toEqual([]);
  }
});

test('related tools use localized text, neutral fallbacks and accessible structure', async ({ page }) => {
  for (const fixture of [
    { route: '/tools/solar-roi/', language: 'en', text: /You might also like/i },
    { route: '/fr/kenya/ke-paye.html', language: 'fr', text: /Ces outils peuvent aussi vous aider/i }
  ]) {
    await page.setViewportSize({ width: 375, height: 820 });
    await page.goto(fixture.route, { waitUntil: 'domcontentloaded' });
    const component = page.locator('afro-related-tools').first();
    await component.scrollIntoViewIfNeeded();
    await expect.poll(async () => component.evaluate((node) => Boolean(node.shadowRoot?.querySelector('.grid')))).toBe(true);
    const snapshot = await component.evaluate((node) => ({
      text: node.shadowRoot.textContent,
      emojiFallbacks: node.shadowRoot.querySelectorAll('.card-emoji').length,
      monograms: node.shadowRoot.querySelectorAll('.card-monogram').length,
      overflow: node.shadowRoot.querySelector('.wrap').scrollWidth > node.shadowRoot.querySelector('.wrap').clientWidth + 1
    }));
    expect(snapshot.text).toMatch(fixture.text);
    expect(snapshot.emojiFallbacks).toBe(0);
    expect(snapshot.monograms).toBeGreaterThan(0);
    expect(snapshot.overflow).toBe(false);
  }
});

test('representative polished surfaces keep core accessible-name and document contracts', async ({ page }) => {
  for (const route of ['/', '/tools/', '/energy/', '/fr/energy/']) {
    await page.setViewportSize({ width: 375, height: 820 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const violations = await page.evaluate(() => {
      const visible = (node) => Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
      const name = (node) => String(
        node.getAttribute('aria-label')
        || node.getAttribute('title')
        || (node.getAttribute('aria-labelledby') && document.getElementById(node.getAttribute('aria-labelledby'))?.textContent)
        || (node.labels && [...node.labels].map((label) => label.textContent).join(' '))
        || node.textContent
        || node.value
        || ''
      ).trim();
      const failures = [];
      if (!document.querySelector('main')) failures.push('missing main landmark');
      if (!document.querySelector('h1')) failures.push('missing h1');
      document.querySelectorAll('a[href],button,input,select,textarea').forEach((node) => {
        if (visible(node) && !name(node) && !node.closest('[inert]')) failures.push(`unnamed ${node.tagName.toLowerCase()}`);
      });
      document.querySelectorAll('img').forEach((image) => {
        if (!image.hasAttribute('alt')) failures.push(`image missing alt: ${image.getAttribute('src') || 'inline'}`);
      });
      return failures;
    });
    expect(violations, `${route}: ${JSON.stringify(violations)}`).toEqual([]);
  }
});

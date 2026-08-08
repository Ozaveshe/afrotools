'use strict';

const { test, expect } = require('@playwright/test');

const routes = [
  ['/sw/zana/microfinance-riba-tambarare-dhidi-ya-salio', 'microfinance-calc'],
  ['/sw/zana/uwezo-wa-mkopo-wa-nyumba', 'mortgage-affordability'],
  ['/sw/zana/kikokotoo-mkopo-wa-nyumba', 'mortgage-calculator'],
  ['/sw/zana/kizalishaji-payslip', 'payslip-generator'],
  ['/sw/zana/faida-ya-uwekezaji-wa-nyumba', 'property-roi'],
  ['/sw/zana/gharama-za-uhamisho-wa-mali', 'property-transfer-cost'],
  ['/sw/zana/kukodi-dhidi-ya-kununua', 'rent-vs-buy'],
  ['/sw/zana/mpango-wa-kustaafu-mapema', 'retirement-planner'],
  ['/sw/zana/nauli-za-ruti', 'route-fares'],
  ['/sw/zana/kilinganisha-mishahara', 'salary-compare'],
  ['/sw/somalia/kikokotoo-kodi-mshahara', 'so-paye'],
  ['/sw/south-sudan/kikokotoo-kodi-mshahara', 'ss-paye'],
  ['/sw/sao-tome/kikokotoo-kodi-mshahara', 'st-paye'],
  ['/sw/zana/thamani-ya-startup', 'startup-valuation'],
  ['/sw/togo/kikokotoo-kodi-mshahara', 'tg-paye'],
];

for (const [route, id] of routes) {
  test(`${id} has native Swahili mobile, metadata, privacy and interaction boundaries`, async ({ page }) => {
    const errors = [];
    const sensitiveWrites = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      const body = request.postData();
      if (request.method() !== 'GET' && body) sensitiveWrites.push({ url: request.url(), body });
    });

    await page.setViewportSize({ width: 320, height: 820 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toBeVisible();
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.some((node) => /"inLanguage"\s*:\s*"sw"/.test(node.textContent || '')))).toBe(true);
    expect(await page.locator('iframe').count()).toBe(0);

    const controls = page.locator('input:not([type="hidden"]), select, textarea, button');
    const unnamed = await controls.evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      if (node.disabled || node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden' || node.getClientRects().length === 0) return false;
      const label = node.labels && node.labels.length;
      return !label && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') && !String(node.textContent || '').trim() && !node.getAttribute('title');
    }).map((node) => node.id || node.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);

    const firstFocusable = page.locator('a[href]:visible, button:visible, input:visible, select:visible, textarea:visible').first();
    await firstFocusable.focus();
    const focus = await page.evaluate(() => {
      const node = document.activeElement;
      const style = node ? getComputedStyle(node) : null;
      return { tag: node && node.tagName, outline: style && style.outlineStyle, width: style && style.outlineWidth };
    });
    expect(focus.tag).not.toBe('BODY');
    expect(focus.outline === 'none' && focus.width === '0px').toBe(false);

    const normalReflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      containers: [...document.querySelectorAll('body *')]
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth })),
    }));
    expect(normalReflow.delta, JSON.stringify(normalReflow.containers)).toBeLessThanOrEqual(1);
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    const reflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll('body *')].filter((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== 'none' && node.getClientRects().length && box.right > viewport + 4;
      }).sort((left, right) => right.getBoundingClientRect().right - left.getBoundingClientRect().right)
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), right: Math.round(node.getBoundingClientRect().right) }));
      return {
        delta: document.documentElement.scrollWidth - viewport,
        offenders,
        metrics: {
          viewport,
          htmlScroll: document.documentElement.scrollWidth,
          bodyClient: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth,
          bodyRight: Math.round(document.body.getBoundingClientRect().right),
          htmlMinWidth: getComputedStyle(document.documentElement).minWidth,
          bodyMinWidth: getComputedStyle(document.body).minWidth,
        },
        scrollContainers: [...document.querySelectorAll('body *')]
          .filter((node) => node.scrollWidth > node.clientWidth + 4)
          .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
          .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth, overflow: getComputedStyle(node).overflowX })),
      };
    });
    expect(reflow.delta, JSON.stringify({ offenders: reflow.offenders, metrics: reflow.metrics, scrollContainers: reflow.scrollContainers })).toBeLessThanOrEqual(4);

    const reset = page.locator('button[type="reset"]:visible, [id*="reset"]:visible, [id*="clear"]:visible').first();
    if (await reset.count()) {
      await reset.focus();
      await expect(reset).toBeFocused();
    }

    await page.setViewportSize({ width: 375, height: 820 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    expect(sensitiveWrites).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('accepted routes expose only local advertised result actions', async ({ page }) => {
  for (const [route, id] of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const actions = await page.locator('button, a[download]').evaluateAll((nodes) => nodes
      .filter((node) => /PDF|CSV|JSON|TXT|Pakua|Nakili|Shiriki|Chapisha/i.test(node.textContent || node.getAttribute('aria-label') || ''))
      .map((node) => ({
        label: String(node.textContent || node.getAttribute('aria-label') || '').trim(),
        href: node.getAttribute('href') || '',
      })));
    for (const action of actions) {
      expect(action.href, `${id}: ${action.label}`).not.toMatch(/^https?:\/\//i);
    }
  }
});

const { test, expect } = require('@playwright/test');
const {
  HUBS,
  getCanonicalEnglishApps,
} = require('../support/day10-category-inventory');

const apps = getCanonicalEnglishApps();

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|ERR_FAILED|CORS|api\/|supabase|netlify|google/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function quietThirdParties(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') return route.continue();
    if (['script', 'image', 'font', 'stylesheet'].includes(route.request().resourceType())) {
      return route.abort();
    }
    return route.continue();
  });
}

async function assertNoOverflow(page, allowance = 2) {
  const details = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const isLocallyContained = (element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (/^(auto|scroll|hidden|clip)$/.test(overflowX) && parent.scrollWidth > parent.clientWidth) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };
    const offenders = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          (rect.right > document.documentElement.clientWidth + 2 || rect.left < -2) &&
          !isLocallyContained(element)
        );
      })
      .slice(0, 24)
      .map((element) => ({
        tag: element.tagName,
        id: element.id,
        className: String(element.className || '').slice(0, 100),
        text: (element.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
        display: getComputedStyle(element).display,
        maxWidth: getComputedStyle(element).maxWidth,
        parentWidth: Math.round(element.parentElement?.getBoundingClientRect().width || 0),
      }));
    return { overflow, offenders };
  });
  expect(details.overflow, JSON.stringify(details.offenders)).toBeLessThanOrEqual(allowance);
}

async function visibleResultText(page) {
  return page.evaluate(() => {
    const selectors = [
      '[aria-live]',
      '[role="status"]',
      '[id*="result" i]',
      '[id*="summary" i]',
      '[class*="result" i]',
      'output',
      '.rs-output',
      '.df-result',
    ];
    return [...document.querySelectorAll(selectors.join(','))]
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => (element.innerText || element.value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, 12000);
  });
}

async function runAdaptiveWorkflow(page) {
  const before = await visibleResultText(page);
  const controls = page.locator('body input:not([type="hidden"]), body select, body textarea');
  const controlCount = await controls.count();

  for (let index = 0; index < Math.min(controlCount, 18); index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible().catch(() => false))) continue;
    const tag = await control.evaluate((element) => element.tagName);
    const type = await control.getAttribute('type');
    if (['hidden', 'file', 'submit', 'button', 'checkbox', 'radio', 'range'].includes(type)) continue;
    if (tag === 'SELECT') {
      const options = await control.locator('option:not([disabled])').evaluateAll((items) =>
        items.map((item) => item.value).filter((value) => value !== ''),
      );
      if (options.length) {
        await control
          .selectOption(options[Math.min(1, options.length - 1)], { timeout: 1200 })
          .catch(() => {});
      }
      continue;
    }
    if (type === 'date') {
      await control.fill('2025-01-15', { timeout: 1200 }).catch(() => {});
    } else if (type === 'month') {
      await control.fill('2027-01', { timeout: 1200 }).catch(() => {});
    } else if (type === 'number') {
      const min = Number(await control.getAttribute('min'));
      const value = Number.isFinite(min) && min > 0 ? Math.max(min, 10) : 100;
      await control.fill(String(value), { timeout: 1200 }).catch(() => {});
    } else if (type === 'email') {
      await control.fill('synthetic@example.test', { timeout: 1200 }).catch(() => {});
    } else {
      await control.fill('Synthetic planning fixture', { timeout: 1200 }).catch(() => {});
    }
  }

  const primary = page.getByRole('button', {
    name: /calculate|estimate|generate|compare|convert|create summary|update plan|build|check|show|find|pick|start|add/i,
  }).first();
  if (await primary.count()) {
    await primary.click({ timeout: 1500 }).catch(() => {});
  } else {
    const form = page
      .locator('body form')
      .filter({ has: page.locator('input:not([type="hidden"]), select, textarea') })
      .first();
    if (await form.count()) {
      await form
        .evaluate((element) =>
          element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
        )
        .catch(() => {});
    }
  }

  const after = await visibleResultText(page);
  return { before, after, controlCount };
}

test.describe.configure({ mode: 'serial' });

for (const hub of HUBS) {
  test(`${hub.category} canonical hub renders its exact registry inventory`, async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await quietThirdParties(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
    await page.goto(hub.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`${hub.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    );
    const expectedRoutes = apps
      .filter((app) => app.category === hub.category)
      .map((app) => `${String(app.href).replace(/\/index\.html$/, '').replace(/\/$/, '')}/`)
      .sort();
    const directorySelector = hub.category === 'data-productivity'
      ? '#tool-grid a[href^="/tools/"]'
      : 'body > :not(afro-navbar):not(afro-footer) a[href^="/tools/"]';
    const renderedRoutes = await page.locator(directorySelector).evaluateAll((links) =>
      [...new Set(links.map((link) => `${link.getAttribute('href').replace(/\/index\.html$/, '').replace(/\/$/, '')}/`))]
        .sort(),
    );
    expect(renderedRoutes).toEqual(expectedRoutes);
    const exactCountSchema = await page.locator('script[type="application/ld+json"]').evaluateAll(
      (scripts, expectedCount) => scripts.some((script) => {
        try {
          return Number(JSON.parse(script.textContent).numberOfItems) === expectedCount;
        } catch {
          return false;
        }
      }),
      expectedRoutes.length,
    );
    expect(exactCountSchema).toBe(true);
    await assertNoOverflow(page);
    expect(errors).toEqual([]);
  });
}

for (const app of apps) {
  test(`${app.category}: ${app.id} executes a browser workflow`, async ({ page }) => {
    test.setTimeout(90000);
    const errors = collectRuntimeErrors(page);
    const requests = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest()) return;
      requests.push({
        url: request.url(),
        postData: request.postData() || '',
      });
    });
    await quietThirdParties(page);
    const width = apps.indexOf(app) % 2 === 0 ? 320 : 375;
    const dark = apps.indexOf(app) % 3 !== 0;
    await page.setViewportSize({ width, height: 812 });
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' });
    await page.addInitScript((choice) => {
      if (choice) localStorage.setItem('aft_theme', choice);
      else localStorage.removeItem('aft_theme');
    }, apps.indexOf(app) % 3 === 0 ? null : dark ? 'dark' : 'light');

    await page.goto(app.href, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    const result = await runAdaptiveWorkflow(page);
    expect(result.controlCount, `${app.id}: no workflow controls`).toBeGreaterThan(0);
    expect(result.after.length, `${app.id}: no visible workflow result`).toBeGreaterThan(0);
    await assertNoOverflow(page, 8);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await assertNoOverflow(page, 8);

    const unsafeInputRequests = requests.filter((request) => {
      const url = new URL(request.url);
      const serializedRequest = `${request.url}\n${request.postData}`;
      const containsEmail = /synthetic%40example\.test|synthetic@example\.test/i.test(serializedRequest);
      const sendsFixtureOffSite =
        url.origin !== 'http://127.0.0.1:4173' &&
        /synthetic(?:%20|\+| )planning(?:%20|\+| )fixture/i.test(serializedRequest);
      return containsEmail || sendsFixtureOffSite;
    });
    expect(unsafeInputRequests, `${app.id}: synthetic input leaked into a URL`).toEqual([]);
    expect(errors).toEqual([]);
  });
}

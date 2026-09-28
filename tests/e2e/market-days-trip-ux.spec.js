const { test, expect } = require('@playwright/test');

test.use({ timezoneId: 'Africa/Lagos', serviceWorkers: 'block' });

let pageErrors;
let nonGetRequests;

test.beforeEach(async ({ page, baseURL }) => {
  pageErrors = [];
  nonGetRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET') nonGetRequests.push(request.method());
    return new URL(request.url()).origin === origin && request.method() === 'GET'
      ? route.continue()
      : route.abort();
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.testClipboard = { writes: [], mode: 'ok', pending: null };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(text) {
          if (window.testClipboard.mode === 'denied') return Promise.reject(new Error('Synthetic permission denial'));
          if (window.testClipboard.mode === 'throw') throw new Error('Synthetic synchronous clipboard failure');
          window.testClipboard.writes.push(text);
          if (window.testClipboard.mode === 'held') {
            return new Promise((resolve, reject) => { window.testClipboard.pending = { resolve, reject }; });
          }
          return Promise.resolve();
        }
      }
    });
  });
  await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') });
});

test.afterEach(async () => {
  expect(pageErrors).toEqual([]);
  expect(nonGetRequests).toEqual([]);
});

async function openPlanner(page, { width = 390, theme = 'light' } = {}) {
  await page.setViewportSize({ width, height: 844 });
  await page.addInitScript(value => localStorage.setItem('aft_theme', value), theme);
  await page.goto('/tools/market-days/?date=2026-10-01', { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('#tripStatus')).toContainText('Trip brief ready');
  await expect(page.getByRole('button', { name: 'Copy trip brief', exact: true })).toBeEnabled();
}

async function expectStale(page) {
  await expect(page.locator('#tripStatus')).toContainText('Build a new trip brief before copying');
  await expect(page.locator('#tripPlannerOutput .trip-stale-note')).toBeVisible();
  await expect(page.locator('#tripPlannerOutput .trip-stale-note')).toContainText('Previous trip brief');
  await expect(page.getByRole('button', { name: 'Copy trip brief', exact: true })).toBeDisabled();
  await expectReadableFeedback(page);
}

async function build(page) {
  await page.getByRole('button', { name: 'Build trip brief', exact: true }).click();
  await expect(page.locator('#tripStatus')).toContainText('Trip brief ready');
  await expect(page.locator('#tripPlannerOutput .trip-stale-note')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Copy trip brief', exact: true })).toBeEnabled();
}

async function expectFits(page) {
  const layout = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const controls = [...document.querySelectorAll('#tripPlannerOutput button, #tripStatus, #tripManualCopy textarea, #lookupDateStatus')]
      .filter(element => element.getClientRects().length)
      .map(element => {
        const bounds = element.getBoundingClientRect();
        return { id: element.id || element.className, left: bounds.left, right: bounds.right };
      });
    return { width, scrollWidth: document.documentElement.scrollWidth, controls };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  for (const control of layout.controls) {
    expect(control.left, control.id).toBeGreaterThanOrEqual(0);
    expect(control.right, control.id).toBeLessThanOrEqual(layout.width);
  }
  await expectReadableFeedback(page);
}

async function expectReadableFeedback(page) {
  const contrast = await page.evaluate(() => {
    const channels = color => {
      const values = color.match(/[\d.]+/g).map(Number);
      return [values[0], values[1], values[2], values.length > 3 ? values[3] : 1];
    };
    const composite = (color, background) => color.slice(0, 3).map((value, index) => value * color[3] + background[index] * (1 - color[3]));
    const luminance = color => {
      const values = color.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    return [...document.querySelectorAll('#tripStatus, #lookupDateStatus, #resultsCount, .trip-stale-note, .field-label, #tripBriefText')]
      .filter(element => element.getClientRects().length)
      .map(element => {
        const ancestors = [];
        for (let parent = element; parent; parent = parent.parentElement) ancestors.unshift(parent);
        const background = ancestors.reduce((color, ancestor) => composite(channels(getComputedStyle(ancestor).backgroundColor), color), [255, 255, 255]);
        const foreground = composite(channels(getComputedStyle(element).color), background);
        const a = luminance(foreground);
        const b = luminance(background);
        return { selector: element.id || element.className, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
  });
  for (const item of contrast) expect(item.ratio, item.selector).toBeGreaterThanOrEqual(4.5);
}

async function expectFocusedUsable(control) {
  await expect(control).toBeFocused();
  await expect.poll(() => control.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const navbar = document.querySelector('afro-navbar');
    const navigation = navbar && ((navbar.shadowRoot && navbar.shadowRoot.querySelector('nav')) || navbar);
    const navigationBounds = navigation && navigation.getBoundingClientRect();
    const topLimit = navigationBounds && navigationBounds.top <= 0 && navigationBounds.bottom > 0
      ? navigationBounds.bottom : 0;
    const centerHit = document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
    return bounds.top >= topLimit && bounds.bottom <= innerHeight && centerHit === element;
  }), { message: 'focused control is inside the viewport, below navigation and receives its center hit' }).toBe(true);
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`trip selections stay explicit and usable at ${width}px ${theme}`, async ({ page }, testInfo) => {
      await openPlanner(page, { width, theme });
      await expect(page.getByLabel('Named market', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Purpose', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Planning buffer', { exact: true })).toBeVisible();
      for (const [label, option] of [
        ['Named market', { label: 'Nkwo Nnewi - Nnewi, Anambra' }],
        ['Purpose', 'vendor'],
        ['Planning buffer', '7']
      ]) {
        await page.getByLabel(label, { exact: true }).selectOption(option);
        await expectStale(page);
        await build(page);
      }
      await expect(page.locator('#tripPlannerOutput')).toContainText('Nkwo Nnewi');
      await page.getByLabel('Planning buffer', { exact: true }).selectOption('7');
      await expect(page.locator('.trip-copy')).toBeEnabled();
      await page.getByLabel('Planning buffer', { exact: true }).selectOption('14');
      await expectStale(page);
      await page.getByLabel('Planning buffer', { exact: true }).selectOption('7');
      await expect(page.locator('#tripStatus')).toHaveText('Trip brief matches the current selections.');
      await expect(page.locator('.trip-stale-note')).toBeHidden();
      await expect(page.locator('.trip-copy')).toBeEnabled();
      await page.getByLabel('Pick any Gregorian date').fill('2026-11-20');
      await expectStale(page);
      await page.getByLabel('Pick any Gregorian date').press('Tab');
      await expect(page.locator('#selectedDateMeta')).toContainText('20 November 2026');
      await build(page);
      await expect(page.locator('.trip-output-box').nth(1)).toContainText('Nov 2026');
      const cell = page.locator('[data-date-key="2026-11-24"]');
      await cell.focus();
      await cell.press('Enter');
      await expect(page.locator('[data-date-key="2026-11-24"]')).toBeFocused();
      await expect(page.locator('[data-date-key="2026-11-24"]')).toHaveAttribute('aria-pressed', 'true');
      await expectStale(page);
      await build(page);
      await page.locator('#nextMonth').click();
      await expect(page.locator('#monthLabel')).toHaveText('December 2026');
      await expect(page.locator('.trip-copy')).toBeEnabled();
      await page.locator('#useNigeriaToday').click();
      await expectStale(page);
      await expect(page.locator('#lookupDate')).toHaveValue('2026-10-01');
      await build(page);
      await page.locator('#useDeviceToday').click();
      await expect(page.locator('.trip-copy')).toBeEnabled();
      await page.locator('#tripBuffer').focus();
      await page.locator('#tripBuffer').press('Tab');
      await expect(page.locator('#buildTripPlan')).toBeFocused();
      const focus = await page.locator('#buildTripPlan').evaluate(element => {
        const style = getComputedStyle(element);
        return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth), height: element.getBoundingClientRect().height };
      });
      expect(focus.outline).not.toBe('none');
      expect(focus.width).toBeGreaterThanOrEqual(2);
      expect(focus.height).toBeGreaterThanOrEqual(44);
      expect(await page.locator('.trip-copy').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      await expectFits(page);
      const tripCard = page.locator('#tripPlannerOutput').locator('..');
      await tripCard.scrollIntoViewIfNeeded();
      await tripCard.screenshot({ path: testInfo.outputPath(`trip-card-${width}-${theme}.png`) });
      expect(new URL(page.url()).searchParams.get('date')).toBe('2026-10-01');
      expect([...new URL(page.url()).searchParams.keys()]).toEqual(['date']);
    });
  }
}

test('blank and invalid date suppress old selected results and recover through real controls', async ({ page }) => {
  await openPlanner(page);
  await page.locator('#lookupDate').fill('2028-02-29');
  await page.locator('#lookupDate').press('Tab');
  await expect(page.locator('#selectedDateMeta')).toContainText('29 February 2028');
  await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'false');
  await build(page);
  for (const invalid of ['', '2027-02-29', '2028-02-30']) {
    if (!invalid) await page.getByLabel('Pick any Gregorian date').fill('');
    else await page.locator('#lookupDate').evaluate((input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, invalid);
    await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#lookupDateStatus')).toContainText('Choose a valid date');
    await expect(page.locator('#selectedDateResult')).toBeHidden();
    await expect(page.locator('#selectedUpcoming')).toBeHidden();
    await expect(page.locator('#tripPlannerOutput')).toBeHidden();
    await expect(page.locator('.directory-schedule').first()).toBeHidden();
    await expect(page.locator('#calendarGrid')).toBeVisible();
    await expect(page.locator('#shareView')).toBeDisabled();
    await page.locator('#buildTripPlan').click();
    await expectFocusedUsable(page.locator('#lookupDate'));
    await expect(page.locator('#tripStatus')).toContainText('Choose a valid date');
    await expect(page.locator('#tripManualCopy')).toBeHidden();
    expect(new URL(page.url()).searchParams.get('date')).toBe('2028-02-29');
    await expect(page.locator('#monthLabel')).toHaveText('February 2028');
    await page.locator('[data-date-key="2028-02-28"]').click();
    await expect(page.locator('#lookupDate')).toHaveValue('2028-02-28');
    await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator('#lookupDateStatus')).toBeEmpty();
    await expect(page.locator('#selectedDateResult')).toBeVisible();
    await expect(page.locator('#selectedDateMeta')).toContainText('28 February 2028');
    await expect(page.locator('.directory-schedule').first()).toBeVisible();
    await page.locator('#lookupDate').fill('2028-02-29');
    await page.locator('#lookupDate').press('Tab');
    await build(page);
  }
  await page.locator('#lookupDate').fill('');
  await page.locator('#useDeviceToday').click();
  await expect(page.locator('#lookupDateStatus')).toBeEmpty();
  await expect(page.locator('#selectedDateResult')).toBeVisible();
  await page.locator('#lookupDate').fill('');
  await page.locator('#lookupDate').fill('2026-11-20');
  await page.locator('#lookupDate').press('Tab');
  await expect(page.locator('#selectedDateMeta')).toContainText('20 November 2026');
  await expect(page.locator('#shareView')).toBeEnabled();
});

test('copy sends the current public brief with real line breaks and a polite success status', async ({ page }) => {
  await openPlanner(page);
  await page.getByLabel('Named market', { exact: true }).selectOption({ label: 'Nkwo Nnewi - Nnewi, Anambra' });
  await page.getByLabel('Purpose', { exact: true }).selectOption('research');
  await build(page);
  await page.locator('.trip-copy').click();
  await expect(page.locator('#tripStatus')).toHaveText('Trip brief copied.');
  await expect(page.locator('#tripStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#tripStatus')).toHaveAttribute('aria-live', 'polite');
  const writes = await page.evaluate(() => window.testClipboard.writes);
  expect(writes).toHaveLength(1);
  expect(writes[0].split('\n')).toHaveLength(7);
  expect(writes[0]).not.toContain('\\n');
  expect(writes[0]).toContain('Market: Nkwo Nnewi (Nnewi, Anambra)\n');
  expect(writes[0]).toContain('\nPurpose: research\n');
  await expect(page.locator('#tripManualCopy')).toBeHidden();
});

test('denied, throwing and absent Clipboard API offer a focused local manual-copy fallback', async ({ page }, testInfo) => {
  await openPlanner(page, { width: 320, theme: 'dark' });
  for (const mode of ['denied', 'throw', 'absent']) {
    await page.evaluate(value => {
      if (value === 'absent') Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      else window.testClipboard.mode = value;
    }, mode);
    await page.locator('.trip-copy').click();
    await expect(page.locator('#tripStatus')).toContainText('copy it manually');
    const fallback = page.getByLabel('Trip brief — select and copy', { exact: true });
    await expect(fallback).toBeVisible();
    await expectFocusedUsable(fallback);
    expect(await fallback.inputValue()).toContain('\nNext options:');
    expect(await fallback.evaluate(element => element.selectionEnd - element.selectionStart)).toBeGreaterThan(50);
    await expectFits(page);
    await page.getByLabel('Purpose', { exact: true }).selectOption(mode === 'throw' ? 'ceremony' : 'vendor');
    await expectStale(page);
    await expect(page.locator('#tripManualCopy')).toBeHidden();
    await build(page);
  }
  await page.locator('.trip-copy').focus();
  await page.locator('.trip-copy').press('Enter');
  await expectFocusedUsable(page.getByLabel('Trip brief — select and copy', { exact: true }));
  await page.screenshot({ path: testInfo.outputPath('manual-copy-320-dark.png') });
});

test('late clipboard success or denial cannot replace a stale or rebuilt trip status', async ({ page }) => {
  await openPlanner(page);
  await page.evaluate(() => { window.testClipboard.mode = 'held'; });
  await page.locator('.trip-copy').click();
  await page.getByLabel('Purpose', { exact: true }).selectOption('vendor');
  await expectStale(page);
  await page.evaluate(() => window.testClipboard.pending.resolve());
  await expectStale(page);
  await expect(page.locator('#tripManualCopy')).toBeHidden();
  await build(page);
  await page.locator('.trip-copy').click();
  await page.getByLabel('Planning buffer', { exact: true }).selectOption('14');
  await build(page);
  await page.evaluate(() => window.testClipboard.pending.reject(new Error('Synthetic delayed permission denial')));
  await expect(page.locator('#tripStatus')).toContainText('Trip brief ready');
  await expect(page.locator('#tripManualCopy')).toBeHidden();
});

test('directory result changes and resets have a compact polite count without moving input focus', async ({ page }) => {
  await openPlanner(page);
  const count = page.locator('#resultsCount');
  await expect(count).toHaveAttribute('role', 'status');
  await expect(count).toHaveAttribute('aria-live', 'polite');
  await expect(count).toHaveAttribute('aria-atomic', 'true');
  const search = page.getByLabel('Search market or town', { exact: true });
  await search.fill('Synthetic unknown market');
  await expect(count).toHaveText('0 results');
  await expect(search).toBeFocused();
  await search.fill('Nnewi');
  await expect(count).toHaveText('1 result');
  await expect(search).toBeFocused();
  await search.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('#resetFilters')).toBeFocused();
  await page.locator('#resetFilters').press('Enter');
  await expect(count).toHaveText('22 results');
  await expect(search).toHaveValue('');
  await expect(page.locator('#resetFilters')).toBeFocused();
});

test.describe('device date boundary', () => {
  test.use({ timezoneId: 'Pacific/Honolulu' });

  test('device Today and Nigeria Today keep distinct dates, validity and trip state', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-01T00:30:00Z'));
    await openPlanner(page, { width: 320, theme: 'dark' });
    await expect(page.locator('#nigeriaDateMeta')).toContainText('1 October 2026');
    await expect(page.locator('#deviceDateMeta')).toContainText('30 September 2026');
    await expect(page.locator('#deviceZoneMeta')).toContainText('Pacific/Honolulu');
    await page.locator('#lookupDate').fill('');
    await page.locator('#useDeviceToday').click();
    await expect(page.locator('#lookupDate')).toHaveValue('2026-09-30');
    await expect(page.locator('#lookupDateStatus')).toBeEmpty();
    await expect(page.locator('#selectedDateMeta')).toContainText('30 September 2026');
    await expect(page.locator('[data-date-key="2026-09-30"]')).toHaveAttribute('aria-pressed', 'true');
    await expectStale(page);
    await build(page);
    await page.locator('#useNigeriaToday').click();
    await expect(page.locator('#lookupDate')).toHaveValue('2026-10-01');
    await expect(page.locator('#selectedDateMeta')).toContainText('1 October 2026');
    await expectStale(page);
    await build(page);
    await expectFits(page);
  });
});

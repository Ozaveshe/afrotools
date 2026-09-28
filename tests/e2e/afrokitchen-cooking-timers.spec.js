const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const recipeRoute = '/tools/afrokitchen/recipes/jollof-rice-ng/';
const storageKey = 'ak_static_recipe_jollof-rice-ng_v2';
const variants = [
  { width: 320, theme: 'light' },
  { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' },
  { width: 390, theme: 'dark' }
];

async function seedTimer(page, remaining) {
  await page.addInitScript(({ key, value }) => {
    if (sessionStorage.getItem('ak-timer-test-seeded')) return;
    localStorage.setItem(key, JSON.stringify({
      servings: 6, checked: {},
      timers: { 6: { total: 180, remaining: value, running: false } }
    }));
    sessionStorage.setItem('ak-timer-test-seeded', 'true');
  }, { key: storageKey, value: remaining });
}

async function readRemaining(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)).timers['6'].remaining, storageKey);
}

async function screenshot(page, variant, stage) {
  if (process.env.AFROTOOLS_KITCHEN_TIMER_SCREENSHOTS !== '1') return;
  const directory = path.join(__dirname, '../../.tmp/kitchen-timer-evidence');
  fs.mkdirSync(directory, { recursive: true });
  await page.locator('#step-6').screenshot({
    path: path.join(directory, `timer-${variant.width}-${variant.theme}-${stage}.png`)
  });
}

for (const variant of variants) {
  test.describe(`AfroKitchen timers at ${variant.width}px in ${variant.theme} mode`, () => {
    test.use({ viewport: { width: variant.width, height: 844 }, colorScheme: variant.theme });

    let pageErrors;
    test.beforeEach(async ({ page }) => {
      pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.route('**/*', route => {
        const host = new URL(route.request().url()).hostname;
        return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
      });
      await page.addInitScript(theme => {
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.setItem('aft_theme', theme);
      }, variant.theme);
    });

    test.afterEach(async ({ page }) => {
      expect(pageErrors).toEqual([]);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    });

    test('a completed timer survives reload until the visitor resets it', async ({ page }) => {
      await seedTimer(page, 0);
      await page.goto(recipeRoute, { waitUntil: 'domcontentloaded' });
      const display = page.locator('#ak-timer-display-6');
      const status = page.locator('#ak-timer-status-6');
      const toggle = page.locator('#ak-timer-toggle-6');
      await expect(display).toHaveText('00:00');
      await expect(toggle).toHaveAccessibleName('Restart timer for step 6');
      await expect(status).toHaveText('Timer complete.');
      expect(await readRemaining(page)).toBe(0);
      await screenshot(page, variant, 'complete');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(display).toHaveText('00:00');
      await expect(toggle).toHaveAccessibleName('Restart timer for step 6');
      expect(await readRemaining(page)).toBe(0);

      await page.locator('#step-6').getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(display).toHaveText('03:00');
      await expect(toggle).toHaveAccessibleName('Start timer for step 6');
      await expect(status).toHaveText('Timer ready.');
      expect(await readRemaining(page)).toBe(180);
    });

    test('restart replenishes the timer and pause, resume and reset remain usable', async ({ page }) => {
      await seedTimer(page, 1);
      await page.goto(recipeRoute, { waitUntil: 'domcontentloaded' });
      const toggle = page.locator('#ak-timer-toggle-6');
      const display = page.locator('#ak-timer-display-6');
      const status = page.locator('#ak-timer-status-6');
      await expect(toggle).toHaveAccessibleName('Resume timer for step 6');
      await page.clock.install();
      await toggle.click();
      await page.clock.runFor(1000);
      await expect(display).toHaveText('00:00');
      await expect(toggle).toHaveAccessibleName('Restart timer for step 6');

      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(display).toHaveText('03:00');
      await expect(toggle).toHaveAccessibleName('Pause timer for step 6');
      await expect(status).toHaveText('Timer running: 03:00 left.');
      await expect(page.locator('#step-6')).not.toHaveClass(/is-timer-complete/);
      expect(await readRemaining(page)).toBe(180);
      await screenshot(page, variant, 'restarted');
      await page.clock.runFor(1000);
      await expect(display).toHaveText('02:59');

      await toggle.click();
      await expect(toggle).toHaveAccessibleName('Resume timer for step 6');
      await page.clock.runFor(2000);
      await expect(display).toHaveText('02:59');
      await toggle.click();
      await page.clock.runFor(1000);
      await expect(display).toHaveText('02:58');
      await page.locator('#step-6').getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(display).toHaveText('03:00');
      await expect(toggle).toHaveAccessibleName('Start timer for step 6');
      await page.clock.runFor(1000);
      await expect(display).toHaveText('03:00');

      // Other timer controls retain their own untouched durations.
      await expect(page.locator('#ak-timer-display-1')).toHaveText('30:00');
      await expect(page.locator('#ak-timer-toggle-1')).toHaveAccessibleName('Start timer for step 1');
    });

    test('invalid stored remaining values restore as bounded whole seconds', async ({ page }) => {
      const cases = [
        { remaining: -1, display: '00:00', stored: 0 },
        { remaining: 999, display: '03:00', stored: 180 },
        { remaining: 2.2, display: '00:03', stored: 3 },
        { remaining: 'invalid', display: '03:00', stored: 180 },
        { remaining: null, display: '03:00', stored: 180 },
        { remaining: true, display: '03:00', stored: 180 },
        { remaining: { unexpected: 1 }, display: '03:00', stored: 180 }
      ];
      await page.goto(recipeRoute, { waitUntil: 'domcontentloaded' });
      for (const fixture of cases) {
        await page.evaluate(({ key, value }) => {
          localStorage.setItem(key, JSON.stringify({
            servings: 6, checked: {},
            timers: { 6: { total: 999, remaining: value, running: true } }
          }));
        }, { key: storageKey, value: fixture.remaining });
        await page.reload({ waitUntil: 'domcontentloaded' });
        // Static HTML already says 03:00; wait for runtime recovery before reading saved state.
        const expectedStatus = fixture.stored === 0 ? 'Timer complete.' : fixture.stored === 180 ? 'Timer ready.' : 'Timer paused at ' + fixture.display + '.';
        await expect(page.locator('#ak-timer-status-6')).toHaveText(expectedStatus);
        await expect(page.locator('#ak-timer-display-6')).toHaveText(fixture.display);
        expect(await readRemaining(page)).toBe(fixture.stored);
        const timer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).timers['6'], storageKey);
        expect(timer.total).toBe(180);
        expect(timer.running).toBe(false);
      }
    });
  });
}

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const manifest = require('../../data/localization/fr-business-roi-parity.json');

const cases = {
  pomodoro: { values: { focusMinutes: '20' }, edit: ['focusMinutes', '30'], expected: '30:00' },
  'unit-converter': { values: { group: 'length', value: '2', from: 'm', to: 'cm' }, edit: ['value', '3'], expected: '300 cm' },
  'budget-planner': { values: { currency: 'USD', incomeMain: '1000', incomeOther: '0' }, edit: ['incomeMain', '2000'], expected: '2 000' },
  'countdown-timer': { values: { eventName: 'Fixture initiale', eventDate: '2030-08-05', eventTime: '09:00' }, edit: ['eventName', 'Fixture modifiée'], expected: 'Fixture modifiée' },
  'time-zone': { values: { localDateTime: '2026-07-29T10:00', fromZone: 'Africa/Abidjan', toZone: 'Africa/Nairobi' }, edit: ['localDateTime', '2026-07-29T11:00'], expected: '14:00' },
  'public-holidays': { values: { country: 'GH', name: 'Fixture initiale', date: '2026-08-04', note: 'Synthetic test only' }, edit: ['name', 'Fixture modifiée'], expected: 'Fixture modifiée', checked: 'confirmed' },
  'working-days': { values: { start: '2026-07-27', end: '2026-08-02', holidays: '' }, edit: ['end', '2026-08-03'], expected: '6' },
  'age-calculator': { values: { birthDate: '2000-02-29', atDate: '2026-07-29' }, edit: ['atDate', '2027-07-29'], expected: '27' },
  'grade-tracker': { values: { course1: 'Fixture initiale' }, edit: ['course1', 'Fixture modifiée'], expected: 'Fixture modifiée' },
  'random-picker': { values: { items: 'Fixture initiale', mode: 'pick' }, edit: ['items', 'Fixture modifiée'], expected: 'Fixture modifiée' },
  'meeting-cost': { values: { currency: 'USD', attendees: '5', annualSalary: '52000', durationMinutes: '60', overhead: '1.5', workHoursPerYear: '2080' }, edit: ['attendees', '10'], expected: '375,00' },
  'tip-calculator': { values: { currency: 'USD', bill: '100', tipRate: '10', taxRate: '0', people: '1', roundTo: '0' }, edit: ['bill', '200'], expected: '220,00' }
};
const normalize = text => text.replace(/[\u00a0\u202f]/g, ' ');
async function fill(page, values) {
  for (const [name, value] of Object.entries(values)) {
    const field = page.locator(`[name="${name}"]`);
    if (await field.evaluate(el => el.tagName) === 'SELECT') await field.selectOption(value);
    else await field.fill(value);
  }
}
async function calculate(page) {
  await page.locator('[data-business-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('[data-business-result]')).toBeVisible();
}
async function jsonDownload(page) {
  const pending = page.waitForEvent('download');
  await page.locator('[data-export="json"]').click();
  return JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__copyCalls = 0; window.__printCalls = 0;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => { window.__copyCalls++; return Promise.resolve(); }
    } });
    window.print = () => { window.__printCalls++; };
  });
});

for (const route of manifest.routes) {
  for (const width of [390, 1280]) {
    test(`${route.id} ${width}: edited inputs cannot reuse a previous report`, async ({ page }) => {
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      // Compare exports at one instant; live ticking is covered separately.
      if (route.id === "countdown-timer") await page.clock.setFixedTime(new Date("2026-07-29T12:00:00Z"));
      await page.goto(route.french);
      const scenario = cases[route.id];
      await fill(page, scenario.values);
      if (scenario.checked) await page.locator(`[name="${scenario.checked}"]`).check();
      await calculate(page);
      await fill(page, { [scenario.edit[0]]: scenario.edit[1] });
      await expect(page.locator('[data-business-result]')).toBeHidden();
      await expect(page.locator('[data-business-status]')).toContainText('Recalculez');
      const downloads = []; page.on('download', download => downloads.push(download));
      // Exercise the handler guard as well as the hidden UI, including every format.
      await page.locator('[data-business-app]').evaluate(root => {
        root.querySelectorAll('[data-export], [data-action]').forEach(button => button.click());
      });
      expect(downloads).toEqual([]);
      expect(await page.evaluate(id => ({ copy: window.__copyCalls, print: window.__printCalls,
        saved: localStorage.getItem('afrotools-fr-business-' + id) }), route.id)).toEqual({ copy: 0, print: 0, saved: null });
      await calculate(page);
      const payload = await jsonDownload(page);
      expect(payload.inputs[scenario.edit[0]]).toBe(scenario.edit[1]);
      const reportText = normalize(JSON.stringify(payload.report));
      expect(reportText).toContain(scenario.expected);
      await page.locator('[data-action="save"]').click();
      const saved = await page.evaluate(id => JSON.parse(localStorage.getItem('afrotools-fr-business-' + id)), route.id);
      expect(saved.inputs).toEqual(payload.inputs);
      expect(saved.report).toEqual(payload.report);
      const txtPending = page.waitForEvent('download');
      await page.locator('[data-export="txt"]').click();
      expect(normalize(fs.readFileSync(await (await txtPending).path(), 'utf8'))).toContain(scenario.expected);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}

test('budget reset, native-invalid input and engine errors clear prior reports', async ({ page }) => {
  await page.goto('/fr/tools/planificateur-budget/');
  await fill(page, { incomeMain: '1000', incomeOther: '0' }); await calculate(page);
  await page.locator('[data-business-form]').evaluate(form => form.reset());
  await expect(page.locator('[data-business-result]')).toBeHidden();
  await fill(page, { incomeMain: '1000', incomeOther: '0' }); await calculate(page);
  await page.locator('[name="incomeMain"]').evaluate(field => { field.value = '-1'; field.reportValidity(); });
  await expect(page.locator('[data-business-result]')).toBeHidden();
  await fill(page, { incomeMain: '1000', incomeOther: '0' }); await calculate(page);
  await page.locator('[data-business-form]').evaluate(form => {
    form.elements.incomeMain.value = '0';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.locator('[data-business-result]')).toBeHidden();
  await page.locator('[data-action="save"]').evaluate(button => button.click());
  expect(await page.evaluate(() => localStorage.getItem('afrotools-fr-business-budget-planner'))).toBeNull();
});

test('copy rejection gives recovery feedback; late completion cannot revive stale status', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fr/tools/planificateur-budget/');
  await fill(page, { incomeMain: '1000' }); await calculate(page);
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
  await page.locator('[data-action="copy"]').click();
  await expect(page.locator('[data-business-status]')).toContainText('La copie a échoué');
  await page.evaluate(() => { navigator.clipboard.writeText = () => new Promise(resolve => { window.__finishCopy = resolve; }); });
  await page.locator('[data-action="copy"]').click();
  await fill(page, { incomeMain: '2000' });
  await page.evaluate(() => window.__finishCopy());
  await expect(page.locator('[data-business-status]')).toContainText('Recalculez');
  await expect(page.locator('[data-business-result]')).toBeHidden();
  expect(errors).toEqual([]);
});

test('editing Pomodoro stops its old interval', async ({ page }) => {
  await page.clock.install();
  await page.goto('/fr/tools/minuteur-pomodoro/');
  await fill(page, { focusMinutes: '1' }); await calculate(page);
  await fill(page, { focusMinutes: '2' });
  await page.clock.fastForward(61000);
  await expect(page.locator('[data-business-status]')).toContainText('Recalculez');
  await expect(page.locator('[data-business-result]')).toBeHidden();
});

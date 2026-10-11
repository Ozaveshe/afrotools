const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const routes = {
  fr: { fraction: '/fr/tools/calculateur-fractions/', countdown: '/fr/tools/compte-a-rebours-examen/', word: '/fr/tools/compteur-mots/' },
  sw: { fraction: '/sw/zana/kikokotoo-sehemu/', countdown: '/sw/zana/siku-za-mtihani/', word: '/sw/zana/kihesabu-maneno/' }
};
const panel = page => page.locator('[data-education-result]');
const metrics = page => page.locator('[data-education-metrics]');
const status = page => page.locator('[data-education-status]');
async function calculate(page) {
  await page.locator('button[type="submit"]').click();
  await expect(panel(page)).toBeVisible();
}
async function field(page, name, value) { await page.locator(`[name="${name}"]`).fill(value); }
async function downloadJson(page) {
  const pending = page.waitForEvent('download');
  await page.locator('[data-action="json"]').click();
  const downloaded = await pending;
  return JSON.parse(fs.readFileSync(await downloaded.path(), 'utf8'));
}
test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__errors || [])).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__errors = [];
    window.addEventListener('error', event => window.__errors.push(event.message));
    window.addEventListener('unhandledrejection', event => window.__errors.push(String(event.reason)));
  });
});

for (const locale of ['fr', 'sw']) {
  test(`${locale}: all fraction operations export their actual result`, async ({ page }) => {
    await page.goto(routes[locale].fraction);
    for (const [name, value] of Object.entries({ leftNumerator: '1', leftDenominator: '2', rightNumerator: '1', rightDenominator: '4' })) await field(page, name, value);
    for (const [operation, expected] of [['add', '3/4'], ['subtract', '1/4'], ['multiply', '1/8'], ['divide', '2']]) {
      await page.locator('[name="operation"]').selectOption(operation);
      await calculate(page);
      await expect(metrics(page)).toContainText(expected);
      const exported = await downloadJson(page);
      expect(exported.inputs.operation).toBe(operation);
      expect(exported.result.simplified.text).toBe(expected);
    }
    await field(page, 'rightNumerator', '0');
    await page.locator('button[type="submit"]').click();
    await expect(panel(page)).toBeHidden();
    await expect(status(page)).toHaveClass(/error/);
  });

  test(`${locale}: countdown uses the clock and registration purpose`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-11T12:00:00Z'));
    await page.goto(routes[locale].countdown);
    await field(page, 'examDate', '2026-10-12');
    await page.locator('[name="meaning"]').selectOption('registration');
    await calculate(page);
    expect((await downloadJson(page)).result.days).toBe(1);
    await expect(metrics(page)).toContainText(locale === 'fr' ? 'Préparation du dépôt' : 'Maandalizi ya kuwasilisha');
    await page.clock.setFixedTime(new Date('2026-10-12T12:00:00Z'));
    await calculate(page);
    expect((await downloadJson(page)).result.days).toBe(0);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });

  test(`${locale}: edits, reset and newer runs invalidate delayed results and errors`, async ({ page }) => {
    await page.goto(routes[locale].fraction);
    await calculate(page);
    await field(page, 'leftNumerator', '9');
    await expect(panel(page)).toBeHidden();
    await calculate(page);
    await page.locator('[name="operation"]').selectOption('multiply');
    await expect(panel(page)).toBeHidden();
    await page.evaluate(() => {
      const engine = window.AfroTools.fractionEngine;
      const original = engine.calculate;
      window.__pending = [];
      engine.calculate = input => new Promise((resolve, reject) => window.__pending.push({ resolve: () => resolve(original(input)), reject }));
    });
    await page.locator('[name="operation"]').selectOption('add');
    await field(page, 'leftNumerator', '1');
    await page.locator('button[type="submit"]').click();
    await field(page, 'leftNumerator', '3');
    await page.locator('button[type="submit"]').click();
    await page.evaluate(() => window.__pending[1].resolve());
    await expect(panel(page)).toBeVisible();
    const newer = await downloadJson(page);
    await page.evaluate(async () => { window.__pending[0].resolve(); await new Promise(requestAnimationFrame); });
    expect(await downloadJson(page)).toEqual(newer);
    await page.locator('button[type="submit"]').click();
    await page.locator('button[type="reset"]').click();
    await page.evaluate(async () => { window.__pending[2].resolve(); await new Promise(requestAnimationFrame); });
    await expect(panel(page)).toBeHidden();
    await expect(status(page)).toHaveText('');
    await page.locator('button[type="submit"]').click();
    await field(page, 'leftNumerator', '4');
    const edited = await status(page).innerText();
    await page.evaluate(async () => { window.__pending[3].reject(new Error('delayed')); await new Promise(requestAnimationFrame); });
    await expect(status(page)).toHaveText(edited);
  });

  test(`${locale}: delayed PDF cannot export a later calculation`, async ({ page }) => {
    await page.goto(routes[locale].fraction);
    await calculate(page);
    await page.evaluate(() => {
      window.__saved = [];
      window.jspdf = undefined;
      const append = document.head.appendChild.bind(document.head);
      document.head.appendChild = node => {
        if (node.src?.includes('jspdf.umd')) { window.__pendingPdf = node; return node; }
        return append(node);
      };
    });
    await page.locator('[data-action="pdf"]').click();
    await field(page, 'leftNumerator', '9');
    await calculate(page);
    const currentStatus = await status(page).innerText();
    await page.evaluate(async () => {
      window.jspdf = { jsPDF: class {
        splitTextToSize(text) { return text; }
        text(text) { this.content = text; }
        save() { window.__saved.push(this.content); }
      } };
      window.__pendingPdf.onload();
      await new Promise(requestAnimationFrame);
    });
    expect(await page.evaluate(() => window.__saved)).toEqual([]);
    await expect(status(page)).toHaveText(currentStatus);
    await page.locator('[data-action="pdf"]').click();
    expect(await page.evaluate(() => window.__saved.length)).toBe(1);
  });

  test(`${locale}: contradictory word limits fail and valid retry succeeds`, async ({ page }) => {
    await page.goto(routes[locale].word);
    for (const [name, value] of Object.entries({ text: 'one two three', minimumWords: '20', maximumWords: '2', maximumCharacters: '1000' })) await field(page, name, value);
    await page.locator('button[type="submit"]').click();
    await expect(panel(page)).toBeHidden();
    await expect(status(page)).toHaveClass(/error/);
    await field(page, 'minimumWords', '1');
    await field(page, 'maximumWords', '10');
    await calculate(page);
    await expect(metrics(page)).toContainText(locale === 'fr' ? 'Respectée' : 'Imetimizwa');
    if (locale === 'sw') await expect(metrics(page)).toContainText('Herufi na alama');
  });
}

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const routes = [
  ['en', '/tools/business-plan-builder/'],
  ['fr', '/fr/tools/generateur-business-plan/'],
  ['sw', '/sw/zana/mjenzi-mpango-wa-biashara/']
];
const numbers = ['monthlyRevenue', 'monthlyVariableCosts', 'monthlyFixedCosts', 'startupNeed', 'workingCapitalNeed', 'confirmedFunding'];
async function build(page) {
  await page.locator('[name=name]').fill('Synthetic existing draft');
  for (const name of numbers) await page.locator(`[name=${name}]`).fill('100');
  await page.locator('.bpd-build').click();
  await expect(page.locator('[data-result]')).toBeVisible();
}

for (const [locale, route] of routes) {
  test(`${locale} reports storage failures and preserves portable exports`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.name));
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new DOMException('Denied', 'SecurityError'); };
      Storage.prototype.removeItem = function () { throw new DOMException('Denied', 'SecurityError'); };
    });
    await page.goto(route);
    await build(page);
    await page.locator('[data-action=save]').click();
    await expect(page.locator('[data-result-status]')).toContainText('JSON');
    await page.locator('[data-action=clear]').click();
    await expect(page.locator('[data-draft-status]')).not.toHaveText('');
    const pending = page.waitForEvent('download');
    await page.locator('[data-action=json]').click();
    const download = await pending;
    const data = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(data.narrative.name).toBe('Synthetic existing draft');
    expect(errors).toEqual([]);
  });

  test(`${locale} rejects invalid backups atomically and accepts a valid saved draft`, async ({ page }) => {
    await page.goto(route);
    await build(page);
    await page.locator('[data-action=save]').click();
    const key = `afrotools:business-plan-draft:v1:${locale}`;
    const backup = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const invalid = [
      null,
      { ...backup, form: { narrative: [], finance: [] } },
      { ...backup, form: { ...backup.form, narrative: { ...backup.form.narrative, team: {} } } },
      { ...backup, form: { ...backup.form, narrative: { ...backup.form.narrative, country: 'x'.repeat(121) } } },
      { ...backup, form: { ...backup.form, finance: { ...backup.form.finance, monthlyRevenue: null } } },
      { ...backup, form: { ...backup.form, finance: { ...backup.form.finance, monthlyRevenue: -1 } } },
      { ...backup, schemaVersion: 99 }
    ];
    const before = await page.locator('[data-result]').innerText();
    for (const value of invalid) {
      await page.locator('[data-draft-status]').evaluate(node => { node.textContent = ''; });
      await page.locator('[data-import]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
      await expect(page.locator('[data-draft-status]')).not.toHaveText('');
      await expect(page.locator('[name=name]')).toHaveValue('Synthetic existing draft');
      await expect(page.locator('[data-result]')).toBeVisible();
      expect(await page.locator('[data-result]').innerText()).toBe(before);
    }
    await page.locator('[data-draft-status]').evaluate(node => { node.textContent = ''; });
    await page.locator('[data-import]').setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(1024 * 1024 + 1, 32) });
    await expect(page.locator('[data-draft-status]')).not.toHaveText('');
    await expect(page.locator('[name=name]')).toHaveValue('Synthetic existing draft');
    await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ schemaVersion: 1, tool: 'business-plan-builder', form: { narrative: [], finance: [] } })), key);
    await page.locator('[data-action=load]').click();
    await expect(page.locator('[name=name]')).toHaveValue('Synthetic existing draft');
    backup.form.narrative.name = 'Synthetic imported draft';
    await page.locator('[data-import]').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await expect(page.locator('[name=name]')).toHaveValue('Synthetic imported draft');
    await expect(page.locator('[data-result]')).toBeHidden();
  });
}

const { test, expect } = require('@playwright/test');
const path = require('node:path');

async function mount(page, lang) {
  await page.setContent(`<html lang="${lang}"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div class="result-actions"><save-result-button tool-slug="zm-paye" tool-name="PAYE" currency="ZMW"></save-result-button><share-result-button tool-slug="zm-paye"></share-result-button></div></body></html>`);
  await page.addScriptTag({ path: path.resolve(__dirname, '../../assets/js/components/save-result-button.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../assets/js/components/share-button.js') });
  await page.evaluate(() => {
    window.sample = { inputs: { annualGross: 180000 }, outputs: { monthlyNet: 10974 } };
    document.querySelector('save-result-button').setData(window.sample);
    document.querySelector('share-result-button').setResult({ headline: 'Mshahara halisi', mainValue: 'ZMW 10,974.00', inputs: { annualGross: 180000 } });
  });
}

test('Swahili guest keeps local results and gets a localized sign-in route', async ({ page }) => {
  await mount(page, 'sw-TZ');
  const save = page.getByRole('button', { name: 'Hifadhi matokeo', exact: true });
  await save.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Ingia ili uhifadhi matokeo yako.');
  await expect(page.getByRole('link', { name: 'Ingia (Kiingereza)', exact: true })).toHaveAttribute('href', /^\/auth\/\?mode=login&next=/);
  expect(await page.evaluate(() => document.querySelector('save-result-button')._data)).toEqual({ inputs: { annualGross: 180000 }, outputs: { monthlyNet: 10974 } });
});

test('Swahili saving, success, limit, failure and retry states retain the exact payload', async ({ page }) => {
  await mount(page, 'sw');
  await page.evaluate(() => {
    window.AfroAuth = { isLoggedIn: () => true };
    window.AfroHistory = { save: data => { window.savedPayload = data; return new Promise(resolve => { window.finishSave = resolve; }); } };
  });
  await page.getByRole('button', { name: 'Hifadhi matokeo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Inahifadhi…', exact: true })).toBeDisabled();
  await page.evaluate(() => window.finishSave({ saved: true }));
  await expect(page.getByRole('button', { name: 'Matokeo yamehifadhiwa', exact: true })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Tazama kwenye dashibodi (Kiingereza)' })).toHaveAttribute('href', '/dashboard/');
  expect(await page.evaluate(() => window.savedPayload)).toEqual({ toolSlug: 'zm-paye', toolName: 'PAYE', countryCode: '', currency: 'ZMW', inputs: { annualGross: 180000 }, outputs: { monthlyNet: 10974 } });
  await page.evaluate(() => { document.querySelector('save-result-button').setData(window.sample); window.AfroHistory.save = async () => ({ reason: 'limit_reached', limit: 5 }); });
  await page.getByRole('button', { name: 'Hifadhi matokeo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Umefikia kikomo cha mwezi (5).');
  await expect(page.getByRole('link', { name: 'Boresha hadi Pro' })).toHaveAttribute('href', '/sw/bei/');
  await page.evaluate(() => { window.AfroHistory.save = async () => { throw new Error('synthetic'); }; });
  await page.getByRole('button', { name: 'Hifadhi matokeo', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Imeshindwa kuhifadhi. Jaribu tena.');
  await expect(page.getByRole('button', { name: 'Hifadhi matokeo', exact: true })).toBeEnabled();
});

test('Swahili share menu names and copied feedback use current data and honor authored labels', async ({ page }) => {
  await mount(page, 'sw-KE');
  await page.evaluate(() => {
    window.AfroTools = { toast: { success: text => { window.copyFeedback = text; } } };
    window.AfroShare = { generateCompareLink: (slug, inputs) => { window.shareInputs = inputs; return 'https://example.test/result'; }, copyToClipboard: async text => { window.copied = text; } };
  });
  await page.getByRole('button', { name: 'Shiriki matokeo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'URL Nakili kiungo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNG Pakua picha', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'URL Nakili kiungo', exact: true }).click();
  expect(await page.evaluate(() => [window.copyFeedback, window.copied, window.shareInputs])).toEqual(['Kiungo kimenakiliwa!', 'https://example.test/result', { annualGross: 180000 }]);
  await page.evaluate(() => { const el = document.querySelector('share-result-button'); el.setAttribute('button-label', 'Shiriki hesabu yangu'); el._applyLabels(); });
  await expect(page.getByRole('button', { name: 'Shiriki hesabu yangu', exact: true })).toBeVisible();
});

for (const [lang, save, share, login] of [['en', 'Save Result', 'Share Result', 'Sign in'], ['fr-CA', 'Enregistrer le résultat', 'Share Result', 'Se connecter']]) {
  test(`${lang} existing save and share labels are preserved`, async ({ page }) => {
    await mount(page, lang);
    await page.getByRole('button', { name: save, exact: true }).click();
    await expect(page.getByRole('button', { name: share, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: login, exact: true })).toHaveAttribute('href', lang.startsWith('fr') ? /\/fr\/auth\// : /\/auth\//);
  });
}

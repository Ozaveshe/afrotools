const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const routes = { en: '/tools/mobile-money-fees/', fr: '/fr/tools/frais-mobile-money/', sw: '/sw/zana/ada-pesa-simu/' };
const labels = {
  en: { action: 'Transaction type', participation: 'Comparison participation', included: 'Included in this comparison', unmatched: 'Excluded: no other unexpired quote matches', expired: 'Excluded: quote expired', asOf: 'Comparison calculated at', expires: 'Expires at', missing: 'Not provided', state: 'Expired', actions: ['Send', 'Withdraw', 'Merchant payment', 'Bill payment', 'Other'] },
  fr: { action: 'Opération', participation: 'Participation à la comparaison', included: 'Inclus dans cette comparaison', unmatched: 'Exclu : aucun autre devis non expiré', expired: 'Exclu : devis expiré', asOf: 'Comparaison calculée le', expires: 'Expire le', missing: 'Non renseignée', state: 'Expiré', actions: ['Envoi', 'Retrait', 'Paiement marchand', 'Paiement de facture', 'Autre'] },
  sw: { action: 'Aina ya muamala', participation: 'Kushiriki katika ulinganisho', included: 'Imejumuishwa katika ulinganisho huu', unmatched: 'Haijajumuishwa: hakuna nukuu nyingine', expired: 'Haijajumuishwa: muda wa nukuu umeisha', asOf: 'Ilikokotolewa', expires: 'Muda wa mwisho', missing: 'Haujawekwa', state: 'Muda umeisha', actions: ['Kutuma', 'Kutoa', 'Kulipa mfanyabiashara', 'Kulipa bili', 'Nyingine'] }
};
test.use({ timezoneId: 'Africa/Nairobi' });
async function start(page, baseURL, locale) {
  await page.clock.setFixedTime(new Date('2026-09-26T12:00:00Z'));
  await page.route('**/*', request => request.request().url().startsWith(baseURL) ? request.continue() : request.abort());
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.contextCopy = text; } } }));
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(routes[locale]);
  if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
}
async function fill(page, letter, fee, action = 'send', expires = '') {
  for (const [key, value] of Object.entries({ label: 'Synthetic ' + letter, market: 'Senegal', currency: 'XOF', amount: '10000', sender: fee, recipient: '0', observed: '2026-09-20T15:00', expires })) await page.locator(`#mm-${letter}-${key}`).fill(value);
  await page.locator(`#mm-${letter}-type`).selectOption(action);
}
function metric(card, label) { return card.getByText(label, { exact: true }).locator('..').locator('strong'); }
async function exported(page, info, name, locale) {
  const event = page.waitForEvent('download');
  await page.locator('#mm-json').click();
  const bytes = fs.readFileSync(await (await event).path());
  fs.writeFileSync(info.outputPath(name), bytes);
  const json = JSON.parse(bytes);
  expect(Object.keys(json).sort()).toEqual((locale === 'fr' ? ['schemaVersion', 'locale', 'resume', 'methode', 'methodology', 'result'] : ['schemaVersion', 'locale', 'summary', 'methodology', 'result']).sort());
  expect(json.schemaVersion).toBe(1);
  return json;
}
async function copied(page, info, filename) {
  await page.locator('#mm-copy').click();
  const text = await page.evaluate(() => window.contextCopy);
  fs.writeFileSync(info.outputPath(filename), text);
  return text;
}
for (const locale of Object.keys(routes)) {
  test(`${locale}: mixed-action results and saved summaries identify the excluded cheaper quote`, async ({ page, baseURL }, info) => {
    await start(page, baseURL, locale);
    await page.locator('#mm-third').check();
    await fill(page, 'a', '20'); await fill(page, 'b', '10'); await fill(page, 'c', '0', 'withdraw');
    const text = await copied(page, info, 'mixed-actions.txt');
    const json = await exported(page, info, 'mixed-actions.json', locale);
    const copy = labels[locale], cards = page.locator('#mm-result-list article');
    await expect(page.locator('#mm-primary-value')).toHaveText('10 XOF');
    expect(json.result.quotes.map(row => row.transactionType)).toEqual(['send', 'send', 'withdraw']);
    expect(json.result.quotes.map(row => row.comparable)).toEqual([true, true, false]);
    expect(json.result.quotes.map(row => row.totalFee)).toEqual([20, 10, 0]);
    expect(json.result.groups[0].quoteIndexes).toEqual([0, 1]);
    await expect(metric(cards.nth(0), copy.action)).toHaveText(copy.actions[0]);
    await expect(metric(cards.nth(0), copy.participation)).toHaveText(copy.included);
    await expect(metric(cards.nth(2), copy.action)).toHaveText(copy.actions[1]);
    await expect(metric(cards.nth(2), copy.participation)).toContainText(copy.unmatched);
    for (const summary of [text, json.summary || json.resume]) {
      const third = summary.split('\n').find(line => line.startsWith('Synthetic c (Senegal)'));
      expect(third).toContain(copy.action + ' ' + copy.actions[1]);
      expect(third).toContain(copy.unmatched);
      expect(summary).toContain(copy.included);
      expect(summary).toContain(copy.asOf);
      expect(summary).toContain('15:00:00');
      expect(summary).toMatch(/(?:GMT|UTC)\s*\+3/);
    }
    for (const [index, action] of ['merchant', 'bill', 'other'].entries()) {
      await page.locator('#mm-c-type').selectOption(action);
      await page.locator('#mm-copy').click();
      await expect(metric(cards.nth(2), copy.action)).toHaveText(copy.actions[index + 2]);
      expect(await page.evaluate(() => window.contextCopy)).toContain(copy.action + ' ' + copy.actions[index + 2]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await cards.nth(2).screenshot({ path: info.outputPath('excluded-quote-320.png') });
  });
  test(`${locale}: copied and JSON summaries retain zoned calculation and expiry times before and after expiry`, async ({ page, baseURL }, info) => {
    await start(page, baseURL, locale);
    await fill(page, 'a', '20', 'send', '2026-09-26T15:01');
    await fill(page, 'b', '10', 'send', '2026-09-26T15:01');
    const copy = labels[locale], card = page.locator('#mm-result-list article').first();
    let text = await copied(page, info, 'before-expiry.txt');
    let json = await exported(page, info, 'before-expiry.json', locale);
    expect(json.result.asOf).toBe('2026-09-26T12:00:00.000Z');
    expect(json.result.quotes[0].expiresAt).toBe('2026-09-26T12:01:00.000Z');
    expect(json.result.quotes[0].expiryState).toBe('not-expired');
    await expect(metric(card, copy.asOf)).toContainText('15:00:00');
    await expect(metric(card, copy.expires)).toContainText('15:01:00');
    for (const summary of [text, json.summary || json.resume]) {
      expect(summary).toContain(copy.asOf); expect(summary).toContain('15:00:00');
      expect(summary).toContain(copy.expires); expect(summary).toContain('15:01:00');
      expect(summary).toContain('2026'); expect(summary).toMatch(/(?:GMT|UTC)\s*\+3/);
    }
    await page.clock.setFixedTime(new Date('2026-09-26T12:02:00Z'));
    text = await copied(page, info, 'after-expiry.txt');
    json = await exported(page, info, 'after-expiry.json', locale);
    expect(json.result.hasEligibleComparison).toBe(false);
    expect(json.result.quotes.map(row => row.expiryState)).toEqual(['expired', 'expired']);
    await expect(metric(card, copy.participation)).toHaveText(copy.expired);
    for (const summary of [text, json.summary || json.resume]) { expect(summary).toContain(copy.expired); expect(summary).toContain('15:02:00'); expect(summary).toContain('15:01:00'); }
    await page.locator('#mm-b-expires').fill('');
    text = await copied(page, info, 'unknown-expiry.txt');
    json = await exported(page, info, 'unknown-expiry.json', locale);
    expect(json.result.quotes[1].expiresAt).toBeNull();
    expect(json.result.quotes[1].expiryState).toBe('unknown');
    await expect(metric(page.locator('#mm-result-list article').nth(1), copy.expires)).toHaveText(copy.missing);
    expect(text).toContain(copy.expires + ' ' + copy.missing);
    expect(json.summary || json.resume).toContain(copy.expires + ' ' + copy.missing);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

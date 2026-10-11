'use strict';
const { test, expect } = require('@playwright/test');

test.use({ storageState: { cookies: [], origins: [] }, trace: 'off', video: 'off', screenshot: 'off' });
const locales = [
  ['en', '/tools/currency-converter/', 'Analytics on this page starts only after you accept.'],
  ['fr', '/fr/tools/convertisseur-devises/', 'L’analyse sur cette page ne démarre qu’après votre accord.'],
  ['sw', '/sw/zana/kibadilishaji-sarafu/', 'Uchanganuzi kwenye ukurasa huu huanza tu baada ya kukubali.'],
  ['ha', '/ha/kayan-aiki/canja-kudi/', 'Nazari a wannan shafin zai fara ne kawai idan ka amince.']
];

for (const [locale, route, message] of locales) {
  test(`${locale} currency consent stays off until acceptance and stops on withdrawal`, async ({ page, context }) => {
    test.setTimeout(90000);
    expect(process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS).not.toBe('1');
    const errors = [], googleTags = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.url().startsWith('https://www.googletagmanager.com/gtag/js')) googleTags.push(request.url());
      if (request.method() !== 'GET') writes.push(request.url());
    });
    await page.setViewportSize({ width: 320, height: 850 });
    await page.goto(route);
    const banner = page.locator('#afro-cookie-consent');
    await expect(banner).toBeVisible();
    await expect(banner.locator('.afro-cc-message')).toContainText(message);
    await page.waitForTimeout(400);
    expect(googleTags).toEqual([]);
    expect(writes).toEqual([]);
    expect(await page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.locator('#afro-analytics-consent-accept').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#afro-cc-decline')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banner).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
    expect(googleTags).toEqual([]);
    expect(writes).toEqual([]);

    await page.evaluate(() => window.AfroTools.analyticsConsent.open());
    const tagRequest = page.waitForRequest(request => request.url().startsWith('https://www.googletagmanager.com/gtag/js'));
    await page.locator('#afro-analytics-consent-accept').click();
    await tagRequest;
    await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(false);
    await page.waitForTimeout(2500);
    expect(googleTags).toHaveLength(1);

    async function assertQuietAfterWithdrawal(action) {
      const beforeWrites = writes.length;
      await action();
      await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(true);
      const eventCounts = await page.evaluate(() => {
        const count = () => (window.dataLayer || []).filter(row => row[0] === 'event' && row[1] === 'synthetic_withdrawn_event').length;
        const before = count();
        window.gtag('event', 'synthetic_withdrawn_event', { count: 1 });
        return [before, count()];
      });
      expect(eventCounts[1]).toBe(eventCounts[0]);
      await page.waitForTimeout(1500);
      expect(writes.slice(beforeWrites)).toEqual([]);
      expect(googleTags).toHaveLength(1);
    }
    await page.evaluate(() => window.AfroTools.analyticsConsent.open());
    await assertQuietAfterWithdrawal(() => page.locator('#afro-cc-decline').click());
    const peerPromise = page.waitForEvent('popup');
    await page.evaluate(() => window.open('about:blank'));
    const peer = await peerPromise;
    expect(await peer.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
    for (const clearAll of [false, true]) {
      await page.evaluate(() => window.AfroTools.analyticsConsent.open());
      await page.locator('#afro-analytics-consent-accept').click();
      await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(false);
      await page.waitForTimeout(1500);
      await assertQuietAfterWithdrawal(() => peer.evaluate(clearAll => {
        if (clearAll) localStorage.clear();
        else localStorage.removeItem('afrotools_cookie_consent');
      }, clearAll));
    }
    await peer.close();
    expect(errors).toEqual([]);
  });
}

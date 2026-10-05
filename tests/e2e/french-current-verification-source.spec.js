'use strict';

const { test, expect } = require('@playwright/test');
const { loadVerification, servedInputs, snapshot, ROOT } = require('../../scripts/lib/french-free-app-verification');
const { sha256 } = require('../../scripts/lib/source-fingerprint');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

for (const app of loadVerification().apps.values()) {
  test(`${app.id}: served bytes match the current French verification snapshot`, async ({ request }) => {
    const fingerprint = snapshot(app, ROOT);
    expect(fingerprint.missing).toEqual([]);
    const hashes = new Map(fingerprint.files.map((entry) => [entry.path, entry.sha256]));
    for (const file of servedInputs(app, ROOT)) {
      const response = await request.get(`/${file}`);
      expect(response.ok(), file).toBe(true);
      // This exact, source-owned server adapter prevents test analytics writes.
      // Real asset bytes still participate in the source fingerprint; the
      // receipt declares this local test boundary rather than claiming live QA.
      const analyticsAdapter = 'window.dataLayer=window.dataLayer||[];'
        + 'window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};'
        + 'window.__afroAnalyticsDisabledForOwnerTests=true;';
      const expected = file === 'assets/js/lazy-analytics.js' && process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS === '1'
        ? sha256(analyticsAdapter) : hashes.get(file);
      expect(sha256(await response.body()), file).toBe(expected);
    }
  });
}

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { chromium } = require('playwright');
const lazy = fs.readFileSync('assets/js/lazy-analytics.js', 'utf8');
const bootstrap = fs.readFileSync('assets/js/analytics-bootstrap.js', 'utf8');

test('both analytics entry points respect parsed privacy marker and ordinary consent', async () => {
  const browser = await chromium.launch();
  try {
    for (const entry of ['bootstrap', 'deferred', 'both']) {
      for (const privacy of [true, false]) {
        for (const accepted of [true, false]) {
          const page = await browser.newPage();
          const requests = [];
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await page.addInitScript(value => { if (value) localStorage.setItem('afrotools_cookie_consent', 'accepted'); }, accepted);
          await page.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.hostname === 'www.googletagmanager.com') requests.push(url.hostname);
            if (url.pathname.endsWith('lazy-analytics.js')) return route.fulfill({ contentType: 'application/javascript', body: lazy });
            if (url.pathname.endsWith('analytics-bootstrap.js')) return route.fulfill({ contentType: 'application/javascript', body: bootstrap });
            if (url.pathname === '/fr/fixture/') return route.fulfill({ contentType: 'text/html', body: `<html><head>${entry !== 'deferred' ? '<script src="/assets/js/analytics-bootstrap.js" data-loader-version="12345678"></script>' : ''}${privacy ? '<script src="/assets/js/pages/creative/fr-creative-privacy-bootstrap.js"></script>' : ''}</head><body>${entry !== 'bootstrap' ? '<script defer src="/assets/js/lazy-analytics.js"></script>' : ''}</body></html>` });
            return route.fulfill({ contentType: 'application/javascript', body: '' });
          });
          await page.goto('https://fixture.test/fr/fixture/');
          await page.waitForTimeout(100);
          // Exercise a second, post-DOMContentLoaded loader as well.
          await page.addScriptTag({ content: lazy });
          await page.waitForTimeout(100);
          const state = await page.evaluate(() => ({ configured: !!window.__afroAnalyticsConfigured, commands: (window.dataLayer || []).map(x => Array.from(x)) }));
          assert.equal(requests.length, privacy ? 0 : 1, `${entry} privacy=${privacy} accepted=${accepted}`);
          assert.equal(state.configured, !privacy);
          if (!privacy) {
            const defaults = state.commands.filter(x => x[0] === 'consent' && x[1] === 'default');
            assert.equal(defaults.length, 1);
            assert.equal(defaults[0][2].analytics_storage, accepted ? 'granted' : 'denied');
          }
          assert.deepEqual(errors, []);
          await page.close();
        }
      }
    }
  } finally { await browser.close(); }
});

const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const fixture = 'Synthetic Candidate\nsynthetic@example.invalid\nSummary\nSynthetic imported career summary with sufficient detail for local extraction.\nSkills\nSQL, Excel, Analysis';
const filename = 'Synthetic Private Candidate CV.txt';

for (const sink of ['CVAnalytics', 'gtag']) {
  for (const method of ['file', 'paste', 'ai-paste']) {
    test(`CV import keeps ${method} metadata private through ${sink}`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const errors = [];
      let mockAiRequests = 0;
      let consentDialogs = 0;
      page.on('pageerror', error => errors.push(error.name));
      page.on('dialog', async dialog => {
        if (method !== 'ai-paste') return dialog.dismiss();
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message().startsWith('Optional AI help for your CV')).toBe(true);
        consentDialogs += 1;
        await dialog.accept();
      });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
      await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL).origin) return route.abort();
        if (url.pathname === '/.netlify/functions/ai-advisor' && method === 'ai-paste') {
          mockAiRequests += 1;
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ response: JSON.stringify({ name: 'Synthetic Candidate', contact: 'synthetic@example.invalid', summary: 'Synthetic imported career summary with sufficient detail for local extraction.', skills: 'SQL, Excel, Analysis' }) }) });
        }
        if (request.method() !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return route.abort();
        return route.continue();
      });
      await page.goto('/tools/cv-builder/');
      await page.waitForFunction(() => window.CVImportAssistant && window.CVApp);
      await page.evaluate(sink => {
        window.__privateImportEvents = [];
        const capture = (event, metadata) => {
          if (event === 'cv_import_completed') window.__privateImportEvents.push(metadata);
        };
        window.CVAnalytics = sink === 'CVAnalytics' ? { track: capture } : null;
        window.gtag = (kind, event, metadata) => capture(event, metadata);
        CVApp.getState().data.summary = 'Synthetic original draft';
        CVImportAssistant.open();
      }, sink);
      if (method === 'file') {
        await page.locator('[data-import-file]').setInputFiles({ name: filename, mimeType: 'text/plain', buffer: Buffer.from(fixture) });
        await expect(page.locator('[data-import-status]')).toContainText('text loaded');
      } else {
        await page.locator('[data-import-text]').fill(fixture);
      }
      await page.locator(method === 'ai-paste' ? '[data-import-ai]' : '[data-import-parse]').click();
      await expect(page.locator('[data-import-review]')).toBeVisible();
      if (method === 'file') await expect(page.locator('.cv-import-review-head')).toContainText(filename);
      expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
      await expect(page.locator('[data-import-apply]')).toBeDisabled();
      expect(await page.evaluate(() => window.__privateImportEvents.length)).toBe(0);
      expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
      await page.locator('[data-import-replace-ok]').check();
      await page.locator('[data-import-apply]').click();
      const result = await page.evaluate(() => ({
        events: window.__privateImportEvents,
        contentPreserved: CVApp.getState().data.summary === 'Synthetic imported career summary with sufficient detail for local extraction.',
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      }));
      expect(result.events).toEqual([{ source: method, sections: 3 }]);
      expect(result.contentPreserved).toBe(true);
      expect(result.overflow).toBe(false);
      expect(errors).toEqual([]);
      expect(mockAiRequests).toBe(method === 'ai-paste' ? 1 : 0);
      expect(consentDialogs).toBe(method === 'ai-paste' ? 1 : 0);
    });
  }
}

const { test, expect } = require('@playwright/test');

test('mobile-money PDF remains local when an email is present without marketing opt-in', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    window.__day10PdfPayloads = [];
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.pdf = {
      async generate(payload) {
        window.__day10PdfPayloads.push(payload);
      },
    };
  });

  const requestsAfterExport = [];
  page.on('request', (request) => {
    if (page.__day10ExportStarted) requestsAfterExport.push(request.url());
  });

  await page.goto('/tools/mobile-money-fees/', { waitUntil: 'domcontentloaded' });
  await page.locator('#telecom-toolkit-panel').waitFor();
  await page.fill('#telecom-lead-email', 'synthetic@example.test');
  await expect(page.locator('#telecom-lead-optin')).not.toBeChecked();

  page.__day10ExportStarted = true;
  await page.getByRole('button', { name: 'Download PDF brief' }).click();

  await expect(page.locator('#telecom-status')).toContainText('generated locally');
  await expect.poll(() => page.evaluate(() => window.__day10PdfPayloads.length)).toBe(1);
  expect(await page.evaluate(() => window.__day10PdfPayloads[0].title)).toContain('Mobile');
  expect(
    requestsAfterExport.filter((url) => /capture-lead|supabase|\/api\/workspace/i.test(url)),
  ).toEqual([]);
});

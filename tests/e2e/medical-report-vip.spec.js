const { test, expect } = require('@playwright/test');

const route = '/tools/medical-report/';

test('lab range wins, AI is explicit, and raw report text stays out of requests', async ({ page }) => {
  const aiRequests = [];
  page.on('dialog', (dialog) => dialog.accept());
  await page.route('**/.netlify/functions/ai-advisor', async (route) => {
    aiRequests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Educational reply. Review with the ordering clinician.' }) });
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.fill('#labInput', [
    'Patient: PRIVATE_RAW_REPORT_BROWSER_SENTINEL',
    'WBC: 12 x10^9/L Reference range: 4.0 - 13.0',
    'Hemoglobin: 7 g/dL Reference range: 12 - 16 CRITICAL',
  ].join('\n'));
  await page.check('#aiConsent');
  await page.click('#analyzeBtn');
  await expect(page.locator('#resultsContainer')).toHaveClass(/on/);
  expect(aiRequests).toHaveLength(0);

  const cards = page.locator('.mr-marker');
  await expect(cards.first()).toContainText('Laboratory range used');
  await expect(page.locator('#summaryStats')).toContainText('Within shown range');
  await expect(page.locator('#emergencyBanner')).toHaveClass(/on/);
  await expect(page.locator('#aiPayloadPreview')).toContainText('"referenceSource": "lab-report"');
  await expect(page.locator('#aiPayloadPreview')).not.toContainText('PRIVATE_RAW_REPORT_BROWSER_SENTINEL');

  await page.click('#aiRunBtn');
  await expect.poll(() => aiRequests.length).toBe(1);
  const body = JSON.stringify(aiRequests[0]);
  expect(body).not.toContain('PRIVATE_RAW_REPORT_BROWSER_SENTINEL');
  expect(body).toContain('parsedMarkers');
  expect(body).toContain('lab-report');
  expect(aiRequests[0].consent).toEqual({ aiAdvisor: 'accepted', aiContentIncluded: true });
});

test('primary PDF is a real local download with no lead or workspace request', async ({ page }) => {
  const forbidden = [];
  page.on('request', (request) => {
    if (page.__pdfStarted && /capture-lead|\/api\/workspace|supabase|cdn\.jsdelivr|cdnjs/i.test(request.url())) {
      forbidden.push(request.url());
    }
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.fill('#labInput', 'WBC: 7.2 x10^9/L Reference range: 4 - 11');
  await page.click('#analyzeBtn');
  await expect(page.locator('#resultsContainer')).toHaveClass(/on/);
  page.__pdfStarted = true;
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-health-action="pdf"]');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^afrotools-health-medical-report-.+\.pdf$/);
  expect(forbidden).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('afro_health_plans'))).toBeNull();
});

for (const width of [320, 375]) {
  test(`mobile ${width}px dark mode is operable without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const imageTab = page.locator('#tab-image');
    await imageTab.focus();
    await expect(imageTab).toBeFocused();
    await imageTab.press('Enter');
    await expect(imageTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-image')).toBeVisible();
    await expect(page.locator('#imageDropZone')).toHaveAttribute('role', 'button');
    await expect(page.locator('.mr-boundary')).toContainText('Source pixels are not uploaded');
    expect(await page.evaluate(() => Boolean(window.Tesseract && window.pdfjsLib && window.MedicalReportEngine))).toBe(true);
  });
}

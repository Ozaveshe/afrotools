const { test, expect } = require('@playwright/test');

const route = '/tools/ielts-calculator/';
test.use({ serviceWorkers: 'block' });

test('requires a user target and applies official overall rounding', async ({ page }) => {
  const errors = [];
  const writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push(request.postData() || '');
  });

  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#ieltsFormStatus')).toContainText('Choose the overall target');
  await expect(page.locator('#resultsPanel')).toBeHidden();

  await page.locator('#planningTarget').selectOption('6.5');
  await page.locator('#listening').selectOption('6.5');
  await page.locator('#reading').selectOption('6.5');
  await page.locator('#writing').selectOption('5.0');
  await page.locator('#speaking').selectOption('7.0');
  await page.locator('#calculateBtn').click();

  await expect(page.locator('#overallScore')).toHaveText('6.5');
  await expect(page.locator('#levelDesc')).toContainText('Section average 6.250');
  await expect(page.locator('#verdictStatus')).toHaveText('At or above target');
  await expect(page.locator('#verdictSummary')).toContainText('does not prove');
  await expect(page.locator('#qualificationCard')).toBeHidden();
  await expect(page.locator('.ielts-toefl-box')).toHaveCount(0);
  expect(writes.every(body => !/6\.5|5\.0|7\.0/.test(body))).toBeTruthy();
  expect(errors).toEqual([]);
});

test('raw estimates distinguish Academic and General Training Reading', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.locator('#rawListening').fill('30');
  await page.locator('#rawReading').fill('30');
  await expect(page.locator('#rawListeningBand')).toHaveText('7.0');
  await expect(page.locator('#rawReadingBand')).toHaveText('7.0');

  await page.locator('#modeGeneral').click();
  await expect(page.locator('#readingEstimateLabel')).toContainText('General Training');
  await expect(page.locator('#rawListeningBand')).toHaveText('7.0');
  await expect(page.locator('#rawReadingBand')).toHaveText('6.0');

  await page.locator('#rawReading').fill('30.5');
  await expect(page.locator('#rawReadingBand')).toHaveText('—');
  await page.locator('#applyRawBtn').click();
  await expect(page.locator('#ieltsFormStatus')).toContainText('whole-number practice scores');
  await expect(page.locator('#resultsPanel')).toBeHidden();
});

test('raw apply fills bands but never creates an eligibility result', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.locator('#rawListening').fill('35');
  await page.locator('#rawReading').fill('32');
  await page.locator('#applyRawBtn').click();
  await expect(page.locator('#listening')).toHaveValue('8.0');
  await expect(page.locator('#reading')).toHaveValue('7.0');
  await expect(page.locator('#resultsPanel')).toBeHidden();
  await expect(page.locator('#ieltsFormStatus')).toContainText('Estimated bands applied');
});

test('action pack print invokes the browser print boundary', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.locator('#planningTarget').selectOption('7.0');
  await page.locator('#calculateBtn').click();
  await page.evaluate(() => {
    window.print = () => { window.__ieltsPrintCalls = (window.__ieltsPrintCalls || 0) + 1; };
  });
  await page.locator('#printIELTSActionPack').click();
  expect(await page.evaluate(() => window.__ieltsPrintCalls || 0)).toBe(1);
  await page.evaluate(() => document.documentElement.classList.add('ielts-pack-printing'));
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

for (const width of [320, 360]) {
  test(`mobile ${width}px has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(1);
  });
}

test('dark mode and 375-equivalent 200 percent text remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.fontSize = '200%';
  });
  const cardBackground = await page.locator('.ielts-card').first().evaluate(node => getComputedStyle(node).backgroundColor);
  expect(cardBackground).not.toBe('rgb(255, 255, 255)');
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
});

test('controls are named and canonical type is active', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  const unnamed = await page.locator('.ielts-container button, .ielts-container input, .ielts-container select, .ielts-container a[href]').evaluateAll(nodes =>
    nodes.filter(node => {
      if (node.hidden || node.type === 'hidden' || !node.getClientRects().length) return false;
      const labels = node.labels ? Array.from(node.labels).map(label => label.textContent.trim()).join('') : '';
      return !(node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') || labels || node.textContent.trim() || node.title);
    }).length
  );
  expect(unnamed).toBe(0);
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).fontFamily)).toContain('DM Sans');
});

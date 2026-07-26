const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const screenshotDir = path.resolve(__dirname, '../../artifacts/day5-language-category-hub-vip');

async function captureProof(page, filename) {
  if (!process.env.VIP_SCREENSHOTS) return;
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
}

test('inventory remains complete and crawlable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
    colorScheme: 'light'
  });
  const page = await context.newPage();
  await page.goto('/language/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Choose the language tool that matches the job');
  await expect(page.locator('.lh-card')).toHaveCount(11);
  await expect(page.locator('[data-inventory-group="phrasebook"] .lh-card')).toHaveCount(8);
  await expect(page.locator('[data-inventory-group="utility"] .lh-card')).toHaveCount(3);
  await expect(page.locator('.lh-card h3 a')).toHaveCount(11);
  await expect(page.getByRole('link', { name: 'Swahili Translator', exact: true })).toHaveAttribute('href', '/tools/swahili-translator/');
  await expect(page.getByRole('link', { name: 'African Name Meaning Finder', exact: true })).toHaveAttribute('href', '/tools/african-name-meaning/');
  await context.close();
});

test('keyboard path exposes skip link and every card is a real link', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/language/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.lh-skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeInViewport();
  await expect(page.locator('.lh-card h3 a')).toHaveCount(11);
  await captureProof(page, 'desktop-light.png');
  expect(consoleErrors).toEqual([]);
});

for (const width of [320, 375]) {
  test(`dark mode fits ${width}px without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/language/');
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth
    }));
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.body).toBeLessThanOrEqual(1);
    await expect(page.locator('.lh-card')).toHaveCount(11);
    await captureProof(page, `mobile-${width}-dark.png`);
  });
}

test('200 percent text remains readable and horizontally contained', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/language/');
  await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth
  }));
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.lh-card')).toHaveCount(11);
  await captureProof(page, 'mobile-375-text-200.png');
});

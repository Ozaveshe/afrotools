const { test, expect } = require('@playwright/test');

for (const { subject, minimum } of [
  { subject: 'mathematics', minimum: 45 },
  { subject: 'english', minimum: 14 },
]) {
  test(`${subject} 2025 practice stays usable on a small screen`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/jamb/${subject}/2025/`);

    const cards = page.locator('article[data-reviewed-question]');
    expect(await cards.count()).toBeGreaterThanOrEqual(minimum);
    await expect(page.locator('body')).toContainText('Original sitting and question number unconfirmed');

    const answer = cards.first().locator('details');
    await expect(answer).not.toHaveAttribute('open', '');
    await answer.locator('summary').click();
    await expect(answer).toHaveAttribute('open', '');
    await expect(answer.locator('p').last()).not.toBeEmpty();

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

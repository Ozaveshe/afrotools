const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

for (const scenario of [
  { width: 320, textScale: '100%' },
  { width: 375, textScale: '200%' }
]) {
  test(`cover-letter dark contrast at ${scenario.width}px and ${scenario.textScale} text`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/cover-letter-generator/app.html');
    const decline = page.locator('#afro-cc-decline');
    if (await decline.isVisible()) await decline.click();
    await page.waitForFunction(() => document.querySelector('#templateId').options.length > 2);
    await page.locator('#tab-draft').focus();
    await page.keyboard.press('Enter');
    await page.locator('#letterText').fill('Synthetic Candidate\n\nDear Hiring Manager,\n\nI am applying for the analyst role at Example Ltd. My reporting experience supports clear operations and reliable delivery.\n\nYours sincerely,\nSynthetic Candidate');
    await page.evaluate((textScale) => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.fontSize = textScale;
    }, scenario.textScale);
    await expect(page.locator('#paperPreview')).toContainText('Synthetic Candidate');
    await expect(page.locator('.app-shell')).toHaveAttribute('data-stage', 'draft');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document.querySelector('main'), {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
      });
      return result.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target)
      }));
    });
    expect(violations).toEqual([]);
  });
}

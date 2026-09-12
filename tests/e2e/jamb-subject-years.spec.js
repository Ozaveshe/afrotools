const { test, expect } = require('@playwright/test');
const { questions } = require('../../data/jamb/pools/practice-pool.json');
const subjects = [...new Set(questions.map(q => q.subject))];
for (const width of [320, 390]) for (const subject of subjects) {
  test(`${subject} index identifies and orders actual exam years at ${width}px`, async ({ page }) => {
    const rows = questions.filter(q => q.subject === subject).sort((a,b) => b.year-a.year || a.num-b.num || a.id.localeCompare(b.id));
    const counts = new Map();
    rows.forEach(q => counts.set(q.year, (counts.get(q.year) || 0) + 1));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/jamb/${subject}/`);
    await expect(page.locator('.qcard > h2')).toHaveText(rows.map(q => `${q.year} · Question ${q.num}`));
    await expect(page.getByRole('navigation', { name: 'Browse paper years' }).locator('a')).toHaveText([...counts].map(([year,count]) => `${year} (${count})`));
    await expect(page.getByText('Practice selection: full-paper coverage has not been confirmed.', { exact: true })).toBeVisible();
    const q = rows.find(q => !q.image);
    const card = page.locator(`[data-reviewed-question="${q.id}"]`);
    await card.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(card.locator('details')).toHaveAttribute('open', '');
    await expect(card.locator('details > p').last()).toHaveText(q.explanation || q.ai_explanation);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

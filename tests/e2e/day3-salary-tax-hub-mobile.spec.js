const { test, expect } = require('@playwright/test');

for (const theme of ['light', 'dark']) {
  test(`salary-tax hub has no 320px overflow in ${theme} mode`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/salary-tax/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(selectedTheme => document.documentElement.setAttribute('data-theme', selectedTheme), theme);
    await expect(page.locator('afro-navbar')).toHaveAttribute('data-styles-ready', '');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero-stat-val').nth(0)).toHaveText('134');
    await expect(page.locator('.hero-stat-val').nth(2)).toHaveText('Dated');
    await expect(page.getByText('Hub navigation and search contract checked 22 July 2026.')).toBeVisible();
    const schema = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(node => JSON.parse(node.textContent));
      const collection = blocks.find(block => block['@type'] === 'CollectionPage');
      const list = blocks.find(block => block['@type'] === 'ItemList');
      return { dateModified: collection.dateModified, numberOfItems: list.numberOfItems, listLength: list.itemListElement.length, listName: list.name };
    });
    expect(schema).toEqual({ dateModified: '2026-07-22', numberOfItems: 10, listLength: 10, listName: 'Featured African PAYE calculator routes' });
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      statsRight: document.querySelector('.hero-stats').getBoundingClientRect().right,
      offenders: Array.from(document.querySelectorAll('body *')).map(element => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: String(element.className || ''), left: rect.left, right: rect.right, width: rect.width };
      }).filter(rect => rect.right > document.documentElement.clientWidth + 1 || rect.left < -1).slice(0, 12),
      wideContainers: Array.from(document.querySelectorAll('body *')).filter(element => element.scrollWidth > element.clientWidth + 1).slice(0, 12).map(element => ({ tag: element.tagName, id: element.id, className: String(element.className || ''), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })),
      navbarWide: (() => {
        const root = document.querySelector('afro-navbar')?.shadowRoot;
        return root ? Array.from(root.querySelectorAll('*')).filter(element => element.scrollWidth > element.clientWidth + 1 || element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 16).map(element => ({ tag: element.tagName, id: element.id, className: String(element.className || ''), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })) : [];
      })(),
    }));
    expect(geometry.scrollWidth, JSON.stringify({ offenders: geometry.offenders, wideContainers: geometry.wideContainers, navbarWide: geometry.navbarWide })).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.statsRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `artifacts/salary-tax-hub-320-${theme}.png`, fullPage: true });
  });
}

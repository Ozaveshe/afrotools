const { test, expect } = require('@playwright/test');

const ROUTES = [
  {
    path: '/agriculture/vaccination-schedule/kenya',
    herdSize: '20',
    animalType: 'all',
    expectedCurrency: 'KSh'
  },
  {
    path: '/agriculture/vaccination-schedule/nigeria',
    herdSize: '35',
    animalType: 'cattle',
    expectedCurrency: '₦'
  },
  {
    path: '/agriculture/vaccination-schedule/tanzania',
    herdSize: '120',
    animalType: 'poultry',
    expectedCurrency: 'TSh'
  }
];

for (const fixture of ROUTES) {
  test(`${fixture.path} uses the extracted engine and renderer`, async ({ page }) => {
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(fixture.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#herdSize')).toBeVisible();

    await page.locator('#herdSize').fill(fixture.herdSize);
    await page.locator('#animalType').selectOption(fixture.animalType);
    await page.locator('#currentMonth').selectOption('3');
    await page.getByRole('button', { name: /Generate Vaccination Schedule/i }).focus();
    await expect(page.getByRole('button', { name: /Generate Vaccination Schedule/i })).toBeFocused();
    await page.getByRole('button', { name: /Generate Vaccination Schedule/i }).click();

    if (!String(await page.locator('#results').getAttribute('class')).includes('on') && errors.length) {
      throw new Error(`Vaccination runtime error: ${errors.join(' | ')}`);
    }
    await expect(page.locator('#results')).toHaveClass(/on/);
    await expect(page.locator('#calendarGrid .cal-wrap')).toBeVisible();
    await expect(page.locator('#scheduleTable table')).toBeVisible();
    await expect(page.locator('#costSection')).toContainText(fixture.expectedCurrency);
    await expect(page.locator('#govInfo .gov-info-box')).toBeVisible();

    const runtime = await page.evaluate(() => ({
      engine: typeof window.AfroTools.VaccinationEngine.calculate,
      validation: typeof window.AfroTools.VaccinationEngine.validateInput,
      renderer: typeof window.AfroTools.VaccinationRenderer.renderCalendarGrid,
      engineOwnsRenderer: typeof window.AfroTools.VaccinationEngine.renderCalendarGrid
    }));
    expect(runtime).toEqual({
      engine: 'function',
      validation: 'function',
      renderer: 'function',
      engineOwnsRenderer: 'undefined'
    });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('English vaccination result reflows at 320px and 200% zoom', async ({ page }) => {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/agriculture/vaccination-schedule/kenya', { waitUntil: 'domcontentloaded' });
  await page.locator('#herdSize').fill('20');
  await page.locator('#currentMonth').selectOption('3');
  await page.getByRole('button', { name: /Generate Vaccination Schedule/i }).click();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('#results')).toHaveClass(/on/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) {
    const offenders = await page.evaluate(() => Array.from(document.querySelectorAll('body *'))
      .map(node => {
        const box = node.getBoundingClientRect();
        return { tag: node.tagName, id: node.id, className: String(node.className || ''), right: box.right };
      })
      .filter(item => item.right > window.innerWidth + 1)
      .sort((left, right) => right.right - left.right)
      .slice(0, 12));
    const chain = await page.evaluate(() => {
      const rows = [];
      let node = document.querySelector('.cal-wrap');
      while (node && rows.length < 8) {
        const style = getComputedStyle(node);
        rows.push({
          tag: node.tagName,
          id: node.id,
          className: String(node.className || ''),
          width: node.getBoundingClientRect().width,
          scrollWidth: node.scrollWidth,
          overflowX: style.overflowX,
          minWidth: style.minWidth,
          contain: style.contain
        });
        node = node.parentElement;
      }
      return {
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth
        },
        rows
      };
    });
    throw new Error(`Horizontal overflow ${overflow}px: ${JSON.stringify({ offenders, chain })}`);
  }
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

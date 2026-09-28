const { test, expect } = require('@playwright/test');

function contrastRatio(foreground, background) {
  const rgb = value => value.startsWith('#')
    ? [1, 3, 5].map(offset => parseInt(value.slice(offset, offset + 2), 16))
    : value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const luminance = value => {
    const channels = rgb(value).map(channel => {
      const linear = channel / 255;
      return linear <= 0.04045 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const levels = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (levels[0] + 0.05) / (levels[1] + 0.05);
}

async function mobilePage(page, width, theme) {
  await page.setViewportSize({ width, height: 780 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('aft_theme', selectedTheme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  }, theme);
}

async function headingIsClearOfNavbar(page, headingSelector) {
  await expect.poll(() => page.evaluate(selector => {
    const nav = document.querySelector('afro-navbar').getBoundingClientRect();
    const heading = document.querySelector(selector).getBoundingClientRect();
    return Math.round(heading.top - nav.bottom);
  }, headingSelector)).toBeGreaterThanOrEqual(8);
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`Lobola result heading clears mobile navigation at ${width}px in ${theme}`, async ({ page }) => {
      await mobilePage(page, width, theme);
      await page.goto('/tools/lobola-calculator/');
      await page.locator('#familyExpectation').fill('50000');
      await page.locator('#giftValue').fill('5000');
      await page.locator('#ceremonyCost').fill('2000');
      await page.getByRole('button', { name: 'Build my family plan' }).click();
      await expect(page.locator('#results')).toHaveClass(/show/);
      await expect(page.locator('#rTotal')).toHaveText('R 62,700');
      await headingIsClearOfNavbar(page, '.cattle-visual h3');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });

    test(`Eswatini PAYE result and chart remain readable at ${width}px in ${theme}`, async ({ page }) => {
      await mobilePage(page, width, theme);
      await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: 'window.Chart = class Chart { constructor(canvas, config) { this.options = config.options; window.__chartConfig = config; } destroy() {} };'
        })
      );
      await page.goto('/eswatini/sz-paye');
      const labels = await page.evaluate(() => ({
        slider: [...document.querySelector('#salarySlider').labels].map(label => label.textContent.trim()),
        amount: [...document.querySelector('#grossSalary').labels].map(label => label.textContent.trim())
      }));
      expect(labels).toEqual({
        slider: ['Annual Gross Salary'],
        amount: ['Or type exact annual amount']
      });
      await page.locator('label[for="grossSalary"]').click();
      await expect(page.locator('#grossSalary')).toBeFocused();
      await page.locator('#grossSalary').fill('600000');
      await page.getByRole('button', { name: /Calculate My Take-Home Pay/ }).click();
      await expect(page.locator('#resultsCard')).toHaveClass(/on/);
      await expect(page.locator('#resAmount')).toContainText('426,971');
      await headingIsClearOfNavbar(page, '.res-hero-label');
      const chart = await page.evaluate(() => ({
        ink: window.__chartConfig.options.plugins.legend.labels.color,
        background: getComputedStyle(document.querySelector('.res-body')).backgroundColor,
        cardBackground: getComputedStyle(document.querySelector('#resultsCard')).backgroundColor
      }));
      const background = chart.background === 'rgba(0, 0, 0, 0)' ? chart.cardBackground : chart.background;
      expect(contrastRatio(chart.ink, background)).toBeGreaterThanOrEqual(4.5);
      if (theme === 'dark') {
        const employer = await page.evaluate(() => ({
          ink: getComputedStyle(document.querySelector('#employerStrip')).color,
          background: getComputedStyle(document.querySelector('.res-body')).backgroundColor
        }));
        expect(contrastRatio(employer.ink, employer.background)).toBeGreaterThanOrEqual(4.5);
      }
      if (theme === 'dark' && width === 390) {
        await page.evaluate(() => {
          document.documentElement.dataset.theme = 'light';
          document.dispatchEvent(new CustomEvent('afrotools:theme-change'));
        });
        await expect.poll(() => page.evaluate(() => window.__chartConfig.options.plugins.legend.labels.color)).toBe('#475569');
      }
      await page.getByRole('button', { name: 'Monthly', exact: true }).click();
      await expect(page.locator('#resAmount')).toContainText('35,581');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
}

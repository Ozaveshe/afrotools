const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) for (const theme of ['light', 'dark']) {
  test(`Ghana cap and contribution units agree at ${width}px ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    }, theme);
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (['127.0.0.1', 'localhost'].includes(url.hostname) && ['GET', 'HEAD'].includes(request.method())) return route.continue();
      const type = request.resourceType();
      return route.fulfill({ status: 200, contentType: type === 'script' ? 'application/javascript' : type === 'stylesheet' ? 'text/css' : 'application/json', body: url.pathname.includes('chart.umd') ? 'window.Chart = class { constructor() {} destroy() {} };' : type === 'script' || type === 'stylesheet' ? '' : '{}' });
    });
    await page.goto('/ghana/gh-paye.html');
    for (const fixture of [
      { annualGross: 780000, employeeMonthly: '3,575', employerMonthly: '8,450', costMonthly: '73,450', employeeAnnual: '42,900', employerAnnual: '101,400', costAnnual: '881,400' },
      { annualGross: 840000, employeeMonthly: '3,795', employerMonthly: '8,970', costMonthly: '78,970', employeeAnnual: '45,540', employerAnnual: '107,640', costAnnual: '947,640' }
    ]) {
      await page.getByLabel('Annual Gross Salary', { exact: true }).fill(String(fixture.annualGross));
      await page.locator('#calcBtn').click();
      await page.getByRole('button', { name: 'Monthly', exact: true }).click();
      const employer = page.locator('#employerStrip');
      await expect(employer).toContainText('13% of basic pay up to GHS 69,000 per month');
      await expect(employer).not.toContainText('61k');
      await expect(employer).toContainText(`GHS ${fixture.employerMonthly}/mo`);
      await expect(employer).toContainText(`GHS ${fixture.costMonthly}/mo`);
      await expect(page.locator('#resRows')).toContainText(`GHS ${fixture.employeeMonthly}`);
      await page.getByRole('button', { name: 'Annual', exact: true }).click();
      await expect(employer).toContainText('GHS 69,000 per month');
      await expect(employer).toContainText(`GHS ${fixture.employerAnnual}/yr`);
      await expect(employer).toContainText(`GHS ${fixture.costAnnual}/yr`);
      await expect(page.locator('#resRows')).toContainText(`GHS ${fixture.employeeAnnual}`);
      const geometry = await employer.evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.page).toBeLessThanOrEqual(geometry.viewport);
    }
    expect(errors).toEqual([]);
  });
}

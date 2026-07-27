const { expect, test } = require('@playwright/test');

const EXPECTED = {
  'betting-odds': 'NGN 7,500',
  'afcon-predictor': '8.0%',
  'fantasy-football': '10 pts',
  'betting-tax': 'NGN 7,125',
  'streaming-royalties': 'USD 250.74',
  'nollywood-box-office': 'NGN 75,870,000',
  'dj-booking-rate': 'NGN 564,750',
  'concert-budget': 'NGN -14,200,240',
  'gym-roi-business': 'NGN 6,260,000',
  'event-ticket-revenue': 'NGN 13,213,400',
  'match-tickets': 'NGN 30,060',
  'sports-scholarship': '89/100',
  'athlete-earnings': 'NGN 99,676,248',
  'gaming-pc-build': '1080p balanced',
  'photo-video-pricing': 'NGN 1,260,896',
};

for (const [id, expected] of Object.entries(EXPECTED)) {
  test(`${id} completes, refuses empty input safely, resets, and exports locally`, async ({ page }) => {
    const errors = [];
    const forbidden = [];
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/capture-lead|workspace|supabase|\/api\//i.test(request.url())) {
        forbidden.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const response = await page.goto(`/tools/${id}/`, { waitUntil: 'domcontentloaded' });
    expect(response && response.status()).toBe(200);
    await expect(page.locator('.sports-result-value')).toHaveText(expected);
    await expect(page.locator('[data-day9-sports-boundary]')).toBeVisible();
    await expect(page.locator('.sports-lead-form')).toHaveCount(0);
    await expect(page.locator('[data-print-report]')).toBeVisible();
    await expect(page.locator('[data-copy-local-report]')).toBeVisible();

    const storageBefore = await page.evaluate(() => JSON.stringify(
      Object.fromEntries(Object.entries(localStorage).filter(([key]) => !/^(?:afro_pro_status_cache|theme|consent)/.test(key)))
    ));
    const firstInput = page.locator('#sports-tool-form input').first();
    if (await firstInput.count()) {
      await firstInput.fill('');
      await firstInput.dispatchEvent('change');
      await expect(page.locator('#sports-results')).not.toContainText(/\b(?:NaN|undefined|null)\b/);
    }
    await page.locator('[data-reset]').click();
    await expect(page.locator('.sports-result-value')).toHaveText(expected);
    const storageAfter = await page.evaluate(() => JSON.stringify(
      Object.fromEntries(Object.entries(localStorage).filter(([key]) => !/^(?:afro_pro_status_cache|theme|consent)/.test(key)))
    ));
    expect(storageAfter).toBe(storageBefore);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.fontSize = '200%';
    });
    const audit = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && rect.width > 0 && rect.height > 0;
      };
      const controls = Array.from(document.querySelectorAll(
        '#sports-tool-root button, #sports-tool-root input, #sports-tool-root select'
      )).filter(visible);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unnamed: controls.filter((control) => !(
          (control.textContent || '').trim()
          || control.getAttribute('aria-label')
          || (control.labels && Array.from(control.labels).some((label) => label.textContent.trim()))
        )).length,
        minTarget: Math.min(...controls.map((control) => control.getBoundingClientRect().height)),
      };
    });
    expect(audit.overflow).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);
    expect(audit.minTarget).toBeGreaterThanOrEqual(40);
    expect(forbidden).toEqual([]);
    expect(errors).toEqual([]);
  });
}

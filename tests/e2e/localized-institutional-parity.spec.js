const { test, expect } = require('@playwright/test');

test.use({ baseURL: process.env.LOCALIZED_PARITY_BASE_URL || 'http://127.0.0.1:43310' });

const routes = [
  '/fr/','/fr/about/','/fr/contact/','/fr/faq/','/fr/cookies/','/fr/privacy/','/fr/terms-of-use/',
  '/sw/','/sw/kuhusu/','/sw/wasiliana/','/sw/maswali-ya-mara-kwa-mara/','/sw/vidakuzi/','/sw/faragha/','/sw/masharti/'
];

test('Tier-1 localized pages remain mobile-safe with visible shared navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, inner: innerWidth, height: document.documentElement.scrollHeight }));
    expect(layout.width, `${route}: no horizontal overflow`).toBeLessThanOrEqual(layout.inner + 1);
    expect(layout.height, `${route}: bounded page length`).toBeLessThan(30000);
    const navbar = page.locator('afro-navbar');
    await expect(navbar).toBeVisible();
    const navState = await navbar.evaluate(host => {
      const root = host.shadowRoot;
      const logo = root && root.querySelector('a[href="/"], .logo, .navbar-logo, .brand');
      const menu = root && root.querySelector('.burger, .menu-toggle, .hamburger');
      const lr = logo && logo.getBoundingClientRect();
      const mr = menu && menu.getBoundingClientRect();
      return { logoVisible: Boolean(lr && lr.width > 10 && lr.height > 10), menuRight: mr ? mr.right : 0 };
    });
    expect(navState.logoVisible, `${route}: logo visible`).toBeTruthy();
    expect(navState.menuRight, `${route}: menu aligned right`).toBeGreaterThan(300);
    expect(errors.filter(error => !/favicon|analytics/i.test(error)), `${route}: console`).toEqual([]);
  }
});

test('home discovery, contact and FAQ interactions work in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of ['fr','sw']) {
    await page.goto(`/${locale}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main form')).toHaveCount(3);
    expect(await page.locator('main a').count()).toBeGreaterThanOrEqual(90);
    const contact = locale === 'fr' ? '/fr/contact/' : '/sw/wasiliana/';
    await page.goto(contact, { waitUntil: 'domcontentloaded' });
    const form = page.locator('.li-form');
    await form.locator('input[name="name"]').fill('Jaribio Salama');
    await form.locator('input[name="email"]').fill('test@example.invalid');
    await form.locator('select[name="reason"]').selectOption({ index: 1 });
    await form.locator('textarea[name="message"]').fill('Ujumbe wa synthetic wa ukaguzi.');
    await expect(form.locator('button[type="submit"]')).toBeEnabled();
    const faq = locale === 'fr' ? '/fr/faq/' : '/sw/maswali-ya-mara-kwa-mara/';
    await page.goto(faq, { waitUntil: 'domcontentloaded' });
    await page.locator('.li-faq-search input[type="search"]').fill(locale === 'fr' ? 'confidentialité' : 'faragha');
    await expect(page.locator('.li-faq-item:visible')).not.toHaveCount(0);
  }
});

test('effective 200 percent layout remains bounded', async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 900 });
  for (const route of ['/fr/','/sw/','/fr/contact/','/sw/wasiliana/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route}: effective 200% overflow`).toBeLessThanOrEqual(1);
  }
});

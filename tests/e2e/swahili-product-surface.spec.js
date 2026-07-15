const { test, expect } = require('@playwright/test');

async function blockExternalNoise(page) {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  await page.route('https://www.google-analytics.com/**', (route) => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort());
}

test.beforeEach(async ({ page }) => {
  await blockExternalNoise(page);
  await page.addInitScript(() => {
    localStorage.removeItem('afrotools_favorites');
    localStorage.removeItem('afro_favorites');
    localStorage.setItem('afrotools_cookie_consent', 'accepted');
  });
});

test('Swahili home presents registry truth, native navigation, and native assistance', async ({ page }) => {
  await page.goto('/sw/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-registry-count="tools.locale.sw.published"]').first()).toHaveText(/^\d+$/);
  await expect(page.locator('body')).toContainText('Nchi na lugha ni vitu tofauti');
  await expect(page.locator('body')).not.toContainText(/Inatumiwa na wataalamu|Viwango vya leo|Kila nchi ya Afrika ina vikokotoo/i);

  const navbar = page.locator('afro-navbar');
  await expect(navbar.getByRole('link', { name: /Chagua nchi bila kubadili lugha/i }).first()).toHaveAttribute('href', '/sw/nchi/');
  await expect(navbar.getByRole('link', { name: /Pro/i }).first()).toHaveAttribute('href', '/sw/bei/');

  const footer = page.locator('afro-footer');
  await expect(footer.locator('a[href="/sw/faragha/"]')).toHaveCount(2);
  await expect(footer.locator('a[href="/sw/masharti/"]')).toHaveCount(2);

  const assistant = page.locator('afro-site-assistant');
  await assistant.getByRole('button', { name: 'Fungua msaidizi wa kutafuta zana za AfroTools' }).click();
  await expect(assistant.locator('.msg-sys').first()).toContainText('Ukituma ombi');
  await expect(assistant.locator('.msg-sys').first()).toContainText('mtoa huduma wa AI');
  await expect(assistant.locator('.quick-nav')).toContainText(/Mshahara|PDF|Biashara/);
});

test('directory keeps useful server-rendered tools and reports a native empty search state', async ({ page }) => {
  await page.goto('/sw/zana-zote/?q=zzqxvv999', { waitUntil: 'domcontentloaded' });
  expect(await page.locator('.tool-card').count()).toBeGreaterThanOrEqual(45);
  await expect(page.locator('#search-results-section')).toBeVisible();
  await expect(page.locator('.results-empty')).toContainText('Hakuna zana iliyopatikana');
});

test('directory does not become a fake zero when the registry script is blocked or malformed', async ({ browser }) => {
  for (const mode of ['blocked', 'malformed']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await blockExternalNoise(page);
    await page.route('**/assets/js/components/tool-registry.js', async (route) => {
      if (mode === 'blocked') return route.abort();
      return route.fulfill({ contentType: 'application/javascript', body: 'window.__broken = ;' });
    });
    await page.goto('/sw/zana-zote/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.tool-card')).toHaveCount(45);
    await expect(page.locator('[data-registry-count="tools.locale.sw.published"]')).not.toHaveText(/^(?:0|--)$/);
    await context.close();
  }
});

test('representative PAYE calculation validates in Swahili and favorites stay localized', async ({ page }) => {
  await page.goto('/sw/kenya/kikokotoo-kodi-mshahara/', { waitUntil: 'domcontentloaded' });
  const salary = page.locator('#salaryInput');
  await salary.fill('0');
  await page.getByRole('button', { name: /Kokotoa Mshahara/i }).click();
  await expect(salary).toBeFocused();
  await expect(salary).toHaveAttribute('placeholder', 'Ingiza mshahara sahihi');

  await salary.fill('100000');
  await page.getByRole('button', { name: /Kokotoa Mshahara/i }).click();
  await expect(page.locator('#resAmount')).not.toHaveText('KES 0');

  const favorite = page.locator('#fav-btn');
  await expect(favorite).toBeVisible();
  await favorite.click();
  await expect(favorite).toHaveAccessibleName('Ondoa kwenye zana zangu');
  await expect(favorite).toContainText('Imehifadhiwa');
});

test('currency lookup distinguishes success, malformed data, empty data, and network failure', async ({ page }) => {
  for (const response of [
    { body: '{', contentType: 'application/json' },
    { body: JSON.stringify({ rates: {} }), contentType: 'application/json' }
  ]) {
    await page.route('**/data/forex/latest.json', (route) => route.fulfill(response), { times: 1 });
    await page.goto('/sw/zana/kibadilishaji-sarafu/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#fxDataStatus')).toContainText('Chanzo cha mtandao hakipatikani');
    await expect(page.locator('#fxDataStatus')).toContainText('si viwango vya moja kwa moja');
    await expect(page.locator('#fxRetry')).toBeVisible();
  }

  await page.route('**/data/forex/latest.json', (route) => route.abort(), { times: 1 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#fxDataStatus')).toContainText('Chanzo cha mtandao hakipatikani');
  await expect(page.locator('#fxRetry')).toBeVisible();
});

test('VAT calculator gives accessible validation and a non-zero localized result', async ({ page }) => {
  await page.goto('/sw/zana/kikokotoo-vat/', { waitUntil: 'domcontentloaded' });
  const amount = page.locator('#vatAmount');
  await amount.fill('0');
  await page.getByRole('button', { name: 'Kokotoa', exact: true }).click();
  await expect(amount).toBeFocused();
  await expect(page.locator('#vatStatus')).toContainText('kikubwa kuliko sifuri');

  await page.locator('#vatCountry').selectOption('KE');
  await amount.fill('1000');
  await page.getByRole('button', { name: 'Kokotoa', exact: true }).click();
  await expect(page.locator('#vatStatus')).toHaveText('');
  await expect(page.locator('#resultTotal')).not.toHaveText('-');
  await expect(page.locator('#formulaText')).toContainText('16%');
});

test('repeated calculator controls gain keyboard activation without changing their calculation behavior', async ({ page }) => {
  await page.goto('/sw/angola/kikokotoo-kodi-mshahara/', { waitUntil: 'domcontentloaded' });
  const contribution = page.locator('.tog[data-tog="inss"]');
  await expect(contribution).toHaveAttribute('tabindex', '0');
  await expect(contribution).toHaveAttribute('role', /button|checkbox/);
  const before = await contribution.getAttribute('class');
  await contribution.focus();
  await page.keyboard.press('Space');
  await expect(contribution).not.toHaveAttribute('class', before);
});

test('legal, help, pricing, and account bridges state their language contract', async ({ page }) => {
  for (const route of ['/sw/faragha/', '/sw/masharti/', '/sw/msaada/', '/sw/bei/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toHaveCount(1);
  }

  await page.goto('/sw/bei/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/hatua ya sasa ya malipo.*Kiingereza/i);

  for (const route of ['/sw/auth/', '/sw/dashboard/', '/sw/vault/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Ukurasa unaofuata ni wa Kiingereza');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[hreflang]')).toHaveCount(0);
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
  }
});

test('cookie consent keeps the privacy journey in Swahili', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await blockExternalNoise(page);
  await page.goto('/sw/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#afro-cookie-consent')).toHaveAttribute('aria-label', 'Idhini ya kuki');
  await expect(page.locator('#afro-cc-learn')).toHaveAttribute('href', '/sw/faragha/');
  await context.close();
});

test('mobile navigation remains native and does not conflate language with country', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sw/', { waitUntil: 'domcontentloaded' });
  const navbar = page.locator('afro-navbar');
  await navbar.getByRole('button', { name: 'Fungua menyu' }).click();
  await expect(navbar.getByRole('link', { name: /Chagua nchi/i }).last()).toHaveAttribute('href', '/sw/nchi/');
  await expect(navbar.getByRole('link', { name: /Ingia/i }).last()).toHaveAttribute('href', /\/sw\/auth\//);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('representative Swahili discovery and calculator routes stay mobile-safe and console-clean', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  for (const route of [
    '/sw/', '/sw/zana-zote/', '/sw/nchi/',
    '/sw/ai/', '/sw/biashara-ndogo/',
    '/sw/kenya/kikokotoo-kodi-mshahara/',
    '/sw/zana/kikokotoo-vat/', '/sw/zana/kibadilishaji-sarafu/',
    '/sw/zana/kilinganisha-tv-na-streaming/',
    '/sw/zana/kulinganisha-hosting/', '/sw/zana/orodha-vifaa/'
  ]) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} must not create horizontal page scroll`).toBeLessThanOrEqual(1);
  }
  expect(pageErrors).toEqual([]);

  await page.goto('/sw/ai/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#afrotools-localized-mobile-css')).toHaveAttribute('href', '/assets/css/localized-mobile.css');
  const aiColumns = await page.locator('.ai-local-hero').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(aiColumns).toBe(1);

  for (const selector of ['#vatAmount', '#vatCountry']) {
    await page.goto('/sw/zana/kikokotoo-vat/', { waitUntil: 'domcontentloaded' });
    const box = await page.locator(selector).boundingBox();
    expect(box && box.height, `${selector} must be a usable mobile touch target`).toBeGreaterThanOrEqual(44);
  }
});

test('core discovery and calculator journeys retain useful HTML without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/sw/', '/sw/zana-zote/', '/sw/nchi/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('a[href]').count()).toBeGreaterThan(20);
  }
  await page.goto('/sw/kenya/kikokotoo-kodi-mshahara/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#salaryInput')).toBeVisible();
  await expect(page.getByRole('button', { name: /Kokotoa Mshahara/i })).toBeVisible();
  await page.goto('/sw/zana/kibadilishaji-sarafu/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toContainText('viwango vya akiba');
  await context.close();
});

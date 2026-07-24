const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

function html(relativePath) {
  return fs.readFileSync(relativePath, 'utf8');
}

test('static and no-JS inventories remain exact and useful', async ({ browser }) => {
  const salarySource = html('salary-tax/index.html');
  const vatSource = html('vat-business-tax/index.html');
  const financeSource = html('finance/index.html');
  expect((salarySource.match(/<a class="hub-card"/g) || []).length).toBe(8);
  expect(salarySource).toContain('<div class="hero-stat-val">134</div>');
  expect(salarySource).toContain('<div class="hero-stat-val">54</div>');
  expect((vatSource.match(/<li><a href=/g) || []).length).toBeGreaterThanOrEqual(6);
  expect(vatSource).toContain('Six featured VAT and business-tax routes');
  expect(vatSource).toContain('complete 63-route registry needs JavaScript');
  expect(financeSource).toContain('<meta name="robots" content="noindex,follow"');
  expect(financeSource).toContain('rel="canonical" href="https://afrotools.com/salary-tax/"');
  expect(financeSource).not.toMatch(/â€¦|Ã/);

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/vat-business-tax/');
  await expect(page.getByRole('heading', { name: 'Six featured VAT and business-tax routes' })).toBeVisible();
  await expect(page.locator('noscript li a')).toHaveCount(6);
  await page.goto('/salary-tax/');
  await expect(page.locator('.hub-card')).toHaveCount(8);
  await context.close();
});

for (const hub of [
  { name: 'salary', path: '/salary-tax/', card: '.hub-card', expected: 8 },
  { name: 'vat', path: '/vat-business-tax/', card: '#tool-grid .tc', expected: 63 },
]) {
  test(`${hub.name} hub final 375px dark replay`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (request.method() !== 'GET') nonGet.push(request.method() + ' ' + request.url()); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(hub.path);
    await expect(page.locator(hub.card)).toHaveCount(hub.expected);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    const links = await page.locator(`${hub.card}`).evaluateAll((cards) => cards.map((card) => {
      const link = card.matches('a') ? card : card.querySelector('a');
      return link && link.getAttribute('href');
    }));
    expect(links.every((href) => href && href !== '#')).toBe(true);
    if (hub.name === 'vat') {
      const art = await page.locator(hub.card).evaluateAll((cards) => cards.map((card) => {
        const image = card.querySelector('img');
        const fallback = card.querySelector('.tc-thumb-ph,.tc-flag');
        return Boolean((image && image.getAttribute('src')) || (fallback && fallback.textContent.trim()));
      }));
      expect(art.every(Boolean)).toBe(true);
    }
    const navbar = page.locator('afro-navbar');
    await navbar.locator('.burger').click();
    await expect(navbar.locator('.mob-lang-opt[data-locale-target="fr"]')).toBeVisible();
    await expect(navbar.locator('.mob-lang-opt[data-locale-target="fr"]')).toContainText(/Fran/);
    expect(errors).toEqual([]);
    expect(nonGet).toEqual([]);
    await page.screenshot({ path: `artifacts/${hub.name}-hub-closeout-375-dark.png`, fullPage: true });
  });

  test(`${hub.name} hub 768px 200 percent reduced-motion replay`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.goto(hub.path);
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    await expect(page.locator(hub.card)).toHaveCount(hub.expected);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    const first = page.locator(hub.card).first();
    await first.focus();
    const focus = await first.evaluate((element) => getComputedStyle(element).outlineStyle !== 'none' || getComputedStyle(element).boxShadow !== 'none');
    expect(focus).toBe(true);
    const motion = await page.locator('body').evaluate(() => {
      const probe = document.querySelector('a,button,input');
      return probe ? getComputedStyle(probe).transitionDuration : '0s';
    });
    const firstDuration = motion.split(',')[0].trim();
    const seconds = firstDuration.endsWith('ms') ? parseFloat(firstDuration) / 1000 : parseFloat(firstDuration);
    expect(seconds).toBeLessThanOrEqual(0.001);
    await page.screenshot({ path: `artifacts/${hub.name}-hub-closeout-768-light-200.png`, fullPage: true });
  });
}

test('hub metadata, schema and privacy copy stay coherent', async ({ page }) => {
  for (const item of [
    { path: '/salary-tax/', canonical: 'https://afrotools.com/salary-tax/', schemas: ['CollectionPage', 'ItemList', 'BreadcrumbList', 'FAQPage'] },
    { path: '/vat-business-tax/', canonical: 'https://afrotools.com/vat-business-tax/', schemas: ['CollectionPage', 'BreadcrumbList', 'FAQPage'] },
  ]) {
    await page.goto(item.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
    for (const language of ['en', 'fr', 'sw', 'ha', 'x-default']) await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveCount(1);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((blocks) => blocks.map((block) => JSON.parse(block.textContent)['@type']));
    for (const type of item.schemas) expect(types).toContain(type);
  }
  await page.goto('/salary-tax/');
  await expect(page.getByText(/inputs stay in your browser unless/i)).toBeVisible();
  await page.goto('/vat-business-tax/');
  await expect(page.getByText(/No invoice lines, customer records or tax documents are saved/i).first()).toBeVisible();
});

test('legacy finance surface resolves to the canonical salary hub with and without JavaScript', async ({ browser, page }) => {
  await page.goto('/finance/');
  await expect(page).toHaveURL(/\/salary-tax\/$/);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await context.newPage();
  await noJsPage.goto('/finance/');
  await expect(noJsPage).toHaveURL(/\/salary-tax\/$/);
  await context.close();
});

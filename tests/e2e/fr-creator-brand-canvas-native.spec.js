const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const routes = [
  {
    path: '/tools/creator-brand/',
    canonical: 'https://afrotools.com/tools/creator-brand/',
    alternate: 'https://afrotools.com/fr/tools/kit-de-marque-pour-createur/',
  },
  {
    path: '/fr/tools/kit-de-marque-pour-createur/',
    canonical: 'https://afrotools.com/fr/tools/kit-de-marque-pour-createur/',
    alternate: 'https://afrotools.com/tools/creator-brand/',
  },
  {
    path: '/tools/creator-canvas/',
    canonical: 'https://afrotools.com/tools/creator-canvas/',
    alternate: 'https://afrotools.com/fr/tools/canevas-de-projet-pour-createur/',
  },
  {
    path: '/fr/tools/canevas-de-projet-pour-createur/',
    canonical: 'https://afrotools.com/fr/tools/canevas-de-projet-pour-createur/',
    alternate: 'https://afrotools.com/tools/creator-canvas/',
  },
];

for (const route of routes) {
  test(`${route.path} landing is mobile, themed and search-complete`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route.canonical);
    await expect(page.locator('link[rel="alternate"]').first()).toBeAttached();
    await expect(page.locator(`link[rel="alternate"][hreflang="${route.path.startsWith('/fr/') ? 'en' : 'fr'}"][href="${route.alternate}"]`)).toBeAttached();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /creator-(brand|canvas)\.webp$/);
    expect(await page.locator('script[type="application/ld+json"]').first().evaluate((node) => node.textContent)).toContain('WebApplication');
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    await page.evaluate(() => localStorage.setItem('aft_theme', 'dark'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // A 160 CSS-pixel viewport is the reflow equivalent of 200% zoom on 320px.
    await page.setViewportSize({ width: 160, height: 760 });
    const reflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
      overflow: [...document.querySelectorAll('body *')].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.right > window.innerWidth + 1 || rect.left < -1 || node.scrollWidth > node.clientWidth + 1;
      }).slice(0, 12).map((node) => ({
        tag: node.tagName,
        className: String(node.className || ''),
        text: String(node.textContent || '').trim().slice(0, 60),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      })),
    }));
    expect(reflow).toEqual({ scrollWidth: 160, width: 160, overflow: [] });
    expect(errors).toEqual([]);
  });
}

test('French CreatorBrand generates and reopens JSON, TXT and HTML outputs privately', async ({ page, context }) => {
  const sensitiveRequests = [];
  page.on('request', (request) => {
    if (/supabase|netlify\/functions|ai-advisor|\/api\//i.test(request.url())) sensitiveRequests.push(request.url());
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/fr/tools/kit-de-marque-pour-createur/app', { waitUntil: 'domcontentloaded' });
  await page.locator('[name="name"]').fill('Atelier Baobab');
  await page.locator('[name="primaryColor"]').fill('#000000');
  await page.locator('[name="textColor"]').fill('#ffffff');
  await page.getByRole('button', { name: 'Générer le kit' }).click();
  await expect(page.locator('[data-brand-hero] h2')).toHaveText('Atelier Baobab');
  await expect(page.locator('[data-contrast]')).toContainText('21:1');

  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger JSON' }).click();
  const jsonDownload = await jsonPromise;
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), 'utf8'));
  expect(json.profile.name).toBe('Atelier Baobab');
  expect(json.colors.primaryTextContrast).toBe(21);

  const txtPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger TXT' }).click();
  const txtDownload = await txtPromise;
  expect(await fs.readFile(await txtDownload.path(), 'utf8')).toContain('KIT DE MARQUE');

  const htmlPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le guide HTML' }).click();
  const htmlDownload = await htmlPromise;
  const html = await fs.readFile(await htmlDownload.path(), 'utf8');
  expect(html).toContain('<!doctype html>');
  expect(html).toContain('Atelier Baobab');

  await page.getByRole('button', { name: 'Copier le résumé' }).click();
  await expect(page.locator('[data-status]')).toContainText('Résumé copié');
  expect(sensitiveRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('French CreatorCanvas exports a real PNG at selected dimensions plus parsed JSON and TXT', async ({ page, context }) => {
  const sensitiveRequests = [];
  page.on('request', (request) => {
    if (/supabase|netlify\/functions|ai-advisor|\/api\//i.test(request.url())) sensitiveRequests.push(request.url());
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/fr/tools/canevas-de-projet-pour-createur/app', { waitUntil: 'domcontentloaded' });
  await page.locator('[name="format"]').selectOption('yt-thumb');
  await page.locator('[name="title"]').fill('CRÉER ENSEMBLE');
  await page.getByRole('button', { name: 'Générer le visuel' }).click();
  await expect(page.locator('[data-dimensions]')).toHaveText('1280×720');
  expect(await page.locator('canvas').evaluate((canvas) => [canvas.width, canvas.height])).toEqual([1280, 720]);

  const pngPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger PNG' }).click();
  const pngDownload = await pngPromise;
  const png = await fs.readFile(await pngDownload.path());
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(1280);
  expect(png.readUInt32BE(20)).toBe(720);

  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger JSON' }).click();
  const jsonDownload = await jsonPromise;
  const json = JSON.parse(await fs.readFile(await jsonDownload.path(), 'utf8'));
  expect([json.width, json.height, json.title]).toEqual([1280, 720, 'CRÉER ENSEMBLE']);

  const txtPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le brief TXT' }).click();
  const txtDownload = await txtPromise;
  expect(await fs.readFile(await txtDownload.path(), 'utf8')).toContain('1280×720');

  await page.getByRole('button', { name: 'Copier le brief' }).click();
  await expect(page.locator('[data-status]')).toContainText('Brief copié');
  expect(sensitiveRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('both French workspaces expose keyboard-visible primary actions and reciprocal app metadata', async ({ page }) => {
  for (const route of [
    '/fr/tools/kit-de-marque-pour-createur/app',
    '/fr/tools/canevas-de-projet-pour-createur/app',
  ]) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(route + '$'));
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toBeAttached();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /creator-(brand|canvas)\.webp$/);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(await page.evaluate(() => {
      const node = document.querySelector(':focus');
      return !!node && getComputedStyle(node).outlineStyle !== 'none';
    })).toBe(true);
  }
});

test('all English and French workspaces reflow at 320px and 200% equivalent with labels and clean consoles', async ({ page }) => {
  for (const route of [
    '/tools/creator-brand/app',
    '/fr/tools/kit-de-marque-pour-createur/app',
    '/tools/creator-canvas/app',
    '/fr/tools/canevas-de-projet-pour-createur/app',
  ]) {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form')).toBeVisible();
    expect(await page.locator('input, select, textarea').count()).toBeGreaterThan(0);
    expect(await page.locator('label input, label select, label textarea').count()).toBe(
      await page.locator('input, select, textarea').count()
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.evaluate(() => localStorage.setItem('aft_theme', 'dark'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.setViewportSize({ width: 160, height: 780 });
    const pageReflow = await page.evaluate(() => ({
      ok: document.documentElement.scrollWidth <= innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      width: innerWidth,
      overflow: [...document.querySelectorAll('body *')].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.right > innerWidth + 1 || rect.left < -1;
      }).slice(0, 8).map((node) => ({
        tag: node.tagName,
        className: String(node.className || ''),
        text: String(node.textContent || '').trim().slice(0, 50),
        right: Math.round(node.getBoundingClientRect().right),
        width: Math.round(node.getBoundingClientRect().width),
      })),
    }));
    expect(pageReflow, route).toEqual({ ok: true, scrollWidth: 160, width: 160, overflow: [] });
    expect(errors).toEqual([]);
  }
});

test('English workspaces execute the same shared engines as French', async ({ page }) => {
  await page.goto('/tools/creator-brand/app', { waitUntil: 'domcontentloaded' });
  await page.locator('[name="name"]').fill('Ubuntu Works');
  await page.getByRole('button', { name: 'Generate brand kit' }).click();
  await expect(page.locator('[data-brand-hero] h2')).toHaveText('Ubuntu Works');
  await expect(page.locator('[data-status]')).toContainText('generated locally');

  await page.goto('/tools/creator-canvas/app', { waitUntil: 'domcontentloaded' });
  await page.locator('[name="format"]').selectOption('x-post');
  await page.getByRole('button', { name: 'Generate graphic' }).click();
  await expect(page.locator('[data-dimensions]')).toHaveText('1200×675');
  expect(await page.locator('canvas').evaluate((node) => [node.width, node.height])).toEqual([1200, 675]);
});

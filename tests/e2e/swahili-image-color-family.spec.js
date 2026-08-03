const { test, expect } = require('@playwright/test');

const routes = {
  picker: ['/tools/color-picker/', '/sw/zana/kichagua-rangi/'],
  palettes: ['/tools/colour-palette/', '/sw/zana/paleti-ya-rangi/']
};

async function downloadText(download) {
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString('utf8');
  return text;
}

function observe(page) {
  const proof = { errors: [], writes: [], data: [], badResources: [] };
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.badResources.push(`${response.status()} ${response.url()}`); });
  return proof;
}

async function assertLocalHealthy(proof) {
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
}

test('color picker preserves exact conversion, invalid-state, contrast, gradient and export contracts in Swahili', async ({ page }) => {
  for (const route of routes.picker) {
    const proof = observe(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.locator('#hexValue').fill('#336699');
    await expect(page.locator('#rgbValue')).toHaveValue('rgb(51, 102, 153)');
    await expect(page.locator('#hslValue')).toHaveValue('hsl(210, 50%, 40%)');
    await expect(page.locator('#cmykValue')).toHaveValue('cmyk(67%, 33%, 0%, 40%)');
    await expect(page.locator('#oklchValue')).toHaveValue('oklch(0.4993 0.1046 254.02)');
    await expect(page.locator('.palette-color')).toHaveCount(5);
    expect(await page.locator('.palette-color').evaluateAll(nodes => nodes.map(n => n.title))).toEqual(['#1A334D','#336699','#336699','#538CC6','#8CB3D9']);

    await page.locator('#gradColor1').fill('#112233');
    await page.locator('#gradColor2').fill('#AABBCC');
    await page.locator('#gradDir').selectOption('to bottom right');
    await expect(page.locator('#gradCode')).toHaveValue('background: linear-gradient(to bottom right, #112233, #aabbcc);');
    await page.locator('#contrastFg').fill('#000000');
    await page.locator('#contrastBg').fill('#ffffff');
    await expect(page.locator('#contrastRatio')).toHaveText('21.00:1');
    await expect(page.locator('#contrastBadges .c-pass')).toHaveCount(4);

    const cssDownload = page.waitForEvent('download');
    await page.locator('#exportCssVars').click();
    const css = await downloadText(await cssDownload);
    expect((css.match(/--palette-\d+:/g) || []).length).toBe(5);
    expect(css).toContain('--palette-300: #336699;');
    const jsDownload = page.waitForEvent('download');
    await page.locator('#exportTwConfig').click();
    const js = await downloadText(await jsDownload);
    expect(js).toMatch(/^\/\/ tailwind\.config\.js/);
    expect((js.match(/"\d+": "#[0-9A-F]{6}"/g) || []).length).toBe(5);

    await page.locator('#hexValue').fill('#12');
    await expect(page.locator('#hexValue')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#rgbValue')).toHaveValue('');
    await expect(page.locator('.palette-color')).toHaveCount(0);
    await expect(page.locator('#exportCssVars')).toBeDisabled();
    await expect(page.locator('#colorStatus')).toContainText(route.startsWith('/sw/') ? 'tarakimu sita' : 'six-digit');
    // EyeDropper is an optional real-device capability. Its result is deliberately
    // excluded from this candidate receipt even when the local Chromium exposes it.
    await expect(page.locator('#eyedropperBtn')).toHaveAttribute('type', 'button');
    await assertLocalHealthy(proof);
  }
});

test('palette owner keeps category, keyboard-copy and real CSS/JSON downloads identical across locales', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  let englishCount = 0;
  for (const route of routes.palettes) {
    const proof = observe(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.palette-card').first()).toBeVisible();
    const count = await page.locator('.palette-card').count();
    if (!englishCount) englishCount = count;
    expect(count).toBe(45);
    expect(count).toBe(englishCount);
    const textileLabel = route.startsWith('/sw/') ? 'Vitambaa' : 'Textiles';
    await page.getByRole('button', { name: textileLabel, exact: true }).click();
    await expect(page.locator('.palette-card')).toHaveCount(10);
    await page.locator('.hex-tag').first().focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('#D4A017');

    const perDownload = page.waitForEvent('download');
    await page.locator('.palette-info button').first().click();
    const perCss = await downloadText(await perDownload);
    expect(perCss).toContain(':root {');
    expect((perCss.match(/--kente-gold-\d:/g) || []).length).toBe(5);

    const jsonDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: route.startsWith('/sw/') ? 'Pakua kama JSON' : 'Export as JSON' }).click();
    const palettes = JSON.parse(await downloadText(await jsonDownload));
    expect(palettes).toHaveLength(45);
    expect(palettes[0]).toEqual({ name: 'Kente Gold', origin: 'Ghana — Ashanti Kente Cloth', cat: 'Textiles', colors: ['#D4A017','#8B6914','#2E8B57','#1C1C1C','#FFFDD0'] });

    const allCssDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: route.startsWith('/sw/') ? 'Pakua Zote kama CSS' : 'Export All as CSS' }).click();
    const allCss = await downloadText(await allCssDownload);
    expect((allCss.match(/\.kente-gold-\d \{/g) || []).length).toBe(5);
    expect((allCss.match(/background: #[0-9A-F]{6}/g) || []).length).toBe(225);
    await assertLocalHealthy(proof);
  }
});

test('both Swahili owners reflow at 320/375 and 200 percent, support themes, focus and computed contrast', async ({ page }) => {
  for (const route of [...routes.picker, ...routes.palettes].filter(r => r.startsWith('/sw/'))) {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const mobileOverflow = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, offenders: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 5).map(node => `${node.tagName}.${node.className}`) }));
      expect(mobileOverflow.overflow, `${route} at ${width}px: ${JSON.stringify(mobileOverflow.offenders)}`).toBeLessThanOrEqual(1);
    }
    // WCAG 200% reflow: a 1280px browser viewport becomes a 640 CSS-pixel
    // layout viewport at 200% browser zoom. CSS `zoom` is intentionally not
    // used because it scales fixed consent UI without performing browser reflow.
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const key = route.includes('kichagua') ? '.card-title' : '.palette-info .name';
    const colors = await page.locator(key).first().evaluate(node => {
      const fg = getComputedStyle(node).color;
      let parent = node;
      let bg = 'rgba(0, 0, 0, 0)';
      while (parent && bg.endsWith(', 0)')) { bg = getComputedStyle(parent).backgroundColor; parent = parent.parentElement; }
      return { fg, bg };
    });
    const ratio = await page.evaluate(({ fg, bg }) => {
      const rgb = value => (value.match(/[\d.]+/g) || []).slice(0,3).map(Number);
      const lum = value => { const [r,g,b]=rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b; };
      const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    }, colors);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    const first = page.locator('button:visible, input:visible, [role="button"]:visible').first();
    await first.focus();
    await expect(first).toBeFocused();
    const size = await first.evaluate(node => ({ w: node.getBoundingClientRect().width, h: node.getBoundingClientRect().height }));
    expect(size.h).toBeGreaterThanOrEqual(36);
  }
});

test('localized SEO, reciprocal hreflang, schema, artwork and privacy boundaries are exact', async ({ page }) => {
  for (const route of [...routes.picker, ...routes.palettes].filter(r => r.startsWith('/sw/'))) {
    const proof = observe(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('meta[name="afrotools-source-owner"]')).toHaveAttribute('content', 'scripts/build-sw-image-color-family.js');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.map(JSON.parse).some(value => JSON.stringify(value).includes('"inLanguage":"sw"'))).toBe(true);
    expect(await page.locator('iframe, input[type="file"]').count()).toBe(0);
    expect(await page.content()).not.toContain('Fungua zana kamili ya Kiingereza');
    await assertLocalHealthy(proof);
  }
});

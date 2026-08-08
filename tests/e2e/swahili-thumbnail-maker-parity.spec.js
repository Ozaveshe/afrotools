const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

test.setTimeout(240000);

async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function dimensions(value) {
  if (value.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return { format: 'png', width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < value.length) {
      if (value[offset] !== 0xff) { offset += 1; continue; }
      const marker = value[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { format: 'jpg', width: value.readUInt16BE(offset + 7), height: value.readUInt16BE(offset + 5) };
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      offset += 2 + value.readUInt16BE(offset + 2);
    }
  }
  if (value.subarray(0, 4).toString('ascii') === 'RIFF' && value.subarray(8, 12).toString('ascii') === 'WEBP') {
    const codec = value.subarray(12, 16).toString('ascii');
    if (codec === 'VP8X') return { format: 'webp', width: value.readUIntLE(24, 3) + 1, height: value.readUIntLE(27, 3) + 1 };
    if (codec === 'VP8 ') return { format: 'webp', width: value.readUInt16LE(26) & 0x3fff, height: value.readUInt16LE(28) & 0x3fff };
    if (codec === 'VP8L') { const bits = value.readUInt32LE(21); return { format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  }
  throw new Error(`Unsupported image ${value.subarray(0, 16).toString('hex')}`);
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

async function setField(page, selector, value) {
  const field = page.locator(selector);
  await field.fill(value);
  await field.dispatchEvent('input');
}

async function configureExact(page, size = 'youtube', format = 'image/png') {
  await setField(page, '#thumbVideoIdea', 'Synthetic parity fixture');
  await setField(page, '#thumbHeadline', 'DETERMINISTIC THUMBNAIL');
  await setField(page, '#thumbSubline', 'Synthetic content only');
  await setField(page, '#thumbBadge', 'TEST');
  await setField(page, '#thumbChannel', '@AfroToolsTest');
  await setField(page, '#thumbSuffix', 'parity');
  await page.locator('#thumbSize').selectOption(size);
  await page.locator('#thumbLayout').selectOption('headline-bar');
  await page.locator('#thumbFont').selectOption('mono');
  await page.locator('#thumbBackgroundStyle').selectOption('solid');
  await page.locator('#thumbPrimary').evaluate(node => { node.value = '#0f5ea8'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#thumbAccent').evaluate(node => { node.value = '#f6b73c'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#thumbTextColor').evaluate(node => { node.value = '#ffffff'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#thumbFormat').selectOption(format);
  await page.locator('#thumbGuides').uncheck();
}

async function exactPng(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.thumbnailStudio))).toBe(true);
  await configureExact(page);
  const event = page.waitForEvent('download');
  await page.locator('#thumbDownload').click();
  return buffer(await event);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('English and Swahili use the exact shared renderer and produce byte-identical controlled PNG', async ({ page }) => {
  const english = await exactPng(page, '/tools/thumbnail-maker/');
  const swahili = await exactPng(page, '/sw/zana/kitengeneza-thumbnail/');
  expect(dimensions(english)).toEqual({ format: 'png', width: 1280, height: 720 });
  expect(dimensions(swahili)).toEqual({ format: 'png', width: 1280, height: 720 });
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili studio reopens every size and format plus all A/B exports', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const proof = observe(page);
  await page.goto('/sw/zana/kitengeneza-thumbnail/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.thumbnailStudio))).toBe(true);
  await expect(page.locator('#thumbHeadline')).toHaveValue('SIKUTARAJIA HILI');
  await configureExact(page);

  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="96" height="64" fill="${color}"/><circle cx="48" cy="32" r="20" fill="#fff"/></svg>`;
  await page.locator('#thumbBackgroundInput').setInputFiles({ name: 'background.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg('#2463a8')) });
  await expect(page.locator('#thumbBackgroundName')).toHaveText('background.svg');
  await page.locator('#thumbSubjectInput').setInputFiles({ name: 'subject.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg('#198754')) });
  await expect(page.locator('#thumbSubjectName')).toHaveText('subject.svg');
  await page.locator('#thumbLogoInput').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg('#b42318')) });
  await expect(page.locator('#thumbLogoName')).toHaveText('logo.svg');
  const uploadedEvent = page.waitForEvent('download');
  await page.locator('#thumbDownload').click();
  expect(dimensions(await buffer(await uploadedEvent))).toEqual({ format: 'png', width: 1280, height: 720 });

  await page.locator('#thumbReset').click();
  await expect(page.locator('#thumbHeadline')).toHaveValue('SIKUTARAJIA HILI');
  await expect(page.locator('#thumbBackgroundName')).toHaveText('Chagua picha');
  await expect(page.locator('#thumbSubjectName')).toHaveText('Chagua mhusika');
  await expect(page.locator('#thumbLogoName')).toHaveText('Chagua logo');
  await configureExact(page);
  const sizes = new Map([
    ['youtube4k', [3840, 2160]], ['youtube', [1280, 720]], ['fullhd', [1920, 1080]], ['shorts', [1080, 1920]], ['square', [1080, 1080]]
  ]);
  const formats = [['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']];
  for (const [size, [width, height]] of sizes) {
    for (const [mime, extension] of formats) {
      await page.locator('#thumbSize').selectOption(size);
      await page.locator('#thumbFormat').selectOption(mime);
      const event = page.waitForEvent('download');
      await page.locator('#thumbDownload').click();
      const download = await event;
      expect(download.suggestedFilename()).toContain(`thumbnail-${size}-`);
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`));
      expect(dimensions(await buffer(download))).toEqual({ format: extension, width, height });
    }
  }

  await page.locator('#thumbSize').selectOption('youtube');
  await page.locator('#thumbFormat').selectOption('image/png');
  await setField(page, '#thumbVideoIdea', 'Biashara ndogo mtandaoni');
  await page.locator('#thumbGenerateHooks').click();
  await expect(page.locator('#thumbHookList button')).toHaveCount(5);
  await expect(page.locator('#thumbHookList')).toContainText('NILIJARIBU BIASHARA NDOGO MTANDAONI');
  const variants = [];
  page.on('download', download => variants.push(download));
  await page.locator('#thumbDownloadAB').click();
  await expect.poll(() => variants.length, { timeout: 30000 }).toBe(3);
  for (const [index, download] of variants.entries()) {
    expect(download.suggestedFilename()).toContain(`-v${index + 1}.png`);
    expect(dimensions(await buffer(download))).toEqual({ format: 'png', width: 1280, height: 720 });
  }

  await page.locator('#thumbCopyBrief').click();
  const brief = await page.evaluate(() => navigator.clipboard.readText());
  expect(brief).toContain('Muhtasari wa upakiaji wa thumbnail');
  expect(brief).toContain('Canvas: YouTube ndogo (1280 x 720)');
  expect(brief).toContain('Faili: PNG kwa ubora wa 90%');
  await page.locator('#thumbCopyChecklist').click();
  const checklist = await page.evaluate(() => navigator.clipboard.readText());
  expect(checklist).toContain('Orodha ya ukaguzi wa thumbnail ya YouTube');
  expect(checklist).toContain('Alama ya utayari:');
  expect(checklist).toContain('Kona ya muda imekaguliwa: hapana');
  await page.locator('#thumbCopyLink').click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/sw\/zana\/kitengeneza-thumbnail\/#design=/);
  const encoded = new URL(link).hash.replace(/^#design=/, '');
  let base64 = decodeURIComponent(encoded).replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const design = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  expect(design.backgroundSrc).toBe(''); expect(design.subjectSrc).toBe(''); expect(design.logoSrc).toBe('');

  await page.locator('#thumbSaveBrand').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afro_thumbnail_brand_v1')))).toMatchObject({ channel: '@AfroToolsTest' });
  await page.locator('#thumbBackgroundInput').setInputFiles({ name: 'not-an-image.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic invalid input') });
  await expect(page.locator('#thumbStatus')).toContainText('Chagua faili ya picha');
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili route reflows and preserves themes, keyboard, accessibility, privacy and SEO', async ({ page }) => {
  const proof = observe(page);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kitengeneza-thumbnail/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => ({ delta: document.documentElement.scrollWidth - document.documentElement.clientWidth, nodes: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 8).map(node => `${node.tagName}.${node.className}#${node.id}:${Math.round(node.getBoundingClientRect().right)}`) }));
    expect(overflow.delta, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 750, height: 900 });
  await page.goto('/sw/zana/kitengeneza-thumbnail/', { waitUntil: 'domcontentloaded' });
  const zoomOverflow = await page.evaluate(() => { document.body.style.zoom = '2'; return { delta: document.documentElement.scrollWidth - document.documentElement.clientWidth, viewport: document.documentElement.clientWidth }; });
  expect(zoomOverflow.delta, JSON.stringify(zoomOverflow)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; });

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/thumbnail-maker/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/createur-miniatures/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/thumbnail-maker.webp');
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).some(value => value.inLanguage === 'sw'))).toBe(true);
  await expect(page.locator('#thumbStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#thumbVideoIdea')).toHaveAttribute('aria-label', 'Wazo la video');
  await expect(page.locator('label[for="thumbSubjectInput"]')).toContainText('Picha ya mhusika');
  await page.locator('#thumbGenerateHooks').focus();
  await expect(page.locator('#thumbGenerateHooks')).toBeFocused();
  const focusStyle = await page.locator('#thumbGenerateHooks').evaluate(node => ({ outline: getComputedStyle(node).outlineStyle, shadow: getComputedStyle(node).boxShadow }));
  expect(focusStyle.outline !== 'none' || focusStyle.shadow !== 'none').toBe(true);
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  expect(await page.locator('iframe').count()).toBe(0);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

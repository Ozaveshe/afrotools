const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test.describe(`French Base64 ${width}px`, () => {
    let errors;
    test.beforeEach(async ({ page }) => {
      errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        window.__base64Copied = [];
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async text => { window.__base64Copied.push(text); } }
        });
      });
      await page.goto('/fr/tools/encodeur-base64/');
    });
    test.afterEach(async ({ page }) => {
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });

    test('Unicode and whitespace round-trip exactly through copy and downloaded TXT', async ({ page }) => {
      const samples = ['  Ẹ káàárọ̀ / Sannu / مرحبا / 🌍\n\t', ' ', '\n\t  '];
      for (const original of samples) {
        await page.locator('#base64Mode').selectOption('encode');
        await page.locator('#base64Input').fill(original);
        await page.locator('#convertBase64Btn').click();
        const encoded = Buffer.from(original, 'utf8').toString('base64');
        await expect(page.locator('#base64Output')).toHaveValue(encoded);
        await page.locator('#base64Mode').selectOption('decode');
        await page.locator('#base64Input').fill(encoded);
        await page.locator('#convertBase64Btn').click();
        await expect(page.locator('#base64Output')).toHaveValue(original);
        await page.locator('#copyBase64Btn').click();
        expect(await page.evaluate(() => window.__base64Copied.at(-1))).toBe(original);
        const downloadPromise = page.waitForEvent('download');
        await page.locator('#downloadBase64Btn').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('resultat-base64.txt');
        expect(await fs.readFile(await download.path(), 'utf8')).toBe(original);
        await page.locator('#swapBase64Btn').click();
        await expect(page.locator('#base64Input')).toHaveValue(original);
        await expect(page.locator('#base64Output')).toHaveValue('');
      }
    });

    test('invalid or empty conversion clears previous output before copy or download', async ({ page }) => {
      await page.locator('#base64Mode').selectOption('decode');
      await page.locator('#base64Input').fill('cHJldmlvdXM=');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('previous');
      await page.locator('#base64Input').fill('%%%invalid%%%');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Status')).toContainText('invalide');
      await page.locator('#copyBase64Btn').click();
      expect(await page.evaluate(() => window.__base64Copied)).toEqual([]);
      await expect(page.locator('#base64Status')).toContainText('Aucun résultat');
      await page.locator('#downloadBase64Btn').click();
      await expect(page.locator('#base64Status')).toContainText('Aucun résultat');
      await page.locator('#base64Mode').selectOption('encode');
      await page.locator('#base64Input').fill('current');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).not.toHaveValue('');
      await page.locator('#base64Input').fill('');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Input')).toBeFocused();
    });

    test('URL-safe and file encoding preserve exact bytes and reject a missing file', async ({ page }) => {
      const text = '??🌍\n';
      await page.locator('#base64Input').fill(text);
      await page.locator('#urlSafe').check();
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue(Buffer.from(text).toString('base64url'));
      await page.locator('#urlSafe').uncheck();
      await page.locator('#base64Mode').selectOption('file');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      const bytes = Buffer.from([0, 9, 10, 32, 127, 128, 255]);
      await page.locator('#base64File').setInputFiles({ name: 'synthetic.bin', mimeType: 'application/octet-stream', buffer: bytes });
      await page.locator('#dataPrefix').check();
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue(`data:application/octet-stream;base64,${bytes.toString('base64')}`);
      await page.locator('#clearBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Input')).toHaveValue('');
    });
  });
}

// These free-utility repairs share the existing native artifact gate. Original
// French conversion/export cases above remain unchanged.
for (const width of [375, 1280]) {
  test(`Base64 native keyboard file and image selection retains byte exports at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/base64/');
    await page.getByRole('button', { name: 'File Upload', exact: true }).click();
    await page.getByRole('button', { name: 'File Upload', exact: true }).press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('#file-drop-zone')).toBeFocused();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const chooser = await chooserPromise;
    const text = 'foobar\nMọ́lá 😀';
    await chooser.setFiles({ name: 'synthetic.txt', mimeType: 'text/plain', buffer: Buffer.from(text) });
    await expect(page.locator('#file-output')).toHaveValue(Buffer.from(text).toString('base64'));
    const encodedDownload = page.waitForEvent('download');
    await page.locator('#file-download-txt').click();
    expect(await fs.readFile(await (await encodedDownload).path(), 'utf8')).toBe(Buffer.from(text).toString('base64'));

    await page.getByRole('button', { name: 'Image to Base64', exact: true }).click();
    await page.getByRole('button', { name: 'Image to Base64', exact: true }).press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('#img-drop-zone')).toBeFocused();
    const imageChooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Space');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>';
    await (await imageChooser).setFiles({ name: 'synthetic.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
    await expect(page.locator('#img-output')).toHaveValue('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
    await expect(page.locator('#img-preview img')).toBeVisible();
    expect(await page.locator('#img-preview img').evaluate(image => image.naturalWidth)).toBe(1);

    await page.getByRole('button', { name: 'Decode File', exact: true }).click();
    await page.locator('#decode-input').fill(Buffer.from(text).toString('base64'));
    const decodedDownload = page.waitForEvent('download');
    await page.locator('#decode-download-btn').click();
    expect(await fs.readFile(await (await decodedDownload).path(), 'utf8')).toBe(text);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const route of ['/tools/url-encoder/', '/sw/zana/kusimba-url/']) {
  test(`URI and form rows keep independent plus and WHATWG semantics: ${route}`, async ({ page }) => {
    await page.goto(route);
    for (const value of ["!'()*~", 'Mọ́lá 😀 /?&=+%', 'a+b c']) {
      await page.locator('#componentInput').fill(value);
      await expect(page.locator('#encodeUriOut')).toHaveText(encodeURI(value));
      await expect(page.locator('#encodeComponentOut')).toHaveText(encodeURIComponent(value));
      await expect(page.locator('#formOut')).toHaveText(new URLSearchParams({ value }).toString().slice(6));
    }
    await page.locator('#componentInput').fill('a+b%20c%2B');
    await expect(page.locator('#decodeOut')).toHaveText('a+b c+');
    await expect(page.locator('#formDecodeOut')).toHaveText('a b c+');
    await page.locator('#componentInput').fill('%E0%A4%A');
    await expect(page.locator('#decodeOut')).toContainText(route.startsWith('/sw/') ? 'Hitilafu' : 'Error');
    await expect(page.locator('#formDecodeOut')).toContainText(route.startsWith('/sw/') ? 'Hitilafu' : 'Error');
    await page.locator('#componentInput').fill('a+b%20c');
    await expect(page.locator('#decodeOut')).toHaveText('a+b c');
    await expect(page.locator('#formDecodeOut')).toHaveText('a b c');
  });
}

async function visibleTextContrast(locator) {
  return locator.evaluate(element => {
    const rgba = color => color.match(/[\d.]+/g).map(Number);
    let background = [0, 0, 0], alpha = 0;
    for (let node = element; node && alpha < 1; node = node.parentElement) {
      const color = rgba(getComputedStyle(node).backgroundColor);
      const opacity = color.length === 4 ? color[3] : 1;
      const contribution = (1 - alpha) * opacity;
      background = background.map((value, index) => value + color[index] * contribution);
      alpha += contribution;
    }
    if (alpha < 1) background = background.map(value => value + 255 * (1 - alpha));
    const luminance = color => color.slice(0, 3).map(value => value / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = luminance(rgba(getComputedStyle(element).color));
    const backdrop = luminance(background);
    return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
  });
}

for (const width of [375, 1280]) for (const theme of ['light', 'dark']) {
  test(`Free encoding tool headings/actions remain readable ${theme} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/tools/base64/', '/tools/url-encoder/']) {
      await page.goto(route);
      await page.waitForFunction(() => typeof window.AfroTools?.darkMode?.set === 'function');
      await page.evaluate(mode => window.AfroTools.darkMode.set(mode), theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const selectors = route.includes('base64')
        ? ['#text-copy-output', '#text-swap', '#text-clear', '#inspector-refresh']
        : ['.panel-title', '#copyCleanUrl', '#saveHistory'];
      for (const selector of selectors) {
        const control = page.locator(selector).first();
        await expect(control).toBeVisible();
        expect(await visibleTextContrast(control), route + ' ' + selector).toBeGreaterThanOrEqual(4.5);
        if (selector.startsWith('#')) {
          await control.focus();
          await expect(control).toBeFocused();
          expect(await visibleTextContrast(control)).toBeGreaterThanOrEqual(4.5);
          await control.hover();
          expect(await visibleTextContrast(control)).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });
}

// Observe every frame rather than waiting for a readable settled theme. A manual
// theme change must keep enabled Copy controls readable while ancestors animate.
async function copyThemeBoundary(page, theme) {
  return page.evaluate(async mode => {
    const controls = ['#text-copy-input', '#text-copy-output', '#text-swap', '#text-clear', '#inspector-refresh']
      .map(selector => document.querySelector(selector)).filter(Boolean);
    const rgba = color => color.match(/[\d.]+/g).map(Number);
    const luminance = color => color.slice(0, 3).map(value => value / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const nodes = new Set();
    for (const control of controls) for (let node = control; node; node = node.parentElement) nodes.add(node);
    const sample = stage => ({ stage, theme: document.documentElement.dataset.theme, controls: controls.map(element => {
      const style = getComputedStyle(element);
      let background = [0, 0, 0], alpha = 0;
      for (let node = element; node && alpha < 1; node = node.parentElement) {
        const color = rgba(getComputedStyle(node).backgroundColor), opacity = color.length === 4 ? color[3] : 1;
        const contribution = (1 - alpha) * opacity;
        background = background.map((value, index) => value + color[index] * contribution);
        alpha += contribution;
      }
      if (alpha < 1) background = background.map(value => value + 255 * (1 - alpha));
      const foreground = luminance(rgba(style.color)), backdrop = luminance(background);
      return { id: element.id, disabled: element.disabled, opacity: style.opacity, color: style.color,
        background: style.backgroundColor, ratio: (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05) };
    }) });
    window.AfroTools.darkMode.set(mode);
    const samples = [sample('immediate')];
    const active = () => [...nodes].some(node => node.getAnimations().some(animation =>
      animation.playState !== 'finished' && animation.playState !== 'idle' &&
      /color|background|border|box-shadow/.test(animation.transitionProperty || '')));
    for (let frame = 0; frame < 120; frame++) {
      await new Promise(requestAnimationFrame);
      samples.push(sample(active() ? 'intermediate' : 'end'));
      if (!active()) return { settled: true, samples };
    }
    return { settled: false, samples };
  }, theme);
}

for (const width of [375, 1280]) {
  test(`Enabled Base64 Copy stays readable throughout both manual theme changes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/base64/');
    await page.waitForFunction(() => typeof window.AfroTools?.darkMode?.set === 'function');
    await page.locator('#text-input').fill('Mọ́lá 😀');
    await expect(page.locator('#text-output')).toHaveValue(Buffer.from('Mọ́lá 😀').toString('base64'));
    const checkBothDirections = async state => {
      for (const theme of ['light', 'dark', 'light']) {
        const result = await copyThemeBoundary(page, theme);
        expect(result.settled, state + ' theme transitions must terminate').toBe(true);
        expect(result.samples[0].stage).toBe('immediate');
        expect(result.samples.at(-1).stage).toBe('end');
        for (const sample of result.samples) {
          expect(sample.theme).toBe(theme);
          expect(sample.controls.map(control => control.id)).toEqual([
            'text-copy-input', 'text-copy-output', 'text-swap', 'text-clear', 'inspector-refresh'
          ]);
          for (const control of sample.controls) {
            expect(control.disabled, state + ' ' + control.id).toBe(false);
            expect(Number(control.opacity), state + ' ' + control.id).toBe(1);
            expect(control.ratio, JSON.stringify({ state, theme, ...sample, control })).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    };
    await checkBothDirections('encoded');
    await page.locator('#text-copy-output').hover();
    await checkBothDirections('hover');
    await page.locator('#text-copy-output').focus();
    await expect(page.locator('#text-copy-output')).toBeFocused();
    await checkBothDirections('focus');
    await page.locator('#decode-btn').click();
    await page.locator('#text-input').fill('%%%');
    await expect(page.locator('#text-output')).toHaveValue(/^Error:/);
    await checkBothDirections('invalid decode');
    await page.locator('#text-clear').click();
    await expect(page.locator('#text-input')).toHaveValue('');
    await expect(page.locator('#text-output')).toHaveValue('');
    await checkBothDirections('reset');
  });
}

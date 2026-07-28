const { test, expect } = require('@playwright/test');

const apps = [
  {
    name: 'swahili',
    route: '/fr/tools/traducteur-swahili/',
    input: '#sourceText',
    value: 'Merci',
    submit: '#swForm button[type="submit"]',
    output: '#swOutput',
    oracle: /asante/i,
    download: '#downloadSw'
  },
  {
    name: 'yoruba',
    route: '/fr/tools/traducteur-yoruba/',
    input: '#sourceText',
    value: 'Merci',
    submit: '#yorubaForm button[type="submit"]',
    output: '#result',
    oracle: /Ẹ ṣéun/,
    download: '#downloadBtn'
  },
  {
    name: 'haoussa',
    route: '/fr/tools/traducteur-haoussa/',
    input: '#inputText',
    value: 'Bonjour',
    submit: '#translateBtn',
    output: '#outputText',
    oracle: /Sannu/i,
    download: '#downloadBtn'
  },
  {
    name: 'igbo',
    route: '/fr/tools/traducteur-igbo/',
    input: '#inputText',
    value: 'Merci',
    submit: '#translateBtn',
    output: '#outputText',
    oracle: /Daalụ/,
    download: '#downloadBtn'
  },
  {
    name: 'amharique',
    route: '/fr/tools/traducteur-amharique/',
    input: '#inputText',
    value: 'Merci',
    submit: '#translateBtn',
    output: '#outputText',
    oracle: /አመሰግናለሁ/,
    download: '#downloadBtn'
  },
  {
    name: 'zoulou',
    route: '/fr/tools/traducteur-zoulou/',
    input: '#query',
    value: 'bonjour',
    submit: '#zuForm button[type="submit"]',
    output: '#results',
    oracle: /Sawubona/i,
    download: '#downloadBtn'
  },
  {
    name: 'chiffres arabes',
    route: '/fr/tools/chiffres-arabes/',
    input: '#inputText',
    value: '2026',
    submit: '#convertForm button[type="submit"]',
    output: '#outputText',
    oracle: /٢٠٢٦/,
    download: '#downloadBtn'
  },
  {
    name: 'translittération',
    route: '/fr/tools/translitteration/',
    input: '#inputText',
    value: 'سلام',
    submit: '#transForm button[type="submit"]',
    output: '#outputText',
    oracle: /slam|salām|salam/i,
    download: '#downloadBtn'
  },
  {
    name: 'pidgin',
    route: '/fr/tools/traducteur-pidgin/',
    input: '#sourceText',
    value: 'Combien ça coûte ?',
    submit: '#pidginForm button[type="submit"]',
    output: '#pidginOutput',
    oracle: /how much e be/i,
    download: '#downloadPidgin'
  },
  {
    name: 'français en Afrique',
    route: '/fr/tools/francais-africain/',
    input: '#search',
    value: 'puce',
    submit: '#africanFrenchForm button[type="submit"]',
    output: '#africanFrenchResults',
    oracle: /Carte SIM/i,
    download: '#downloadAfricanFrench'
  },
  {
    name: 'prénoms africains',
    route: '/fr/tools/signification-prenoms-africains/',
    input: '#query',
    value: 'Ayo',
    submit: '#nameForm button[type="submit"]',
    output: '#nameList',
    oracle: /Ayo/,
    download: '#downloadNames'
  }
];

for (const app of apps) {
  test(`${app.name}: workflow, export, reflow, dark and runtime`, async ({ page }) => {
    const consoleErrors = [];
    const failedAssets = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      const url = response.url();
      if (response.status() >= 400 && /\.(?:js|css|woff2?|webp|svg)(?:\?|$)/i.test(url)) {
        failedAssets.push(`${response.status()} ${url}`);
      }
    });

    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator(app.input)).toHaveAccessibleName(/\S+/);

    await page.locator(app.input).fill(app.value);
    await page.locator(app.submit).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(app.output)).toContainText(app.oracle);

    const downloadPromise = page.waitForEvent('download');
    await page.locator(app.download).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.txt$/i);

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main.scrollWidth - main.clientWidth;
      });
      expect(overflow, `${app.name} overflow at ${width}px`).toBeLessThanOrEqual(1);
    }

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const zoomOverflow = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main.scrollWidth - main.clientWidth;
    });
    expect(zoomOverflow, `${app.name} overflow at 200% text`).toBeLessThanOrEqual(4);
    await expect(page.locator(app.submit)).toBeVisible();

    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    expect(consoleErrors, `${app.name} console errors`).toEqual([]);
    expect(failedAssets, `${app.name} failed assets`).toEqual([]);
  });
}

test('yoruba validates empty input and reverses direction', async ({ page }) => {
  await page.goto('/fr/tools/traducteur-yoruba/');
  await page.locator('#yorubaForm button[type="submit"]').click();
  await expect(page.locator('#yorubaError')).toBeVisible();
  await expect(page.locator('#sourceText')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#direction').selectOption('yo-fr');
  await page.locator('#sourceText').fill('Ẹ ṣéun');
  await page.locator('#yorubaForm button[type="submit"]').click();
  await expect(page.locator('#result')).toContainText('Merci');
});

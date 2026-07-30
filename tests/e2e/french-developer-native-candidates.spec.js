const fs = require('fs');
const { test, expect } = require('@playwright/test');

const CASES = [
  {
    id: 'json-formatter',
    route: '/fr/tools/formateur-json/',
    async run(page) {
      await page.locator('#jsonInput').fill('{"pays":"Sénégal","actif":true}');
      await page.locator('#jsonFormatterForm button[type="submit"]').click();
      await expect(page.locator('#jsonOutput')).toHaveValue(/"pays": "Sénégal"/);
    }
  },
  {
    id: 'hash-generator',
    route: '/fr/tools/generateur-hash/',
    async run(page) {
      await page.locator('#inputText').fill('abc');
      await page.locator('#runBtn').click();
      await expect(page.locator('#hashOutput')).toContainText('ba7816bf8f01cfea414140de5dae2223');
    }
  },
  {
    id: 'base64',
    route: '/fr/tools/encodeur-base64/',
    async run(page) {
      await page.locator('#base64Input').fill('bonjour');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('Ym9uam91cg==');
    }
  },
  {
    id: 'jwt-decoder',
    route: '/fr/tools/decodeur-jwt/',
    async run(page) {
      await page.locator('#sampleBtn').click();
      await expect(page.locator('#payloadOut')).not.toHaveText('');
      await expect(page.locator('#reportOut')).not.toHaveText('');
    }
  },
  {
    id: 'url-encoder',
    route: '/fr/tools/encodeur-url/',
    async run(page) {
      await page.locator('#urlInput').fill('https://exemple.test/recherche?q=café du Sénégal');
      await page.locator('#encodeComponentBtn').click();
      await expect(page.locator('#urlOutput')).toContainText('%3A%2F%2F');
    }
  },
  {
    id: 'uuid-generator',
    route: '/fr/tools/generateur-uuid/',
    async run(page) {
      await page.locator('#countInput').fill('2');
      await page.locator('#generateBtn').click();
      await expect(page.locator('#idList')).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    }
  },
  {
    id: 'html-entities',
    route: '/fr/tools/entites-html/',
    async run(page) {
      await page.locator('#inputText').fill('<p>Côte d’Ivoire & Sénégal</p>');
      await page.locator('#heForm button[type="submit"]').click();
      await expect(page.locator('#outputText')).toHaveValue(/&lt;p&gt;/);
    }
  },
  {
    id: 'markdown-editor',
    route: '/fr/tools/editeur-markdown/',
    async run(page) {
      await page.locator('#markdownInput').fill('# Rapport\n\n**Validé**');
      await page.locator('#renderButton').click();
      await expect(page.locator('#htmlPreview h1')).toHaveText('Rapport');
    }
  },
  {
    id: 'color-contrast',
    route: '/fr/tools/contraste-couleurs/',
    async run(page) {
      await page.locator('#fgHex').fill('#000000');
      await page.locator('#bgHex').fill('#ffffff');
      await page.locator('#contrastForm button[type="submit"]').click();
      await expect(page.locator('#ratioOut')).toContainText('21');
    }
  },
  {
    id: 'ussd-simulator',
    route: '/fr/tools/simulateur-ussd/',
    async run(page) {
      await page.locator('#ussdForm button[type="submit"]').click();
      await expect(page.locator('#ussdTranscript')).toContainText('CON');
    }
  },
  {
    id: 'meta-tag-gen',
    route: '/fr/tools/generateur-meta/',
    async run(page) {
      await page.locator('#topic').fill('Guide API Sénégal');
      await page.locator('#keyword').fill('API Sénégal');
      await page.locator('#meta-copy-form button[type="submit"]').click();
      await expect(page.locator('#output')).not.toHaveValue('');
    }
  },
  {
    id: 'htaccess-gen',
    route: '/fr/tools/generateur-htaccess/',
    async run(page) {
      await page.locator('#domain').fill('exemple.sn');
      await page.locator('#ht-form button[type="submit"]').click();
      await expect(page.locator('#code-output')).toHaveValue(/RewriteEngine/);
    }
  },
  {
    id: 'robots-txt',
    route: '/fr/tools/generateur-robots-txt/',
    async run(page) {
      await page.locator('#siteUrl').fill('https://exemple.sn');
      await page.locator('#robotsForm button[type="submit"]').click();
      await expect(page.locator('#robotsOutput')).toContainText('User-agent');
    }
  },
  {
    id: 'password-gen',
    route: '/fr/tools/generateur-mot-de-passe/',
    async run(page) {
      await page.locator('#count').fill('2');
      await page.locator('#length').fill('20');
      await page.locator('#password-form button[type="submit"]').click();
      await expect(page.locator('#password-output')).not.toHaveText('');
    }
  },
  {
    id: 'sql-formatter',
    route: '/fr/tools/formateur-sql/',
    async run(page) {
      await page.locator('#sqlInput').fill('select id,name from users where active=1');
      await page.locator('#formatSqlBtn').click();
      await expect(page.locator('#sqlOutput')).toHaveValue(/SELECT/);
    }
  },
  {
    id: 'meta-tag-generator',
    route: '/fr/tools/generateur-meta-tags/',
    async run(page) {
      await page.locator('#page-title').fill('Outils API au Sénégal');
      await page.locator('#description').fill('Découvrez des outils API locaux et privés pour les développeurs au Sénégal.');
      await page.locator('#url').fill('https://exemple.sn/outils-api');
      await page.locator('#meta-form button[type="submit"]').click();
      await expect(page.locator('#meta-code')).toHaveValue(/<title>/);
    }
  },
  {
    id: 'dev-tools',
    route: '/fr/tools/outils-dev/',
    async run(page) {
      await page.locator('#sourceInput').fill('{"pays":"Mali","valeur":3}');
      await page.locator('#runBtn').click();
      await expect(page.locator('#resultOutput')).toHaveValue(/"pays"/);
    }
  }
];

for (const candidate of CASES) {
  test(`${candidate.id} has a native French workflow and mobile contract`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const response = await page.goto(candidate.route, { waitUntil: 'domcontentloaded' });
    expect(response && response.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(await page.locator('h1').count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`https://afrotools\\.com${candidate.route}`));
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await candidate.run(page);
    expect(errors).toEqual([]);
  });
}

const EXPORTS = {
  'json-formatter': ['#jsonDownload'],
  'hash-generator': ['#downloadBtn'],
  base64: ['#downloadBase64Btn'],
  'jwt-decoder': ['#downloadBtn'],
  'url-encoder': ['#downloadBtn'],
  'uuid-generator': ['#downloadTxtBtn', '#downloadJsonBtn'],
  'html-entities': ['#downloadBtn'],
  'markdown-editor': ['#downloadMarkdown', '#downloadHtml'],
  'color-contrast': ['#exportBtn'],
  'ussd-simulator': ['#downloadUssd'],
  'meta-tag-gen': ['#download-result'],
  'htaccess-gen': ['#download-result'],
  'robots-txt': ['#downloadBtn'],
  'password-gen': ['#download-result'],
  'sql-formatter': ['#downloadSqlBtn'],
  'meta-tag-generator': ['#download-code'],
  'dev-tools': ['#downloadBtn']
};

for (const candidate of CASES) {
  test(`${candidate.id} advertised exports download and reopen`, async ({ page }) => {
    await page.goto(candidate.route, { waitUntil: 'domcontentloaded' });
    await candidate.run(page);
    for (const selector of EXPORTS[candidate.id]) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator(selector).click()
      ]);
      const filename = download.suggestedFilename();
      const file = await download.path();
      expect(file, `${candidate.id} ${selector} download path`).toBeTruthy();
      const content = fs.readFileSync(file, 'utf8');
      expect(content.trim().length, `${candidate.id} ${filename} non-empty`).toBeGreaterThan(2);
      if (/\.json$/i.test(filename)) expect(() => JSON.parse(content)).not.toThrow();
      if (/\.html?$/i.test(filename)) expect(content).toMatch(/<(!doctype|html|head|meta|title|h1|p)\b/i);
      if (/\.sql$/i.test(filename)) expect(content).toMatch(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/i);
    }
  });
}

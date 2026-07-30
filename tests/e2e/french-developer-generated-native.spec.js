const fs = require('fs');
const { test, expect } = require('@playwright/test');
const malformedHybrids = /\b(?:Générerd|Importered|Remplacerment|Partagerd|Prixs|Moisly|Planificationr|TextesS)\b/i;
const strongEnglish = /\b(?:the|your|this|that|with|before|after|select|choose|copy|save|download|generate|results?|tool|builder|does|not|only|from|into|should|will|what|how|why|where|when|review|verify|check|ready|screen|flow|query|request|response)\b/gi;
const preservedExportKeys = new Set(['id', 'type', 'provider', 'country', 'ops', 'risk', 'supports', 'tags', 'source', 'url', 'serviceCode', 'home', 'next', 'variable', 'key', 'project', 'localPay', 'countries']);

function hasResidualEnglish(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || /^(?:https?:\/\/|\/)/i.test(text)) return false;
  return (text.match(strongEnglish) || []).length >= 2;
}

function exportStrings(value, key = '') {
  if (Array.isArray(value)) return value.flatMap(item => exportStrings(item, key));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([childKey, child]) => exportStrings(child, childKey));
  if (typeof value !== 'string' || preservedExportKeys.has(key)) return [];
  return [value];
}

const CASES = [
  {
    id: 'data-converter',
    route: '/fr/tools/convertisseur-donnees/',
    async run(page) {
      await page.locator('#inputFormat').selectOption('json');
      await page.locator('#outputFormat').selectOption('csv');
      await page.locator('#inputData').fill('[{"pays":"Sénégal","valeur":2}]');
      await page.locator('#convertBtn').click();
      await expect(page.locator('#outputData')).toHaveValue(/pays,valeur[\s\S]*Sénégal,2/);
    },
    downloads: ['#downloadBtn']
  },
  {
    id: 'regex-tester',
    route: '/fr/tools/testeur-regex/',
    async run(page) {
      await page.locator('#patternInput').fill('\\d+');
      await page.locator('#testInput').fill('Référence 123 et 456');
      await expect(page.locator('#output')).toContainText('123');
    },
    downloads: []
  },
  {
    id: 'cron-builder',
    route: '/fr/tools/constructeur-cron/',
    async run(page) {
      await page.locator('#cronInput').fill('*/5 * * * *');
      await page.locator('#cronInput').dispatchEvent('input');
      await expect(page.locator('#expressionOutput')).toContainText('*/5 * * * *');
      await expect(page.locator('#descriptionOutput')).not.toHaveText('');
    },
    downloads: []
  },
  {
    id: 'diff-checker',
    route: '/fr/tools/comparateur-texte/',
    async run(page) {
      await page.locator('#text1').fill('Ligne une\nLigne deux');
      await page.locator('#text2').fill('Ligne une\nLigne trois');
      await page.locator('#text2').dispatchEvent('input');
      await expect(page.locator('#statAdded')).not.toHaveText('0');
      await expect(page.locator('#diffOutput')).toContainText('Ligne trois');
    },
    downloads: []
  },
  {
    id: 'sql-playground',
    route: '/fr/tools/bac-a-sable-sql/',
    async run(page) {
      await expect(page.locator('#loading')).toBeHidden({ timeout: 20_000 });
      await page.locator('#editor').fill('SELECT 1 AS valeur;');
      await page.locator('#run-query').click();
      await expect(page.locator('#results')).toContainText('1');
    },
    downloads: ['#download-sql', '#export-csv']
  },
  {
    id: 'css-gradient',
    route: '/fr/tools/generateur-degrade-css/',
    async run(page) {
      await expect(page.locator('#codeOutput')).toContainText(/gradient\(/);
      await page.locator('#angle').fill('45');
      await page.locator('#angle').dispatchEvent('input');
      await expect(page.locator('#codeOutput')).toContainText('45deg');
    },
    downloads: []
  },
  {
    id: 'sitemap-gen',
    route: '/fr/tools/generateur-sitemap/',
    async run(page) {
      await page.locator('#baseUrl').fill('https://exemple.sn');
      await page.locator('#urlInput').fill('/\n/a-propos\n/outils');
      await page.getByRole('button', { name: /Generate Sitemap|Générer/ }).click();
      await expect(page.locator('#xmlOutput')).toContainText('<urlset');
      await expect(page.locator('#xmlOutput')).toContainText('https://exemple.sn/outils');
    },
    downloads: ['button[onclick="downloadXML()"]']
  },
  {
    id: 'african-api-directory',
    route: '/fr/tools/annuaire-api-africaines/',
    async run(page) {
      await page.locator('#search').fill('Paystack');
      await expect(page.locator('#api-grid')).toContainText('Paystack');
      await expect(page.locator('#result-count')).not.toHaveText('0');
    },
    downloads: []
  },
  {
    id: 'african-domains',
    route: '/fr/tools/verificateur-domaines-africains/',
    async run(page) {
      await page.locator('#domain-name').fill('afrotools');
      expect(await page.locator('#results-tbody tr').count()).toBeGreaterThan(0);
      await expect(page.locator('#domain-status')).toContainText('afrotools');
    },
    downloads: []
  },
  {
    id: 'commit-message-gen',
    route: '/fr/tools/generateur-message-commit/',
    async run(page) {
      await page.locator('#scope').fill('api');
      await page.locator('#description').fill('ajouter la validation pays');
      await expect(page.locator('#output-main')).toContainText('feat(api): ajouter la validation pays');
    },
    downloads: []
  },
  {
    id: 'docker-compose-gen',
    route: '/fr/tools/generateur-docker-compose/',
    async run(page) {
      await page.locator('#project').fill('afro-demo');
      await page.locator('#project').dispatchEvent('input');
      await expect(page.locator('#compose-code')).toContainText('services:');
      await expect(page.locator('#compose-code')).toContainText('afro-demo');
    },
    downloads: []
  },
  {
    id: 'hosting-compare',
    route: '/fr/tools/comparateur-hebergement/',
    async run(page) {
      await page.locator('#budget').fill('25');
      await page.locator('#budget').dispatchEvent('input');
      await expect(page.locator('#results')).not.toHaveText('');
      await expect(page.locator('#best-title')).not.toHaveText('');
    },
    downloads: ['#download-json']
  },
  {
    id: 'pwa-manifest',
    route: '/fr/tools/generateur-manifest-pwa/',
    async run(page) {
      await page.locator('#app-name').fill('Afro Démo');
      await page.locator('#app-name').dispatchEvent('input');
      await expect(page.locator('#manifest-code')).toContainText('"name": "Afro Démo"');
      const manifest = JSON.parse(await page.locator('#manifest-code').textContent());
      expect(manifest.name).toBe('Afro Démo');
    },
    downloads: []
  },
  {
    id: 'ussd-flow-builder',
    route: '/fr/tools/constructeur-flux-ussd/',
    async run(page) {
      await page.locator('#flow-name').fill('Paiement Démo');
      await page.locator('#flow-name').dispatchEvent('input');
      await expect(page.locator('#code-json')).toContainText('Paiement Démo');
      await expect(page.locator('#phone-text')).not.toHaveText('');
    },
    downloads: ['#export-flow']
  }
];

for (const candidate of CASES) {
  test(`${candidate.id} deterministic native French owner works and reopens exports`, async ({ page }) => {
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
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`https://afrotools\\.com${candidate.route}`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await candidate.run(page);
    const languageEvidence = await page.evaluate(() => {
      const values = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,code,pre,textarea,[data-fr-preserve],#codeOutput,.code-text,.code-output,.generated-code,.syntax-output')) continue;
        const text = node.nodeValue.replace(/\s+/g, ' ').trim();
        if (text) values.push(text);
      }
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"]').forEach(element => {
        ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(attribute => {
          if (element.hasAttribute(attribute)) values.push(element.getAttribute(attribute));
        });
      });
      return [...new Set(values)];
    });
    expect(languageEvidence.filter(value => malformedHybrids.test(value)), 'hybrid dynamic French copy').toEqual([]);
    expect(languageEvidence.filter(hasResidualEnglish), 'residual English after workflow').toEqual([]);
    for (const selector of candidate.downloads) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
      const file = await download.path();
      expect(file).toBeTruthy();
      const content = fs.readFileSync(file, 'utf8');
      expect(content.trim().length).toBeGreaterThan(2);
      if (/\.csv$/i.test(download.suggestedFilename())) expect(content.trim().split(/\r?\n/).length).toBeGreaterThanOrEqual(2);
      if (/\.xml$/i.test(download.suggestedFilename())) expect(content).toContain('<urlset');
      if (/\.sql$/i.test(download.suggestedFilename())) expect(content).toMatch(/\bSELECT\b/i);
      if (/\.json$/i.test(download.suggestedFilename())) {
        const strings = exportStrings(JSON.parse(content));
        expect(strings.filter(value => malformedHybrids.test(value)), 'hybrid French export copy').toEqual([]);
        expect(strings.filter(hasResidualEnglish), 'residual English in human-facing JSON export values').toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
}

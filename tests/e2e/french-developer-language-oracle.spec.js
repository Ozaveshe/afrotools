const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/localization/fr-developer-parity-manifest.json'), 'utf8'));
const malformedHybrids = /\b(?:Générerd|Importered|Remplacerment|Partagerd|Prixs|Moisly|Planificationr|TextesS)\b/i;
const strongEnglish = /\b(?:the|your|this|that|with|before|after|select|choose|copy|save|download|generate|results?|tool|builder|does|not|only|from|into|should|will|what|how|why|where|when|review|verify|check|ready|screen|flow|query|request|response)\b/gi;
const technicalAllowlist = /^(?:AfroTools|JSON|CSV|XML|YAML|TSV|TOML|SQL|INSERT|JavaScript|RegExp|Python|PHP|API|URL|HTML|CSS|PWA|USSD|CON|END|Node(?:\.js)?|GitHub|Kubernetes|AWS|SQLite|Docker|HTTP|HTTPS|JWT|UUID|Base64|MDN|W3C|Chrome|Safari|Edge|Redis)$/i;

function englishSignals(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || technicalAllowlist.test(text) || /^(?:https?:\/\/|\/)/i.test(text)) return [];
  return text.match(strongEnglish) || [];
}

function structuredStrings(value, key = '') {
  if (Array.isArray(value)) return value.flatMap(item => structuredStrings(item, key));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([childKey, childValue]) => structuredStrings(childValue, childKey));
  }
  if (typeof value !== 'string' || key.startsWith('@') || /^(?:url|image|item|sameAs|contentUrl|mainEntityOfPage)$/i.test(key)) return [];
  return [value];
}

for (const row of manifest.rows) {
  test(`${row.id} exposes reviewed French UI, metadata and structured data`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(row.frenchRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', /^fr(?:-|$)/i);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`https://afrotools\\.com${row.frenchRoute}`));
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`https://afrotools\\.com${row.frenchRoute}`));
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.tagName)).not.toBe('BODY');

    const evidence = await page.evaluate(() => {
      const visible = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,code,pre,textarea,[data-fr-preserve],#codeOutput,.code-text,.code-output,.generated-code,.syntax-output')) continue;
        const text = node.nodeValue.replace(/\s+/g, ' ').trim();
        if (text) visible.push(text);
      }
      const attributes = [];
      document.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"]').forEach(element => {
        ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(attribute => {
          if (element.hasAttribute(attribute)) attributes.push(element.getAttribute(attribute));
        });
      });
      const metadata = [...document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')]
        .map(element => element.content);
      const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(element => {
        try { return JSON.parse(element.textContent); } catch (_) { return null; }
      }).filter(Boolean);
      return { visible: [...new Set(visible)], attributes: [...new Set(attributes)], metadata, schemas };
    });

    const humanFacing = [...evidence.visible, ...evidence.attributes, ...evidence.metadata];
    expect(humanFacing.filter(value => malformedHybrids.test(value)), 'hybrid English/French fragments').toEqual([]);
    expect(humanFacing.filter(value => englishSignals(value).length >= 2), 'residual English UI or metadata').toEqual([]);
    const schemaText = evidence.schemas.flatMap(schema => structuredStrings(schema));
    expect(schemaText.filter(value => englishSignals(value).length >= 2), 'residual English structured data').toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

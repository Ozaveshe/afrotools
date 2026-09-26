const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const root = path.resolve(__dirname, '../..');
const fr = require('../../data/localization/fr-document-pdf-parity.json').apps;
const sw = require('../../scripts/build-swahili-document-pdf-parity').apps;
const descriptions = require('../../data/localization/sw-document-related-tools.json');
const { localizeDocumentRelatedTools } = require('../../scripts/lib/localized-document-related-tools');
const routes = {
  en: ['/tools/pdf-form-filler/', '/tools/pdf-watermark/'],
  fr: ['/fr/tools/remplir-formulaire-pdf/', '/fr/tools/filigrane-pdf/'],
  sw: ['/sw/zana/kujaza-fomu-pdf/', '/sw/zana/watermark-pdf/']
};
const shell = {
  en: ['You might also like', 'Open tool', 'Browse all tools', '/tools/'],
  fr: ['Ces outils peuvent aussi vous aider', 'Ouvrir l’outil', 'Voir tous les outils', '/fr/all-tools/'],
  sw: ['Zana nyingine zinazoweza kukusaidia', 'Fungua zana', 'Angalia zana zote', '/sw/zana-zote/']
};
function truncate(text) { return text.length > 50 ? text.slice(0, 48) + '…' : text; }
for (const [locale, paths] of Object.entries(routes)) for (const route of paths) {
  test(`${locale} native rendered document recommendations: ${route}`, async ({ page, request }) => {
    const datasetRequests = [];
    page.on('request', r => { if (r.url().includes('related-tools-data')) datasetRequests.push(r.url()); });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const host = page.locator('afro-related-tools');
    const cards = host.locator('.card');
    await expect(cards).toHaveCount(6);
    await expect(host.locator('.title')).toHaveText(shell[locale][0]);
    await expect(host.locator('.all-link')).toHaveText(shell[locale][2]);
    await expect(host.locator('.all-link')).toHaveAttribute('href', shell[locale][3]);
    expect((await request.get(shell[locale][3])).status()).toBe(200);
    const anchors = await host.locator('[data-related-tools-ssr] a').evaluateAll(nodes => nodes.map(a => ({
      id: a.dataset.id, name: a.dataset.name, desc: a.dataset.desc, href: a.getAttribute('href')
    })));
    for (let i = 0; i < anchors.length; i++) {
      const row = anchors[i];
      if (locale !== 'en') {
        const app = (locale === 'fr' ? fr : sw).find(app => app.id === row.id);
        expect(row.name).toBe(app.name);
        expect(row.desc).toBe(locale === 'fr' ? app.description : descriptions[row.id]);
        expect(row.href).toBe(locale === 'fr' ? app.frenchRoute : app.swahiliRoute);
      }
      await expect(cards.nth(i)).toHaveAccessibleName(row.name);
      await expect(cards.nth(i).locator('.card-name')).toHaveText(row.name);
      await expect(cards.nth(i).locator('.card-desc')).toHaveText(truncate(row.desc));
      await expect(cards.nth(i)).toHaveAttribute('href', row.href);
      await expect(cards.nth(i).locator('.cta-btn')).toHaveText(shell[locale][1]);
      await expect(cards.nth(i).locator('.category-meta')).toHaveText({ en:'PDF & Docs', fr:'PDF et documents', sw:'Hati na PDF' }[locale]);
      expect((await request.get(row.href)).status()).toBe(200);
    }
    // Let document localizers finish their deferred mutation pass, then verify again.
    await expect.poll(() => host.locator('.card-name').allTextContents()).toEqual(anchors.map(a => a.name));
    expect(datasetRequests).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    await host.scrollIntoViewIfNeeded();
    expect(await host.evaluate(el => Array.from(el.shadowRoot.querySelectorAll('.wrap, .card, .all-link, .title')).every(node => {
      const bounds = node.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= 390;
    }))).toBe(true);
  });
}

for (const asset of ['related-tools.js', 'related-tools.min.js']) {
  for (const order of ['component-first', 'localizer-first']) {
    test(`${asset}: real French localizer ${order}`, async ({ page }) => {
      await page.goto('/');
      await page.setContent('<html lang="fr"><body><afro-related-tools data-ssr="1" category="document-pdf"><nav data-related-tools-ssr><a data-related-tool data-id="cv-builder" data-name="CV / Resume Builder" data-desc="Build a professional CV" href="/fr/tools/generateur-cv/">CV / Resume Builder</a></nav></afro-related-tools></body></html>');
      const component = () => page.addScriptTag({ path: path.join(root, 'assets/js/components', asset) });
      const localizer = () => page.addScriptTag({ path: path.join(root, 'assets/js/lib/fr-document-pdf-localizer.js') });
      if (order === 'component-first') { await component(); await localizer(); }
      else { await localizer(); await component(); }
      const host = page.locator('afro-related-tools');
      const translated = await host.locator('a[data-related-tool]').getAttribute('data-name');
      expect(translated).not.toBe('CV / Resume Builder');
      await expect(host.locator('.card')).toHaveAccessibleName(translated);
      await expect(host.locator('.card-name')).toHaveText(translated);
    });
  }
  for (const order of ['component-first', 'localizer-first']) {
    test(`${asset}: native Swahili SSR with real localizer ${order}`, async ({ page }) => {
      await page.goto('/');
      const source = '<html lang="sw"><body><afro-related-tools data-ssr="1" category="document-pdf"><nav data-related-tools-ssr><a data-related-tool data-id="cv-builder" data-name="CV / Resume Builder" data-desc="Build a professional CV" href="/tools/cv-builder/">CV / Resume Builder</a></nav></afro-related-tools></body></html>';
      await page.setContent(localizeDocumentRelatedTools(source, 'sw', sw));
      const component = () => page.addScriptTag({ path: path.join(root, 'assets/js/components', asset) });
      const localizer = async () => {
        await page.addScriptTag({ path: path.join(root, 'assets/js/pages/sw-document-pdf-lexicon.js') });
        await page.addScriptTag({ path: path.join(root, 'assets/js/pages/sw-document-pdf-localizer.js') });
      };
      if (order === 'component-first') { await component(); await localizer(); }
      else { await localizer(); await component(); }
      const host = page.locator('afro-related-tools');
      await expect(host.locator('.card')).toHaveAccessibleName('Mjenzi wa CV');
      await expect(host.locator('.card-name')).toHaveText('Mjenzi wa CV');
      await expect(host.locator('.card-desc')).toHaveText(descriptions['cv-builder']);
      await expect(host.locator('.card')).toHaveAttribute('href', '/sw/zana/mjenzi-cv/');
    });
  }
  test(`${asset}: late SSR metadata, escaped text, disconnect/reconnect`, async ({ page }) => {
    await page.goto('/');
    await page.setContent('<html lang="sw"><body><afro-related-tools data-ssr="1" category="document-pdf"><nav data-related-tools-ssr><a data-related-tool data-id="test" data-name="Awali" data-desc="Maelezo" href="/sw/zana/nafasi-pdf/">Awali</a></nav></afro-related-tools></body></html>');
    await page.addScriptTag({ path: path.join(root, 'assets/js/components', asset) });
    const host = page.locator('afro-related-tools');
    await expect(host.locator('.card-name')).toHaveText('Awali');
    const name = 'CV "A&B" <img src=x onerror=alert(1)>';
    const desc = 'Maelezo <b>salama</b> & "wazi"';
    const href = '/sw/zana/nafasi-pdf/?a=1&b="salama"';
    await host.evaluate((el, data) => {
      window.renderCount = 0;
      const original = el._render.bind(el);
      el._render = () => { window.renderCount++; original(); };
      const a = el.querySelector('a');
      a.dataset.name = data.name; a.dataset.desc = data.desc; a.href = data.href;
    }, { name, desc, href });
    await expect(host.locator('.card-name')).toHaveText(name);
    await expect(host.locator('.card')).toHaveAccessibleName(name);
    await expect(host.locator('.card-desc')).toHaveText(desc);
    await expect(host.locator('.card')).toHaveAttribute('href', href);
    await expect(host.locator('.card-name img, .card-desc b')).toHaveCount(0);
    expect(await page.evaluate(() => window.renderCount)).toBe(1);
    await host.evaluate(el => {
      el.remove();
      el.querySelector('a').dataset.name = 'Baada ya kurudi';
      document.body.appendChild(el);
    });
    await expect(host.locator('.card-name')).toHaveText('Baada ya kurudi');
    await host.evaluate(el => {
      const a = el.querySelector('a'); a.removeAttribute('data-name'); a.textContent = 'Jina la maandishi';
    });
    await expect(host.locator('.card-name')).toHaveText('Jina la maandishi');
    await host.evaluate(el => { window.savedRelatedLink = el.querySelector('a'); window.savedRelatedLink.remove(); });
    await expect(host.locator('.card')).toHaveCount(0);
    await host.evaluate(el => el.querySelector('nav').appendChild(window.savedRelatedLink));
    await expect(host.locator('.card-name')).toHaveText('Jina la maandishi');
  });
  for (const locale of ['en', 'fr', 'sw']) {
    test(`${asset}: ${locale} lazy dataset remains usable`, async ({ page }) => {
      await page.goto('/');
      await page.route('**/assets/js/components/related-tools-data.min.js', route => route.fulfill({
        contentType: 'application/javascript',
        body: 'window.AFRO_RELATED_TOOLS=' + JSON.stringify({ buckets: { [`${locale}::document-pdf`]: [{ id:'fixture', name:'Fixture & <safe>', desc:'Description & <safe>', href:'/tools/pdf-workspace/', category:'document-pdf', imageExt:'' }] }, fallback: { [locale]: [] } })
      }));
      await page.setContent(`<html lang="${locale}"><body><afro-related-tools category="document-pdf"></afro-related-tools></body></html>`);
      await page.addScriptTag({ path: path.join(root, 'assets/js/components', asset) });
      await expect(page.locator('afro-related-tools .card')).toHaveAccessibleName('Fixture & <safe>');
      await expect(page.locator('afro-related-tools .all-link')).toHaveAttribute('href', shell[locale][3]);
    });
  }
}

test('SSR owner changes only known document recommendation anchors and escapes native text', () => {
  const source = '<p>Outside English unchanged</p><afro-related-tools data-ssr="1"><nav data-related-tools-ssr><a data-related-tool data-id="known" href="/tools/known/" data-name="Old" data-desc="Old">Old</a><a data-related-tool data-id="unknown" href="/else/">Unknown</a></nav></afro-related-tools>';
  const apps = [{ id:'known', name:'Nom "A&B" <CV>', description:'Texte <sûr>', frenchRoute:'/fr/tools/exemple/' }];
  const output = localizeDocumentRelatedTools(source, 'fr', apps);
  expect(output).toContain('<p>Outside English unchanged</p>');
  expect(output).toContain('<a data-related-tool data-id="unknown" href="/else/">Unknown</a>');
  expect(output).toContain('data-name="Nom &quot;A&amp;B&quot; &lt;CV&gt;"');
  expect(output).toContain('>Nom &quot;A&amp;B&quot; &lt;CV&gt;</a>');
  expect(localizeDocumentRelatedTools(output, 'fr', apps)).toBe(output);
});

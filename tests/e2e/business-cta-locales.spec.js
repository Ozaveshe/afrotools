const { test, expect } = require('@playwright/test');
const routes = {
  en: ['/tools/invoice-generator/', '/business-enquiry/', 'Business options', 'Embed this calculator'],
  fr: ['/fr/tools/generateur-factures/', '/fr/demande-entreprise/', 'Options professionnelles', 'Intégrer cet outil'],
  sw: ['/sw/zana/kizalishaji-ankara/', '/sw/ombi-la-biashara/', 'Chaguo za biashara', 'Pachika zana hii']
};
for (const [locale, [route, destination, group, first]] of Object.entries(routes)) {
  for (const theme of ['light', 'dark']) for (const width of [320, 390]) {
    test(`${locale} business actions ${theme} ${width}`, async ({ page, baseURL }) => {
      await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), theme);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 844 });
      const writes = [];
      page.on('request', request => {
        if (request.method() !== 'GET' && ['xhr', 'fetch'].includes(request.resourceType())) writes.push(request.method());
      });
      await page.goto(route + (locale === 'en' ? '' : '?tool=unrelated-tool'));
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
      const host = page.locator('afro-business-cta');
      await expect(host.getByRole('group', { name: group })).toBeVisible();
      await expect(host.getByRole('link', { name: first, exact: true })).toBeVisible();
      const links = host.locator('.actions a');
      await expect(links).toHaveCount(4);
      const offers = ['widget-demo', 'sponsored-tool', 'api-pilot', 'white-label'];
      for (let index = 0; index < 4; index++) {
        const link = links.nth(index), url = new URL(await link.getAttribute('href'), baseURL);
        expect(url.pathname).toBe(destination);
        expect(url.searchParams.get('tool')).toBe('invoice-generator');
        expect(url.searchParams.get('source_route')).toBe(route);
        expect(url.searchParams.get('offer')).toBe(offers[index]);
        expect(url.searchParams.get('cta_type')).toBe('business-cta');
        expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
      if (locale !== 'en') {
        expect(await host.evaluate(element => element.shadowRoot.querySelector('.wrap').textContent)).not.toMatch(/Business use|Business options|Download\/save|Use the existing|Invoice Generator/);
        await host.evaluate(element => element.setAttribute('tool-name', 'Nom local — jina la zana'));
        expect(new URL(await links.first().getAttribute('href'), baseURL).searchParams.get('tool')).toBe('invoice-generator');
      }
      await links.first().focus();
      await expect(links.first()).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(links.nth(1)).toBeFocused();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const result = await host.evaluate(async element => {
        await document.fonts.ready;
        const audit = await axe.run(element, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
        return { violations: audit.violations.map(row => row.id), incomplete: audit.incomplete.map(row => row.id) };
      });
      expect(result.violations).toEqual([]);
      expect(result.incomplete).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(writes).toEqual([]);
    });
  }
}

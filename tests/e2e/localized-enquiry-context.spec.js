const { test, expect } = require('@playwright/test');

for (const [locale, route] of [['fr','/fr/demande-entreprise/'], ['sw','/sw/ombi-la-biashara/']]) {
  for (const width of [320,390]) for (const theme of ['light','dark']) {
    test(`${locale} enquiry retains reviewed context at ${width}px ${theme} without sending it`, async ({ page, baseURL }) => {
      const sends = [];
      await page.route('**/*', async routed => {
        const request = routed.request();
        if (request.method() !== 'GET') { sends.push(request.method()); return routed.abort(); }
        if (new URL(request.url()).origin !== new URL(baseURL).origin) return routed.abort();
        return routed.continue();
      });
      await page.setViewportSize({width,height:844});
      await page.addInitScript(value => localStorage.setItem('aft_theme',value),theme);
      await page.emulateMedia({colorScheme:theme});
      await page.goto(route+'?offer=widget-demo&tool=invoice-generator&source_route=%2Ftools%2Finvoice-generator%2F&prospect_segment=hr-payroll&cta_type=business-cta&email=synthetic%40example.test');
      const form = page.locator('[data-localized-enquiry-context]');
      await expect(form.locator('[name=requested_offer]')).toHaveValue('widget_demo');
      await expect(form.locator('[name=relevant_tool]')).toHaveValue('invoice-generator');
      await expect(form.locator('[name=source_route]')).toHaveValue('/tools/invoice-generator/');
      await expect(form.locator('[name=email]')).toHaveValue('');
      await form.locator('[name=requested_offer]').focus();
      await page.keyboard.press('Tab');
      await expect(form.locator('[name=relevant_tool]')).toBeFocused();
      await form.locator('[name=relevant_tool]').fill('pdf-compress');
      const fields = await form.evaluate(node => Object.fromEntries(new FormData(node)));
      expect(fields.requested_offer).toBe('widget_demo');
      expect(fields.relevant_tool).toBe('pdf-compress');
      expect(fields.source_route).toBe('/tools/invoice-generator/');
      expect(fields.prospect_segment).toBe('hr_payroll');
      expect(fields.cta_type).toBe('business-cta');
      expect(fields.email).toBe('');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(sends).toEqual([]);
      for (const name of ['requested_offer','prospect_segment','relevant_tool','source_route']) {
        const field = form.locator(`[name=${name}]`);
        await expect(field).toHaveAccessibleName(/\S/);
        expect((await field.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await form.evaluate(async node=>(await window.axe.run(node,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(item=>({id:item.id,targets:item.nodes.map(n=>n.target)})));
      expect(violations).toEqual([]);
    });
  }
}

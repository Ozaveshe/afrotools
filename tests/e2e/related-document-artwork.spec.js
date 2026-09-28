const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const routes = {en:'/tools/pdf-form-filler/', fr:'/fr/tools/remplir-formulaire-pdf/', sw:'/sw/zana/kujaza-fomu-pdf/'};
const ids = ['cv-builder','invoice-generator','pdf-editor'];
const catalogs = {fr:require('../../data/localization/fr-document-pdf-parity.json').apps, sw:require('../../scripts/build-swahili-document-pdf-parity').apps};
const names = {en:['CV / Resume Builder','Invoice Generator','PDF Editor']};
for(const locale of ['fr','sw']) names[locale] = ids.map(id=>catalogs[locale].find(app=>app.id===id).name);
const forbiddenArtwork = /\/assets\/img\/tools\/(?:fr\/|sw\/)?(?:cv-builder|invoice-generator|pdf-editor)\.(?:webp|svg|png)(?:\?|$)/;
test.use({contextOptions:{reducedMotion:'reduce'}});
for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} document recommendation icons retain native identity on light and dark mobile`, async ({page, baseURL}, info) => {
    const imageRequests = [], errors = [];
    page.on('request', request => {if(forbiddenArtwork.test(request.url())) imageRequests.push(request.url());});
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.abort());
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent','declined'));
    await page.goto(route);
    const host = page.locator('afro-related-tools');
    await expect(host.locator('.card')).toHaveCount(6);
    const metadata = await host.locator('[data-related-tools-ssr] a').evaluateAll(nodes => nodes.map(a=>({id:a.dataset.id,name:a.dataset.name,href:a.getAttribute('href')})));
    expect(metadata.slice(0,3).map(row=>row.id)).toEqual(ids);
    // Native metadata is supplied by the maintained locale catalog, not by artwork.
    expect(metadata.slice(0,3).map(row=>row.name)).toEqual(names[locale]);
    const geometry = [];
    for (const theme of ['light','dark']) for (const width of [320,390]) {
      await page.setViewportSize({width,height:844});
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme',theme),theme);
      await host.scrollIntoViewIfNeeded();
      for(const [i,row] of metadata.entries()) {
        const card = host.locator('.card').nth(i);
        await expect(card).toHaveAccessibleName(row.name);
        await expect(card).toHaveAttribute('href',row.href);
        await expect(card.locator('.card-name')).toHaveText(row.name);
        if(ids.includes(row.id)) {
          await expect(card.locator('.card-img')).toHaveCount(0);
          await expect(card.locator('.card-document-icon svg')).toHaveCount(1);
          await expect(card.locator('.card-document-icon')).toHaveAttribute('aria-hidden','true');
          await expect(card.locator('.card-document-icon svg')).toHaveAttribute('aria-hidden','true');
          await expect(card.locator('.card-document-icon text, .card-document-icon image, .card-document-icon foreignObject')).toHaveCount(0);
          await expect(card.locator('.card-monogram')).toBeHidden();
          await card.focus(); await expect(card).toBeFocused();
        } else {
          await expect(card.locator('.card-document-icon')).toHaveCount(0);
          await expect(card.locator('.card-img')).toHaveCount(1);
          expect(await card.locator('.card-img').getAttribute('src')).toMatch(new RegExp('/'+row.id+'\\.(webp|svg)$'));
        }
      }
      const visual = await host.evaluate(host => {
        const luminance = color => {
          const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
          return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
        };
        return [...host.shadowRoot.querySelectorAll('.card-document-icon')].map(icon=>{
          const svg=icon.querySelector('svg'),box=svg.getBoundingClientRect(), header=icon.closest('.card-visual'), color=getComputedStyle(svg).stroke, bg=getComputedStyle(header).backgroundColor;
          const l1=luminance(color),l2=luminance(bg);
          return {width:box.width,height:box.height,headerHeight:header.getBoundingClientRect().height,color,bg,contrast:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05),inBounds:box.left>=0&&box.right<=innerWidth};
        });
      });
      visual.forEach(icon=>{expect(icon.width).toBe(48);expect(icon.height).toBe(48);expect(icon.headerHeight).toBe(112);expect(icon.contrast).toBeGreaterThanOrEqual(3);expect(icon.inBounds).toBe(true);});
      geometry.push({theme,width,visual});
      await host.screenshot({path:info.outputPath(`${locale}-${theme}-${width}.png`)});
    }
    fs.writeFileSync(info.outputPath('visual-proof.json'),JSON.stringify({metadata,geometry,imageRequests,errors},null,2));
    expect(imageRequests).toEqual([]); expect(errors).toEqual([]);
  });
}
for(const asset of ['related-tools.js','related-tools.min.js']) {
  test(`${asset} resolved aliases use reviewed glyph and unrelated artwork remains unchanged`, async({page})=>{
    await page.route('**/*',request=>request.abort());
    await page.setContent('<html lang="fr"><body></body></html>');
    await page.evaluate(()=>{window.AFRO_RELATED_TOOLS={buckets:{'fr::document-pdf':[
      {id:'localized-cv-alias',name:'CV natif',href:'/fr/cv/',category:'document-pdf',imageKey:'cv-builder',imageExt:'webp'},
      {id:'localized-invoice-alias',name:'Facture native',href:'/fr/facture/',category:'document-pdf',imageKey:'invoice-generator',imageExt:'webp'},
      {id:'localized-editor-alias',name:'Éditeur natif',href:'/fr/edition/',category:'document-pdf',imageKey:'pdf-editor',imageExt:'webp'},
      {id:'unrelated',name:'Reçu',href:'/fr/recu/',category:'document-pdf',imageKey:'receipt-generator',imageExt:'svg'}]},fallback:{fr:[]}};});
    await page.addScriptTag({path:path.join(root,'assets/js/components',asset)});
    await page.evaluate(()=>{const host=document.createElement('afro-related-tools');host.setAttribute('category','document-pdf');document.body.appendChild(host);});
    const cards=page.locator('afro-related-tools .card');
    await expect(cards).toHaveCount(4);
    for(let i=0;i<3;i++){await expect(cards.nth(i).locator('.card-document-icon svg')).toHaveCount(1);await expect(cards.nth(i).locator('img')).toHaveCount(0);}
    await expect(cards.nth(3).locator('.card-document-icon')).toHaveCount(0);
    // Both current requests fail in this offline fixture; its ordinary image fallback remains intact.
    await expect(cards.nth(3).locator('img')).toHaveAttribute('src','/assets/img/tools/receipt-generator.webp');
    await expect(cards.nth(3).locator('.card-monogram')).toBeVisible();
  });
}

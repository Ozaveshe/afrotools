const {test,expect}=require('@playwright/test');
const bindings=require('../../data/image-generation/blog-artwork-bindings.json').images.filter(row=>row.placement==='listing-card');
test.use({trace:'off'});

for(const appearance of [{width:390,colorScheme:'light'},{width:320,colorScheme:'dark'}]){
  test('Resources artwork renders through real pagination at '+appearance.width+'px in '+appearance.colorScheme+' mode',async({page})=>{
    test.setTimeout(300000);
    await page.setViewportSize({width:appearance.width,height:844});
    await page.emulateMedia({colorScheme:appearance.colorScheme});
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const seen=new Set();
    for(const file of [...new Set(bindings.map(row=>row.file))]){
      await page.goto('/'+file.replace(/index\.html$/,''));
      const selector=file==='blog/index.html'?'#blogGrid .article-card':'[data-blog-card]';
      const allCards=page.locator(selector);
      const expectedCount=await allCards.count();
      expect(expectedCount).toBeGreaterThan(0);
      const fileSeen=new Set();
      let pageNumber=1;
      while(true){
        const visible=page.locator(selector+':visible');
        expect(await visible.count()).toBeGreaterThan(0);
        for(const card of await visible.all()){
          const link=card.locator('a[href^="/blog/"],a[href^="/fr/blog/"]').first();
          await expect(link).toBeAttached();
          const route=await link.getAttribute('href');
          const key=file+'#'+route;
          expect(fileSeen.has(key),'A card must not repeat across pagination: '+key).toBe(false);
          fileSeen.add(key);seen.add(key);
          const row=bindings.find(row=>row.file===file&&row.route===route);
          const image=card.locator('img');
          await image.scrollIntoViewIfNeeded();
          const imageSource=await image.getAttribute('src');
          expect(imageSource,route).toMatch(/^\/assets\/img\/blog\//);
          if(row){
            await expect(image).toHaveAttribute('src',row.path);
            await expect(image).toHaveAttribute('alt',row.alt);
          }
          await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
          const box=await image.boundingBox();
          expect(box?.width,route).toBeGreaterThan(0);
          expect(box.x,route).toBeGreaterThanOrEqual(-1);
          expect(box.x+box.width,route).toBeLessThanOrEqual(appearance.width+1);
        }
        if(file!=='blog/index.html'||await page.locator('#pageNext').isDisabled())break;
        await page.locator('#pageNext').click();pageNumber++;
        await expect(page.locator('#blogResultsSummary')).toContainText('page '+pageNumber+' of');
      }
      expect(fileSeen.size,'Every story card must be rendered: '+file).toBe(expectedCount);
    }
    for(const row of bindings)expect(seen.has(row.file+'#'+row.route),row.route).toBe(true);
  });
}

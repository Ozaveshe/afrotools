const {test,expect}=require('@playwright/test');
const bindings=require('../../data/image-generation/blog-artwork-bindings.json').images.filter(row=>row.placement==='listing-card');
const {createReviewedCardIdentity}=require('../support/reviewed-resource-card-identity');
const graph=require('../../data/registry/route-graph.json');
const identities=createReviewedCardIdentity(bindings,graph);
test.use({trace:'off'});

for(const appearance of [{width:390,colorScheme:'light'},{width:320,colorScheme:'dark'}]){
  test('Resources artwork renders through real pagination at '+appearance.width+'px in '+appearance.colorScheme+' mode',async({page},testInfo)=>{
    test.setTimeout(300000);
    await page.setViewportSize({width:appearance.width,height:844});
    await page.emulateMedia({colorScheme:appearance.colorScheme});
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    // Observe existing image traffic only; no fetch, response body, headers or trace changes.
    const imageTraffic=[];
    const imageURL=value=>{try{const u=new URL(value,page.url());return u.origin+u.pathname;}catch{return null;}};
    const remember=row=>{imageTraffic.push(row);if(imageTraffic.length>128)imageTraffic.shift();};
    page.on('response',response=>{const url=imageURL(response.url());if(url&&new URL(url).pathname.startsWith('/assets/img/blog/'))remember({kind:'response',url,status:response.status()});});
    page.on('requestfailed',request=>{const url=imageURL(request.url());if(url&&new URL(url).pathname.startsWith('/assets/img/blog/'))remember({kind:'requestfailed',url,failure:(request.failure()?.errorText||'unknown').slice(0,160)});});
    const seen=new Set();
    const coverage=identities.createCoverage();
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
          const {key,row}=coverage.observe(file,route);
          expect(fileSeen.has(key),'A card must not repeat across pagination: '+key).toBe(false);
          fileSeen.add(key);seen.add(key);
          const image=card.locator('img');
          await image.scrollIntoViewIfNeeded();
          const imageSource=await image.getAttribute('src');
          expect(imageSource,route).toMatch(/^\/assets\/img\/blog\//);
          if(row){
            await expect(image).toHaveAttribute('src',row.path);
            await expect(image).toHaveAttribute('alt',row.alt);
            coverage.assertArtwork(file,route,imageSource,await image.getAttribute('alt'));
          }
          try{
            await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0),{message:'Resource image decode: file='+file+' route='+route+' src='+imageSource}).toBe(true);
          }catch(error){
            const state=await Promise.race([
              image.evaluate(img=>({src:(img.getAttribute('src')||'').slice(0,512),srcset:(img.getAttribute('srcset')||'').slice(0,1024),currentSrc:img.currentSrc.slice(0,512),complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,loading:img.loading})).catch(()=>({unavailable:'DOM image state unavailable after failure'})),
              new Promise(resolve=>setTimeout(()=>resolve({unavailable:'Diagnostic DOM read exceeded1500ms'}),1500))
            ]);
            const selectedURLs=new Set([imageURL(imageSource),imageURL(state.src||''),imageURL(state.currentSrc||'')].filter(Boolean));
            const evidence={file,route,imageSource,state,traffic:imageTraffic.filter(row=>selectedURLs.has(row.url)).slice(-8),limits:'Saved existing-page metadata only; missing traffic is unobserved, not a failed response. No newHTTP, response bodies, headers or trace.'};
            let body=Buffer.from(JSON.stringify(evidence,null,2));
            if(body.length>8192)body=Buffer.from(JSON.stringify({...evidence,state:{...state,srcset:(state.srcset||'').slice(0,256)},traffic:evidence.traffic.slice(-2)}));
            if(body.length<=8192)await testInfo.attach('resource-image-failure.json',{body,contentType:'application/json'}).catch(()=>{});
            throw error;
          }
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
    coverage.assertComplete();
    for(const row of bindings)expect(seen.has(identities.keyFor(row.file,row.route)),row.route).toBe(true);
  });
}

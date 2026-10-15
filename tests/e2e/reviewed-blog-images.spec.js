const { test, expect } = require('@playwright/test');
const bindings = require('../../data/image-generation/blog-artwork-bindings.json').images.filter(row=>row.placement==='article-hero');

for (const appearance of [{width:390,colorScheme:'light'},{width:320,colorScheme:'dark'}]) {
  test(`reviewed article covers render at ${appearance.width}px in ${appearance.colorScheme} mode`, async ({page})=>{
    test.setTimeout(300000);
    await page.setViewportSize({width:appearance.width,height:844});
    await page.emulateMedia({colorScheme:appearance.colorScheme});
    await page.route('**/*', route=>{
      const url=new URL(route.request().url());
      return url.hostname==='127.0.0.1' ? route.continue() : route.abort();
    });
    for (const row of bindings) {
      await page.goto(row.route);
      const figure=page.locator('figure[data-reviewed-blog-image="true"]');
      const image=figure.locator('img');
      await expect(image).toHaveAttribute('src',row.path);
      await expect(image).toHaveAttribute('alt',row.alt);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      await expect(figure.locator('figcaption')).toHaveText(row.caption);
      const box=await image.boundingBox();
      expect(box?.width,row.route).toBeGreaterThan(0);
      expect(box.x,row.route).toBeGreaterThanOrEqual(-1);
      expect(box.x+box.width,row.route).toBeLessThanOrEqual(appearance.width+1);
    }
  });
}

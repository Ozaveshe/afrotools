const { test, expect } = require('@playwright/test');
const data = require('../../data/cars/price-intelligence.json');

for (const appearance of [{width:390,colorScheme:'light'},{width:320,colorScheme:'dark'}]) {
  for (const vehicle of data.vehicles) {
    test(`published starter ${vehicle.id} artwork renders at ${appearance.width}px in ${appearance.colorScheme} mode`, async ({ page }) => {
  await page.setViewportSize({width:appearance.width,height:844});
  await page.emulateMedia({colorScheme:appearance.colorScheme});
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
    const binding = data.mediaLibrary.bindings.find(row => row.vehicleId === vehicle.id && row.isPrimary && row.status === 'approved');
    const asset = data.mediaLibrary.assets.find(row => row.id === binding?.assetId);
    expect(asset, vehicle.id).toBeTruthy();
    await page.goto(`/cars/nigeria/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/`);
    const image = page.locator('#carsApp .cars-hero-image');
    await expect(image).toHaveAttribute('src', asset.imageUrl);
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute('alt', asset.alt);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), vehicle.id+' mobile overflow').toBe(true);
    if (asset.sourceType === 'generated') {
      await expect(page.locator('#carsApp .cars-media-caption')).toHaveText(asset.caption);
    }
  expect(errors).toEqual([]);
    });
  }
  test(`published Kenya Axio starter artwork renders at ${appearance.width}px in ${appearance.colorScheme} mode`, async ({ page }) => {
  await page.setViewportSize({width:appearance.width,height:844});
  await page.emulateMedia({colorScheme:appearance.colorScheme});
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  const axioAsset=data.mediaLibrary.assets.find(row=>row.id==='toyota-axio-2018-hero');
  await page.goto('/cars/kenya/toyota/axio/2018/');
  const kenyaImage=page.locator('#carsApp .cars-hero-image');
  await expect(kenyaImage).toHaveAttribute('src',axioAsset.imageUrl);
  await expect(kenyaImage).toHaveAttribute('alt',axioAsset.alt);
  await expect.poll(()=>kenyaImage.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Kenya Axio mobile overflow').toBe(true);
  expect(errors).toEqual([]);
  });
}

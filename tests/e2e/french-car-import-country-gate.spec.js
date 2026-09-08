'use strict';
const {test,expect}=require('@playwright/test');
const route='/fr/tools/cout-importation-voiture/';
test.use({viewport:{width:390,height:844},trace:'off'});

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('afrotools_cookie_consent','declined');
    window.unselectedResultFrames=0;
    function checkFrame(){
      const result=document.getElementById('carImportResults');
      const ready=document.body&&document.body.getAttribute('data-fr-car-import-result-ready')==='true';
      if(result&&!ready&&!result.hidden&&result.getBoundingClientRect().height>0)window.unselectedResultFrames++;
      requestAnimationFrame(checkFrame);
    }
    requestAnimationFrame(checkFrame);
  });
});

async function ready(page,suffix=''){
  await page.goto(route+suffix);
  await expect(page.locator('#carImportCountry option[value=KE]')).toHaveCount(1);
  await expect(page.locator('#carImportCountry')).toHaveValue('');
  await expect(page.locator('#carImportResults')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-fr-transport-export-ready','false');
}
async function vehicle(page){
  await page.locator('#carImportMake').fill('Toyota');
  await page.locator('#carImportModel').fill('Axio');
  await page.locator('#carImportYear').fill('2022');
  await page.locator('#carImportEngineCc').fill('1500');
  await page.locator('#carImportInputMode').selectOption('purchase');
  await page.locator('#carImportPurchasePrice').fill('8200');
}
async function submit(page){await page.locator('#carImportForm button[type=submit]').click();}
async function textOf(download){const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks).toString('utf8');}

for(const suffix of ['', '?country=XX', '?country=KE&country=NG#country=GH', '?country=KE&make=QueryFixture#country=KE']){
  test(`entry ${suffix||'blank'} requires explicit country and preserves privacy`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await ready(page,suffix);
    expect(new URL(page.url()).search).toBe('');expect(new URL(page.url()).hash).toBe('');
    await expect(page.locator('[data-fr-transport-status]')).toContainText('Choisissez un pays');
    await expect(page.locator('#carImportPdf')).toBeDisabled();
    await expect(page.locator('[data-fr-transport-download-text]')).toBeDisabled();
    await submit(page);
    await expect(page.locator('[data-fr-transport-error]')).toContainText('Choisissez explicitement');
    await expect(page.locator('#carImportCountry')).toBeFocused();
    await expect(page.locator('#carImportResults')).toBeHidden();
    expect(await page.evaluate(()=>window.unselectedResultFrames)).toBe(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('vehicle inputs survive country validation, then KE calculation and parsed local exports recover',async({page})=>{
  await ready(page,'?country=XX');await vehicle(page);await submit(page);
  await expect(page.locator('#carImportPurchasePrice')).toHaveValue('8200');
  await expect(page.locator('#carImportModel')).toHaveValue('Axio');
  await page.locator('#carImportCountry').selectOption('KE');
  await expect(page.locator('#carImportResults')).toBeHidden();
  await expect(page.locator('#carImportCsv')).toBeDisabled();
  await expect(page.locator('#carImportPurchasePrice')).toHaveValue('8200');
  await submit(page);
  await expect(page.locator('#carImportResults')).toBeVisible();
  await expect(page.locator('#carImportSummaryLine')).toContainText('Kenya');
  await expect(page.locator('#carImportTotalLocal')).toContainText('KES');
  await expect(page.locator('#carImportCsv')).toBeEnabled();
  let pending=page.waitForEvent('download');await page.locator('#carImportCsv').click();
  const csv=await textOf(await pending);expect(csv).toContain('KEBS');
  const totalRow=csv.trim().split(/\r?\n/).find(row=>row.startsWith('total,on-road,'));
  const displayedTotal=Number((await page.locator('#carImportTotal').textContent()).replace(/[^\d.]/g,''));
  expect(Number(totalRow.split(',')[2])).toBeCloseTo(displayedTotal,1);
  pending=page.waitForEvent('download');await page.locator('[data-fr-transport-download-text]').click();
  const text=await textOf(await pending);expect(text).toContain('Kenya');expect(text).toContain('Axio');
  expect(new URL(page.url()).search).toBe('');expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(()=>localStorage.getItem('carImportCostLastInput'))).toBeNull();
  // A different supported country also needs a fresh calculation.
  await page.locator('#carImportCountry').selectOption('GH');
  await expect(page.locator('#carImportResults')).toBeHidden();await expect(page.locator('#carImportCsv')).toBeDisabled();
  await expect(page.locator('#carImportModel')).toHaveValue('Axio');
});

test('custom reset, native form reset and reload require a new country choice',async({page})=>{
  await ready(page);await vehicle(page);await page.locator('#carImportCountry').selectOption('KE');await submit(page);
  await expect(page.locator('#carImportResults')).toBeVisible();
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('car-import:reset')));
  await expect(page.locator('#carImportCountry')).toHaveValue('');
  await expect(page.locator('#carImportResults')).toBeHidden();await expect(page.locator('#carImportCsv')).toBeDisabled();
  await page.locator('#carImportCountry').selectOption('KE');await submit(page);
  await expect(page.locator('#carImportResults')).toBeVisible();
  await page.evaluate(()=>document.getElementById('carImportForm').reset());
  await expect(page.locator('#carImportCountry')).toHaveValue('');
  await expect(page.locator('#carImportResults')).toBeHidden();await expect(page.locator('#carImportCsv')).toBeDisabled();
  await page.reload();await expect(page.locator('#carImportCountry option[value=KE]')).toHaveCount(1);
  await expect(page.locator('#carImportCountry')).toHaveValue('');await expect(page.locator('#carImportResults')).toBeHidden();
});

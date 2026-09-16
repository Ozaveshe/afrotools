const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
test('French inflation chart uses shared arithmetic, recorded years and native CSV',async({page})=>{
 await page.goto('/fr/tools/salaire-minimum/');
 await page.locator('#referenceCountry').selectOption('MA');
 await page.getByText('Historique et coût de la vie enregistrés',{exact:true}).click();
 await expect(page.locator('#referenceInflationSummary')).toContainText('observation de 2024');
 await expect(page.locator('#referenceInflationSummary')).toContainText('gain de pouvoir d’achat de 0,9 %');
 await expect(page.locator('#referenceInflationSummary')).toContainText('Source et date de vérification');
 await expect(page.locator('#referenceInflationGraph svg')).toBeVisible();
 await expect(page.locator('#referenceInflationGraph polyline')).toHaveCount(2);
 const last=page.locator('#referenceInflationRows tr').last();
 await expect(last).toContainText('2024');await expect(last).toContainText('2 512,5');
 const download=page.waitForEvent('download');await page.locator('#referenceInflationCSV').click();const file=await download;
 expect(file.suggestedFilename()).toBe('afrotools-inflation-salaire-ma.csv');
 const csv=fs.readFileSync(await file.path(),'utf8');
 expect(csv).toContain('"Maroc","MAD","2024","3015","120","2512.5","2020"');
 expect(csv).toContain('Source et date de vérification');
 await page.locator('#referenceCountry').selectOption('NG');await expect(page.locator('#referenceInflationSummary')).toContainText('perte de pouvoir d’achat');await expect(page.locator('#referenceInflationSummary')).toContainText('2025');
 await page.locator('#referenceCountry').selectOption('ZA');await expect(page.locator('#referenceInflationSummary')).toContainText('2026');await page.locator('#referenceSector').selectOption('epwp');await expect(page.locator('#referenceInflationUnits')).toContainText('Référence nationale historique');
 await page.locator('#referenceCountry').selectOption('RW');await expect(page.locator('#referenceInflationCSV')).toBeDisabled();await expect(page.locator('#referenceInflationGraph svg')).toHaveCount(0);await expect(page.locator('#referenceInflationSummary')).toContainText('Aucune série');
 await page.locator('#referenceReset').click();await expect(page.locator('#referenceInflationCSV')).toBeDisabled();
});
test('French inflation mobile chart and accessible table work in light and dark',async({page})=>{
 await page.goto('/fr/tools/salaire-minimum/');await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 await page.locator('#referenceCountry').selectOption('MA');await page.getByText('Historique et coût de la vie enregistrés',{exact:true}).click();
 for(const width of [320,390])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:800});await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const violations=await page.evaluate(async()=>(await axe.run(document.getElementById('referenceInflation'))).violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));expect(violations).toEqual([]);
  await page.locator('#referenceInflationCSV').focus();await expect(page.locator('#referenceInflationCSV')).toBeFocused();
 }
 const directory=path.resolve('..','fr-inflation-visual');fs.mkdirSync(directory,{recursive:true});await page.locator('#referenceInflation').screenshot({path:path.join(directory,'fr-390-dark.png')});
});

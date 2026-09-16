const{test,expect}=require('@playwright/test');
const locales=[['en','/tools/mobile-money-fees/','Enter a valid positive amount','could not be calculated','catalog is unavailable'],['fr','/fr/tools/frais-mobile-money/','Saisissez un montant positif','calcul des frais a échoué','catalogue de tarifs vérifiés est indisponible'],['sw','/sw/zana/ada-pesa-simu/','Weka kiasi halali chanya','Ada haikuweza kuhesabiwa','Katalogi ya ada zilizochapishwa haipatikani']];
for(const[locale,route,invalid,failure,catalogFailure]of locales){
 test(locale+' clears changed and invalid tariff results, restores valid calculations and native reset state',async({page})=>{
  await page.goto(route);const form=page.locator('#mm-tariff-form'),amount=page.locator('#mm-amount'),result=page.locator('#mm-tariff-result'),status=page.locator('#mm-tariff-status'),submit=form.locator('button[type=submit]');
  async function valid(){await amount.fill('500');await submit.click();await expect(result.locator('.rm-metric')).toHaveCount(7);}
  await valid();await amount.fill('600');await expect(result).toBeEmpty();await expect(status).not.toContainText(/Calculated|Calculé|Imehesabiwa/);
  for(const value of ['', '-1','1000000000000001']){await valid();await amount.fill(value);await submit.click();await expect(result).toBeEmpty();await expect(status).toContainText(invalid);await expect(amount).toHaveAttribute('aria-invalid','true');await expect(amount).toBeFocused();}
  await valid();await expect(amount).not.toHaveAttribute('aria-invalid','true');await page.locator('#mm-action').selectOption('withdraw');await expect(result).toBeEmpty();await submit.click();await expect(result).toContainText('830 UGX');
  await page.locator('#mm-provider').selectOption('airtel-tanzania');await expect(result).toBeEmpty();await expect(page.locator('#mm-currency')).toHaveText('TZS');await expect(page.locator('#mm-action')).toHaveValue('send');await submit.click();await expect(result).toContainText('10 TZS');
  // There is no advertised tariff-reset button. Verify standard form.reset() integration separately.
  await form.evaluate(node=>node.reset());await expect(result).toBeEmpty();await expect(amount).toHaveValue('');await expect(page.locator('#mm-provider')).toHaveValue('mtn-uganda');await expect(page.locator('#mm-currency')).toHaveText('UGX');await expect(page.locator('#mm-action')).toHaveValue('send');
  await valid();await page.evaluate(()=>{window.MobileMoneyQuoteEngine.quoteTariff=()=>{throw new Error('synthetic engine failure');};});await submit.click();await expect(result).toBeEmpty();await expect(status).toContainText(failure);
 });
 for(const response of ['network','invalid-catalog'])test(locale+' '+response+' failure has native feedback and no stale result',async({page})=>{
  await page.route('**/data/fintech/mobile-money-tariffs.json',route=>response==='network'?route.abort():route.fulfill({contentType:'application/json',body:'{"schemaVersion":1,"providers":[]}'}));
  await page.goto(route);await expect(page.locator('#mm-tariff-status')).toContainText(catalogFailure);await expect(page.locator('#mm-tariff-result')).toBeEmpty();await expect(page.locator('#mm-tariff-form')).toHaveAttribute('data-readiness','failed');
  for(const control of await page.locator('#mm-tariff-form input,#mm-tariff-form select,#mm-tariff-form button').all())await expect(control).toBeDisabled();
 });
}

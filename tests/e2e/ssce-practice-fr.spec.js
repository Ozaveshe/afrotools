const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
test('French practice works at 320px with translated teaching and shared saved progress',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto('/fr/tools/pratique-waec-neco/');
 await expect(page.locator('html')).toHaveAttribute('lang','fr');await page.getByRole('button',{name:'Commencer',exact:true}).click();
 await expect(page.locator('#practice-session h2')).toHaveText('Question 1 sur 24');await expect(page.locator('#practice-session legend')).toContainText('Une école achète 240 cahiers');await expect(page.locator('#practice-session fieldset')).toHaveAttribute('lang','fr');
 await page.getByRole('radio',{name:'C. 150',exact:true}).check();await page.getByRole('button',{name:'Vérifier la réponse',exact:true}).click();await expect(page.locator('.practice-feedback')).toHaveText('Bonne réponse.');
 await page.getByText('Voir l’explication',{exact:true}).click();await expect(page.locator('.practice-explanation')).toContainText('Cahiers restants : 240 − 90 = 150.');
 await page.getByRole('button',{name:'Enregistrer sur cet appareil',exact:true}).click();await expect(page.locator('#practice-status')).toContainText('Progression enregistrée');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le compte rendu',exact:true}).click();const report=await download;const text=await fs.readFile(await report.path(),'utf8');expect(text).toContain('Votre réponse : 150');expect(text).toContain('Cahiers restants');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.goto('/tools/ssce-practice/');await page.getByRole('button',{name:'Resume saved practice',exact:true}).click();await expect(page.locator('.practice-feedback')).toHaveText('Correct.');
});
test('English exercise language stays explicit while explanations and controls are French',async({page})=>{
 await page.goto('/fr/tools/pratique-waec-neco/');await page.getByLabel('Matière',{exact:true}).selectOption('English');await page.getByRole('button',{name:'Commencer',exact:true}).click();
 await expect(page.locator('#practice-session fieldset')).toHaveAttribute('lang','en');await expect(page.locator('#practice-session .practice-passage')).toHaveAttribute('lang','en');await expect(page.locator('#practice-session .practice-passage')).toContainText('a dependable plan would keep it open.');
 await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'Vérifier la réponse',exact:true}).click();await page.getByText('Voir l’explication',{exact:true}).click();await expect(page.locator('.practice-explanation')).toContainText('La bibliothèque fermait à quatre heures');
 await page.getByRole('button',{name:'Question suivante',exact:true}).click();await expect(page.locator('#practice-session h2')).toHaveText('Question 2 sur 16');
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const quick = require('../../assets/js/lib/ssce-practice-bank');
const written = require('../../assets/js/lib/ssce-written-bank');
const configs = {
  fr:{route:'/fr/tools/pratique-waec-neco/',start:'Commencer',check:'Vérifier la réponse',next:'Question suivante',results:'Voir les résultats',retry:'Reprendre les questions manquées',save:'Enregistrer sur cet appareil',report:'Télécharger le compte rendu',backup:'Télécharger la sauvegarde',correct:'Bonne réponse.',writtenSave:'Enregistrer la réponse sur cet appareil',writtenReport:'Télécharger le compte rendu des réponses rédigées',writtenBackup:'Télécharger la sauvegarde des réponses rédigées',reportHeading:'Ma réponse :'},
  sw:{route:'/sw/zana/mazoezi-waec-neco/',start:'Anza mazoezi',check:'Hakiki jibu',next:'Swali linalofuata',results:'Angalia matokeo',retry:'Rudia maswali uliyokosea',save:'Hifadhi maendeleo kwenye kifaa hiki',report:'Pakua ripoti ya mazoezi',backup:'Pakua nakala ya maendeleo',correct:'Sahihi.',writtenSave:'Hifadhi jibu kwenye kifaa hiki',writtenReport:'Pakua ripoti ya majibu ya kuandika',writtenBackup:'Pakua nakala ya majibu ya kuandika',reportHeading:'Jibu langu:'}
};
async function downloadText(page, name) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name, exact:true}).click();
  return fs.readFile(await (await pending).path(), 'utf8');
}
for (const [locale, c] of Object.entries(configs)) {
  test(`${locale}: quick practice grades, retries and exports across languages`, async ({page}) => {
    await page.goto(c.route); await page.locator('#practice-topic').selectOption('Number and proportion');
    await page.getByRole('button',{name:c.start,exact:true}).click();
    const questions = quick.questions.filter(q => q.subject === 'Mathematics' && q.topic === 'Number and proportion');
    for (const [i, q] of questions.entries()) {
      await expect(page.locator('#practice-session fieldset')).toHaveAttribute('lang',locale);
      await page.getByRole('radio').nth(i === 0 ? (q.answer+1)%q.options.length : q.answer).check();
      await page.getByRole('button',{name:c.check,exact:true}).click();
      await page.getByRole('button',{name:i===questions.length-1?c.results:c.next,exact:true}).click();
    }
    await expect(page.locator('.practice-score')).toContainText(String(questions.length-1));
    const report = await downloadText(page,c.report);
    expect(report).toContain(locale==='fr'?'Votre réponse :':'Jibu lako:');
    const backup = JSON.parse(await downloadText(page,c.backup));
    expect(backup.ids).toEqual(questions.map(q=>q.id));
    await page.getByRole('button',{name:c.retry,exact:true}).click();
    await page.getByRole('radio').nth(questions[0].answer).check();
    await page.getByRole('button',{name:c.check,exact:true}).click();
    await page.getByRole('button',{name:c.save,exact:true}).click();
    await page.goto('/tools/ssce-practice/');
    await page.locator('#practice-resume').click();
    await expect(page.locator('.practice-feedback')).toHaveText('Correct.');
    await page.goto(c.route); await page.locator('#practice-subject').selectOption('English');
    await page.getByRole('button',{name:c.start,exact:true}).click();
    await expect(page.locator('#practice-session fieldset')).toHaveAttribute('lang','en');
    await expect(page.locator('#practice-session .practice-passage')).toHaveAttribute('lang','en');
    await expect(page.locator('#practice-session legend')).toHaveText(quick.questions.find(q=>q.subject==='English').prompt);
  });

  test(`${locale}: all written tasks, diagrams, private exports and backup import at mobile widths`, async ({page}, testInfo) => {
    test.setTimeout(120000);
    const errors=[], sensitiveRequests=[]; const marker='SYNTHETIC_SSCE_PRIVATE_84926';
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if ((request.url()+' '+(request.postData()||'')).includes(marker)) sensitiveRequests.push(request.url()); });
    await page.setViewportSize({width:locale==='fr'?320:375,height:850});
    await page.goto(c.route);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    const visited=[];
    for (const collection of [...new Set(written.items.map(q=>q.collection))]) {
      await page.locator('#written-collection').selectOption(collection);
      for (const q of written.items.filter(item=>item.collection===collection)) {
        await page.locator('#written-task').selectOption(q.id); visited.push(q.id);
        await expect(page.locator('.written-prompt')).toHaveAttribute('lang',q.subject==='English'||q.year===2022?'en':locale);
        if(q.subject==='English') await expect(page.locator('.written-prompt')).toHaveText(q.prompt);
        if(q.passage) await expect(page.locator('#written-editor .practice-passage p')).toHaveAttribute('lang','en');
        await expect(page.locator('#written-editor input[type="checkbox"]')).toHaveCount(q.checks.length);
        if(q.figure) {
          await expect(page.locator('svg.written-diagram')).toHaveAttribute('aria-label',locale==='fr'?/Triangle|cercle/:/Pembetatu|duara/);
          await expect(page.locator('svg.written-diagram')).not.toContainText('Not to scale');
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
      }
    }
    expect(visited.length).toBe(written.items.length);
    await page.locator('#written-collection').selectOption('Mathematics written practice');
    await page.locator('#written-task').selectOption('written-m1');
    await page.locator('#written-answer').fill(marker+' 45; 1.68 × 10¹');
    await page.locator('#written-editor input[type="checkbox"]').first().focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#written-editor input[type="checkbox"]').first()).toBeChecked();
    await page.getByRole('button',{name:c.writtenSave,exact:true}).click();
    const report = await downloadText(page,c.writtenReport);
    expect(report).toContain(c.reportHeading); expect(report).toContain(marker); expect(report).toContain('https://www.waeconline.org.ng/');
    const backupText = await downloadText(page,c.writtenBackup); const backup=JSON.parse(backupText);
    expect(backup.entries['written-m1'].answer).toContain(marker); expect(backup.entries['written-m1'].checks).toEqual([true,false]);
    await page.screenshot({path:testInfo.outputPath(`ssce-${locale}-mobile.png`),fullPage:true});
    await page.reload(); await expect(page.locator('#written-answer')).toHaveValue(marker+' 45; 1.68 × 10¹');
    await page.goto('/tools/ssce-practice/'); await expect(page.locator('#written-answer')).toHaveValue(marker+' 45; 1.68 × 10¹');
    await page.evaluate(()=>localStorage.removeItem('afrotools.ssceWritten.v1'));
    await page.goto(c.route);
    await page.locator('#written-import').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(backupText)});
    await expect(page.locator('#written-answer')).toHaveValue(marker+' 45; 1.68 × 10¹');
    await page.getByRole('button',{name:c.writtenSave,exact:true}).click();
    await page.locator('#written-import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
    await expect(page.locator('#written-status')).toContainText(locale==='fr'?'Sauvegarde non ouverte':'Nakala haikufunguliwa');
    await expect(page.locator('#written-answer')).toHaveValue(marker+' 45; 1.68 × 10¹');
    expect(sensitiveRequests).toEqual([]); expect(errors).toEqual([]);
  });
}
for (const [locale,c] of Object.entries(configs)) test(`${locale}: new Physics assessment and native guidance round-trip`, async({page})=>{await page.goto(c.route);await page.locator('#practice-subject').selectOption('Physics');await page.locator('#practice-topic').selectOption('Electric circuits');await page.getByRole('button',{name:c.start,exact:true}).click();const questions=quick.questions.filter(q=>q.subject==='Physics'&&q.topic==='Electric circuits');for(const [i,q] of questions.entries()){await expect(page.locator('#practice-session fieldset')).toHaveAttribute('lang','en');await page.getByRole('radio').nth(q.answer).check();await page.getByRole('button',{name:c.check,exact:true}).click();await page.getByRole('button',{name:i===questions.length-1?c.results:c.next,exact:true}).click();}const backup=JSON.parse(await downloadText(page,c.backup));expect(backup.ids).toEqual(questions.map(q=>q.id));const report=await downloadText(page,c.report);expect(report).toContain(questions[0].prompt);expect(report).toContain(locale==='fr'?'résistance':'ukinzani');});

for (const [locale,c] of Object.entries(configs)) test(`${locale}: WAEC 2021 selected Mathematics guides are translated and hidden until opened`,async({page})=>{
  await page.setViewportSize({width:375,height:820});await page.goto(c.route);
  await page.locator('#written-collection').selectOption('WAEC 2021 Mathematics companion');
  for (const [id,pattern,number] of [['waec-2021-mathematics-p2-q1a',/20[ ,]?375/,1],['waec-2021-mathematics-p2-q1b',/42[,.]9\s*%/,1],['waec-2021-mathematics-p2-q11',/7[,.]30.*2[,.]04/,11]]) {
    await page.locator('#written-task').selectOption(id);
    await expect(page.locator('.written-prompt')).toHaveAttribute('lang',locale);
    await expect(page.locator('#written-editor a')).toHaveAttribute('href',`https://www.waeconline.org.ng/e-Learning/Mathematics/maths233mq${number}.html`);
    await expect(page.locator('.written-explanation')).not.toHaveAttribute('open','');
    await page.locator('.written-explanation summary').click();
    await expect(page.locator('.written-explanation')).toContainText(pattern);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

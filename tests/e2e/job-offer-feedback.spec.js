const { test, expect } = require('@playwright/test');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
for (const [locale, route] of [['en','/tools/job-offer-evaluator/'],['fr','/fr/tools/evaluateur-offre-emploi/'],['sw','/sw/zana/tathmini-ya-ofa-ya-kazi/']]) {
  test(`${locale} invalid comparison identifies fields and preserves typing focus`, async ({ page }) => {
    await page.setViewportSize({width:320,height:900});
    await page.emulateMedia({colorScheme:locale==='en'?'light':'dark'});
    await page.goto(route);
    await page.locator('#joe-calc').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[name=currency]')).toBeFocused();
    await expect(page.locator('[name=currency]')).toHaveAttribute('aria-invalid','true');
    await expect(page.locator('[name=currency]')).toHaveAttribute('aria-describedby','joe-status');
    await expect(page.locator('[name=currency]')).toHaveCSS('border-top-color',locale==='en'?'rgb(180, 35, 24)':'rgb(255, 180, 169)');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await page.locator('[name=currency]').fill('TEST');
    const pay = page.locator('[data-offer]').first().locator('[name=monthlyPay]');
    await pay.fill('-1');
    await page.locator('#joe-calc').click();
    await expect(pay).toBeFocused();
    await pay.fill('100');
    await expect(pay).toBeFocused();
    await expect(pay).not.toHaveAttribute('aria-invalid','true');
    const rating = page.locator('[data-offer]').nth(1).locator('[name=team]');
    await rating.fill('11');
    await page.locator('#joe-calc').click();
    await expect(rating).toBeFocused();
    await rating.fill('7');
    for(const input of await page.locator('[data-weights] input[type=number]').all()) await input.fill('0');
    await page.locator('#joe-calc').click();
    await expect(page.locator('[data-weights] [name=financial]')).toBeFocused();
    await page.locator('[data-weights] [name=financial]').fill('40');
    await page.locator('#joe-calc').click();
    await expect(page.locator('#joe-results')).toHaveClass(/on/);
    await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);
  });
  test(`${locale} unavailable clipboard has feedback and leaves JSON download working`, async ({page}) => {
    const errors=[];page.on('pageerror',e=>errors.push(e.name));
    await page.goto(route);await page.locator('[name=currency]').fill('TEST');await page.locator('#joe-calc').click();
    for(const mode of ['missing','reject','throw']) {
      await page.evaluate(mode=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:()=>{if(mode==='throw')throw new Error('Unavailable');return Promise.reject(new DOMException('Denied','NotAllowedError'));}}});document.getElementById('joe-status').textContent='';},mode);
      await page.locator('#joe-copy').click();await expect(page.locator('#joe-status')).toContainText('JSON');
    }
    const pending=page.waitForEvent('download');await page.locator('#joe-json').click();expect((await pending).suggestedFilename()).toBe('job-offer-comparison.json');expect(errors).toEqual([]);
  });
  test(`${locale} clear restores default weights and removes previous results`, async ({page}) => {
    await page.goto(route);
    await page.locator('[name=currency]').fill('TEST');
    await page.locator('[data-weights] [name=financial]').fill('91');
    await page.locator('#joe-calc').click();
    await page.locator('#joe-clear').click();
    await expect(page.locator('#joe-results')).not.toHaveClass(/on/);
    await expect(page.locator('[name=currency]')).toHaveValue('');
    expect(await page.locator('[data-weights] input[type=number]').evaluateAll(xs=>xs.map(x=>Number(x.value)))).toEqual([40,20,15,10,10,5]);
    expect(await page.locator('[data-offer] input').evaluateAll(xs=>xs.every(x=>x.value===''))).toBe(true);
  });
  test(`${locale} delayed copy cannot overwrite newer clear or validation status`, async ({page}) => {
    await page.goto(route);
    for (const outcome of ['resolve','reject']) for (const action of ['clear','invalid','edited','recompare']) {
      await page.locator('[name=currency]').fill('TEST');
      await page.locator('#joe-calc').click();
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((resolve,reject)=>{window.finishSyntheticCopy=resolve;window.rejectSyntheticCopy=()=>reject(new Error("Denied"));})}}));
      await page.locator('#joe-copy').click();
      if(action==='clear') await page.locator('#joe-clear').click();
      else if(action==='recompare') await page.locator('#joe-calc').click();
      else {
        await page.locator('[name=currency]').fill('');
        if(action==='invalid') await page.locator('#joe-calc').click();
      }
      const before=await page.locator('#joe-status').textContent();
      await page.evaluate(async outcome=>{if(outcome==='resolve')window.finishSyntheticCopy();else window.rejectSyntheticCopy();await Promise.resolve();},outcome);
      await expect(page.locator('#joe-status')).toHaveText(before);
    }
  });

}

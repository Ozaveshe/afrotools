const {test,expect}=require('@playwright/test');
const bank=require('../../data/jamb/pools/practice-pool.json');
const subjects=new Set(bank.questions.map(q=>q.subject));
const routes=[...new Set(bank.questions.filter(q=>subjects.has(q.subject)).map(q=>q.subject+'/'+q.year))];

test('the reviewed bank supplies actual paper routes for browser coverage',()=>{
  expect(routes.length).toBeGreaterThan(0);
});

for(const width of [320,390,1440]) for(const route of routes) test(`reviewed ${route} works at ${width}px`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:900});
  await page.context().addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
    const [subject,year]=route.split('/');
    const expected=bank.questions.filter(q=>q.subject===subject&&String(q.year)===year);
    const response=await page.goto('/jamb/'+route+'/');expect(response.status()).toBe(200);
    await expect(page.locator('[data-reviewed-question]')).toHaveCount(expected.length);
    await expect(page.locator('[data-reviewed-question] details[open]')).toHaveCount(0);
    for(const illustrated of expected.filter(q=>q.image)){
      const figure=page.locator('[data-reviewed-question="'+illustrated.id+'"] img');
      await expect(figure).toBeVisible();
      await expect(figure).toHaveJSProperty('complete',true);
      expect(await figure.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
    }
    const q=expected.find(q=>!q.image)||expected[0];expect(q).toBeTruthy();
    const card=page.locator('[data-reviewed-question="'+q.id+'"]');
    await card.locator('summary').focus();await card.locator('summary').press('Enter');
    await expect(card.getByText(q.explanation||q.ai_explanation,{exact:true})).toBeVisible();
    await expect(card.locator('details')).toContainText(q.answer+': '+q.options[q.answer]);
    await card.locator('summary').press('Enter');
    await expect(card.locator('details')).not.toHaveAttribute('open','');
    expect(await page.locator('main').innerText()).not.toMatch(/Source note:|repair history|original key|imported option/i);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);
  expect(errors).toEqual([]);
});

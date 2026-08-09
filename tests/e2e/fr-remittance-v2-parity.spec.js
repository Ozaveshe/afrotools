const {test,expect}=require('@playwright/test');
const fs=require('fs');

const route='/fr/tools/transfert-v2/';
async function fillQuote(page,letter,values={}){
  const row=Object.assign({label:letter==='a'?'Devis A':'Devis B',send:'USD',debit:'500',receive:'NGN',recipient:letter==='a'?'780000':'790000',fee:'5',payout:'bank',delivery:'60',observed:letter==='a'?'2026-08-08T10:00':'2026-08-08T10:05',expires:''},values);
  for(const [id,value] of Object.entries(row)){
    const locator=page.locator(`#rm-${letter}-${id}`);
    if(id==='payout')await locator.selectOption(value);else await locator.fill(value);
  }
}
async function calculate(page){await fillQuote(page,'a');await fillQuote(page,'b');await page.locator('#rm-form button[type=submit]').click();}

test('French remittance-v2 uses the shared checked-quote contract and local JSON reopen',async({page})=>{
  const errors=[];const remote=[];
  page.on('console',(message)=>{if(message.type()==='error')errors.push(message.text());});
  page.on('pageerror',(error)=>errors.push(error.message));
  page.on('request',(request)=>{const url=new URL(request.url());if(url.hostname!=='127.0.0.1')remote.push(request.url());});
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page.locator('main')).not.toContainText(/Wise|Remitly|Western Union|classement de prestataire à jour/i);
  const storageBefore=await page.evaluate(()=>JSON.stringify(localStorage));
  await calculate(page);
  await expect(page.locator('#rm-primary-value')).toContainText('790');
  await expect(page.locator('.rm-result[data-highest=true]')).toHaveCount(1);
  const exact=await page.evaluate(()=>({
    firstRate:Number(document.querySelectorAll('.rm-result')[0].querySelectorAll('.rm-metric strong')[2].textContent.split(' ')[0].replace(/\s/g,'').replace(',','.')),
    rows:document.querySelectorAll('.rm-result').length
  }));
  expect(exact.rows).toBe(2);
  expect(exact.firstRate).toBe(1560);

  const downloadEvent=page.waitForEvent('download');
  await page.locator('#rm-json').click();
  const download=await downloadEvent;
  expect(download.suggestedFilename()).toBe('remittance-v2-quote-comparison.json');
  const payload=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  expect(payload.methodology).toBe('user-entered-remittance-quotes');
  expect(payload.result.groups[0].highestRecipientAmount).toBe(790000);
  const reopened=await page.evaluate((input)=>window.RemittanceQuoteComparatorEngine.calculate({asOf:input.asOf,quotes:input.quotes.map((row)=>({label:row.label,sendCurrency:row.sendCurrency,totalDebit:row.totalDebit,receiveCurrency:row.receiveCurrency,recipientAmount:row.recipientAmount,statedFee:row.statedFee,payoutMethod:row.payoutMethod,deliveryMinutes:row.deliveryMinutes,observedAt:row.observedAt,expiresAt:row.expiresAt}))}),payload.result);
  expect(reopened.groups[0].highestRecipientAmount).toBe(790000);
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(storageBefore);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('invalid values fail closed and reset closes the third quote',async({page})=>{
  await page.goto(route);
  await fillQuote(page,'a');await fillQuote(page,'b',{recipient:'0'});
  await page.locator('#rm-form button[type=submit]').click();
  await expect(page.locator('#rm-error')).toBeVisible();
  await expect(page.locator('#rm-error')).toContainText('valeurs valides');
  await expect(page.locator('#rm-primary-value')).toHaveText('—');
  await page.locator('#rm-third').check();
  await expect(page.locator('#rm-quote-c')).toBeVisible();
  await page.locator('#rm-form button[type=reset]').click();
  await expect(page.locator('#rm-third')).not.toBeChecked();
  await expect(page.locator('#rm-quote-c')).toBeHidden();
  await expect(page.locator('#rm-c-label')).toBeDisabled();
  await expect(page.locator('#rm-a-label')).toHaveValue('');
});

for(const width of [320,375])test(`French remittance-v2 reflows at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:920});await page.goto(route);await calculate(page);
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,minControl:Math.min(...Array.from(document.querySelectorAll('button,input,select')).filter((node)=>node.offsetParent!==null).map((node)=>node.getBoundingClientRect().height))}));
  expect(layout.scroll).toBeLessThanOrEqual(layout.client+1);expect(layout.minControl).toBeGreaterThanOrEqual(44);
});

test('French remittance-v2 supports 200 percent reflow, themes, keyboard and metadata',async({browser})=>{
  const context=await browser.newContext({colorScheme:'dark',reducedMotion:'reduce',viewport:{width:640,height:920}});const page=await context.newPage();
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('#rm-theme')).toHaveAttribute('aria-pressed','true');
  await page.locator('#rm-theme').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.evaluate(()=>{document.body.style.zoom='200%';});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
  expect(await page.locator('#rm-form input:not([type=checkbox]),#rm-form select').evaluateAll((nodes)=>nodes.every((node)=>{const label=document.querySelector(`label[for="${node.id}"]`);return !!label&&label.textContent.trim().length>0;}))).toBe(true);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://afrotools.com/fr/tools/transfert-v2/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content','https://afrotools.com/assets/img/tools/remittance-v2.webp');
  const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());expect(schema.inLanguage).toBe('fr');expect(schema.url).toBe('https://afrotools.com/fr/tools/transfert-v2/');
  await context.close();
});

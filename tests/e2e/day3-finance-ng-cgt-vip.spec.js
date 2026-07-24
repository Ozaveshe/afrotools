const { test, expect } = require('@playwright/test');

const routes = [
  { name: 'en', path: '/tools/ng-cgt/', lang: 'en', width: 320, heading: 'Estimate disposal tax without the repealed flat 10% shortcut.', button: 'Calculate gain estimate' },
  { name: 'fr', path: '/fr/tools/ng-plus-value/', lang: 'fr', width: 360, heading: 'Estimez la plus-value sans appliquer l’ancien forfait de 10 %.', button: 'Calculer la plus-value' },
  { name: 'ha', path: '/ha/kayan-aiki/cgt-najeriya/', lang: 'ha', width: 390, heading: 'Kimanta harajin ribar kadara ba tare da tsohon flat 10% ba.', button: 'Lissafa ribar kadara' }
];

function channel(value){value/=255;return value<=.03928?value/12.92:Math.pow((value+.055)/1.055,2.4)}
function contrast(a,b){const parse=value=>value.match(/\d+/g).slice(0,3).map(Number),x=parse(a),y=parse(b),lx=.2126*channel(x[0])+.7152*channel(x[1])+.0722*channel(x[2]),ly=.2126*channel(y[0])+.7152*channel(y[1])+.0722*channel(y[2]);return(Math.max(lx,ly)+.05)/(Math.min(lx,ly)+.05)}

for(const route of routes){
  test(`${route.name} Nigeria CGT route is native, local and mobile-safe`,async({page})=>{
    const errors=[],nonGet=[],dataRequests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    page.on('request',r=>{if(r.method()!=='GET')nonGet.push(`${r.method()} ${r.url()}`);if(/\.netlify\/functions|\/api\//i.test(r.url()))dataRequests.push(r.url())});
    await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
    await page.setViewportSize({width:route.width,height:820});
    await page.goto(route.path,{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang',route.lang);
    await expect(page.locator('h1')).toHaveText(route.heading);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(4);
    await page.locator('[name="scopeConfirmed"]').check();
    await page.getByRole('button',{name:route.button}).click();
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-tax]')).toHaveAttribute('data-amount','1410000');
    await page.locator('[name="proceeds"]').focus();
    expect(parseFloat(await page.locator('[name="proceeds"]').evaluate(n=>getComputedStyle(n).outlineWidth))).toBeGreaterThanOrEqual(3);
    const colors=await page.locator('.cgt-button').first().evaluate(n=>{const s=getComputedStyle(n);return{fg:s.color,bg:s.backgroundColor}});
    expect(contrast(colors.fg,colors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect((await page.locator('body').innerText())).not.toMatch(/\uFFFD|\u00C3.|\u00C2.|\u00E2\u20AC/);
    expect(dataRequests).toEqual([]);expect(nonGet).toEqual([]);expect(errors).toEqual([]);
    await page.screenshot({path:`artifacts/day3-finance-ng-cgt/ng-cgt-${route.name}-${route.width}-dark.png`,fullPage:true});
  });
}

test('share thresholds, reinvestment, company classification and residence scope are explicit',async({page})=>{
  await page.goto('/tools/ng-cgt/');
  await page.locator('[name="scopeConfirmed"]').check();
  await page.locator('[name="assetType"]').selectOption('shares');
  await page.locator('[name="aggregateShareProceeds"]').fill('149999999');
  await page.locator('[name="aggregateShareGain"]').fill('10000000');
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  await expect(page.locator('[data-tax]')).toHaveAttribute('data-amount','0');
  await expect(page.locator('[data-relief]')).toContainText('threshold');
  await page.locator('[name="aggregateShareProceeds"]').fill('150000000');
  await page.locator('[name="reinvestedProceeds"]').fill('5000000');
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  await expect(page.locator('[data-taxable]')).toContainText('6,750,000');
  await page.locator('[name="sellerType"]').selectOption('company');
  await page.locator('[name="assetType"]').selectOption('general');
  await page.locator('[name="turnover"]').fill('50000000');
  await page.locator('[name="fixedAssets"]').fill('250000000');
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  await expect(page.locator('[data-tax]')).toHaveAttribute('data-amount','0');
  await page.locator('[name="professionalServices"]').check();
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  await expect(page.locator('[data-tax]')).toHaveAttribute('data-amount','2700000');
});

test('scope validation and local TXT export are keyboard-safe',async({page})=>{
  await page.goto('/tools/ng-cgt/');
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await expect(page.locator('[data-error]')).toContainText('Confirm the 2026');
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole('button',{name:'Calculate gain estimate'}).click();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download TXT'}).click();
  const download=await pending;expect(download.suggestedFilename()).toBe('nigeria-cgt-estimate.txt');
  const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk.toString('utf8');
  expect(text).toContain('Estimated incremental tax');expect(text).toContain('Planning estimate only');
});

test('English calculator reflows at 200% text in light mode',async({page})=>{
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});await page.setViewportSize({width:375,height:820});
  await page.goto('/tools/ng-cgt/',{waitUntil:'networkidle'});await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});
  expect(await page.locator('main').evaluate(n=>n.scrollWidth-n.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.locator('main *').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&(n.getBoundingClientRect().left<0||n.getBoundingClientRect().right>innerWidth)).map(n=>n.tagName))).toEqual([]);
  await page.screenshot({path:'artifacts/day3-finance-ng-cgt/ng-cgt-en-375-light-200pct.png',fullPage:true});
});

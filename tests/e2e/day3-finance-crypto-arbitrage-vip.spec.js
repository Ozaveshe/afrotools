const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');

function localInput(offsetMinutes){
  const d=new Date(Date.now()+offsetMinutes*60000);
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
async function fillValid(page,{knownExpiry=true}={}){
  await page.locator('#aw-asset').fill('USDT');
  await page.locator('#aw-amount').fill('100');
  await page.locator('#aw-buy-label').fill('Receipt A');
  await page.locator('#aw-sell-label').fill('Receipt B');
  await page.locator('#aw-buy-debit').fill('150000');
  await page.locator('#aw-sell-credit').fill('154000');
  await page.locator('#aw-costs').fill('1000');
  await page.locator('#aw-buy-checked').fill(localInput(-10));
  await page.locator('#aw-sell-checked').fill(localInput(-9));
  if(knownExpiry){
    await page.locator('#aw-buy-expiry').fill(localInput(30));
    await page.locator('#aw-sell-expiry').fill(localInput(31));
  }
  await page.locator('#aw-confirm').check();
}
async function headingContrast(page){
  return page.locator('.aw-hero h1').evaluate(heading=>{
    function channels(value){const parts=value.match(/[\d.]+/g)||[];return parts.slice(0,3).map(Number);}
    function luminance(value){return channels(value).map(channel=>{const n=channel/255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4);}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);}
    const foreground=getComputedStyle(heading).color;
    let background='rgb(255, 255, 255)';
    for(let node=heading.parentElement;node;node=node.parentElement){
      const candidate=getComputedStyle(node).backgroundColor;
      const values=candidate.match(/[\d.]+/g)||[];
      const transparent=candidate==='transparent'||(candidate.startsWith('rgba')&&Number(values[3])===0);
      if(candidate&&!transparent){background=candidate;break;}
    }
    const light=Math.max(luminance(foreground),luminance(background));
    const dark=Math.min(luminance(foreground),luminance(background));
    return{foreground,background,ratio:(light+.05)/(dark+.05)};
  });
}

for(const route of ['/crypto/arbitrage/','/fr/crypto/arbitrage/']){
  test(`${route} is native, local-only, responsive and deterministic`,async({page})=>{
    const runtime=[],dataRequests=[];
    page.on('console',m=>{if(m.type()==='error')runtime.push(m.text());});
    page.on('pageerror',e=>runtime.push(e.message));
    page.on('request',r=>{if(['fetch','xhr','websocket'].includes(r.resourceType()))dataRequests.push(r.url());});
    await page.setViewportSize({width:375,height:812});
    await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
    await page.goto(route);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    const lightContrast=await headingContrast(page);
    expect(lightContrast.ratio,JSON.stringify(lightContrast)).toBeGreaterThanOrEqual(4.5);
    if(route==='/crypto/arbitrage/')await page.locator('.aw-hero').screenshot({path:'test-results/row114-375-top-light.png'});
    await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
    const darkContrast=await headingContrast(page);
    expect(darkContrast.ratio,JSON.stringify(darkContrast)).toBeGreaterThanOrEqual(4.5);
    await fillValid(page);
    await page.locator('#aw-form button[type=submit]').click();
    await expect(page.locator('#aw-net')).toContainText('3');
    await expect(page.locator('#aw-return')).toHaveText('2.00%');
    await expect(page.locator('#aw-break-even')).toContainText('151');
    await expect(page.locator('#aw-status')).toHaveAttribute('data-state','ready');
    if(route==='/crypto/arbitrage/')await page.locator('.aw-card').screenshot({path:'test-results/row114-375-result-dark.png'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    expect(dataRequests).toEqual([]);
    expect(runtime).toEqual([]);
  });
}

test('unknown expiry warns; expired and future receipts fail closed',async({page})=>{
  await page.goto('/crypto/arbitrage/');
  await fillValid(page,{knownExpiry:false});
  await page.locator('#aw-form button[type=submit]').click();
  await expect(page.locator('#aw-status')).toHaveAttribute('data-state','warning');
  await expect(page.locator('#aw-json')).toBeEnabled();
  await page.locator('#aw-buy-expiry').fill(localInput(-1));
  await page.locator('#aw-form button[type=submit]').click();
  await expect(page.locator('#aw-status')).toContainText('expired');
  await expect(page.locator('#aw-results')).toBeHidden();
  await expect(page.locator('#aw-json')).toBeDisabled();
  await page.locator('#aw-buy-expiry').fill('');
  await page.locator('#aw-buy-checked').fill(localInput(10));
  await page.locator('#aw-form button[type=submit]').click();
  await expect(page.locator('#aw-status')).toContainText('future');
  await expect(page.locator('#aw-pdf')).toBeDisabled();
});

test('CSV is formula-safe, JSON is structured and PDF is parser-readable',async({page})=>{
  await page.goto('/crypto/arbitrage/');
  await fillValid(page);
  await page.locator('#aw-buy-label').fill('=unsafe');
  await page.locator('#aw-form button[type=submit]').click();
  const [csvDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#aw-csv').click()]);
  const csv=fs.readFileSync(await csvDownload.path(),'utf8');
  expect(csv).toContain('"\'=unsafe"');
  expect(csv).toContain('"net_modeled_difference_ngn","3000"');
  const [jsonDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#aw-json').click()]);
  const json=JSON.parse(fs.readFileSync(await jsonDownload.path(),'utf8'));
  expect(json.outputs.netModeledDifferenceNGN).toBe(3000);
  expect(json.inputs.sameAmountAndAllInConfirmed).toBe(true);
  expect(JSON.stringify(json)).not.toContain('wallet');
  const [pdfDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#aw-pdf').click()]);
  const parsed=await pdfParse(fs.readFileSync(await pdfDownload.path()));
  expect(parsed.text).toContain('Net modeled difference');
  expect(parsed.text).toContain('sell credit - buy debit - external costs');
  expect(parsed.text).toContain('not a live quote');
});

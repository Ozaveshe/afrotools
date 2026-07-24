const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

function rgb(value) {
  const match = String(value).match(/[\d.]+/g);
  return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
}
function luminance(value) {
  return rgb(value).map(channel => channel / 255).map(channel => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const routes = [
  {name:'en',path:'/tools/loan-compare/',lang:'en',button:'Compare offers',canonical:'https://afrotools.com/tools/loan-compare/',shareTitle:'Loan Comparison Calculator',pdf:'Loan Offer Comparison Report'},
  {name:'fr',path:'/fr/tools/comparateur-prets/',lang:'fr',button:'Comparer les offres',canonical:'https://afrotools.com/fr/tools/comparateur-prets/',shareTitle:'Comparateur de prêts',pdf:'Rapport de comparaison des offres de prêt'},
  {name:'sw',path:'/sw/zana/kilinganisha-mikopo/',lang:'sw',button:'Linganisha ofa',canonical:'https://afrotools.com/sw/zana/kilinganisha-mikopo/',shareTitle:'Kilinganisha Mikopo',pdf:'Ripoti ya Kulinganisha Ofa za Mkopo'}
];

for (const route of routes) test(`${route.name} loan comparison is private, like-for-like and PDF-capable`, async ({page}) => {
  const errors=[];const nonGet=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.method()!=='GET')nonGet.push(`${r.method()} ${r.url()}`);});
  await page.addInitScript(()=>{window.__sharedPayload=null;Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.__sharedPayload=payload;}});});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.setViewportSize({width:375,height:812});await page.goto(route.path,{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang',route.lang);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',route.canonical);
  expect(await page.locator('link[rel="alternate"]').count()).toBe(4);
  await page.locator('#confirmedAssumptions').focus();
  const confirmationStyles = await page.locator('.lc-check').evaluate(node => {
    const card = getComputedStyle(node);
    const strong = getComputedStyle(node.querySelector('strong'));
    const checkbox = getComputedStyle(node.querySelector('input'));
    return {background:card.backgroundColor,text:card.color,border:card.borderTopColor,strong:strong.color,accent:checkbox.accentColor,outlineStyle:checkbox.outlineStyle,outlineWidth:checkbox.outlineWidth,outlineColor:checkbox.outlineColor};
  });
  expect(contrast(confirmationStyles.text, confirmationStyles.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(confirmationStyles.strong, confirmationStyles.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(confirmationStyles.border, confirmationStyles.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(confirmationStyles.outlineColor, confirmationStyles.background)).toBeGreaterThanOrEqual(3);
  expect(confirmationStyles.accent).not.toBe('auto');expect(confirmationStyles.outlineStyle).toBe('solid');expect(parseFloat(confirmationStyles.outlineWidth)).toBeGreaterThanOrEqual(3);
  await page.evaluate(()=>{if(!document.querySelector('afro-site-assistant'))document.body.appendChild(document.createElement('afro-site-assistant'));});await expect(page.locator('afro-site-assistant')).toBeHidden();
  const cards=page.locator('.lc-offer');await cards.nth(0).locator('[name="name"]').fill('Alpha');await cards.nth(1).locator('[name="name"]').fill('Beta');await cards.nth(1).locator('[name="annualRate"]').fill('18');await cards.nth(1).locator('[name="paidUpfront"]').fill('2500');
  await page.getByRole('button',{name:route.button}).click();await expect(page.locator('#status')).toHaveClass(/error/);await page.locator('#confirmedAssumptions').check();await page.getByRole('button',{name:route.button}).click();
  await expect(page.locator('#resultTitle')).toContainText('Alpha');await expect(page.locator('#resultRows tr')).toHaveCount(2);await expect(page.locator('#resultRows')).toContainText(/100.?000/);
  const downloadPromise=page.waitForEvent('download');await page.locator('#pdfBtn').click();const download=await downloadPromise;const parsed=await pdfParse(fs.readFileSync(await download.path()));expect(parsed.text).toContain(route.pdf);expect(parsed.text).toContain('Alpha');expect(parsed.text).toContain('Beta');
  await page.locator('#shareBtn').click();expect(await page.evaluate(()=>window.__sharedPayload)).toEqual({title:route.shareTitle,url:route.canonical});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/loan|pret/i.test(k)))).toEqual([]);
  const html=await page.locator('html').evaluate(n=>n.outerHTML);expect(html).not.toMatch(/SaveState|fetch\(|XMLHttpRequest|\.netlify\/functions|AI advisor|GTBank|FairMoney|Tala/i);expect(nonGet).toEqual([]);expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/loan-compare-${route.name}-375-dark.png`,fullPage:true});
});

test('different principal or term never receives a winner', async ({page})=>{
  await page.setViewportSize({width:360,height:780});await page.goto('/tools/loan-compare/');const cards=page.locator('.lc-offer');await cards.nth(1).locator('[name="amount"]').fill('120000');await page.locator('#confirmedAssumptions').check();await page.getByRole('button',{name:'Compare offers'}).click();await expect(page.locator('#resultTitle')).toHaveText('Review scenario differences');await expect(page.locator('#resultNote')).toContainText('no winner');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('loan comparison widget is correct and stacked at 320px dark',async({page})=>{
  const errors=[];const nonGet=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.method()!=='GET')nonGet.push(r.method());});await page.setViewportSize({width:320,height:700});await page.goto('/widgets/iframe/financial-loan-compare.html?theme=dark',{waitUntil:'networkidle'});await expect(page.locator('body')).toHaveClass(/dark/);await page.locator('#aw-rate1').fill('0');await page.locator('#aw-rate2').fill('12');await page.locator('#aw-confirm').check();await page.locator('#aw-calc').click();await expect(page.locator('#aw-verdict')).toContainText('Offer 1 has the lower entered cost');await expect(page.locator('#aw-verdict')).toContainText('8,333.33 / 100,000.00');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);expect(nonGet).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:'test-results/loan-compare-widget-320-dark.png',fullPage:true});
});

test('French widget parent is dark-safe and publishes real routes',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.setViewportSize({width:375,height:812});await page.goto('/fr/widgets/comparateur-prets/',{waitUntil:'networkidle'});await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://afrotools.com/fr/widgets/comparateur-prets/');await expect(page.locator('.fr-widget-code')).toContainText('financial-loan-compare.html');await expect(page.locator('.fr-widget-card-grid')).not.toContainText('comparateur-prêts');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);expect(errors).toEqual([]);await page.screenshot({path:'test-results/loan-compare-fr-widget-parent-375-dark.png',fullPage:true});
});

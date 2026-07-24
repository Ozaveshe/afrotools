const { test, expect } = require('@playwright/test');
const cases = [
  { path: '/somalia/so-paye', lang: 'en', button: 'Calculate take-home', title: 'Somalia Salary Tax Calculator', canonical: 'https://afrotools.com/somalia/so-paye' },
  { path: '/fr/somalia/so-paye', lang: 'fr', button: 'Calculer le net', title: 'Calculateur d’impôt sur salaire Somalie', canonical: 'https://afrotools.com/fr/somalia/so-paye' },
  { path: '/sw/somalia/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa malipo halisi', title: 'Kikokotoo cha Kodi ya Mshahara Somalia', canonical: 'https://afrotools.com/sw/somalia/kikokotoo-kodi-mshahara/' }
];
for (const item of cases) test(`Somalia ${item.lang} federal calculator is correct, private, dark and mobile-safe`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' }); await page.setViewportSize({ width: 375, height: 812 });
  const errors=[]; const writes=[]; page.on('console', m => { if(m.type()==='error') errors.push(m.text()); }); page.on('request', r => { if(r.method()!=='GET') writes.push(`${r.method()} ${r.url()}`); });
  await page.addInitScript(() => { window.__sharedPayload=null; Object.defineProperty(navigator,'share',{configurable:true,value:async p=>{window.__sharedPayload=p;}}); });
  await page.goto(item.path); await expect(page.locator('html')).toHaveAttribute('lang', item.lang); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
  await page.locator('#grossSalary').fill('1000'); await page.getByRole('button',{name:item.button}).click();
  const number = selector => page.locator(selector).evaluate(node => {
    let value = node.textContent.replace(/[^0-9.,-]/g, '');
    if (value.includes('.') && value.includes(',')) value = value.lastIndexOf('.') > value.lastIndexOf(',') ? value.replace(/,/g, '') : value.replace(/\./g, '').replace(',', '.');
    else if (value.includes(',')) value = /,\d{2}$/.test(value) ? value.replace(',', '.') : value.replace(/,/g, '');
    return Number(value);
  });
  expect(await number('#taxMonthly')).toBe(84); expect(await number('#netMonthly')).toBe(916); expect(await number('#annualTax')).toBe(1008); expect(await number('#annualNet')).toBe(10992);
  await page.locator('#taxpayerCategory').selectOption('nonresident'); await page.getByRole('button',{name:item.button}).click(); expect(await number('#taxMonthly')).toBe(180); expect(await number('#netMonthly')).toBe(820);
  await page.locator('#taxpayerCategory').selectOption('resident-under-18'); await page.getByRole('button',{name:item.button}).click(); expect(await number('#taxMonthly')).toBe(200); expect(await number('#netMonthly')).toBe(800);
  const pdf=await page.evaluate(async()=>{const done=new Promise(resolve=>window.addEventListener('afro-pdf-generated',async e=>{const b=new Uint8Array(await e.detail.blob.arrayBuffer());resolve({name:e.detail.fileName,size:b.length,header:String.fromCharCode(...b.slice(0,5))});},{once:true}));document.querySelector('#pdfBtn').click();return done;}); expect(pdf.header).toBe('%PDF-'); expect(pdf.size).toBeGreaterThan(1000); expect(pdf.name).toMatch(/somal/i);
  await page.locator('#shareBtn').click(); expect(await page.evaluate(()=>window.__sharedPayload)).toEqual({title:item.title,url:item.canonical});
  const source=await page.locator('html').evaluate(n=>n.outerHTML); expect(source).not.toContain('pdf-leads'); expect(source).not.toContain('/.netlify/functions/ai-advisor'); expect(source).not.toContain('financialministry.gov.sd'); expect(source).not.toMatch(/flat 5%|SOS 600,000|No formal PAYE/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375); expect(writes).toEqual([]); expect(errors).toEqual([]);
});
test('Somalia widget matches the shared federal engine at 320px', async ({ page }) => { await page.setViewportSize({width:320,height:720}); const errors=[]; const writes=[]; page.on('console',m=>{if(m.type()==='error')errors.push(m.text());}); page.on('request',r=>{if(r.method()!=='GET')writes.push(`${r.method()} ${r.url()}`);}); await page.goto('/widgets/iframe/financial-somalia-paye.html?theme=dark'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await page.locator('#awSoGross').fill('1000'); await page.locator('#awSoCalc').click(); await expect(page.locator('.aw-result-main')).toHaveText('USD 916.00'); await expect(page.getByText('-USD 84.00')).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320); expect(writes).toEqual([]); expect(errors).toEqual([]); });

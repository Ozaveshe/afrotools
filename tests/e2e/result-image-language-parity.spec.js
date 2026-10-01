const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const rows = [
  {lang:'en', route:'/ghana/gh-paye', title:'Ghana PAYE Calculator', button:'Share as image', pending:'Generating…', footer:'Calculate your result with AfroTools', gross:'Annual gross', net:'Monthly take-home', tax:'Annual tax'},
  {lang:'fr', route:'/fr/ghana/gh-paye', title:'Calculateur de salaire au Ghana', button:'Partager en image', pending:'Création de l’image…', footer:'Calculez votre résultat avec AfroTools', gross:'Salaire brut annuel', net:'Salaire net mensuel', tax:'Impôt annuel'},
  {lang:'sw', route:'/sw/ghana/kikokotoo-kodi-mshahara/', title:'Kikokotoo cha mshahara Ghana', button:'Shiriki kama picha', pending:'Inatengeneza picha…', footer:'Kokotoa matokeo yako kwa AfroTools', gross:'Mshahara ghafi wa mwaka', net:'Mshahara halisi wa mwezi', tax:'Kodi ya mwaka'}
];
async function fixture(page, row, toolId='gh-paye') {
  await page.route('**/__image-fixture**', route => route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${row.lang}"><head><meta name="tool-id" content="${toolId}"></head><body><h1>${row.title}</h1><span class="f-prefix">GHS</span><div class="action-row"></div></body></html>`}));
  await page.goto('/__image-fixture?locale='+row.lang);
  await page.evaluate(() => {window.fmt=value=>Math.round(value).toLocaleString('en');window.AfroTools={toast:{show:(text,type)=>{window.notices=(window.notices||[]).concat({text,type})}}};});
  await page.addScriptTag({url:'/assets/js/result-card.js'});
}
for(const row of rows) {
  test(`${row.lang}: native control and payload preserve zero rate and explicit annual/monthly fields`, async({page})=>{
    await fixture(page,row);
    await page.evaluate(()=>{
      window.RESULT={grossAnnual:120000, netMonthly:8750, annualTax:15000, effectiveRate:0,rate:0.25};
      window.AfroTools.resultCard.generateAndShare=async data=>{window.capturedImage=data; await new Promise(resolve=>window.finishImage=resolve);};
    });
    await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
    const button=page.locator('.act-share-image');
    await expect(button).toHaveAccessibleName(row.button);
    await button.click();
    await expect(button).toHaveText(row.pending);
    await expect(button).toBeDisabled();
    const data=await page.evaluate(()=>window.capturedImage);
    expect(data.value).toBe(row.lang==='fr'?'0,0%':'0.0%');
    expect(data.details).toContain(`${row.gross}: GHS 120,000`);
    expect(data.details).toContain(`${row.net}: GHS 8,750`);
    expect(data.details).toContain(`${row.tax}: GHS 15,000`);
    expect(data.subtitle).toContain(row.title);
    expect(data.subtitle).not.toMatch(/PAYE 20\d\d/);
    await page.evaluate(()=>window.finishImage());
    await expect(button).toHaveAccessibleName(row.button);
    await expect(button).toBeEnabled();
  });
  test(`${row.lang}: real PNG uses native footer and preserves synthetic text exactly`,async({page})=>{
    await fixture(page,row);
    await page.addScriptTag({url:'/assets/vendor/html2canvas/html2canvas.min.js'});
    await page.evaluate(()=>{const capture=window.html2canvas;window.html2canvas=(node,opts)=>{window.rasterCopy=node.textContent;const card=node.getBoundingClientRect();window.rasterClipped=[...node.querySelectorAll('span')].some(child=>{const bounds=child.getBoundingClientRect();return bounds.right>card.right||bounds.bottom>card.bottom});return capture(node,opts)}});
    const download=page.waitForEvent('download');
    await page.evaluate(async()=>window.AfroTools.resultCard.generateAndDownload({title:'Élève · Juma — ✓',value:'GHS 8,750',subtitle:'2025 · fixture',details:'État prêt | Ukaguzi umekamilika',toolId:'synthetic'}));
    const file=await download;
    await file.saveAs(test.info().outputPath(row.lang+'-result.png'));
    const png=await fs.readFile(await file.path());
    expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(2400);
    expect(png.readUInt32BE(20)).toBe(1260);
    expect(await page.evaluate(()=>window.rasterCopy)).toContain(row.footer);
    expect(await page.evaluate(()=>window.rasterCopy)).toContain('Élève · Juma — ✓');
    expect(await page.evaluate(()=>window.rasterCopy)).toContain('État prêt');
    expect(await page.evaluate(()=>window.rasterCopy)).toContain('Ukaguzi umekamilika');
    expect(await page.evaluate(()=>window.rasterClipped)).toBe(false);
    await expect(page.locator('#afro-result-card-gen')).toHaveCount(0);
  });
  test(`${row.lang}: native feedback recovers after failure and fits a small screen`,async({page})=>{
    await page.setViewportSize({width:320,height:700});
    await fixture(page,row);
    await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
    const button=page.locator('.act-share-image');
    await button.click();
    const first={en:'Calculate first to create an image.',fr:'Effectuez un calcul pour créer une image.',sw:'Kokotoa kwanza ili kutengeneza picha.'};
    expect(await page.evaluate(()=>window.notices[0].text)).toBe(first[row.lang]);
    await page.evaluate(()=>window.RESULT={gross:100});
    await button.click();
    const unsupported={en:'This result cannot be shared as an image.',fr:'Ce résultat ne peut pas être partagé en image.',sw:'Picha ya matokeo haya haipatikani.'};
    expect(await page.evaluate(()=>window.notices.at(-1).text)).toBe(unsupported[row.lang]);
    await page.evaluate(()=>{
      window.RESULT={grossMonthly:100,netMonthly:100,effectiveRate:0};
      window.AfroTools.resultCard.generateAndShare=()=>Promise.reject(new Error('Synthetic failure'));
    });
    await button.click();
    const failed={en:'Could not generate the image. Try again.',fr:'Impossible de créer l’image. Réessayez.',sw:'Picha haikuweza kutengenezwa. Jaribu tena.'};
    await expect.poll(()=>page.evaluate(()=>window.notices.at(-1).text)).toBe(failed[row.lang]);
    await expect(button).toHaveAccessibleName(row.button);
    await expect(button).toBeEnabled();
    await expect(button).not.toHaveAttribute('aria-busy');
    const bounds=await button.boundingBox();
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    // The delayed mount must not create another control.
    await page.waitForTimeout(1100);
    await expect(button).toHaveCount(1);
  });
}

test('French TVA zero result stays a VAT image with native labels',async({page})=>{
  await fixture(page,rows[1],'bj-tva-fr');
  await page.evaluate(()=>{
    window.RESULT={netAmount:0,vatAmount:0,totalInclusive:0,rate:0,rateLabel:'Zero-rated'};
    window.AfroTools.resultCard.generateAndShare=async data=>window.capturedImage=data;
  });
  await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
  await page.getByRole('button',{name:rows[1].button}).click();
  const data=await page.evaluate(()=>window.capturedImage);
  expect(data.value).toBe('GHS 0');
  expect(data.subtitle).toBe('Taux zéro · 0% · TVA');
  expect(data.details).toBe('Hors taxe: GHS 0 | TVA: GHS 0 | Total: GHS 0');
});

for(const [index,route] of ['/benin/bj-vat','/fr/benin/calculateur-tva','/sw/benin/kikokotoo-vat/'].entries()) {
  const row=rows[index];
  test(`${row.lang}: Benin VAT calculator downloads its actual result as a native image`,async({page})=>{
    await page.setViewportSize({width:320,height:800});
    await page.goto(route);
    await page.waitForFunction(()=>window.AfroTools&&window.AfroTools.BJVatEngine);
    await page.locator('#amount').fill('10000');
    await page.evaluate(()=>calculate());
    await expect.poll(()=>page.evaluate(()=>window.RESULT&&window.RESULT.totalInclusive)).toBe(11800);
    await page.addScriptTag({url:'/assets/js/result-card.js'});
    await page.addScriptTag({url:'/assets/vendor/html2canvas/html2canvas.min.js'});
    await page.evaluate(()=>{
      const generate=window.AfroTools.resultCard.generate.bind(window.AfroTools.resultCard);
      window.AfroTools.resultCard.generate=data=>{window.actualImageData=data;return generate(data)};
      const capture=window.html2canvas;
      window.html2canvas=(node,options)=>{window.rasterCopy=node.textContent;return capture(node,options)};
    });
    const button=page.getByRole('button',{name:row.button,exact:true});
    await expect(button).toHaveCount(1);
    const bounds=await button.boundingBox();
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const download=page.waitForEvent('download');
    await button.click();
    const file=await download;
    await file.saveAs(test.info().outputPath(`${row.lang}-benin-vat.png`));
    const data=await page.evaluate(()=>window.actualImageData);
    expect(data.title).toBe((await page.locator('h1').innerText()).replace(/\s+/g,' ').trim());
    expect(data.subtitle).toContain(index===1?'TVA':'VAT');
    expect(data.subtitle).toContain('18%');
    expect(data.value.replace(/[^0-9]/g,'')).toBe('11800');
    expect(data.details).toContain(index===1?'Hors taxe':index===2?'Bila kodi':'Net');
    expect(await page.evaluate(()=>window.rasterCopy)).toContain(row.footer);
    await expect(button).toBeEnabled();
    await page.locator('#amount').fill('0');
    await page.evaluate(()=>calculate());
    expect(await page.evaluate(()=>window.RESULT.totalInclusive)).toBe(0);
    await page.locator('#amount').fill('-1');
    await page.evaluate(()=>calculate());
    expect(await page.evaluate(()=>window.RESULT)).toBeNull();
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid','true');
    if(row.lang==='fr') {
      await expect(page.locator('#calcStatus')).toHaveText('Saisissez un montant de 0 ou plus.');
      await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
      await page.locator('#amount').fill('');
      await page.evaluate(()=>calculate());
      expect(await page.evaluate(()=>window.RESULT)).toBeNull();
      await page.locator('#amount').fill('2000');
      await page.evaluate(()=>calculate());
      expect(await page.evaluate(()=>window.RESULT.totalInclusive)).toBe(2360);
      await expect(page.locator('#amount')).toHaveAttribute('aria-invalid','false');
      await expect(page.locator('#calcStatus')).toHaveText('');
      await expect(button).toBeVisible();
    }
  });
}

for(const tool of ['pdf-merge','syntax-checker']) {
  test(`${tool} action row does not receive an unsupported salary control`,async({page})=>{
    await fixture(page,rows[1],tool);
    await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
    await page.waitForTimeout(1100);
    await expect(page.locator('.act-share-image')).toHaveCount(0);
  });
}

test('legacy VAT HTML route keeps its image control before calculation',async({page})=>{
  await fixture(page,rows[0],'bj-vat.html');
  await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
  await expect(page.getByRole('button',{name:rows[0].button})).toHaveCount(1);
});

test('lazy image export loads the revised renderer URL and produces a real PNG',async({page})=>{
  await fixture(page,rows[1]);
  await page.evaluate(()=>{
    delete window.AfroTools.resultCard;
    window.RESULT={netAmount:100,vatAmount:18,totalInclusive:118,rate:0.18};
  });
  const requested=[];
  page.on('request',request=>requested.push(request.url()));
  await page.addScriptTag({url:'/assets/js/share-image-inject.js'});
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:rows[1].button}).click();
  const file=await download;
  const png=await fs.readFile(await file.path());
  expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(requested.some(url=>url.endsWith('/assets/js/result-card.js?v=native-image-20261001'))).toBe(true);
});

test('image renderer loads its local dependency and preserves a numeric zero',async({page})=>{
  await fixture(page,rows[1]);
  const locationOrigin=await page.evaluate(()=>location.origin);
  const requested=[];
  page.on('request',request=>requested.push(request.url()));
  await page.evaluate(async()=>{
    const observer=new MutationObserver(()=>{
      const card=document.getElementById('afro-result-card-gen');
      if(card) window.rasterValue=card.children[2].children[2].textContent;
    });
    observer.observe(document.body,{childList:true});
    const blob=await window.AfroTools.resultCard.generate({value:0});
    window.blobSize=blob.size;
    observer.disconnect();
  });
  expect(await page.evaluate(()=>window.rasterValue)).toBe('0');
  expect(await page.evaluate(()=>window.blobSize)).toBeGreaterThan(1000);
  expect(requested.some(url=>url.endsWith('/assets/vendor/html2canvas/html2canvas.min.js'))).toBe(true);
  expect(requested.every(url=>new URL(url).origin===locationOrigin)).toBe(true);
});

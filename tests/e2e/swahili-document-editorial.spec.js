const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const overrides = require('../../data/localization/sw-document-pdf-lexicon-overrides.json').routes;
test.use({trace:'off', screenshot:'off', video:'off'});

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});

async function reflow(page) {
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width}px overflow`).toBeLessThanOrEqual(1);
  }
}

function zipEntries(bytes) {
  const entries=[];
  for(let offset=0; offset+30<=bytes.length && bytes.readUInt32LE(offset)===0x04034b50;) {
    expect(bytes.readUInt16LE(offset+8)).toBe(0);
    const size=bytes.readUInt32LE(offset+18), nameLength=bytes.readUInt16LE(offset+26), extraLength=bytes.readUInt16LE(offset+28);
    const start=offset+30+nameLength+extraLength;
    entries.push({name:bytes.subarray(offset+30,offset+30+nameLength).toString('utf8'),bytes:bytes.subarray(start,start+size)});
    offset=start+size;
  }
  return entries;
}

test('invoice: opened controls, validation, unchanged author text, tax and JSON roundtrip', async ({page}) => {
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto('/sw/zana/kizalishaji-ankara/');
  await expect(page.locator('label[for="companyName"]')).toHaveText('Jina la kampuni *');
  await expect(page.locator('label[for="documentType"]')).toHaveText('Aina ya hati');
  await expect(page.locator('#invoiceActionHint')).toContainText('Ongeza jina la biashara yako');
  for(const detail of await page.locator('details').all()) await detail.evaluate(e=>e.open=true);
  await expect(page.locator('label[for="bankDetails"]')).toHaveText('Maelekezo ya benki au malipo');
  await expect(page.locator('#btnSaveTemplate')).toHaveText('Hifadhi kiolezo');
  await expect(page.getByText('Violezo vilivyohifadhiwa',{exact:true})).toBeVisible();
  await page.locator('#companyName').fill('Payment Instructions');
  await page.locator('#clientName').fill('Global Compact');
  await page.locator('.li-desc').first().fill('Balance Due');
  await page.locator('.li-price').first().fill('100');
  await page.locator('#taxRate').fill('9');
  await page.locator('#currency').selectOption('KES');
  await expect(page.locator('#taxRate')).toHaveValue('9');
  await expect(page.locator('#pCompany')).toHaveText('Payment Instructions');
  await expect(page.locator('#pClient')).toHaveText('Global Compact');
  await expect(page.locator('#pItems td').first()).toHaveText('Balance Due');
  await expect(page.locator('#sumTotal')).toHaveText('KSh 109.00');
  await expect(page.locator('#sumBalance')).toHaveText('KSh 109.00');
  await page.locator('#btnSaveTemplate').click();
  await expect(page.locator('#templatesContainer strong')).toContainText('Payment Instructions');
  const savedTemplate=page.locator('#templatesContainer button[data-sw-user-label]').first();
  await expect(savedTemplate).toHaveAttribute('aria-label', /^Fungua kiolezo Payment Instructions - /);
  await page.locator('#btnSaveClient').click();
  await expect(page.locator('#clientList .client-item-name')).toHaveText('Global Compact');
  await expect(page.locator('#clientList button[data-sw-user-label]')).toHaveAttribute('aria-label','Futa mteja aliyehifadhiwa Global Compact');
  await page.locator('#btnSaveItem').click();
  await expect(page.locator('#savedItemSelect option[value="0"]')).toContainText('Balance Due');
  await page.locator('#companyName').fill('Changed');
  await savedTemplate.click();
  await expect(page.locator('#companyName')).toHaveValue('Payment Instructions');
  await expect(page.locator('#taxRate')).toHaveValue('9');
  await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
  await page.locator('#invoiceReviewConfirm').check();
  const pending=page.waitForEvent('download');
  await page.locator('#btnExportJson').click();
  const download=await pending;
  const state=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  expect(state.cn).toBe('Payment Instructions');
  expect(state.cl).toBe('Global Compact');
  expect(state.items[0].d).toBe('Balance Due');
  await page.locator('#companyName').fill('Changed');
  await page.locator('#importJsonInput').setInputFiles({name:'synthetic-invoice.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  await expect(page.locator('#companyName')).toHaveValue('Payment Instructions');
  await expect(page.locator('#pCompany')).toHaveText('Payment Instructions');
  await reflow(page);
  expect(errors).toEqual([]);
});

test('CV: all 30 template modals, focus return and mobile reflow', async ({page}) => {
  test.setTimeout(120000);
  const errors=[];
  const sends=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET' && new URL(r.url()).pathname.startsWith('/.netlify/functions/'))sends.push(new URL(r.url()).pathname)});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/sw/zana/mjenzi-cv/');
  await expect(page.locator('#cv-landing-title')).toHaveText(overrides['cv-builder']['Free CV Builder for African & International Jobs']);
  await expect(page.locator('#cv-template-gallery-title')).toHaveText('Chagua kati ya violezo 30 vya CV');
  await expect(page.locator('.cv-cloud-backup legend')).toHaveText('Nakala rudufu mtandaoni (hiari)');
  await expect(page.locator('#cv-cloud-consent')).not.toBeChecked();
  const cards=page.locator('.cv-template-landing-grid [data-template-card]');
  await expect(cards).toHaveCount(30);
  const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.templateCard));
  for(const id of ids) {
    const button=page.locator(`.cv-template-landing-grid [data-template-preview="${id}"]`);
    await button.click();
    const modal=page.locator('.cv-template-modal-overlay.open');
    await expect(modal.getByRole('button',{name:'Tumia kiolezo',exact:true})).toBeFocused();
    const description=await page.evaluate(id=>window.CVTemplateRegistry.get(id).description,id);
    await expect(modal.locator('.cv-template-modal-head p')).toHaveText(overrides['cv-builder'][description]);
    expect(await modal.innerText()).not.toMatch(/\b(?:BEST FOR|Use template|Preview full size|Keep browsing|Cross-market|programu za soko la msalaba|Clinical|Consultant|Teacher)\b/i);
    await reflow(page);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(button).toBeFocused();
  }
  expect(sends).toEqual([]);
  expect(errors).toEqual([]);
});

test('CV: editor preserves author text and JSON export without private-content sends', async ({page}) => {
  const errors=[];
  const sends=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
    const address=new URL(r.url());
    const content=decodeURIComponent(r.url())+' '+(r.postData()||'');
    sends.push({endpoint:address.pathname, privateContent:['Global Compact','Māori','synthetic@example.com','Balance Due. This synthetic'].some(value=>content.includes(value)), contentSend:r.method()!=='GET' && address.pathname.startsWith('/.netlify/functions/')});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/sw/zana/mjenzi-cv/');
  await page.locator('.cv-flow-hero-actions [data-cv-flow-action="build"]').click();
  await page.locator('[data-path="fn"]').fill('Global Compact');
  await page.locator('[data-path="ln"]').fill('Māori');
  await page.locator('[data-path="title"]').fill('Payment Instructions');
  await page.locator('[data-path="email"]').fill('synthetic@example.com');
  await page.locator('[data-path="summary"]').fill('Balance Due. This synthetic content must retain its original wording.');
  await page.locator('[data-path="edus.0.sch"]').fill('Synthetic School');
  await expect.poll(()=>page.evaluate(()=>window.CVApp.getState().data.fn)).toBe('Global Compact');
  await page.evaluate(()=>window.CVApp.renderPreview());
  await expect(page.locator('#cvpreview')).toContainText('Global Compact Māori');
  await expect(page.locator('#cvpreview')).toContainText('Payment Instructions');
  await expect(page.locator('#cvpreview')).toContainText('Balance Due. This synthetic content must retain its original wording.');
  await reflow(page);
  const pending=page.waitForEvent('download');
  await page.evaluate(()=>window.CVExportUpgrade.exportJson());
  const download=await pending;
  const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  expect(data.data.fn).toBe('Global Compact');
  expect(data.data.ln).toBe('Māori');
  expect(data.data.summary).toBe('Balance Due. This synthetic content must retain its original wording.');
  expect(sends.filter(send=>send.privateContent || send.contentSend)).toEqual([]);
  expect(errors).toEqual([]);
});

test('CV: application pack contains parsed PDFs and unchanged local backup', async ({page}) => {
  test.setTimeout(90000);
  await page.goto('/sw/zana/mjenzi-cv/');
  await page.waitForFunction(()=>window.CVApplicationPackExport && window.CVApplicationPackExport.isAvailable());
  await page.evaluate(()=>{
    const state=window.CVApp.getState();
    Object.assign(state.data,{fn:'Synthetic',ln:'Candidate',title:'Synthetic Engineer',summary:'Synthetic document export fixture.'});
    state.template='ats-classic';
    window.CVApp.renderAll();
  });
  const pending=page.waitForEvent('download');
  await page.evaluate(()=>window.CVApplicationPackExport.download());
  const archive=fs.readFileSync(await(await pending).path());
  const entries=zipEntries(archive);
  const pdfs=entries.filter(entry=>entry.name.endsWith('.pdf'));
  expect(pdfs.length).toBeGreaterThanOrEqual(2);
  for(const document of pdfs) {
    expect(document.bytes.subarray(0,5).toString('ascii'),document.name).toBe('%PDF-');
    const parsed=await pdfParse(new Uint8Array(document.bytes));
    expect(parsed.numpages).toBeGreaterThan(0);
    if(document.name.includes('-ats-plain-')) expect(parsed.text).toContain('Synthetic Candidate');
  }
  const backup=JSON.parse(entries.find(entry=>entry.name.endsWith('-backup.json')).bytes.toString('utf8'));
  expect(backup.data.fn).toBe('Synthetic');
  expect(backup.data.summary).toBe('Synthetic document export fixture.');
});

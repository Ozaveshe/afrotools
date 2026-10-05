const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const copy=require('../../data/localization/sw-cv-application-pack-copy.json');
test.use({trace:'off',screenshot:'off',video:'off'});
test.beforeEach(async({page})=>page.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined')));

function zip(bytes) {
  const result=[];
  for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;) {
    expect(bytes.readUInt16LE(offset+8)).toBe(0);
    const size=bytes.readUInt32LE(offset+18),n=bytes.readUInt16LE(offset+26),x=bytes.readUInt16LE(offset+28),start=offset+30+n+x;
    result.push({name:bytes.subarray(offset+30,offset+30+n).toString('utf8'),bytes:bytes.subarray(start,start+size)});
    offset=start+size;
  }
  return result;
}
function csv(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if(c==='\n'&&!quoted){row.push(cell);rows.push(row);row=[];cell='';}
    else if(c!=='\r')cell+=c;
  }
  row.push(cell);rows.push(row);return rows;
}
async function download(page,action) {
  const pending=page.waitForEvent('download');await action();
  return fs.readFileSync(await(await pending).path());
}
async function clickExport(page,format) {
  const button=page.locator(`[data-pack-export="${format}"]`);
  await button.click({timeout:10000});
}
async function prepare(page) {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/sw/zana/mjenzi-cv/');
  await page.waitForFunction(()=>window.CVApplicationPack&&window.CVApplicationPackExport&&document.querySelector('[data-pack-role]'));
  await page.locator('.cv-flow-hero-actions [data-cv-flow-action="build"]').click();
  for(const [key,value] of Object.entries({fn:'Global Compact',ln:'Māori',email:'synthetic@example.test',title:'Payment Instructions',summary:'Cover letter'})) {
    await page.locator(`[data-path="${key}"]`).fill(value);
  }
  await page.evaluate(()=>{
    const state=CVApp.getState();state.template='ats-classic';
    state.data.skills={h:'Balance Due',s:'Application Pack',t:'Synthetic Tool'};
    state.data.exps=[{t:'Cover letter',c:'Application Pack',s:'2024',cur:true,d:'Payment Instructions 12%.'}];
    CVApp.renderPreview();
  });
  await page.locator('[data-pack-role]').fill('Cover letter');
  await page.locator('[data-pack-company]').fill('Application Pack');
}

test('Swahili pack buttons download native TXT, DOC, PDF and ZIP without translating authored slots',async({page})=>{
  test.setTimeout(90000);
  const leakage=[];const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{
    const content=decodeURIComponent(r.url())+' '+(r.postData()||'');
    if(['Global Compact','Māori','synthetic@example.test','Payment Instructions 12%.'].some(value=>content.includes(value)))leakage.push({path:new URL(r.url()).pathname,privateContent:true});
  });
  await prepare(page);
  await page.locator('[data-pack-generate-all]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Generated full application pack from current CV.']);
  const textarea=page.locator('[data-pack-text="coverLetter"]');
  const generated=await textarea.inputValue();
  expect(generated).toContain('Kwa timu ya uajiri ya Application Pack,');
  for(const authored of ['Global Compact Māori','Cover letter','Application Pack','Payment Instructions 12%.'])expect(generated).toContain(authored);
  expect(generated).not.toMatch(/Dear |I am applying|Kind regards|Thank you for considering/);
  const txt=(await download(page,()=>clickExport(page,'txt'))).toString('utf8');
  expect(txt).toContain(copy.literals['AFROTOOLS APPLICATION PACK']);
  expect(txt).toContain('Mtindo: Rasmi');
  expect(txt).toContain('BARUA YA MAOMBI YA KAZI');
  expect(txt).not.toMatch(/AFROTOOLS APPLICATION PACK|Generated:|Subject:|Dear |Kind regards/);
  expect(txt).toContain('Global Compact Māori');
  const doc=(await download(page,()=>clickExport(page,'doc'))).toString('utf8');
  expect(doc).toContain('BARUA YA MAOMBI YA KAZI');expect(doc).toContain('Global Compact Māori');
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    await page.locator('[data-pack-role]').focus();
    await expect(page.locator('.cv-layout-action-bar')).toHaveCSS('position','relative');
    const mobileText=(await download(page,()=>clickExport(page,'txt'))).toString('utf8');
    expect(mobileText.includes('Mtindo: Rasmi'),`${width}px native TXT click`).toBe(true);
    const pdf=await download(page,()=>clickExport(page,'pdf'));
    const parsed=await pdfParse(new Uint8Array(pdf));
    expect(parsed.text.includes('Global Compact Māori'),`${width}px PDF preserves author Unicode`).toBe(true);
    expect(parsed.text.includes('BARUA YA MAOMBI YA KAZI'),`${width}px PDF native heading`).toBe(true);
  }
  const archive=zip(await download(page,()=>page.locator('[data-pack-download]').click()));
  const letter=archive.find(entry=>entry.name.endsWith('-cover-letter.txt')).bytes.toString('utf8');
  const email=archive.find(entry=>entry.name.endsWith('-application-email.txt')).bytes.toString('utf8');
  expect(letter).toBe(generated);expect(email).toContain('Mada: ');expect(email).toContain('Wako kwa heshima,');
  expect(email).toContain('Payment Instructions 12%.');
  for(const entry of archive.filter(entry=>entry.name.endsWith('.pdf'))) {
    expect(entry.bytes.subarray(0,5).toString('ascii')).toBe('%PDF-');
    const text=await pdfParse(new Uint8Array(entry.bytes));expect(text.numpages).toBeGreaterThan(0);
    if(entry.name.endsWith('-cover-letter.pdf')) {expect(text.text).toContain('Kwa timu ya uajiri ya Application Pack,');expect(text.text).toContain('Global Compact Māori');}
  }
  const backup=JSON.parse(archive.find(entry=>entry.name.endsWith('-backup.json')).bytes.toString('utf8'));
  expect(backup.target.tone).toBe('formal');expect(backup.target.role).toBe('Cover letter');
  expect(backup.data.title).toBe('Payment Instructions');expect(backup.applicationPack.coverLetter).toBe(generated);
  expect(Object.keys(backup.applicationPack)).toEqual(['coverLetter','emailMessage','linkedinHeadline','linkedinAbout','interviewPrep','recruiterMessage','followupApplication','followupInterview']);
  // The author can replace generated text; downloaded content remains exact.
  const authored='Dear Hiring Team,\nApplication Pack; Payment Instructions. Māori authored text.';
  await textarea.fill(authored);
  const edited=zip(await download(page,()=>page.locator('[data-pack-download]').click()));
  expect(edited.find(entry=>entry.name.endsWith('-cover-letter.txt')).bytes.toString('utf8')).toBe(authored);
  expect((await pdfParse(new Uint8Array(edited.find(entry=>entry.name.endsWith('-cover-letter.pdf')).bytes))).text).toContain('Māori authored text.');
  for(const width of [320,390]) {await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);}
  expect(leakage).toEqual([]);expect(errors).toEqual([]);
});

test('saved pack CSV has native headings and keeps user values, keys and statuses intact',async({page})=>{
  await prepare(page);await page.locator('[data-pack-generate-all]').click();
  await page.locator('[data-pack-save]').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0]);
  expect(stored.status).toBe('Saved');expect(stored.role).toBe('Cover letter');expect(stored.company).toBe('Application Pack');
  await page.evaluate(()=>{const leads=JSON.parse(localStorage.getItem('afro_cv_job_pipeline'));leads[0].notes='Payment Instructions, "quoted"; Māori';localStorage.setItem('afro_cv_job_pipeline',JSON.stringify(leads));CVJobTracker.render();});
  // The existing tracker reloads stored leads on entry; pack saving writes the
  // shared local store without updating its already-mounted in-memory list.
  await prepare(page);
  const rows=csv((await download(page,()=>page.evaluate(()=>document.querySelector('[data-tracker-export]').click()))).toString('utf8'));
  expect(rows[0]).toEqual(Object.values(copy.trackerHeaders));
  expect(rows[1]).toHaveLength(15);expect(rows[1][0]).toBe('Cover letter');expect(rows[1][1]).toBe('Application Pack');
  expect(rows[1][8]).toBe('Imehifadhiwa');expect(rows[1][11]).toBe('Ndiyo');expect(rows[1][12]).toBe('Payment Instructions, "quoted"; Māori');
});

test('native validation, copy failure, missing PDF and missing ZIP messages remain local',async({page})=>{
  await prepare(page);
  await page.locator('[data-pack-role]').fill('');await page.locator('[data-pack-company]').fill('');
  await page.locator('[data-pack-save]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Add a target job title or company before saving to tracker.']);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('operation_failed'))}}));
  await page.locator('[data-pack-copy]').first().click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Copy failed. Select and copy manually.']);
  await page.evaluate(()=>{window.CVExportAtsPlainPdf=undefined;});
  await page.locator('[data-pack-export="pdf"]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['PDF export is unavailable in this browser. Use TXT or DOC export.']);
  const result=await page.evaluate(async()=>{const statuses=[];CVExportUpgrade.status=value=>statuses.push(value);const original=window.Blob;window.Blob=undefined;const success=await CVApplicationPackExport.download();window.Blob=original;return{success,statuses};});
  expect(result.success).toBe(false);expect(result.statuses).toContain(copy.literals['Application Pack ZIP is unavailable in this browser.']);
});

test('fallback email and ungenerated placeholders use native copy without changing author text',async({page})=>{
  test.setTimeout(60000);await prepare(page);
  const text=(await download(page,()=>page.locator('[data-pack-export="txt"]').click())).toString('utf8');
  expect(text).toContain('[bado haijatengenezwa]');expect(text).not.toContain('[not generated]');
  await page.evaluate(()=>{CVApplicationPack.generatePack=()=>{throw Error('operation_failed')};});
  const archive=zip(await download(page,()=>page.locator('[data-pack-download]').click()));
  const email=archive.find(entry=>entry.name.endsWith('-application-email.txt')).bytes.toString('utf8');
  expect(email).toContain('Mada: Maombi ya nafasi ya Cover letter');expect(email).toContain('Kwa timu ya uajiri,');
  expect(email).toContain('Global Compact Māori');expect(email).not.toMatch(/Subject:|Dear Hiring Team|Please find attached|Kind regards/);
});

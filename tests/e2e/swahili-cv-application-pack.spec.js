const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const copy=require('../../data/localization/sw-cv-application-pack-copy.json');
const countryCopy=require('../../data/localization/sw-document-pdf-lexicon-overrides.json').routes['cv-builder'];
// Playwright otherwise records the whole authored page in error-context.md,
// even with screenshots and traces disabled.
process.env.PLAYWRIGHT_NO_COPY_PROMPT='1';
test.use({trace:'off',screenshot:'off',video:'off'});
test.afterEach(async({},info)=>{
  for(const failure of info.errors) {
    const category=/timeout.*exceeded|test timeout/i.test(failure.message||'') ? 'timeout'
      : /expect\(/.test(failure.message||'') ? 'assertion' : 'exception';
    const sourceLine=(failure.stack||'').match(/swahili-cv-application-pack\.spec\.js:(\d+):\d+/)?.[1]||'unknown';
    const phase=info.annotations.filter(item=>item.type==='private-flow-phase').at(-1)?.description||'unspecified';
    failure.message=`Synthetic private-document ${category} failed at source line ${sourceLine}, phase ${phase}; authored values omitted.`;
    delete failure.stack;delete failure.snippet;delete failure.value;
  }
});
function phase(value) { test.info().annotations.push({type:'private-flow-phase',description:value}); }
test.beforeEach(async({page,baseURL})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
  // This is local workflow proof; third-party availability is not part of it.
  await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin
    ? route.continue() : route.fulfill({status:204,body:''}));
});

test('Swahili country guidance and privacy controls stay native at 320 and 390 without rewriting the CV',async({page})=>{
  test.setTimeout(120000);await prepare(page);
  const authored=await page.evaluate(()=>{
    const d=CVApp.getState().data;
    return JSON.stringify([d.fn,d.ln,d.email,d.title,d.summary,d.exps,d.skills]);
  });
  const country=page.locator('.cv-country-sel').filter({visible:true}).first();
  const panel=page.locator('.cv-country-advisor');
  async function expand() {
    const details=panel.locator('.cv-country-details');
    await expect(details).toBeAttached();
    if(!await details.evaluate(element=>element.open)) await details.locator('summary').click();
  }
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    for(const code of ['KE','TZ','UG','RW','NG','ZA','INTL']) {
      phase(`country-${width}-${code}`);
      await country.selectOption(code);
      await expect.poll(()=>page.evaluate(()=>CVApp.getState().country)).toBe(code);
      const english=await page.evaluate(id=>({language:CVCountryRules.get(id).language,warning:CVCountryRules.get(id).warning}),code);
      await expect(panel.locator('.cv-country-advisor-head')).toContainText(countryCopy['Country Format Advisor']);
      await expect(panel.locator('summary')).toHaveText(countryCopy['View country guidance and field controls']);
      await expand();
      await expect(panel.locator('.cv-country-warning')).toHaveText(countryCopy[english.warning]);
      await expect(panel.locator('.cv-country-advice-grid')).toContainText(countryCopy[english.language]);
      await expect(panel.locator('.cv-country-overrides')).toHaveAttribute('aria-label',countryCopy['Manual country field overrides']);
      await expect(panel.locator('[data-country-safe]')).toHaveText(countryCopy['Hide risky fields']);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
  }
  await country.selectOption('NG');await expand();
  await panel.locator('[data-country-override="photo"]').check();await expand();
  await panel.locator('[data-country-safe]').click();
  await expect.poll(()=>page.evaluate(()=>!CVApp.getState().data.showPhoto&&!CVApp.getState().data.sp)).toBe(true);
  expect(await page.evaluate(value=>{
    const d=CVApp.getState().data;
    return JSON.stringify([d.fn,d.ln,d.email,d.title,d.summary,d.exps,d.skills])===value;
  },authored)).toBe(true);
});

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
  const [result]=await Promise.all([page.waitForEvent('download',{timeout:45000}),Promise.resolve().then(action)]);
  return fs.readFileSync(await result.path());
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
    phase(`pack-${width}-exports`);
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
  test.setTimeout(90000);
  await prepare(page);await page.locator('[data-pack-generate-all]').click();
  await page.locator('[data-pack-save]').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0]);
  expect(stored.status.toLowerCase()).toBe('saved');expect(stored.role).toBe('Cover letter');expect(stored.company).toBe('Application Pack');
  // Prove the already-mounted tracker updates before navigation or reload.
  await expect(page.locator(`[data-job-card="${stored.id}"] .cv-tracker-card-top strong`)).toHaveText('Cover letter');
  for(const width of [320,390]) {
    phase(`tracker-${width}-navigation`);
    await page.setViewportSize({width,height:844});
    await page.locator('[data-cv-copilot="job-tracker"]').click();
    await page.locator('[data-tracker-mode="list"]').click();
    phase(`tracker-${width}-csv`);
    const immediate=csv((await download(page,()=>page.locator('[data-tracker-export]').click())).toString('utf8'));
    expect(immediate).toHaveLength(2);expect(immediate[1][0]).toBe('Cover letter');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  const card=page.locator(`[data-job-card="${stored.id}"]`);
  await expect(card.locator('.cv-tracker-card-top span').first()).toContainText('Application Pack');
  await card.locator('[data-card-edit]').click();
  phase('tracker-note-edit');
  await expect(page.locator('[data-job-pack] option:checked')).toHaveText('Cover letter katika Application Pack');
  await page.locator('[data-job-field="notes"]').fill('Payment Instructions, "quoted"; Māori');
  await page.locator('[data-job-field="salaryRange"]').fill('Balance Due');
  await page.locator('[data-tracker-form] button[type="submit"]').click();
  await card.locator('[data-card-status]').selectOption('applied');
  await expect(page.locator('.cv-layout-action-bar')).toHaveCSS('position','relative');
  phase('tracker-status-presentation');
  await expect(card.locator('.cv-tracker-status')).toHaveText(copy.trackerStatusLabels.applied);
  phase('tracker-note-protection');
  await expect(card.locator('.cv-tracker-note')).toHaveText('Payment Instructions, "quoted"; Māori');
  phase('tracker-salary-protection');
  await expect(card.locator('.cv-tracker-card-meta')).toContainText('Balance Due');
  phase('tracker-edited-csv-download');
  const rows=csv((await download(page,()=>page.locator('[data-tracker-export]').click({timeout:10000}))).toString('utf8'));
  expect(rows[0]).toEqual(Object.values(copy.trackerHeaders));
  expect(rows[1]).toHaveLength(15);expect(rows[1][0]).toBe('Cover letter');expect(rows[1][1]).toBe('Application Pack');
  expect(rows[1][8]).toBe(copy.trackerStatusLabels.applied);expect(rows[1][11]).toBe('Ndiyo');expect(rows[1][12]).toBe('Payment Instructions, "quoted"; Māori');
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))))[0].status).toBe('applied');
  const editedLead=await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0]);
  expect(editedLead.applicationPackId).toBe(stored.applicationPackId);expect(editedLead.applicationPackId).not.toBe('');
  expect(editedLead.applicationPack.coverLetter).toBe(stored.applicationPack.coverLetter);
  phase('tracker-repeated-pack-save');
  await page.locator('[data-pack-save]').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('afro_cv_job_pipeline')).map(lead=>lead.id))).toEqual([stored.id]);
});

test('native validation, copy failure, missing PDF and missing ZIP messages remain local',async({page})=>{
  test.setTimeout(90000);
  await prepare(page);
  phase('empty-export-validation');
  for(const format of ['txt','doc','pdf']) {
    await page.locator(`[data-pack-export="${format}"]`).click();
    await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Generate or write at least one asset before exporting.']);
  }
  await page.locator('[data-pack-role]').fill('');await page.locator('[data-pack-company]').fill('');
  await page.locator('[data-pack-save]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Add a target job title or company before saving to tracker.']);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('operation_failed'))}}));
  await page.locator('[data-pack-copy]').first().click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Copy failed. Select and copy manually.']);
  await page.locator('[data-pack-text="coverLetter"]').fill('Authored Māori export recovery.');
  phase('missing-pdf-fallback');
  await page.evaluate(()=>{window.__originalPackPdf=window.CVExportAtsPlainPdf;window.CVExportAtsPlainPdf=undefined;});
  await page.locator('[data-pack-export="pdf"]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['PDF export is unavailable in this browser. Use TXT or DOC export.']);
  expect((await download(page,()=>clickExport(page,'txt'))).toString('utf8')).toContain('Authored Māori export recovery.');
  await page.evaluate(()=>{window.CVExportAtsPlainPdf=window.__originalPackPdf;});
  phase('font-load-failure');
  await page.route('**/NotoSans-*.ttf',route=>route.fulfill({status:503,body:''}));
  await page.locator('[data-pack-export="pdf"]').click();
  await expect(page.locator('[data-pack-status]')).toHaveText('PDF haikuweza kutengenezwa. Jaribu tena au hamisha kama DOCX au TXT.');
  await page.unroute('**/NotoSans-*.ttf');
  phase('font-load-retry');
  expect((await pdfParse(new Uint8Array(await download(page,()=>clickExport(page,'pdf'))))).text).toContain('Authored Māori export recovery.');
  await page.evaluate(()=>{
    window.__failedZipStatuses=[];const status=CVExportUpgrade.status;
    CVExportUpgrade.status=value=>{window.__failedZipStatuses.push(value);status(value);};
  });
  await page.locator('[data-pack-text="coverLetter"]').fill('Authored unsupported 🧪 character.');
  phase('unsupported-character-zip');
  await page.locator('[data-pack-download]').click();
  await expect.poll(()=>page.evaluate(()=>window.__failedZipStatuses),{timeout:30000}).toContain('Fonti ya PDF haiauni baadhi ya herufi. Hamisha kama DOCX au TXT ili kuhifadhi maandishi yako yote.');
  expect((await download(page,()=>clickExport(page,'txt'))).toString('utf8')).toContain('Authored unsupported 🧪 character.');
  await page.locator('[data-pack-text="coverLetter"]').fill('Authored Māori export recovery.');
  phase('repaired-character-zip-retry');
  const recoveredZip=zip(await download(page,()=>page.locator('[data-pack-download]').click()));
  expect((await pdfParse(new Uint8Array(recoveredZip.find(entry=>entry.name.endsWith('-cover-letter.pdf')).bytes))).text).toContain('Authored Māori export recovery.');
  const result=await page.evaluate(async()=>{const statuses=[];CVExportUpgrade.status=value=>statuses.push(value);const original=window.Blob;window.Blob=undefined;const success=await CVApplicationPackExport.download();window.Blob=original;return{success,statuses};});
  expect(result.success).toBe(false);expect(result.statuses).toContain(copy.literals['Application Pack ZIP is unavailable in this browser.']);
});

test('fallback email and ungenerated placeholders use native copy without changing author text',async({page})=>{
  test.setTimeout(60000);await prepare(page);
  phase('fallback-placeholder-txt');
  await page.locator('[data-pack-tab="linkedinHeadline"]').click();
  await page.locator('[data-pack-text="linkedinHeadline"]').fill('Authored headline Māori.');
  const text=(await download(page,()=>page.locator('[data-pack-export="txt"]').click())).toString('utf8');
  expect(text).toContain('[bado haijatengenezwa]');expect(text).not.toContain('[not generated]');
  await page.evaluate(()=>{CVApplicationPack.generatePack=()=>{throw Error('operation_failed')};});
  phase('fallback-email-zip');
  const archive=zip(await download(page,()=>page.locator('[data-pack-download]').click()));
  const email=archive.find(entry=>entry.name.endsWith('-application-email.txt')).bytes.toString('utf8');
  expect(email).toContain('Mada: Maombi ya nafasi ya Cover letter');expect(email).toContain('Kwa timu ya uajiri,');
  expect(email).toContain('Global Compact Māori');expect(email).not.toMatch(/Subject:|Dear Hiring Team|Please find attached|Kind regards/);
});

test('edited pack rejects stale awaited PDF and recovers with exact authored content',async({page})=>{
  test.setTimeout(90000);await prepare(page);
  await page.locator('[data-pack-text="coverLetter"]').fill('Original authored Māori.');
  await page.evaluate(()=>{
    const original=CVExportAtsPlainPdf.buildPdf;window.__originalPdfBuilder=original;
    CVExportAtsPlainPdf.buildPdf=text=>new Promise((resolve,reject)=>{window.__resumePackPdf=()=>original(text).then(resolve,reject);});
  });
  let downloads=0;page.on('download',()=>downloads++);
  await page.locator('[data-pack-export="pdf"]').click();
  await page.waitForFunction(()=>typeof window.__resumePackPdf==='function');
  await page.locator('[data-pack-text="coverLetter"]').fill('Revised authored Ślusarz Māori.');
  await page.evaluate(()=>window.__resumePackPdf());
  await expect(page.locator('[data-pack-status]')).toHaveText(copy.literals['Application pack changed. Review it and export again.']);
  expect(downloads).toBe(0);
  await page.evaluate(()=>{CVExportAtsPlainPdf.buildPdf=window.__originalPdfBuilder;});
  const parsed=await pdfParse(new Uint8Array(await download(page,()=>clickExport(page,'pdf'))));
  expect(parsed.text).toContain('Revised authored Ślusarz Māori.');expect(parsed.text).not.toContain('Original authored Māori.');
});

test('edited CV rejects stale awaited ZIP and retry downloads current facts',async({page})=>{
  test.setTimeout(90000);await prepare(page);await page.locator('[data-pack-generate-all]').click();
  await page.evaluate(()=>{
    const original=CVExportAtsPlainPdf.buildPdf;window.__originalZipPdf=original;let paused=false;
    window.__zipStatuses=[];const status=CVExportUpgrade.status;
    CVExportUpgrade.status=value=>{window.__zipStatuses.push(value);status(value);};
    CVExportAtsPlainPdf.buildPdf=text=>{
      if(paused)return original(text);paused=true;
      return new Promise((resolve,reject)=>{window.__resumeZipPdf=()=>original(text).then(resolve,reject);});
    };
  });
  let downloads=0;page.on('download',()=>downloads++);
  await page.locator('[data-pack-download]').click();
  phase('stale-zip-initial-await');
  await page.waitForFunction(()=>typeof window.__resumeZipPdf==='function');
  await page.locator('[data-path="fn"]').fill('Revised Global Compact');
  await page.evaluate(()=>window.__resumeZipPdf());
  phase('stale-zip-rejection');
  await expect.poll(()=>page.evaluate(()=>window.__zipStatuses)).toContain(copy.literals['CV or application pack changed. Review it and export again.']);
  expect(downloads).toBe(0);
  await page.evaluate(()=>{CVExportAtsPlainPdf.buildPdf=window.__originalZipPdf;});
  phase('stale-zip-retry');
  const archive=zip(await download(page,()=>page.locator('[data-pack-download]').click({timeout:10000})));
  expect(JSON.parse(archive.find(entry=>entry.name.endsWith('-backup.json')).bytes.toString('utf8')).data.fn).toBe('Revised Global Compact');
  for(const entry of archive.filter(entry=>entry.name.endsWith('.pdf')))expect((await pdfParse(new Uint8Array(entry.bytes))).numpages).toBeGreaterThan(0);
});

test('saved CV backup import and reload preserve local pack and tracker facts',async({page})=>{
  test.setTimeout(90000);await prepare(page);
  await page.locator('[data-pack-generate-all]').click();await page.locator('[data-pack-save]').click();
  await page.locator('[data-cv-version-save-master]').click();
  const original=await page.evaluate(()=>({data:structuredClone(CVApp.getState().data),pipeline:JSON.parse(localStorage.getItem('afro_cv_job_pipeline')),packs:JSON.parse(localStorage.getItem('afro_cv_application_packs'))}));
  const backup=await download(page,()=>page.evaluate(()=>CVExportUpgrade.exportJson()));
  await page.locator('[data-path="fn"]').fill('Changed draft');
  await page.evaluate(()=>CVImportAssistant.open());
  await page.locator('[data-import-file]').setInputFiles({name:'synthetic-backup.json',mimeType:'application/json',buffer:backup});
  await expect(page.locator('[data-backup-restore]')).toBeEnabled();await page.locator('[data-backup-restore]').click();
  await page.reload();await page.waitForFunction(()=>window.CVVersionSystem&&window.CVApplicationPack);
  const restored=await page.evaluate(()=>({data:structuredClone(CVApp.getState().data),pipeline:JSON.parse(localStorage.getItem('afro_cv_job_pipeline')),packs:JSON.parse(localStorage.getItem('afro_cv_application_packs'))}));
  expect(restored.data).toEqual(original.data);expect(restored.pipeline).toEqual(original.pipeline);expect(restored.packs).toEqual(original.packs);
  await page.locator('.cv-flow-hero-actions [data-cv-flow-action="build"]').click();
  await page.locator('[data-cv-version-open-tracker]').click();await page.locator('[data-tracker-mode="list"]').click();
  await expect(page.locator('[data-job-card] .cv-tracker-card-top strong').first()).toHaveText('Cover letter');
  expect(csv((await download(page,()=>page.locator('[data-tracker-export]').click())).toString('utf8'))[1][1]).toBe('Application Pack');
});

test('local DOCX review preserves authored text and keyboard focus at 320 and 390',async({page})=>{
  test.setTimeout(90000);await prepare(page);
  const bytes=await download(page,()=>page.evaluate(()=>CVDocxExport.exportDocx()));
  const before=await page.evaluate(()=>JSON.stringify(CVApp.getState().data));
  const opener=page.locator('[data-path="fn"]');
  for(const width of [320,390]) {
    phase(`docx-review-${width}`);await page.setViewportSize({width,height:844});
    await opener.focus();await page.evaluate(()=>CVImportAssistant.open());
    await expect(page.locator('[data-import-text]')).toBeFocused();
    const close=page.locator('#cv-import-assistant-modal [data-import-close]').first();
    await close.focus();await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[data-import-parse]')).toBeFocused();
    await page.keyboard.press('Tab');await expect(close).toBeFocused();
    await page.locator('[data-import-file]').setInputFiles({name:'synthetic-cv.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
    await expect(page.locator('[data-import-text]')).toHaveValue(/Global Compact Māori/);
    await page.locator('[data-import-parse]').click();
    await expect(page.locator('[data-import-review]')).toBeVisible();
    const extracted=(await page.locator('[data-import-raw]').evaluateAll(fields=>fields.map(field=>field.value))).join('\n');
    expect(extracted).toContain('Global Compact Māori');expect(extracted).toContain('Payment Instructions 12%.');
    await expect(page.locator('[data-import-country]')).toBeFocused();
    expect(await page.evaluate(()=>JSON.stringify(CVApp.getState().data))).toBe(before);
    await page.keyboard.press('Escape');await expect(page.locator('#cv-import-assistant-modal')).not.toHaveClass(/open/);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

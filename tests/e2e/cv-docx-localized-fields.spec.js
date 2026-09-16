const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
function entries(b){let p=0;const out={};while(b.readUInt32LE(p)===0x04034b50){const size=b.readUInt32LE(p+18),n=b.readUInt16LE(p+26),x=b.readUInt16LE(p+28),start=p+30+n+x;out[b.subarray(p+30,p+30+n).toString()]=b.subarray(start,start+size).toString();p=start+size;}return out;}
for(const [route,heading]of [['/tools/cv-builder/','Summary'],['/fr/tools/generateur-cv/','Profil'],['/sw/zana/mjenzi-cv/','Muhtasari']])test('downloaded DOCX retains contacts and native headings: '+route,async({page,baseURL})=>{
 const fixture={fn:'Élodie',ln:'François Łukasz',summary:'Évaluation des systèmes. Ujuzi wa mawasiliano.',linkedin:'https://example.test/linkedin',github:'https://example.test/github',web:'https://example.test/website',portfolio:'https://example.test/portfolio',altPhone:'+250 700000001',edus:[{deg:'Maîtrise',sch:'Université Exemple',d:'Étude des systèmes durables.'}],refs:[{n:'Asha Mwang’ombe',rel:'Ancienne responsable'}],showRefs:true};
 const sent=[];page.on('request',r=>sent.push(r));
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));
 await page.goto(route);await page.waitForFunction(()=>window.CVDocxExport);
 await page.evaluate(f=>{Object.assign(window.CVApp.getState().data,f);window.CVApp.renderAll();},fixture);
 const pending=page.waitForEvent('download');await page.evaluate(()=>window.CVDocxExport.exportDocx());
 const zip=entries(fs.readFileSync(await(await pending).path()));
 for(const value of [fixture.fn,fixture.ln,fixture.summary,fixture.linkedin,fixture.github,fixture.web,fixture.portfolio,fixture.altPhone,fixture.edus[0].d,fixture.refs[0].n,fixture.refs[0].rel,heading])expect(zip['word/document.xml']).toContain(value);
 expect(zip['word/numbering.xml']).toContain('w:val="•"');
 expect(sent.every(r=>!decodeURIComponent(r.url()).includes('Élodie')&&!(r.postData()||'').includes('Élodie'))).toBe(true);
});

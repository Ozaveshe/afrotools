const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const fixture={fn:'Élodie',ln:'François Łukasz',title:'Ingénieure — Mhandisi',email:'synthetic@example.test',phoneCode:'+254',phone:'700000000',altPhone:'+250 700000001',loc:'Nairobi — Kigali',linkedin:'https://example.test/linkedin',github:'https://example.test/github',web:'https://example.test/website',portfolio:'https://example.test/portfolio',summary:'Évaluation des systèmes. Ujuzi wa mawasiliano.',exps:[{t:'Ingénieure',c:'Exemple',s:'2023',cur:true,d:'Amélioration vérifiée.'}],edus:[{deg:'Maîtrise',sch:'Université Exemple',y1:'2018',y2:'2020',d:'Étude des systèmes durables.'}],skills:{h:'Évaluation',s:'Uongozi',t:'SQL'},projs:[{n:'Projet Énergie',d:'Conception vérifiée.'}],certs:[{n:'Qualité',i:'Institut Exemple',y:'2025'}],langs:[{l:'Kiswahili',lv:'Fasaha'}],refs:[{n:'Asha Mwang’ombe',t:'Responsable',org:'Exemple',e:'ref@example.test',p:'+254 700000002',rel:'Ancienne responsable'}],showRefs:true};
function entries(buffer){const out={};let p=0;while(buffer.readUInt32LE(p)===0x04034b50){assert.equal(buffer.readUInt16LE(p+8),0);const size=buffer.readUInt32LE(p+18),nl=buffer.readUInt16LE(p+26),extra=buffer.readUInt16LE(p+28),start=p+30+nl+extra;out[buffer.subarray(p+30,p+30+nl).toString()]=buffer.subarray(start,start+size).toString();p=start+size;}return out;}
for(const [lang,headings]of [['en',['Summary','Experience','Education','References','Present']],['fr',['Profil','Expérience','Formation','Références','Aujourd’hui']],['sw',['Muhtasari','Uzoefu','Elimu','Wadhamini','Sasa']]])test('DOCX preserves all supplied fields and native copy: '+lang,async()=>{
 const document={readyState:'loading',documentElement:{lang},addEventListener(){}};
 const ctx={document,Blob,TextEncoder,Uint8Array,setTimeout(){},console,CVApp:{getState:()=>({data:fixture,template:'lagos-corporate'}),fmtMonth:x=>x},CVTemplateRegistry:{get:()=>({colorAccent:'#123456'})}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync(lang==='fr'?'fr/tools/generateur-cv/js/cv-docx-export.js':'tools/cv-builder/js/cv-docx-export.js','utf8'),ctx);
 const zip=entries(Buffer.from(await ctx.CVDocxExport.buildBlob().arrayBuffer()));
 const xml=zip['word/document.xml'];
 for(const value of [fixture.fn,fixture.ln,fixture.title,fixture.email,fixture.phone,fixture.altPhone,fixture.loc,fixture.linkedin,fixture.github,fixture.web,fixture.portfolio,fixture.summary,fixture.edus[0].d,fixture.projs[0].d,fixture.refs[0].rel,fixture.refs[0].n,...headings])assert.ok(xml.includes(value),value);
 assert.ok(zip['word/numbering.xml'].includes('w:val="•"'));
 assert.ok(!zip['word/numbering.xml'].includes('\\u2022'));
 if(lang!=='en')for(const heading of ['Summary','Experience','Education','References'])assert.ok(!xml.includes('>'+heading+'<'),heading);
});

for(const [lang,expected]of [['en','DOCX export is unavailable in this browser'],['fr','L’export DOCX est indisponible dans ce navigateur'],['sw','Uhamishaji wa DOCX haupatikani kwenye kivinjari hiki']])test('unsupported DOCX browser has native fallback: '+lang,()=>{
 let feedback;const ctx={document:{readyState:'loading',documentElement:{lang},addEventListener(){}},CVApp:{showToast:value=>{feedback=value;}}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync(lang==='fr'?'fr/tools/generateur-cv/js/cv-docx-export.js':'tools/cv-builder/js/cv-docx-export.js','utf8'),ctx);
 assert.equal(ctx.CVDocxExport.exportDocx(),false);assert.equal(feedback,expected);
});

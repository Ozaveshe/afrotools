const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const fixture={
  "fn": "Élodie",
  "ln": "François Łukasz",
  "title": "Ingénieure — Mhandisi",
  "email": "synthetic@example.test",
  "phoneCode": "+254",
  "phone": "700000000",
  "altPhone": "+250 700000000",
  "loc": "Nairobi — Kigali",
  "linkedin": "https://example.test/linkedin",
  "github": "https://example.test/github",
  "web": "https://example.test/website",
  "portfolio": "https://example.test/portfolio",
  "summary": "Profil synthétique : coordination d’équipe et contrôle qualité. Ujuzi wa mawasiliano na usimamizi wa miradi.",
  "exps": [
    {
      "t": "Ingénieure principale",
      "c": "Société Exemple",
      "l": "Kigali",
      "s": "2023-02",
      "cur": true,
      "d": "Réduit les coûts de 20 %.\nAmeongoza timu ya watu 12."
    },
    {
      "t": "Analyste de projets",
      "c": "Projet Exemple",
      "l": "Nairobi",
      "s": "2020-01",
      "e": "2023-01",
      "d": "Vérifié les données et les échéances."
    }
  ],
  "edus": [
    {
      "deg": "Maîtrise en ingénierie",
      "sch": "Université Exemple",
      "loc": "Nairobi",
      "y1": "2018",
      "y2": "2020",
      "g": "Mention très bien",
      "d": "Étude des systèmes durables."
    }
  ],
  "skills": {
    "h": "Analyse, Évaluation",
    "s": "Communication, Uongozi",
    "t": "Excel, SQL"
  },
  "projs": [
    {
      "n": "Projet Énergie",
      "tech": "Outils locaux",
      "d": "Conception d’un système efficace."
    }
  ],
  "certs": [
    {
      "n": "Certification Qualité",
      "i": "Institut Exemple",
      "y": "2025"
    }
  ],
  "langs": [
    {
      "l": "Français",
      "lv": "Courant"
    },
    {
      "l": "Kiswahili",
      "lv": "Fasaha"
    }
  ],
  "refs": [
    {
      "n": "Asha Mwang’ombe",
      "t": "Responsable",
      "org": "Exemple",
      "e": "ref@example.test",
      "p": "+254 700000001",
      "rel": "Ancienne responsable"
    }
  ],
  "showRefs": true,
  "showPhoto": false
};
for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/','/sw/zana/mjenzi-cv/']) {
 for(const template of ['lagos-corporate','nairobi-tech']) test(`mobile PDF keeps paper dimensions: ${route} ${template}`,async({page,baseURL},testInfo)=>{
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));
  await page.setViewportSize({width:320,height:844});
  await page.goto(route);await page.waitForFunction(()=>window.CVProductionTemplates&&window.CVExportUpgrade);
  await page.evaluate(({fixture,template})=>{const s=window.CVApp.getState();Object.assign(s.data,fixture);s.template=template;s.country='KE';window.CVApp.renderAll();},{fixture,template});
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   const pending=page.waitForEvent('download');
   await page.evaluate(()=>window.CVExportUpgrade.exportPdf());
   const file=testInfo.outputPath(`styled-${width}.pdf`);await(await pending).saveAs(file);
   const bytes=fs.readFileSync(file), parsed=await pdfParse(new Uint8Array(bytes));
   expect(parsed.numpages).toBe(1);
   // Inspect the actual PDF image stream dimensions, not just the pre-capture DOM.
   const imageWidths=[...bytes.toString('latin1').matchAll(/\/Width\s+(\d+)/g)].map(m=>Number(m[1]));
   expect(imageWidths.length).toBeGreaterThan(0);
   expect(Math.max(...imageWidths)).toBeGreaterThanOrEqual(1190);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
   expect(await page.locator('.cv-export-clone-wrap').count()).toBe(0);
  }
 });
}

"use strict";
const fs=require("fs"),path=require("path"),app=require("./lib/sw-boq-builder-contract.js"),root=path.resolve(__dirname,".."),page=fs.readFileSync(path.join(root,app.file),"utf8"),english=fs.readFileSync(path.join(root,app.englishFile),"utf8");
for(const token of [app.engine,"data-tool-verification-panel","exportJSON()","importJSON(event)","exportCSV()","exportTXT()","exportPDF()",`hreflang="en" href="https://afrotools.com${app.englishRoute}"`,`hreflang="fr" href="https://afrotools.com${app.frenchRoute}"`,`hreflang="sw" href="https://afrotools.com${app.swRoute}"`,app.image])if(!page.includes(token))throw new Error(`Swahili BOQ owner missing ${token}`);
if(!english.includes(app.engine))throw new Error("English BOQ owner does not consume the shared engine.");
console.log(`checked ${app.id}: ${app.englishRoute} -> ${app.swRoute}`);

#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const contract=JSON.parse(fs.readFileSync(path.join(root,"data/localization/sw-business-planner-final.json"),"utf8"));
const html=fs.readFileSync(path.join(root,contract.swahiliFile),"utf8");
const required=['lang="sw"',`<meta name="afrotools-sw-native-owner" content="${contract.englishId}">`,`<meta name="afrotools-sw-source-owner" content="${contract.sourceOwner}">`,`<link rel="canonical" href="https://afrotools.com${contract.swahiliRoute}">`,`<link rel="alternate" hreflang="en" href="https://afrotools.com${contract.englishRoute}">`,`<meta property="og:image" content="https://afrotools.com${contract.artwork}">`,'data-business-planner-sw','id="country-search"','id="region-filter"','id="country-code"','id="business-type"','id="industry"','data-generate','data-plan','data-plan-check','data-print','data-pdf','id="advisor-consent"','data-advisor','id="full-plan-consent"','data-full-plan','data-full-plan-pdf','/engines/business-planner-engine.js','/assets/vendor/jspdf/jspdf.umd.min.js','/assets/js/pages/financial/business-planner-sw-controller.js'];
const missing=required.filter((token)=>!html.includes(token)&&!fs.readFileSync(path.join(root,contract.controllerOwner),"utf8").includes(token));
if(missing.length){console.error(`Swahili business-planner owner contract failed: ${missing.join(", ")}`);process.exit(1);}
for(const owned of [contract.engineOwner,contract.controllerOwner,"assets/css/sw-business-planner-final.css",contract.artwork.replace(/^\//,"")]){const file=path.join(root,owned);if(!fs.existsSync(file)||(owned.endsWith(".webp")&&fs.statSync(file).size<1000)){console.error(`Business planner dependency missing: ${owned}`);process.exit(1);}}
console.log(`Swahili business-planner source owner is current: ${contract.countries} countries, ${contract.basePhases} phases, ${contract.baseExports.join("+")}, ${contract.aiSections.length} consent-gated AI sections`);

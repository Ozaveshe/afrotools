#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),{render}=require("./lib/route-fares-locale-page.js");
const ROOT=path.resolve(__dirname,"..");
const arg=process.argv.find(x=>x.startsWith("--locale="));
const locales=arg?[arg.slice(9)]:["fr","sw"];
const outputs={fr:"fr/tools/tarifs-itineraire/index.html",sw:"sw/zana/nauli-za-ruti/index.html"};
for(const locale of locales){if(!outputs[locale])throw new Error(`Unsupported locale: ${locale}`);const file=path.join(ROOT,outputs[locale]);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,render(locale).normalize("NFC")+"\n","utf8");console.log(`Generated ${outputs[locale]}`);}

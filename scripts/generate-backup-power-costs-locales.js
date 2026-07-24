#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),{render}=require('./lib/backup-power-costs-locale-page.js');
const ROOT=path.resolve(__dirname,'..');
const requested=process.argv.find(arg=>arg.startsWith('--locale='));
const locales=requested?[requested.slice(9)]:['fr','sw'];
const outputs={fr:'fr/tools/couts-secours-energie/index.html',sw:'sw/zana/gharama-ya-nishati-ya-dharura/index.html'};
for(const locale of locales){if(!outputs[locale])throw new Error('Unsupported locale: '+locale);const target=path.join(ROOT,outputs[locale]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,render(locale).normalize('NFC')+'\n','utf8');console.log('Generated '+outputs[locale]);}

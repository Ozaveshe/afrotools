#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),PAGE=path.join(ROOT,'tools/agric-profit/index.html'),JSON_FILE=path.join(ROOT,'data/agriculture/agric-profit-data.json'),JS_FILE=path.join(ROOT,'data/agriculture/agric-profit-data.js');
function extract(source){const start=source.indexOf('var SYMS='),end=source.indexOf('function loadCropDefaults()',start);if(start<0||end<0)throw new Error('Agric Profit embedded data markers missing');const c={};vm.createContext(c);vm.runInContext(source.slice(start,end),c);return{schemaVersion:1,symbols:JSON.parse(JSON.stringify(c.SYMS)),usdRates:JSON.parse(JSON.stringify(c.USD_RATES)),crops:JSON.parse(JSON.stringify(c.CROP_DATA))}}
function browser(data){return`(function(root,factory){'use strict';var data=factory();if(typeof module==='object'&&module.exports)module.exports=data;if(root)root.AGRIC_PROFIT_DATA=data;}(typeof window!=='undefined'?window:globalThis,function(){return ${JSON.stringify(data,null,2)};}));\n`}
function run(){const data=fs.existsSync(JSON_FILE)?JSON.parse(fs.readFileSync(JSON_FILE,'utf8')):extract(fs.readFileSync(PAGE,'utf8'));fs.writeFileSync(JSON_FILE,JSON.stringify(data,null,2)+'\n');fs.writeFileSync(JS_FILE,browser(data));console.log(`Agric Profit data owner: ${Object.keys(data.crops).length} crops, ${Object.keys(data.usdRates).length} countries`)}
if(require.main===module)run();module.exports={extract,browser};

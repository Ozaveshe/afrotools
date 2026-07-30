#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PAGE=path.join(ROOT,'agriculture/soil-ph/index.html');
function replaceFunction(source,name,replacement){
 const start=source.indexOf('function '+name+'(');if(start<0)throw new Error('Missing function '+name);
 const brace=source.indexOf('{',start);let depth=0,quote='',escape=false,line=false,block=false,end=-1;
 for(let index=brace;index<source.length;index+=1){const char=source[index],next=source[index+1];
  if(line){if(char==='\n')line=false;continue}if(block){if(char==='*'&&next==='/'){block=false;index+=1}continue}
  if(quote){if(escape){escape=false;continue}if(char==='\\'){escape=true;continue}if(char===quote)quote='';continue}
  if(char==='/'&&next==='/'){line=true;index+=1;continue}if(char==='/'&&next==='*'){block=true;index+=1;continue}
  if(char==='"'||char==="'"||char==='`'){quote=char;continue}if(char==='{')depth+=1;if(char==='}'&&--depth===0){end=index+1;break}
 }
 if(end<0)throw new Error('Unclosed function '+name);return source.slice(0,start)+replacement+source.slice(end);
}
function migrate(input){
 let source=input;
 const marker='<script>\n//';
 if(!source.includes('/engines/soil-ph-engine.js'))source=source.replace(marker,'<script src="/data/agriculture/soil-ph-data.js"></script>\n<script src="/engines/soil-ph-engine.js"></script>\n'+marker);
 const dataStart=source.indexOf('var CROPS = {'),textureEnd=source.indexOf(';',source.indexOf('var TEX =',dataStart))+1;
 if(dataStart<0||textureEnd<=dataStart)throw new Error('Missing embedded Soil pH data');
 source=source.slice(0,dataStart)+"var SOIL_DATA = window.AfroTools.SoilPhData;\nvar SOIL_ENGINE = window.AfroTools.SoilPhEngine;\nvar CROPS = SOIL_DATA.crops;\nvar TEX = SOIL_DATA.textures;"+source.slice(textureEnd);
 source=replaceFunction(source,'baseLimeRange',"function baseLimeRange(currentPH, targetPH) {\n  return SOIL_ENGINE.baseLimeRange(currentPH, targetPH);\n}");
 source=replaceFunction(source,'phLabel',"function phLabel(ph) {\n  var value = SOIL_ENGINE.phLabel(ph);\n  return { label: value.label, cls: value.code };\n}");
 source=replaceFunction(source,'phToPercent',"function phToPercent(ph) {\n  return SOIL_ENGINE.phToPercent(ph);\n}");
 source=replaceFunction(source,'getLimeName',"function getLimeName(quality) {\n  return SOIL_ENGINE.limeName(quality);\n}");
 source=replaceFunction(source,'getSuitability',"function getSuitability(ph, crop) {\n  var value = SOIL_ENGINE.suitability(ph, crop);\n  var text = { excellent: 'Excellent — soil pH is within optimal range.', marginal: 'Marginal — just outside optimal range. Slight yield reduction expected.', 'too-acidic': 'Poor — soil too acidic for this crop. Liming recommended.', 'too-alkaline': 'Poor — soil too alkaline for this crop.' }[value.code];\n  return { color: value.color, text: text };\n}");
 source=replaceFunction(source,'getTargetPH',"function getTargetPH(currentPH, crop) {\n  return SOIL_ENGINE.targetPH(currentPH, crop);\n}");
 const old="  var crop = cropKey ? CROPS[cropKey] : null;\n  var texMult = TEX[texture] || 1.0;\n  var depthMult = depth / 15;\n  // Lime quality correction: if lime purity < 100%, need more of it\n  // All rates assume 85% CCE agricultural limestone as base\n  var qualityCorr = 85 / limeQuality;\n  var limeName = getLimeName(limeQuality);\n\n  var phInfo = phLabel(phVal);";
 const next="  var model = SOIL_ENGINE.calculate({ ph: phVal, cropKey: cropKey, texture: texture, depth: depth, limeQuality: limeQuality, farmHa: farmHa, limePrice: limePrice }, SOIL_DATA);\n  window.SOIL_PH_LAST_RESULT = model;\n  var crop = model.crop;\n  var texMult = model.textureMultiplier;\n  var depthMult = model.depthMultiplier;\n  var qualityCorr = model.qualityCorrection;\n  var limeName = model.limeName;\n\n  var phInfo = { label: model.phInfo.label, cls: model.phInfo.code };";
 assert.ok(source.includes(old),'Missing main Soil pH calculation owner');source=source.replace(old,next);return source;
}
function run(){const current=fs.readFileSync(PAGE,'utf8'),output=current.includes('/engines/soil-ph-engine.js')?current:migrate(current);if(process.argv.includes('--check')){assert.equal(current,output);console.log('PASS Soil pH English shared-engine migration')}else{fs.writeFileSync(PAGE,output,'utf8');console.log('Migrated Soil pH English page to shared owners')}}
if(require.main===module)run();module.exports={migrate,replaceFunction};

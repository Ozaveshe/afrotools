'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
for (const file of ['engines/src/crop-rotation-engine.js','engines/crop-rotation-engine.js']) {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  const e=context.window.AfroTools.CropRotationEngine;
  const input={prevCrop:'maize',seasons:4,goal:'maximize_yield',soilCondition:'average'};
  const mono=e.calculate({...input,availableCrops:['maize']});
  assert.equal(mono.yieldBoost,0);
  assert.equal(mono.warnings.length,4);
  for(const s of mono.sequence){assert.equal(s.crop,s.prevCrop);assert.ok(s.warning);assert.doesNotMatch(s.reason,/different.*family/i);}
  const legacy=e.calculate({...input,availableCrops:['maize','beans']});
  assert.equal(legacy.sequence[0].crop,'common_bean');
  assert.deepEqual(legacy,e.calculate({...input,availableCrops:['maize','common_bean']}));
  const crops=e.getCropGroups();
  for(const a of Object.keys(crops))for(const b of Object.keys(crops)){
    if(crops[a].family===crops[b].family)assert.doesNotMatch(e.generateReason(a,b,'maximize_yield'),/different.*family/i);
  }
}

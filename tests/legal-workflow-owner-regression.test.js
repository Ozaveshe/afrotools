'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'scripts/verify-legal-workflow.js'),'utf8');
function verify(relative,from,to){
 const target=path.join(root,relative);
 const fakeFs={...fs,readFileSync(file,...args){const value=fs.readFileSync(file,...args);return path.resolve(file)===target?value.replace(from,to):value;}};
 vm.runInNewContext(source,{__dirname:path.join(root,'scripts'),process,console:{log(){}},require(name){if(name==='fs')return fakeFs;if(name==='node:child_process')return {execFileSync(){}};return require(name);}});
}
// The owner tests execute separately in the real CLI gate. These mutations check
// that its route exceptions still fail closed instead of bypassing coverage.
assert.doesNotThrow(()=>verify('does-not-exist','x','y'));
assert.throws(()=>verify('tools/rental-agreement/index.html','data-property-workflow','data-retired-workflow'),/Native property route owner missing/);
assert.throws(()=>verify('tools/plot-converter/index.html','data-tool="plot-converter"','data-tool="stamp-duty"'),/Native property route owner missing/);
assert.throws(()=>verify('tools/kenya-dpa/index.html','/assets/js/pages/government-verification-planner.js','/assets/js/pages/missing-planner.js'),/Kenya evidence planner runtime missing/);
assert.throws(()=>verify('legal/index.html','numberOfItems":69','numberOfItems":68'),/numberOfItems is not 69/);
console.log('Legal workflow owner regression mutations: PASS');

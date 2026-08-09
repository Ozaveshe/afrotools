'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const engine=require('../assets/js/engines/ke-wht.js');
const sw=fs.readFileSync(path.join(__dirname,'../sw/zana/kikokotoo-wht-kenya/index.html'),'utf8');
const out=engine.calculate({scopeConfirmed:true,grossAmount:100000,paymentType:'dividend',residency:'resident',treatment:'standard'});
assert.deepStrictEqual({ok:out.ok,rate:out.rate,deduction:out.deduction,net:out.netPayment},{ok:true,rate:10,deduction:10000,net:90000});
assert.strictEqual(engine.calculate({scopeConfirmed:false,grossAmount:100000,paymentType:'dividend',residency:'resident'}).ok,false);
assert.match(sw,/lang="sw"/);assert.match(sw,/data-ke-wht-app/);assert.match(sw,/assets\/js\/engines\/ke-wht\.js/);assert.match(sw,/ke-wht\.webp/);assert.doesNotMatch(sw,/iframe/i);
console.log('Swahili Kenya WHT static and oracle checks passed');

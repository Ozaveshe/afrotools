"use strict";const assert=require("assert"),engine=require("../assets/js/engines/funeral-budget-engine.js");
const result=engine.calculate({currency:"kes",items:[{label:"Venue quote",amount:1000},{label:"Food quote",amount:2000}],bufferPercent:10,availableFund:500,confirmedBenefit:300,contributors:5,days:10});
assert.deepEqual({subtotal:result.subtotal,buffer:result.buffer,total:result.total,gap:result.gap,perContributor:result.perContributor,perDay:result.perDay},{subtotal:3000,buffer:300,total:3300,gap:2500,perContributor:500,perDay:250});
assert.throws(()=>engine.calculate({currency:"KES",items:[{label:"A",amount:-1}],bufferPercent:0,availableFund:0,confirmedBenefit:0,contributors:1,days:1}),/ITEM_AMOUNT_REQUIRED/);
assert.throws(()=>engine.calculate({currency:"KES",items:[{label:"A",amount:1},{label:"a",amount:2}],bufferPercent:0,availableFund:0,confirmedBenefit:0,contributors:1,days:1}),/DUPLICATE_ITEM/);
console.log("funeral-budget-engine: ok");

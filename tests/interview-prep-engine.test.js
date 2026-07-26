'use strict';const assert=require('node:assert/strict');const engine=require('../tools/interview-prep/interview-prep-engine.js');
const plan=engine.compile({role:' Operations analyst ',employer:'Example Co',format:'panel',instructions:'Bring a case study',evidence:[{requirement:'Process improvement',proof:'Reduced cycle time'}],stories:[{title:'Launch',situation:'Context',task:'Own delivery',action:'Mapped risks',result:'Delivered'}],questions:['How is success measured?','']});
assert.equal(plan.role,'Operations analyst');assert.equal(plan.evidence.length,1);assert.equal(plan.stories[0].action,'Mapped risks');assert.deepEqual(plan.questions,['How is success measured?']);assert.throws(()=>engine.compile({role:' '}));
assert.equal(engine.compile({role:'A',evidence:[{}],stories:[{}],questions:[' ']}).stories.length,0);
console.log('interview-prep-engine: ok');

const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../assets/js/lib/education-applications');
const item={id:'one',sourceKey:'',title:'Engineering admission',kind:'admission',status:'Preparing',url:'https://example.org/admissions',deadline:'2027-01-10',checkedOn:'2026-09-13',nextAction:'Prepare transcript',documents:[{label:'Transcript',done:false}],archived:false};
test('shortlist import preserves existing progress and does not infer deadlines',()=>{
 const source=[{key:'award-one',title:'Award',officialUrl:'https://example.org/award',deadline:'2027-01-01'}];
 const first=api.importShortlist(api.empty(),source);first.items[0].status='Submitted';
 const again=api.importShortlist(first,source);
 assert.equal(again.items.length,1);assert.equal(again.items[0].status,'Submitted');assert.equal(again.items[0].deadline,'');
});
test('dates require a recorded source check; unsafe links and duplicate document tasks are rejected',()=>{
 assert.throws(()=>api.upsert(api.empty(),{...item,checkedOn:''}));
 assert.throws(()=>api.upsert(api.empty(),{...item,deadline:'2027-02-30'}));
 assert.throws(()=>api.upsert(api.empty(),{...item,url:'javascript:alert(1)'}));
 assert.throws(()=>api.upsert(api.empty(),{...item,documents:[{label:'Transcript',done:false},{label:'transcript',done:true}]}));
});
test('backup merge retains existing records and failed writes leave prior data intact',()=>{
 const state=api.upsert(api.empty(),item);
 assert.deepEqual(api.merge(state,api.upsert(api.empty(),{...item,title:'Different'})),state);
 let raw=JSON.stringify(state);const storage={getItem:()=>raw,setItem:()=>{throw Error('Quota');}};
 assert.throws(()=>api.write(storage,{version:1,items:[]}));assert.deepEqual(api.read(storage),state);
});

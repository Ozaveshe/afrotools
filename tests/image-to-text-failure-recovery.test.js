"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/lib/image-to-text-studio.js'),'utf8');
// Execute the shipped owner unchanged. The DOM/decoder are synthetic; the
// recognizer rejects except for a discarded stale synthetic reply. Genuine OCR
// accuracy and export bytes are proved separately by a native bundled worker.
function studio(options={}){
 const nodes=new Map(),urls=new Map(),recognitions=[],pending=[],timers=[];let next=0;
 function node(id){if(nodes.has(id))return nodes.get(id);const classes=new Set(),events={};const n={value:'',textContent:'',innerHTML:'',style:{},hidden:false,disabled:false,width:20,height:10,files:[],children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle(x,on){on?classes.add(x):classes.delete(x)}},setAttribute(){},getAttribute(){return ''},addEventListener(type,fn){(events[type]||(events[type]=[])).push(fn)},async fire(type,event={}){for(const fn of events[type]||[])await fn(event)},appendChild(x){this.children.push(x)},querySelector(s){return node(id+'/'+s)},remove(){},click(){return this.fire('click')},toDataURL(){return 'data:image/png;base64,CONTROLLED_DECODER_FIXTURE'},getContext(){return {drawImage(){},clearRect(){},save(){},restore(){},translate(){},rotate(){},getImageData(){return {data:new Uint8ClampedArray(4)}},putImageData(){}}}};nodes.set(id,n);return n;}
 class DecoderImage{constructor(){this.naturalWidth=20;this.naturalHeight=10}set src(url){const f=urls.get(url);queueMicrotask(()=>f.bad?this.onerror():this.onload())}}
 const document={readyState:'complete',getElementById:node,createElement:tag=>node(tag+'-'+nodes.size),querySelectorAll:()=>[],addEventListener(){},head:node('head'),body:node('body')};
 const context={document,Image:DecoderImage,URL:{createObjectURL(f){const u='blob:fixture-'+(++next);urls.set(u,f);return u},revokeObjectURL(u){urls.delete(u)}},localStorage:{getItem(){return null},setItem(){}},navigator:{},console,Blob,setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},queueMicrotask,Tesseract:{async recognize(image,language,runOptions){recognitions.push('rejected');if(options.defer)return new Promise((resolve,reject)=>pending.push({resolve,reject,runOptions}));throw Error('CONTROLLED_REJECTION_NO_RECOGNITION_SUCCESS')}}};if(options.bootstrap)delete context.Tesseract;context.window=context;vm.createContext(context);vm.runInContext(source,context,{filename:'actual-image-to-text-studio.js'});
 async function settle(){for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve))}
 async function add(files){node('ocrInput').files=files;await node('ocrInput').fire('change');await settle()}
 async function load(index){await node('ocrQueue').children[index].querySelector('button').click();await settle()}
 return {node,add,load,settle,recognitions,pending,timers,completeBootstrap(){context.Tesseract={async recognize(){recognitions.push("BOOTSTRAP_OLD_JOB_MUST_NOT_RUN");throw Error("BOOTSTRAP_CONTROL")}};node("head").children.find(n=>n.src&&n.src.includes("tesseract.min.js")).onload()}};
}
const image=(name,bad=false)=>({name,type:'image/png',size:128,bad});
test('failed recognition is not counted as a completed queued image',async()=>{
 const s=studio();await s.add([image('one.png'),image('two.png')]);await s.node('ocrBatchBtn').click();await s.settle();
 assert.equal(s.recognitions.length,2);assert.equal(s.node('ocrStatus').textContent,'Processed 0 of 2 queued images; 2 failed.');
 assert.equal(s.node('ocrDownloadJsonBtn').disabled,true);assert.equal(s.node('ocrDownloadTxtBtn').disabled,true);
});
test('failed decode clears the previous active image and disables stale run/export',async()=>{
 const s=studio();await s.add([image('valid.png'),image('broken.png',true)]);assert.equal(s.node('ocrRunBtn').disabled,false);
 await s.load(1);assert.match(s.node('ocrStatus').textContent,/could not be decoded/);assert.equal(s.node('ocrRunBtn').disabled,true);
 assert.equal(s.node('ocrOriginalCanvas').hidden,true);assert.equal(s.node('ocrPreparedCanvas').hidden,true);assert.equal(s.node('ocrTextArea').value,'');assert.equal(s.node('ocrDownloadJsonBtn').disabled,true);
 await s.node('ocrRunBtn').click();await s.settle();assert.equal(s.recognitions.length,0,'failed selection must not OCR previous pixels');
});
test('batch skips undecodable images and reports decode plus recognition failures honestly',async()=>{
 const s=studio();await s.add([image('valid.png'),image('broken.png',true)]);await s.node('ocrBatchBtn').click();await s.settle();
 assert.equal(s.recognitions.length,1);assert.equal(s.node('ocrStatus').textContent,'Processed 0 of 2 queued images; 2 failed.');
});
test('a valid selection after failed decode restores the actual upload controls',async()=>{
 const s=studio();await s.add([image('first.png'),image('broken.png',true)]);await s.load(1);assert.equal(s.node('ocrRunBtn').disabled,true);
 await s.load(0);assert.equal(s.node('ocrRunBtn').disabled,false);assert.match(s.node('ocrStatus').textContent,/Loaded first.png/);assert.equal(s.node('ocrOriginalCanvas').hidden,false);
});

test('shared Sw adapter localizes honest batch totals and failures',()=>{
 const adapter=fs.readFileSync(path.join(__dirname,'../assets/js/lib/image-to-text-studio-sw.js'),'utf8');
 const marker='  var targets = [';assert.equal(adapter.split(marker).length,2);
 const seam='window.__translateStatus=translate; return;';
 const instrumented=adapter.replace(marker,seam+marker);
 assert.equal(instrumented.replace(seam,''),adapter);
 const context={document:{documentElement:{lang:'sw'}},window:{}};
 vm.runInNewContext(instrumented,context);
 assert.equal(context.window.__translateStatus('Processed 1 of 2 queued images; 1 failed.'),'Picha 1 kati ya 2 zimechakatwa; 1 zimeshindwa.');
 assert.equal(context.window.__translateStatus('Processed 2 of 2 queued images.'),'Picha 2 kati ya 2 zimechakatwa.');
});

test('late OCR failure/progress cannot overwrite a newly selected image',{timeout:1000},async()=>{
 const s=studio({defer:true});await s.add([image('old.png'),image('new.png')]);await s.node('ocrRunBtn').click();await s.settle();assert.equal(s.pending.length,1);
 await s.load(1);const status=s.node('ocrStatus').textContent,progress=s.node('ocrProgressText').textContent;
 s.pending[0].runOptions.logger({progress:0.9,status:'OLD_JOB_PROGRESS'});s.pending[0].reject(Error('OLD_JOB_FAILURE'));await s.settle();
 assert.equal(s.node('ocrStatus').textContent,status);assert.match(status,/Loaded new.png/);assert.equal(s.node('ocrProgressText').textContent,progress);assert.equal(s.node('ocrRunBtn').disabled,false);
});
test('an old pending job cannot unlock the newer image recognition controls',{timeout:1000},async()=>{
 const s=studio({defer:true});await s.add([image('old.png'),image('new.png')]);await s.node('ocrRunBtn').click();await s.settle();await s.load(1);await s.node('ocrRunBtn').click();await s.settle();assert.equal(s.pending.length,2);
 s.pending[0].reject(Error('OLD_JOB_FAILURE'));await s.settle();assert.equal(s.node('ocrRunBtn').disabled,true);assert.equal(s.node('ocrRunBtn').textContent,'Reading...');
 s.pending[1].reject(Error('NEW_JOB_FAILURE'));await s.settle();assert.equal(s.node('ocrRunBtn').disabled,false);
});
test('a batch stops without completion status or further loads after visitor selection changes',{timeout:1000},async()=>{
 const s=studio({defer:true});await s.add([image('one.png'),image('two.png')]);const batch=s.node('ocrBatchBtn').click();await s.settle();assert.equal(s.pending.length,1);
 await s.load(1);const status=s.node('ocrStatus').textContent;s.pending[0].reject(Error('OLD_BATCH_FAILURE'));await s.settle();
 assert.equal(s.node('ocrStatus').textContent,status);assert.match(status,/Loaded two.png/);assert.equal(s.recognitions.length,1);
});

test('late synthetic OCR success is discarded before it can mutate newer image or exports',{timeout:1000},async()=>{
 const s=studio({defer:true});await s.add([image('old.png'),image('new.png')]);await s.node('ocrRunBtn').click();await s.settle();
 await s.load(1);const status=s.node('ocrStatus').textContent;
 s.pending[0].resolve({data:{text:'STALE_SYNTHETIC_REPLY_NOT_OCR_PROOF',confidence:100}});await s.settle();
 assert.equal(s.node('ocrStatus').textContent,status);assert.match(status,/Loaded new.png/);assert.equal(s.node('ocrTextArea').value,'');
 assert.equal(s.node('ocrDownloadJsonBtn').disabled,true);assert.equal(s.node('ocrDownloadTxtBtn').disabled,true);
 assert.equal(s.node('ocrRunBtn').disabled,false);assert.equal(s.node('ocrOriginalCanvas').hidden,false);
});

test('selection during deferred lazy bootstrap discards old job before progress or recognition',{timeout:1000},async()=>{
 const s=studio({bootstrap:true});await s.add([image('old.png'),image('new.png')]);await s.node('ocrRunBtn').click();await s.settle();
 await s.load(1);const status=s.node('ocrStatus').textContent,progress=s.node('ocrProgressText').textContent;
 s.completeBootstrap();await s.settle();
 assert.equal(s.recognitions.length,0);assert.equal(s.node('ocrStatus').textContent,status);assert.equal(s.node('ocrProgressText').textContent,progress);
 assert.equal(s.node('ocrRunBtn').disabled,false);assert.equal(s.node('ocrTextArea').value,'');
});

test('completed old-job timer cannot hide progress of a new job on the same image',{timeout:1000},async()=>{
 const s=studio({defer:true});await s.add([image('same.png')]);await s.node('ocrRunBtn').click();await s.settle();
 s.pending[0].resolve({data:{text:'SYNTHETIC_SCHEDULER_CONTROL',confidence:80}});await s.settle();
 assert.equal(s.timers.length,1);await s.node('ocrRunBtn').click();await s.settle();
 const progress=s.node('ocrProgressText').textContent;s.timers[0]();
 assert.equal(s.node('ocrProgressText').textContent,progress);assert.equal(s.node('ocrRunBtn').disabled,true);
 s.pending[1].reject(Error('CONTROLLED_END'));await s.settle();
});

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'../tools/flashcard-maker/index.html');
const html=fs.readFileSync(file,'utf8'),start=html.indexOf('function copyReviewPack() {'),end=html.indexOf('\nfunction downloadReviewPack()',start);
assert(start>=0&&end>start,'Flashcard copy controller missing');
const source=html.slice(start,end);
async function scenario(mode,legacy,success){
 let status='',active,temporary=0,calls=0,payload;
 const button={focus(){active=button;}};active=button;
 const document={get activeElement(){return active;},createElement(){const area={value:'',style:{},setAttribute(){},focus(){active=area;},select(){active=area;}};return area;},body:{appendChild(){temporary++;},removeChild(){temporary--;}},execCommand(){calls++;if(legacy==='throw')throw Error('denied');return legacy;}};
 const navigator={};if(mode!=='missing')navigator.clipboard={writeText(text){payload=text;if(mode==='throw')throw Error('denied');return mode==='reject'?Promise.reject(Error('denied')):Promise.resolve();}};
 const context={document,navigator,Promise,buildReviewPackText:()=> 'Synthetic review pack',setReviewPackStatus:x=>status=x};vm.createContext(context);vm.runInContext(source,context);
 await context.copyReviewPack();await new Promise(setImmediate);
 assert.equal(status,success?'Review pack copied.':'Copy failed. Download the TXT pack instead.',mode+'/'+legacy);
 assert.equal(temporary,0,'Temporary selection area must be removed');assert.equal(active,button,'Copy focus must be restored');
 assert.equal(calls,mode==='resolve'?0:1,'Fallback called only when required');if(mode!=='missing')assert.equal(payload,'Synthetic review pack');
}
(async()=>{
 await scenario('reject',false,false);await scenario('reject',true,true);await scenario('resolve',false,true);
 await scenario('missing',false,false);await scenario('missing',true,true);await scenario('throw',false,false);await scenario('reject','throw',false);
 console.log('PASS: 7 flashcard clipboard capability, failure and focus scenarios');
})().catch(error=>{console.error(error);process.exitCode=1;});

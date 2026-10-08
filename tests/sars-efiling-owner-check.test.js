'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const script=path.resolve(__dirname,'../scripts/build-sw-sars-efiling-final.js'),target=path.resolve(__dirname,'../sw/zana/mwongozo-wa-sars-efiling/index.html'),source=fs.readFileSync(script,'utf8'),page=fs.readFileSync(target,'utf8'),nativeRequire=createRequire(script);
function check(html,args=["--check"]){let code=0;const fakeFs={...fs,existsSync:p=>path.resolve(String(p))===target?html!==null:fs.existsSync(p),readFileSync:(p,...args)=>path.resolve(String(p))===target?html:fs.readFileSync(p,...args),writeFileSync:()=>assert.fail('Check must not write')};const exit={};try{vm.runInNewContext(source,{require:name=>name==='fs'||name==='node:fs'?fakeFs:nativeRequire(name),__dirname:path.dirname(script),process:{argv:['node',script,...args],exit:value=>{code=value;throw exit}},console:{log:()=>{},error:()=>{}}})}catch(error){if(error!==exit)throw error}return code}
test('accepts the committed release-processed page without rewriting it',()=>assert.equal(check(page),0));
test('accepts cache hash and newline differences',()=>assert.equal(check(page.replace(/\?v=[a-f0-9]+/g,'?v=abcdef12').replace(/\r?\n/g,'\r\n')),0));
test('fails when the page is absent',()=>assert.equal(check(null),1));
for(const [name,from,to] of [
 ['visible instruction','Nitaandika au kuthibitisha domain rasmi ya SARS mwenyewe.','Changed instruction'],
 ['official route','https://secure.sarsefiling.co.za/','https://example.invalid/'],
 ['canonical','rel="canonical" href="https://afrotools.com/sw/zana/mwongozo-wa-sars-efiling/"','rel="canonical" href="https://afrotools.com/sw/zana/other/"'],
 ['workspace control','id="sarsPreparationWorkspace"','id="missingWorkspace"'],
 ['app script','/assets/js/lib/sars-efiling-guide.js','/assets/js/lib/other-guide.js'],
 ['structured data','"@type":"FAQPage"','"@type":"WrongType"'],
 ['privacy boundary','Hakuna fomu ya kuingia','Ingiza nenosiri hapa']
])test('rejects drift in '+name,()=>{assert.ok(page.includes(from),'Fixture must target existing content');assert.equal(check(page.replace(from,to)),1)});
test('rejects an added form or unowned runtime script',()=>{assert.equal(check(page.replace('</body>','<form><input name="taxNumber"></form></body>')),1);assert.equal(check(page.replace('</body>','<script src="/unowned.js"></script></body>')),1)});

test('default generation preserves an already-current processed page without writes',()=>assert.equal(check(page,[]),0));

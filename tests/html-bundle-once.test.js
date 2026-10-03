'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const manifest={core:{path:'/assets/js/bundles/core.12345678.min.js',files:['assets/js/lib/dark-mode.js','assets/js/lib/analytics.js']},'tool-page':{path:'/assets/js/bundles/tool-page.23456789.min.js',files:['assets/js/components/tool-page.js']},chat:{path:'/assets/js/bundles/chat.34567890.min.js',files:['assets/js/components/chat-panel.js']}};
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'afro-bundle-once-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 function write(file,bytes){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 for(const file of ['scripts/update-html-bundles.js','scripts/lib/shared-asset-references.js'])write(file,fs.readFileSync(path.join(repo,file)));
 write('assets/js/bundles/manifest.json',JSON.stringify(manifest));
 return {write,read:file=>fs.readFileSync(path.join(root,file),'utf8'),run:(only='index.html')=>{const r=spawnSync(process.execPath,[path.join(root,'scripts/update-html-bundles.js'),'--only='+only],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}};
}
const tag=src=>`<script src="${src}" defer></script>`;
const bundleTags=(html,name)=>[...html.matchAll(new RegExp('<script\\b[^>]*src="[^" ]*/bundles/'+name+'\\.[^"]+"[^>]*></script>','g'))];

test('existing bundle duplicates and individual members execute only once; unrelated inline bytes stay exact',t=>{
 const f=fixture(t),inline='<script>window.unrelated="keep every byte";</script>';
 f.write('index.html','<html><body>'+tag('/assets/js/bundles/core.aaaaaaaa.min.js')+inline+tag('/assets/js/lib/analytics.js')+tag('/assets/js/bundles/core.bbbbbbbb.min.js?v=old')+'</body></html>');
 f.run();const first=f.read('index.html');assert.equal(bundleTags(first,'core').length,1);assert(first.includes(inline));assert(!first.includes('/assets/js/lib/analytics.js'));
 const context={window:{}};
 for(const m of first.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const src=m[1].match(/src="([^"]+)"/);if(src){assert.equal(src[1],manifest.core.path);vm.runInNewContext('window.coreRuns=(window.coreRuns||0)+1;',context);}else vm.runInNewContext(m[2],context);}
 assert.equal(context.window.coreRuns,1);assert.equal(context.window.unrelated,'keep every byte');
 f.run();assert.equal(f.read('index.html'),first);
});

test('earliest member retains document position when an existing bundle occurs later',t=>{
 const f=fixture(t),marker='<script>window.positionMarker=true;</script>';
 f.write('index.html','<html><body>'+tag('/assets/js/lib/dark-mode.js')+marker+tag('/assets/js/bundles/core.aaaaaaaa.min.js')+'</body></html>');
 f.run();const html=f.read('index.html');assert.equal(bundleTags(html,'core').length,1);assert(html.indexOf(manifest.core.path)<html.indexOf(marker));assert(html.includes(marker));
});

test('explicit tool/chat bundles deduplicate while lazy and non-tool individual scripts retain their contract',t=>{
 const f=fixture(t);f.write('index.html','<html><body>'+tag('/assets/js/components/tool-page.js')+tag('/assets/js/components/chat-panel.js')+tag('/assets/js/bundles/tool-page.aaaaaaaa.min.js')+tag('/assets/js/bundles/tool-page.bbbbbbbb.min.js')+tag('/assets/js/bundles/chat.aaaaaaaa.min.js')+tag('/assets/js/bundles/chat.bbbbbbbb.min.js')+'</body></html>');
 f.run();const html=f.read('index.html');assert.equal(bundleTags(html,'tool-page').length,1);assert.equal(bundleTags(html,'chat').length,1);assert(html.includes(tag('/assets/js/components/tool-page.js')));assert(html.includes(tag('/assets/js/components/chat-panel.js')));
 f.write('index.html','<html><body class="tool-page">'+tag('/assets/js/components/tool-page.js')+tag('/assets/js/components/chat-panel.js')+'</body></html>');f.run();const tool=f.read('index.html');assert.equal(bundleTags(tool,'tool-page').length,1);assert.equal(bundleTags(tool,'chat').length,0);assert(tool.includes(tag('/assets/js/components/chat-panel.js')));
});

test('selected-page processing leaves other pages and unknown bundle families untouched',t=>{
 const f=fixture(t),other='<html>'+tag('/assets/js/bundles/core.aaaaaaaa.min.js')+tag('/assets/js/bundles/core.bbbbbbbb.min.js')+'</html>',unknown=tag('/assets/js/bundles/custom.12345678.min.js');
 f.write('unselected.html',other);f.write('index.html','<html>'+unknown+tag('/assets/js/bundles/core.aaaaaaaa.min.js')+'</html>');f.run();assert.equal(f.read('unselected.html'),other);assert(f.read('index.html').includes(unknown));
});

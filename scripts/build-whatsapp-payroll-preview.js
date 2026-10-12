'use strict';
// Build a local browser preview from the same country engines and adapter used by WhatsApp.
// Include only the selected pure functions, never the webhook configuration or provider code.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const local=require('module').createRequire(root+'/package.json'),acorn=local('acorn');
const files=fs.readdirSync(root+'/netlify/functions/_engines').filter(x=>x.endsWith('.js')).sort().map(x=>'netlify/functions/_engines/'+x);
const known=new Set(files);
for(let i=0;i<files.length;i++){
 const file=files[i],source=fs.readFileSync(root+'/'+file,'utf8');
 const tree=acorn.parse(source,{ecmaVersion:'latest'});
 function visit(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='require'&&node.arguments[0]?.type==='Literal'){
   const request=node.arguments[0].value;if(!request.startsWith('.'))throw Error('Nonlocal browser dependency '+request);
   let resolved=path.resolve(root,path.dirname(file),request);if(!path.extname(resolved))resolved+='.js';
   assert(resolved.startsWith(path.resolve(root)+path.sep),'Dependency escaped repository');
   const relative=path.relative(root,resolved).replaceAll('\\','/');
   if(relative!=='data/calculation-quality/formula-registry.json'&&!known.has(relative)){assert(relative.endsWith('.js'),'Unexpected dependency format');known.add(relative);files.push(relative);}
  }
  for(const child of Object.values(node))if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);
 }
 visit(tree);
}
const definitions=files.map(file=>JSON.stringify(file)+':function(module,exports,require){\n'+fs.readFileSync(root+'/'+file,'utf8').replace(/\r\n/g,'\n')+'\n}');
const registry=JSON.parse(fs.readFileSync(root+'/data/calculation-quality/formula-registry.json','utf8'));
registry.formulas=registry.formulas.filter(f=>f.formulaFamily==='paye-server'&&f.jurisdictions.length===1);
definitions.push(JSON.stringify('data/calculation-quality/formula-registry.json')+':function(module){module.exports='+JSON.stringify(registry)+';}');
const original=fs.readFileSync(root+'/netlify/functions/afrowork-whatsapp.js','utf8');
const name=acorn.parse(original,{ecmaVersion:'latest'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='countryName');
const adapterNode=acorn.parse(original,{ecmaVersion:'latest'}).body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='handlePaye');
assert(adapterNode && name,'Required payroll adapter functions are missing');
const adapter=original.slice(adapterNode.start,adapterNode.end);
const bundle=`(function(root){'use strict';
var definitions={${definitions.join(',\n')}},cache={};
function resolve(from,request){
 if(request.charAt(0)!=='.')throw Error('Unsupported browser engine import');
 var pieces=from.split('/');pieces.pop();
 request.split('/').forEach(function(piece){if(piece==='..')pieces.pop();else if(piece!=='.'&&piece)pieces.push(piece);});
 var id=pieces.join('/');if(!/\\.(js|json)$/.test(id))id+='.js';return id;
}
function load(id){if(cache[id])return cache[id].exports;if(!definitions[id])throw Error('Missing browser engine '+id);var module={exports:{}};cache[id]=module;definitions[id](module,module.exports,function(request){return load(resolve(id,request));});return module.exports;}
var payeEngines=load('netlify/functions/_engines/index.js');
var BotEngine=root.AfroTools&&root.AfroTools.engines&&root.AfroTools.engines.whatsappBot;
if(!BotEngine)throw Error('WhatsApp command engine must load before payroll preview');
var SITE_URL='https://afrotools.com';
${original.slice(name.start,name.end)}
${adapter}
root.AfroTools.whatsappPayrollPreview=handlePaye;
})(window);\n`.replace(/\r\n/g,'\n');
const output=path.join(root,'assets/js/pages/whatsapp-payroll-preview.js');
if(process.argv.includes('--check')) {
 assert(fs.existsSync(output),'Missing generated payroll preview');
 assert.equal(fs.readFileSync(output,'utf8'),bundle,'Generated payroll preview is stale');
} else {
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,bundle);
}
console.log('WhatsApp payroll preview: '+files.length+' local modules, '+Buffer.byteLength(bundle)+' bytes; '+(process.argv.includes('--check')?'verified':'generated'));

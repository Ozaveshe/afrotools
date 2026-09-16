const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const acorn=require('acorn');
for(const file of ['assets/js/pages/freelance-invoice.js','fr/tools/facture-freelance/js/freelance-invoice.js']){
 const source=fs.readFileSync(file,'utf8');let merge;
 function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id.name==='f')merge=source.slice(node.start,node.end);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
 visit(acorn.parse(source,{ecmaVersion:'latest'}));assert.ok(merge,'shared draft merge exists');
 const result=vm.runInNewContext(`
  ${merge}
  const draft={meta:{reference:'before'}};
  const input=JSON.parse('{"__proto__":{"invoicePolluted":true},"meta":{"reference":"after","constructor":{"prototype":{"invoicePolluted":true}},"prototype":{"invoicePolluted":true}}}');
  f(draft,input);
  JSON.stringify({draft,polluted:({}).invoicePolluted===true,ownConstructor:Object.hasOwn(draft.meta,'constructor'),ownPrototype:Object.hasOwn(draft.meta,'prototype')});
 `);
 assert.deepEqual(JSON.parse(result),{draft:{meta:{reference:'after'}},polluted:false,ownConstructor:false,ownPrototype:false});
}
console.log('Freelance invoice merges preserve ordinary fields and reject prototype keys in both owners.');

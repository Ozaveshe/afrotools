"use strict";
const acorn=require('acorn');
function calculation(html){
 const found=[];
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  if(!match[1].includes('function calculate'))continue;
  const offset=match.index+match[0].indexOf(match[1]);
  function walk(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id.name==='calculate')found.push({body:node.body.body,offset});for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}
  walk(acorn.parse(match[1],{ecmaVersion:'latest'}));
 }
 if(found.length!==1)throw Error('Expected one calculate function');return found[0];
}
function refreshSaveReadiness(target,source){
 const src=calculation(source),dst=calculation(target);
 const index=src.body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='saveButton'));
 if(index<0||src.body[index+1].type!=='IfStatement')throw Error('Missing source save readiness contract');
 const block=source.slice(src.offset+src.body[index].start,src.offset+src.body[index+1].end);
 if(!block.includes('saveButton.disabled = false'))throw Error('Unexpected source readiness');
 const existing=dst.body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='saveButton'));
 if(existing>=0){const current=target.slice(dst.offset+dst.body[existing].start,dst.offset+dst.body[existing+1].end);if(current!==block)throw Error('Target readiness differs');return target;}
 const anchors=dst.body.filter(n=>target.slice(dst.offset+n.start,dst.offset+n.end)==="$('bonusCard').style.display = 'block';");
 if(anchors.length!==1)throw Error('Missing unique result anchor');
 const at=dst.offset+anchors[0].end;return target.slice(0,at)+'\n    '+block+target.slice(at);
}
module.exports={refreshSaveReadiness};

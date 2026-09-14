(function(root,factory){
  'use strict';var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.ssceWritten=api;}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  var key='afrotools.ssceWritten.v1';
  function empty(bank){return {version:1,bankId:bank.id,entries:{}};}
  function normalize(value,bank){
    if(!value||value.version!==1||value.bankId!==bank.id||!value.entries||typeof value.entries!=='object'||Array.isArray(value.entries))throw Error('This written-practice backup is not supported.');
    var out=empty(bank);
    Object.keys(value.entries).forEach(function(id){
      var item=bank.items.find(function(q){return q.id===id;}),entry=value.entries[id];
      if(!item||!entry||typeof entry.answer!=='string'||entry.answer.length>20000||!Array.isArray(entry.checks)||entry.checks.length!==item.checks.length||!entry.checks.every(function(c){return typeof c==='boolean';}))throw Error('This written-practice backup contains an invalid response.');
      out.entries[id]={answer:entry.answer,checks:entry.checks.slice()};
    });
    return out;
  }
  function read(storage,bank){var raw=storage.getItem(key);return raw?normalize(JSON.parse(raw),bank):empty(bank);}
  function write(storage,bank,id,entry){
    // Validate the existing snapshot before replacing it. Failed writes preserve the editor.
    var state=read(storage,bank);state.entries[id]=entry;state=normalize(state,bank);
    var raw=JSON.stringify(state);storage.setItem(key,raw);
    if(storage.getItem(key)!==raw)throw Error('The browser did not confirm this save. Download a backup to keep your work.');
    return state;
  }
  function report(bank,state){
    state=normalize(state,bank);var lines=['AfroTools written practice',bank.scope];
    bank.items.forEach(function(q){var entry=state.entries[q.id];if(!entry)return;lines.push('',q.title,q.origin,q.sourceUse,q.source,q.passage||'',q.prompt,'My response:',entry.answer,'Self-review:',...q.checks.map(function(c,i){return (entry.checks[i]?'[x] ':'[ ] ')+c;}),'Worked guide:',q.answer,...q.steps);});
    return lines.filter(function(line){return line!==undefined;}).join('\n');
  }
  return {key:key,empty:empty,normalize:normalize,read:read,write:write,report:report};
});

(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.educationApplications=api;}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  var key='afrotools.educationApplications.v1';
  var statuses=['Researching','Preparing','Submitted','Offer received','Unsuccessful','Withdrawn'];
  function text(value,max){if(typeof value!=='string'||value.length>max)throw Error('A field is too long or invalid.');return value.trim();}
  function date(value){
    if(!value)return '';
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Choose a valid date.');
    var parsed=new Date(value+'T12:00:00Z');
    if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw Error('Choose a valid date.');
    return value;
  }
  function url(value){
    if(!value||value==='#')return '';
    var raw=text(value,2000),parsed;
    try{parsed=new URL(raw);}catch(e){throw Error('Use a complete official page URL, starting with https://.');}
    if(!/^https?:$/.test(parsed.protocol)||parsed.username||parsed.password)throw Error('Use an http or https source link without login details.');
    return parsed.href;
  }
  function empty(){return {version:1,items:[]};}
  function normalize(value){
    if(!value||value.version!==1||!Array.isArray(value.items)||value.items.length>200)throw Error('This application backup is not supported.');
    var ids=new Set(),sources=new Set();
    return {version:1,items:value.items.map(function(item){
      if(!item||typeof item!=='object')throw Error('An application record is invalid.');
      var id=text(item.id,300),title=text(item.title,180),sourceKey=text(item.sourceKey||'',300);
      if(!id||!title||ids.has(id)||(sourceKey&&sources.has(sourceKey)))throw Error('An application is missing a title or repeats an existing record.');
      ids.add(id);if(sourceKey)sources.add(sourceKey);
      if(!['scholarship','admission'].includes(item.kind)||!statuses.includes(item.status))throw Error('Choose a supported application type and status.');
      var deadline=date(item.deadline),checkedOn=date(item.checkedOn),source=url(item.url);
      if(deadline&&(!checkedOn||!source))throw Error('Add the official source and the date you checked it before recording a deadline.');
      if(!Array.isArray(item.documents)||item.documents.length>30)throw Error('Keep the document checklist to 30 items.');
      var labels=new Set();
      var documents=item.documents.map(function(doc){
        if(!doc||typeof doc.done!=='boolean')throw Error('A document task is invalid.');
        var label=text(doc.label,120);if(!label||labels.has(label.toLowerCase()))throw Error('Document task names must be nonempty and unique.');
        labels.add(label.toLowerCase());return {label:label,done:doc.done};
      });
      return {id:id,sourceKey:sourceKey,title:title,kind:item.kind,status:item.status,url:source,deadline:deadline,checkedOn:checkedOn,nextAction:text(item.nextAction||'',240),documents:documents,archived:item.archived===true};
    })};
  }
  function read(storage){var raw=storage.getItem(key);return raw?normalize(JSON.parse(raw)):empty();}
  function write(storage,value){var safe=normalize(value);storage.setItem(key,JSON.stringify(safe));return safe;}
  function upsert(state,item){var next=normalize(state),index=next.items.findIndex(function(x){return x.id===item.id;});if(index<0)next.items.push(item);else next.items[index]=item;return normalize(next);}
  function importShortlist(state,items){
    var next=normalize(state);
    items.forEach(function(item){
      var sourceKey=text(item.key,300);if(!sourceKey||next.items.some(function(x){return x.sourceKey===sourceKey;}))return;
      var source='';try{source=url(item.officialUrl);}catch(e){/* The student can add a verified source in the editor. */}
      next.items.push({id:'scholarship:'+sourceKey,sourceKey:sourceKey,title:text(item.title,180),kind:'scholarship',status:'Researching',url:source,deadline:'',checkedOn:'',nextAction:'Check the current cycle and requirements on the official provider page.',documents:[],archived:false});
    });
    return normalize(next);
  }
  function merge(state,incoming){var next=normalize(state);normalize(incoming).items.forEach(function(item){if(!next.items.some(function(x){return x.id===item.id||(item.sourceKey&&x.sourceKey===item.sourceKey);}))next.items.push(item);});return normalize(next);}
  return {key:key,statuses:statuses,empty:empty,normalize:normalize,read:read,write:write,upsert:upsert,importShortlist:importShortlist,merge:merge};
});

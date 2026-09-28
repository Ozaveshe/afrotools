(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.studentDay=api;}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  var KEY='afrotools.studentDay.v1';
  function day(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) throw new Error('Choose a valid date.');
    var d=new Date(value+'T12:00:00Z');
    if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value) throw new Error('Choose a valid date.');
    return d;
  }
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function addDays(value,count){var d=day(value);d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
  function empty(){return {version:1,tasks:[],activeId:null};}
  function normalize(value){
    if(!value||value.version!==1||!Array.isArray(value.tasks)||value.tasks.length>500) throw new Error('This study backup is not supported.');
    var ids=new Set();
    var tasks=value.tasks.map(function(t){
      if(!t||typeof t.id!=='string'||!t.id||t.id.length>300||ids.has(t.id)||typeof t.subject!=='string'||!t.subject.trim()||t.subject.length>120) throw new Error('A study task is invalid.');
      ids.add(t.id);day(t.date);
      if(!Number.isInteger(t.minutes)||t.minutes<5||t.minutes>240) throw new Error('Session length must be 5–240 minutes.');
      if(t.doneAt!=null&&(typeof t.doneAt!=='string'||!Number.isFinite(Date.parse(t.doneAt)))) throw new Error('A completion date is invalid.');
      var task={id:t.id,subject:t.subject.trim(),date:t.date,minutes:t.minutes,doneAt:t.doneAt||null,sourceId:typeof t.sourceId==='string'?t.sourceId.slice(0,250):null,deckId:typeof t.deckId==='string'?t.deckId.slice(0,100):null};
      if(t.revision!=null){
        var r=t.revision;
        if(task.sourceId!=='ssce-practice'||!r||typeof r.bankId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(r.bankId)||!['en','fr','sw'].includes(r.locale)||!Array.isArray(r.ids)||!r.ids.length||r.ids.length>200||new Set(r.ids).size!==r.ids.length||r.ids.some(function(id){return typeof id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(id);}))throw new Error('A revision session is invalid.');
        task.revision={bankId:r.bankId,locale:r.locale,ids:r.ids.slice()};
      }
      return task;
    });
    return {version:1,tasks:tasks,activeId:tasks.some(function(t){return t.id===value.activeId&&!t.doneAt;})?value.activeId:null};
  }
  function read(storage){var raw=storage.getItem(KEY);return raw?normalize(JSON.parse(raw)):empty();}
  function write(storage,state){var safe=normalize(state);storage.setItem(KEY,JSON.stringify(safe));return safe;}
  function plan(state,sessions,start,minutes){
    var result=normalize(state),weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var base=day(start).getUTCDay();
    if(!Array.isArray(sessions)||!sessions.length) throw new Error('Generate a timetable first.');
    sessions.forEach(function(s){
      var target=weekdays.indexOf(s.day);if(target<0)throw new Error('A timetable day is invalid.');
      var date=addDays(start,(target-base+7)%7),id=date+'|'+s.id;
      if(!result.tasks.some(function(t){return t.id===id;}))result.tasks.push({id:id,sourceId:s.id,subject:s.subject,date:date,minutes:minutes,doneAt:null});
    });
    return normalize(result);
  }
  function change(state,id,action,value){
    var result=normalize(state),task=result.tasks.find(function(t){return t.id===id;});
    if(!task)throw new Error('This task is no longer available. Refresh your day.');
    if(action==='done'){task.doneAt=new Date().toISOString();if(result.activeId===id)result.activeId=null;}
    else if(action==='undo'){task.doneAt=null;}
    else if(action==='move'){day(value);task.date=value;}
    else if(action==='start'){if(task.doneAt)throw new Error('This session is already complete.');result.activeId=id;}
    else throw new Error('Unknown study action.');
    return result;
  }
  function scheduleRevision(state,revision,subject,date){
    var result=normalize(state);
    var existing=result.tasks.find(function(t){return !t.doneAt&&t.date===date&&t.subject===subject&&t.revision&&t.revision.bankId===revision.bankId&&t.revision.locale===revision.locale&&JSON.stringify(t.revision.ids)===JSON.stringify(revision.ids);});
    if(existing)return result;
    var suffix=1,id;
    do{id='ssce|'+date+'|'+suffix++;}while(result.tasks.some(function(t){return t.id===id;}));
    result.tasks.push({id:id,subject:subject,date:date,minutes:20,doneAt:null,sourceId:'ssce-practice',revision:revision});
    return normalize(result);
  }
  function revisionHref(task){return ({en:'/tools/ssce-practice/',fr:'/fr/tools/pratique-waec-neco/',sw:'/sw/zana/mazoezi-waec-neco/'}[task.revision?task.revision.locale:'en'])+(task.revision?'#revision='+encodeURIComponent(task.id):'');}
  function view(state,date){day(date);var tasks=normalize(state).tasks.slice().sort(function(a,b){return a.date.localeCompare(b.date)||a.id.localeCompare(b.id);});return {due:tasks.filter(function(t){return !t.doneAt&&t.date<=date;}),upcoming:tasks.filter(function(t){return !t.doneAt&&t.date>date;}),completed:tasks.filter(function(t){return !!t.doneAt;})};}
  return {key:KEY,today:today,addDays:addDays,empty:empty,normalize:normalize,read:read,write:write,plan:plan,change:change,view:view,scheduleRevision:scheduleRevision,revisionHref:revisionHref};
});

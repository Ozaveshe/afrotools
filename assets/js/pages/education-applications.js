(function(){
 'use strict';
 var api=window.AfroTools.educationApplications;
 var fieldId=0;
 function node(tag,text,cls){var el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
 function button(text,run){var el=node('button',text);el.type='button';el.addEventListener('click',run);return el;}
 function link(text,url){var el=node('a',text);el.href=url;return el;}
 function mount(host){
  var state=api.empty(),loadError=false;
  var status=node('p','','sd-status');status.setAttribute('role','status');status.tabIndex=-1;
  function load(){try{state=api.read(localStorage);loadError=false;}catch(e){loadError=true;status.textContent='Saved applications could not be loaded. The saved copy has not been changed. Export your current work before clearing browser data.';}}
  function save(next,message){try{state=api.write(localStorage,next);loadError=false;render();status.textContent=message;status.focus({preventScroll:true});return true;}catch(e){status.textContent='Could not save: '+e.message;return false;}}
  function field(parent,title,type,value){var label=node('label',title),input=node('input');input.type=type;input.value=value||'';label.append(input);parent.append(label);return input;}
  function select(parent,title,options,value){var wrap=node('div'),label=node('label',title),input=node('select');input.id='ea-select-'+(++fieldId);label.htmlFor=input.id;options.forEach(function(option){var el=node('option',option.label||option);el.value=option.value||option;input.append(el);});input.value=value;wrap.append(label,input);parent.append(wrap);return input;}
  function edit(item){
   var details=node('details','','ea-item');var summary=node('summary');
   summary.append(node('strong',item.title),node('span',item.status+(item.deadline?' · Your deadline: '+item.deadline:' · Deadline not recorded')));details.append(summary);
   if(item.nextAction)details.append(node('p','Next: '+item.nextAction));
   if(item.url){var source=link('Open recorded source',item.url);source.target='_blank';source.rel='noopener noreferrer';details.append(source);}
   var form=node('form'),fields=node('div','','sd-fields');
   var title=field(fields,'Application name','text',item.title);title.required=true;title.maxLength=180;
   var kind=select(fields,'Application type',[{value:'scholarship',label:'Scholarship'},{value:'admission',label:'Admission'}],item.kind);
   var stage=select(fields,'Application status',api.statuses,item.status);
   var sourceInput=field(fields,'Official source URL','url',item.url);sourceInput.maxLength=2000;
   var deadline=field(fields,'Confirmed application deadline','date',item.deadline);
   var checked=field(fields,'Date you checked the official source','date',item.checkedOn);
   var now=new Date();checked.max=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
   form.append(fields,node('p','Record dates only after checking the current application cycle. This tracker does not send reminders or submit applications.'));
   var next=field(form,'Next action','text',item.nextAction);next.maxLength=240;
   var docs=node('fieldset','','ea-documents');docs.append(node('legend','Your required documents'));
   docs.append(node('p','List only documents the provider requests. Track preparation here; keep the files and identity details outside this checklist.'));
   var rows=[];
   item.documents.forEach(function(doc){var row=node('div'),label=node('label'),check=node('input');check.type='checkbox';check.checked=doc.done;label.append(check,node('span',doc.label));var record={label:doc.label,input:check,removed:false};row.append(label,button('Remove '+doc.label,function(){record.removed=true;row.remove();}));docs.append(row);rows.push(record);});
   var extra=field(docs,'Add a required document or task','text','');extra.maxLength=120;form.append(docs);
   var actions=node('div','','sd-actions'),submit=node('button','Save application');submit.type='submit';actions.append(submit);
   actions.append(button(item.archived?'Restore application':'Archive application',function(){try{var latest=api.read(localStorage),current=latest.items.find(function(x){return x.id===item.id;});if(!current)throw Error('Application no longer exists. Reload the page.');current.archived=!current.archived;save(api.upsert(latest,current),'Application '+(current.archived?'archived.':'restored.'));}catch(e){status.textContent=e.message;}}));
   form.append(actions);form.addEventListener('submit',function(e){e.preventDefault();try{
    var documents=rows.filter(function(row){return !row.removed;}).map(function(row){return {label:row.label,done:row.input.checked};});if(extra.value.trim())documents.push({label:extra.value.trim(),done:false});
    var updated={id:item.id,sourceKey:item.sourceKey,title:title.value,kind:kind.value,status:stage.value,url:sourceInput.value,deadline:deadline.value,checkedOn:checked.value,nextAction:next.value,documents:documents,archived:item.archived};
    save(api.upsert(api.read(localStorage),updated),'Application saved on this device.');
   }catch(err){status.textContent='Could not save: '+err.message;}});details.append(form);return details;
  }
  function render(){
   host.replaceChildren();host.append(node('span','MY APPLICATIONS','sd-kicker'),node('h2','Turn your shortlist into next steps.'));
   var active=state.items.filter(function(item){return !item.archived;});
   host.append(node('p',active.length+(active.length===1?' active application':' active applications')+' · '+(loadError?'Storage unavailable':'Saved on this device'),'sd-summary'));
   host.append(node('p','Keep each application’s status, confirmed deadline, next action and document checklist together. These records stay in this browser.'));
   var actions=node('div','','sd-actions');
   if(window.AfroTools.scholarshipShortlist){actions.append(button('Track my saved scholarships',function(){try{var latest=api.read(localStorage),next=api.importShortlist(latest,window.AfroTools.scholarshipShortlist.items());var count=next.items.length-latest.items.length;save(next,count?count+' applications added. Confirm each deadline at its official source.':'No new scholarships to add. Existing progress is kept.');}catch(e){status.textContent='Could not import shortlist: '+e.message;}}));}
   else actions.append(link('Choose scholarships to track','/tools/scholarship-finder/#my-applications'));
   actions.append(link('My Study Space','/tools/education-hub/#my-applications'),link('Admission checklists','/tools/university-admission/'));host.append(actions);
   active.slice().sort(function(a,b){return (a.deadline||'9999').localeCompare(b.deadline||'9999');}).forEach(function(item){host.append(edit(item));});
   var archived=state.items.filter(function(item){return item.archived;});if(archived.length){var history=node('details','','sd-history');history.append(node('summary','Archived applications ('+archived.length+')'));archived.forEach(function(item){history.append(edit(item));});host.append(history);}
   var form=node('form','','sd-add');form.append(node('h3','Add an application'));var fields=node('div','','sd-fields');
   var title=field(fields,'New application name','text','');title.required=true;title.maxLength=180;
   var kind=select(fields,'New application type',[{value:'scholarship',label:'Scholarship'},{value:'admission',label:'Admission'}],'admission');
   form.append(fields);var add=node('button','Add application');add.type='submit';add.disabled=loadError;form.append(add);
   form.addEventListener('submit',function(e){e.preventDefault();try{var item={id:crypto.randomUUID(),sourceKey:'',title:title.value,kind:kind.value,status:'Researching',url:'',deadline:'',checkedOn:'',nextAction:'',documents:[],archived:false};save(api.upsert(api.read(localStorage),item),'Application added. Open it to record requirements and next steps.');}catch(err){status.textContent='Could not add application: '+err.message;}});host.append(form);
   var backup=node('div','','sd-actions');backup.append(button('Download applications backup',function(){var url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=link('Download',url);a.download='afrotools-applications.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}));
   var restore=field(backup,'Restore applications backup','file','');restore.accept='.json,application/json';restore.addEventListener('change',async function(){var file=restore.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Backup exceeds 1 MB.');var incoming=api.normalize(JSON.parse(await file.text()));save(api.merge(api.read(localStorage),incoming),'Backup imported. Existing application records kept.');}catch(e){status.textContent='Backup not imported: '+e.message;}});host.append(backup,status);
  }
  load();render();window.addEventListener('storage',function(e){if(e.key===api.key)status.textContent='Applications changed in another tab. Reload this page to view them; unsaved edits remain here.';});
 }
 function boot(){document.querySelectorAll('[data-education-applications]').forEach(mount);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

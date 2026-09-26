(function(){
 'use strict';
 var api=window.AfroTools.studentDay;
 function trackCompletion(task){var analytics=window.AfroTools&&window.AfroTools.analytics;if(analytics&&typeof analytics.track==='function')analytics.track('education_study_session_complete',{source:task.sourceId==='ssce-practice'?'ssce_practice':'study_plan'});}
 function node(tag,text,cls){var el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
 function boot(){document.querySelectorAll('[data-student-day]').forEach(mount);}
 function mount(host){
  var state=api.empty(),storageOK=true;
  var status=node('p','','sd-status');status.setAttribute('role','status');status.tabIndex=-1;
  function load(){try{state=api.read(localStorage);storageOK=true;}catch(e){storageOK=false;status.textContent='Saved study data could not be loaded. Your existing data has not been changed. Enable browser storage or use your saved backup.';}}
  function save(next,message){try{state=api.write(localStorage,next);storageOK=true;render();status.textContent=message;status.focus({preventScroll:true});window.dispatchEvent(new CustomEvent('student-day-updated'));return true;}catch(e){status.textContent='Could not save: '+e.message+' Your last saved plan is unchanged.';return false;}}
  function button(text,handler){var b=node('button',text);b.type='button';b.addEventListener('click',handler);return b;}
  function link(text,url){var a=node('a',text);a.href=url;return a;}
  function taskRow(task){
   var row=node('li','','sd-task'),copy=node('div','','sd-task-copy');
   copy.append(node('strong',task.subject));copy.append(node('span',task.minutes+' min · '+task.date+(task.date<api.today()&&!task.doneAt?' · Unfinished':'')));
   row.append(copy);var actions=node('div','','sd-actions');
   if(task.doneAt)actions.append(button('Undo completion',function(){save(api.change(state,task.id,'undo'),'Session restored.');}));
   else{
    actions.append(button(state.activeId===task.id?'Continue session':'Start session',function(){if(save(api.change(state,task.id,'start'),'Session ready. Mark it done when you finish studying.'))host.querySelector('.sd-focus').focus();}));
    actions.append(button('Mark done',function(){if(save(api.change(state,task.id,'done'),'Session completed.'))trackCompletion(task);}));
    var move=node('details','','sd-move');move.append(node('summary','Move date'));
    var label=node('label','New date for '+task.subject),date=node('input');date.type='date';date.value=task.date;label.append(date);move.append(label);
    move.append(button('Move session',function(){try{save(api.change(state,task.id,'move',date.value),'Session moved.');}catch(e){status.textContent=e.message;}}));actions.append(move);
   }
   row.append(actions);return row;
  }
  function render(){
   host.replaceChildren();host.append(node('span','YOUR STUDY DAY','sd-kicker'));host.append(node('h2','A little progress, every day.'));
   var v=api.view(state,api.today());host.append(node('p',v.due.length+(v.due.length===1?' session ready':' sessions ready')+' · '+v.completed.length+' completed · '+(storageOK?'Saved on this device':'Storage unavailable'),'sd-summary'));
   if(!state.tasks.length){host.append(node('p','Start with one subject for today, or bring in your weekly timetable.'));}
   var active=state.tasks.find(function(t){return t.id===state.activeId;});
   if(active){var focus=node('section','','sd-focus');focus.tabIndex=-1;focus.append(node('h3','Continue: '+active.subject));focus.append(node('p','Spend '+active.minutes+' minutes studying. Practise a question, check your reasoning, then mark this session complete.'));var paths=node('div','','sd-actions');paths.append(link(active.deckId?'Review this deck':'Open my flashcards','/tools/flashcard-maker/'+(active.deckId?'#review='+encodeURIComponent(active.deckId):'')),link('JAMB past questions','/jamb/past-questions/'));if(active.sourceId==='ssce-practice')paths.prepend(link('Open WAEC/NECO practice',api.revisionHref(active)));paths.append(button('Finish this session',function(){if(save(api.change(state,active.id,'done'),'Session complete. Your next task is ready.'))trackCompletion(active);}));focus.append(paths);host.append(focus);}
   if(v.due.length){var list=node('ul','','sd-list');v.due.forEach(function(t){list.append(taskRow(t));});host.append(list);}
   else if(state.tasks.length)host.append(node('p','You have no unfinished sessions due today. You can start an upcoming session or add a new task.'));
   [['Coming up',v.upcoming],['Completed sessions',v.completed]].forEach(function(group){if(!group[1].length)return;var details=node('details','','sd-history');details.append(node('summary',group[0]+' ('+group[1].length+')'));var list=node('ul','','sd-list');group[1].forEach(function(t){list.append(taskRow(t));});details.append(list);host.append(details);});
   var form=node('form','','sd-add');form.append(node('h3','Add a study session'));
   var fields=node('div','','sd-fields');
   function field(title,type,value){var label=node('label',title),input=node('input');input.type=type;input.required=true;input.value=value||'';label.append(input);fields.append(label);return input;}
   var subject=field('Subject or topic','text','');subject.maxLength=120;subject.placeholder='e.g. Mathematics: fractions';
   var minutes=field('Minutes','number','25');minutes.min='5';minutes.max='240';minutes.step='5';var date=field('Study date','date',api.today());
   form.append(fields);var add=node('button','Add session');add.type='submit';add.disabled=!storageOK;form.append(add);
   form.addEventListener('submit',function(e){e.preventDefault();try{var next=api.normalize(state);next.tasks.push({id:'task-'+crypto.randomUUID(),subject:subject.value,date:date.value,minutes:Number(minutes.value),doneAt:null});save(next,'Study session added.');}catch(err){status.textContent=err.message;}});host.append(form);
   var footer=node('div','','sd-actions');footer.append(link('Edit my weekly timetable','/tools/study-planner/#daily-study'),link('Open My Study Space','/tools/education-hub/#daily-study'));
   footer.append(button('Download study backup',function(){var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=link('Download',url);a.download='afrotools-study-day.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}));
   var restore=node('label','Restore study backup','sd-restore'),input=node('input');input.type='file';input.accept='.json,application/json';restore.append(input);input.addEventListener('change',async function(){var file=input.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Backup is too large.');var incoming=api.normalize(JSON.parse(await file.text())),next=api.normalize(state);incoming.tasks.forEach(function(t){if(!next.tasks.some(function(x){return x.id===t.id;}))next.tasks.push(t);});save(next,'Backup imported. Existing sessions kept; duplicate IDs skipped.');}catch(e){status.textContent='Backup not imported: '+e.message;}});footer.append(restore);host.append(footer,status);
  }
  load();render();window.addEventListener('storage',function(e){if(e.key===api.key){load();render();}});window.addEventListener('student-day-plan-saved',function(){load();render();status.textContent='Timetable added to your study day.';});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

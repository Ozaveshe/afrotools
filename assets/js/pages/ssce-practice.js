(function(){
  'use strict';
  var bank=window.AfroTools.sscePracticeBank,api=window.AfroTools.sscePractice,day=window.AfroTools.studentDay;
  var area=document.getElementById('practice-session'),status=document.getElementById('practice-status'),state=null;
  var subject=document.getElementById('practice-subject'),topic=document.getElementById('practice-topic');
  function t(text){return bank.ui&&bank.ui[text]||text;}
  function errorText(error){return bank.locale==='fr'?(bank.ui[error.message]||'Impossible de terminer cette action. Les données enregistrées sont conservées.'):error.message;}
  function node(tag,text,cls){var el=document.createElement(tag);if(text!==undefined)el.textContent=t(text);if(cls)el.className=cls;return el;}
  function message(text){status.textContent=t(text);}
  function act(label,fn,primary){var b=node('button',label,'btn '+(primary?'btn-primary':'btn-secondary'));b.type='button';b.addEventListener('click',function(){try{fn();}catch(e){message(errorText(e));}});return b;}
  function download(name,text,type){var url=URL.createObjectURL(new Blob([text],{type:type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function topics(){topic.replaceChildren(new Option(t('All pilot topics'),''));Array.from(new Set(bank.questions.filter(function(q){return q.subject===subject.value;}).map(function(q){return q.topic;}))).forEach(function(label){topic.add(new Option(t(label),label));});}
  subject.addEventListener('change',topics);topics();
  document.getElementById('practice-start').addEventListener('click',function(){try{state=api.start(bank,subject.value,topic.value);message('Session started. Your saved session is kept until you choose Save progress.');render();}catch(e){message(errorText(e));}});
  function render(){
    area.replaceChildren();if(!state)return;
    var score=api.result(state,bank),q=bank.questions.find(function(q){return q.id===state.ids[state.index];});
    var heading=node('h2',q?'Question '+(state.index+1)+t(' of ')+state.ids.length:'Session complete');heading.tabIndex=-1;area.append(heading);
    if(q){
      area.append(node('p',t(q.subject)+' · '+t(q.topic)+' · '+t('Original practice'),'practice-meta'));
      if(q.passageId){var passage=bank.passages[q.passageId],box=node('section',undefined,'practice-passage');box.lang='en';box.append(node('h3',passage.title),node('p',passage.text));area.append(box);}
      var field=node('fieldset'),legend=node('legend',q.prompt);field.lang=q.questionLanguage||'en';field.append(legend);
      var chosen=state.answers[q.id];
      q.options.forEach(function(option,i){var label=node('label',undefined,'practice-option'),radio=node('input');radio.type='radio';radio.name='practice-answer';radio.value=String(i);radio.checked=chosen===i;radio.disabled=chosen!==undefined;label.append(radio,node('span',String.fromCharCode(65+i)+'. '+option));field.append(label);});area.append(field);
      if(chosen===undefined){area.append(act('Check answer',function(){var radio=field.querySelector('input:checked');if(!radio){message('Choose an answer first.');field.querySelector('input').focus();return;}state=api.answer(state,Number(radio.value),bank);message('Answer checked.');render();},true));}
      else{
        var feedback=node('p',chosen===q.answer?'Correct.':t('Correct answer: ')+q.options[q.answer],'practice-feedback');area.append(feedback);
        var details=node('details',undefined,'practice-explanation'),steps=node('ol');details.append(node('summary','Show explanation'));q.steps.forEach(function(s){steps.append(node('li',s));});details.append(steps,node('p',q.pitfall));area.append(details);
        area.append(act(state.index===state.ids.length-1?'See results':'Next question',function(){state=api.advance(state,bank);message('');render();},true));
      }
    }else{
      area.append(node('p',score.correct+t(' correct out of ')+score.total+t('. This is a practice score, not an exam-grade prediction.'),'practice-score'));
      var topicsSummary={};state.ids.forEach(function(id){var item=bank.questions.find(function(q){return q.id===id;});var s=topicsSummary[item.topic]||(topicsSummary[item.topic]={total:0,correct:0});s.total++;if(state.answers[id]===item.answer)s.correct++;});
      var list=node('ul');Object.keys(topicsSummary).forEach(function(t){list.append(node('li',(bank.ui&&bank.ui[t]||t)+': '+topicsSummary[t].correct+'/'+topicsSummary[t].total));});area.append(list);
      if(score.missed.length)area.append(act('Retry missed questions',function(){state=api.retry(state,bank);message('A new retry session has started.');render();},true));
      area.append(act('Save a revision session for tomorrow',function(){var saved=day.read(localStorage),date=day.addDays(day.today(),1),subjects=Array.from(new Set(state.ids.map(function(id){return bank.questions.find(function(q){return q.id===id;}).subject;}))).join(' & '),id='ssce|'+date+'|'+subjects;
        if(!saved.tasks.some(function(t){return t.id===id;}))saved.tasks.push({id:id,subject:t('WAEC/NECO practice: ')+subjects.split(' & ').map(t).join(' & '),date:date,minutes:20,doneAt:null,sourceId:'ssce-practice'});
        day.write(localStorage,saved);message('Revision saved for tomorrow in your study day.');
      }));
    }
    var controls=node('div',undefined,'practice-actions');
    controls.append(act('Save progress on this device',function(){var raw=localStorage.getItem(api.key);if(raw)api.normalize(JSON.parse(raw),bank);localStorage.setItem(api.key,JSON.stringify(api.normalize(state,bank)));message('Progress saved on this device.');}),act('Download progress backup',function(){download('afrotools-ssce-progress.json',JSON.stringify(state,null,2),'application/json');message('Progress backup downloaded.');}),act('Download practice report',function(){download('afrotools-ssce-report.txt',api.report(state,bank),'text/plain;charset=utf-8');message('Practice report downloaded.');}));area.append(controls);heading.focus();heading.scrollIntoView({block:"start",behavior:"instant"});
  }
  document.getElementById('practice-resume').addEventListener('click',function(){try{var raw=localStorage.getItem(api.key);if(!raw){message('There is no saved session on this device.');return;}state=api.normalize(JSON.parse(raw),bank);render();message('Saved session restored.');}catch(e){message('Saved progress could not be loaded. It has been kept unchanged. You can still start a new session and download a backup.');}});
  document.getElementById('practice-import').addEventListener('change',async function(){var file=this.files[0];if(!file)return;try{if(file.size>100000)throw Error('Choose a practice backup smaller than 100 KB.');var next=api.normalize(JSON.parse(await file.text()),bank);state=next;render();message('Backup opened. Choose Save progress to keep it on this device.');}catch(e){message(t('Backup not opened: ')+errorText(e));}this.value='';});
})();

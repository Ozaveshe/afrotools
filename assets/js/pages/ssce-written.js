(function(){
  'use strict';
  var root=document.getElementById('written-practice');if(!root)return;
  var bank=window.AfroTools.ssceWrittenBank,api=window.AfroTools.ssceWritten;
  var collection=document.getElementById('written-collection'),select=document.getElementById('written-task'),area=document.getElementById('written-editor'),status=document.getElementById('written-status');
  var current=null,answer=null,checks=[],draft=api.empty(bank),dirty=new Set();
  function t(text){return bank.ui&&bank.ui[text]||text;}
  function errorText(error){return bank.locale&&bank.locale!=='en'?(bank.ui[error.message]||t('Action failed. Saved data has been kept.')):error.message;}
  function el(tag,text,cls){var node=document.createElement(tag);if(text!==undefined)node.textContent=t(text);if(cls)node.className=cls;return node;}
  function message(text){status.textContent=t(text);}
  function button(text,fn){var b=el('button',text,'btn btn-secondary');b.type='button';b.addEventListener('click',function(){try{fn();}catch(e){message(errorText(e));}});return b;}
  function capture(){if(current&&answer&&(dirty.has(current.id)||draft.entries[current.id])){draft.entries[current.id]={answer:answer.value,checks:checks.map(function(c){return c.checked;})};}}
  function download(name,text,type){var url=URL.createObjectURL(new Blob([text],{type:type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function diagram(kind){
    var ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 300');svg.setAttribute('class','written-diagram');svg.setAttribute('role','img');
    function add(tag,attrs,text){var node=document.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){node.setAttribute(k,attrs[k]);});if(text)node.textContent=text;svg.append(node);return node;}
    var description=kind==='equilateral-sector'?'Equilateral triangle PQR of side 18 centimetres. P is at the top, Q and R are the base endpoints and M is their midpoint. The arc AB has centre P and touches the base at M. The two regions between the arc and the base are shaded.':'O is the centre of a circle with radius 7 centimetres. OM points horizontally right. ON makes a 60 degree angle above OM. T is directly below N on OM. The region bounded by NT, TM and arc NM is shaded.';
    svg.setAttribute('aria-label',t(description));add('title',{},t(description));
    if(kind==='equilateral-sector'){
      add('path',{d:'M160 30 L40 238 L280 238 Z',class:'written-shade'});
      add('path',{d:'M160 30 L56 210 A208 208 0 0 0 264 210 Z',class:'written-sector'});
      add('path',{d:'M160 30 L160 238',class:'written-line','stroke-dasharray':'5 5'});
      [['P',154,22],['Q',23,248],['R',285,248],['M',155,258],['A',38,210],['B',271,210],['18 cm',69,125]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else{
      add('path',{d:'M40 50 L40 260 L250 260 A210 210 0 0 0 40 50',class:'written-sector'});
      add('path',{d:'M145 78.135 A210 210 0 0 1 250 260 L145 260 Z',class:'written-shade'});
      add('path',{d:'M40 260 L145 78.135 M145 260 L145 78.135 M132 260 L132 247 L145 247',class:'written-line'});
      [['O',22,278],['P',25,45],['M',258,278],['N',151,75],['T',140,278],['7 cm',3,155],['60°',66,242]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }
    add('text',{x:160,y:297,'text-anchor':'middle'},t('Not to scale'));return svg;
  }
  function render(skipCapture){
    if(skipCapture!==true)capture();current=bank.items.find(function(q){return q.id===select.value;});area.replaceChildren();checks=[];answer=null;if(!current)return;
    var q=current,entry=draft.entries[q.id],heading=el('h3',q.title);area.append(heading,el('p',t(q.origin)+(q.year?' · '+q.year+t(' · Paper ')+q.paper+t(' · Question ')+q.number+(q.subpart?'('+q.subpart+')':''):''),'practice-meta'));
    var source=el('a',q.sourceLabel);source.href=q.source;source.target='_blank';source.rel='noopener noreferrer';area.append(source,el('p',q.sourceUse,'practice-meta'));
    if(q.passage){var passage=el('section',undefined,'practice-passage'),passageText=el('p',q.passage);passageText.lang='en';passage.append(el('h4','Read the passage'),passageText);area.append(passage);}
    var prompt=el('p',q.prompt,'written-prompt');prompt.lang=q.questionLanguage||'en';area.append(prompt);if(q.figure)area.append(diagram(q.figure));
    var label=el('label','Your written answer','form-label');label.htmlFor='written-answer';answer=el('textarea',undefined,'form-input');answer.id='written-answer';answer.rows=10;answer.maxLength=20000;answer.value=entry?entry.answer:'';answer.setAttribute('aria-describedby','written-word-count');
    var words=el('p',undefined,'practice-meta');words.id='written-word-count';
    answer.lang=q.questionLanguage||'en';
    function count(){var text=answer.value.trim();words.textContent=(text?text.split(/\s+/).length:0)+t(' words · saved only when you choose Save response');}
    answer.addEventListener('input',function(){dirty.add(q.id);count();});count();area.append(label,answer,words);
    var details=el('details',undefined,'written-explanation'),steps=el('ol'),guide=el('p',q.answer);guide.lang=q.answerLanguage||q.questionLanguage||'en';details.append(el('summary',q.subject==='Mathematics'?'Show worked solution':'Show writing guide'));q.steps.forEach(function(step){steps.append(el('li',step));});details.append(guide,steps);area.append(details);
    var field=el('fieldset');field.append(el('legend','Self-review checklist'));
    q.checks.forEach(function(text,i){var row=el('label',undefined,'practice-option'),check=el('input');check.type='checkbox';check.checked=!!(entry&&entry.checks[i]);check.addEventListener('change',function(){dirty.add(q.id);});checks.push(check);row.append(check,el('span',text));field.append(row);});area.append(field);
    var actions=el('div',undefined,'practice-actions');actions.append(button('Save response on this device',function(){dirty.add(q.id);capture();api.write(localStorage,bank,q.id,draft.entries[q.id]);dirty.delete(q.id);message('Response saved on this device.');}),button('Download written-practice backup',function(){capture();download('afrotools-written-practice.json',JSON.stringify(api.normalize(draft,bank),null,2),'application/json');message('Backup downloaded. It includes responses opened or edited in this session.');}),button('Download written-practice report',function(){capture();download('afrotools-written-practice.txt',api.report(bank,draft),'text/plain;charset=utf-8');message('Written-practice report downloaded.');}));area.append(actions);
    area.append(el('p','The checklist records your own review. It does not award an official exam mark.','practice-meta'));
  }
  function tasks(){capture();select.replaceChildren();bank.items.filter(function(q){return q.collection===collection.value;}).forEach(function(q){select.add(new Option((q.number?t('Question ')+q.number+(q.subpart?'('+q.subpart+')':'')+' · ':'')+q.title,q.id));});render();}
  Array.from(new Set(bank.items.map(function(q){return q.collection;}))).forEach(function(name){collection.add(new Option(t(name),name));});
  try{draft=api.read(localStorage,bank);}catch(e){message('Saved responses could not be read. Existing storage has been kept unchanged. You can write and download a backup.');}
  collection.addEventListener('change',tasks);select.addEventListener('change',render);tasks();
  document.getElementById('written-import').addEventListener('change',async function(){var file=this.files[0];if(!file)return;try{if(file.size>4000000)throw Error('Choose a written-practice backup smaller than 4 MB.');var incoming=api.normalize(JSON.parse(await file.text()),bank);capture();Object.keys(incoming.entries).forEach(function(id){if(!draft.entries[id]){draft.entries[id]=incoming.entries[id];dirty.add(id);}});render(true);message('Backup opened. Existing session responses were kept where tasks overlapped. Save each response you want to keep on this device.');}catch(e){message(t('Backup not opened: ')+errorText(e));}this.value='';});
  function openLinkedTask(){var id=new URLSearchParams(location.hash.slice(1)).get('written');if(!id)return;var task=bank.items.find(function(q){return q.id===id;});if(!task)return;capture();collection.value=task.collection;tasks();select.value=id;render();area.scrollIntoView({block:'start'});}
  window.addEventListener('hashchange',openLinkedTask);openLinkedTask();
  window.addEventListener('beforeunload',function(event){if(dirty.size){event.preventDefault();event.returnValue='';}});
})();

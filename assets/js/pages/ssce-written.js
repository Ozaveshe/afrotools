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
  function trackWrittenSave(task,entry){
    if(!entry||(!String(entry.answer||'').trim()&&!(Array.isArray(entry.checks)&&entry.checks.some(Boolean))))return;
    if(!task||!['WAEC','NECO'].includes(task.exam)||!['Mathematics','English'].includes(task.subject))return;
    var year=Number(task.year),analytics=window.AfroTools&&window.AfroTools.analytics;
    if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear()||!analytics)return;
    var exam=task.exam.toLowerCase(),subject=task.subject.toLowerCase();
    if(typeof analytics.track==='function')analytics.track('education_written_response_saved',{exam:exam,subject:subject,collection_year:year});
    if(typeof analytics.trackEducationPractice==='function')analytics.trackEducationPractice(exam,subject,'start');
  }
  function capture(){if(current&&answer&&(dirty.has(current.id)||draft.entries[current.id])){draft.entries[current.id]={answer:answer.value,checks:checks.map(function(c){return c.checked;})};}}
  function download(name,text,type){var url=URL.createObjectURL(new Blob([text],{type:type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function diagram(question){
    var kind=question.figure,graph=kind==='quadratic-line',ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',graph?'0 0 440 340':'0 0 320 300');svg.setAttribute('class',graph?'written-diagram written-diagram-graph':'written-diagram');svg.setAttribute('role','img');
    function add(tag,attrs,text){var node=document.createElementNS(ns,tag);Object.keys(attrs||{}).forEach(function(k){node.setAttribute(k,attrs[k]);});if(text)node.textContent=text;svg.append(node);return node;}
    var description=question.figureAlt||(kind==='equilateral-sector'?'Equilateral triangle PQR of side 18 centimetres. P is at the top, Q and R are the base endpoints and M is their midpoint. The arc AB has centre P and touches the base at M. The two regions between the arc and the base are shaded.':'O is the centre of a circle with radius 7 centimetres. OM points horizontally right. ON makes a 60 degree angle above OM. T is directly below N on OM. The region bounded by NT, TM and arc NM is shaded.');
    svg.setAttribute('aria-label',t(description));add('title',{},t(description));
    if(graph){
      var px=function(x){return 50+(x+4)*42;},py=function(y){return 282-y*7;};
      for(var x=-4;x<=4;x++){add('path',{d:'M'+px(x)+' 37 V317',class:'written-grid'});add('text',{x:px(x),y:305,'text-anchor':'middle'},String(x));}
      for(var y=-5;y<=35;y+=5){add('path',{d:'M50 '+py(y)+' H386',class:'written-grid'});if(y!==0)add('text',{x:39,y:py(y)+4,'text-anchor':'end'},String(y));}
      add('path',{d:'M50 282 H400 M218 317 V22',class:'written-axis'});
      add('text',{x:406,y:287},'x');add('text',{x:215,y:17},'y');
      var points=[];for(var step=0;step<=80;step++){x=-4+step/10;points.push((step?'L':'M')+px(x)+' '+py(2*x*x-x-2));}
      add('path',{d:points.join(' '),class:'written-curve'});
      add('path',{d:'M'+px(-4)+' '+py(-5)+' L'+px(4)+' '+py(11),class:'written-guide-line'});
      add('text',{x:295,y:52},'y = 2x² − x − 2');add('text',{x:292,y:195},'y = 2x + 3');
    }else if(kind==='right-triangle-ratio'){
      add('path',{d:'M60 240 L60 60 L300 240 Z',class:'written-line'});
      add('path',{d:'M60 225 H75 V240',class:'written-line'});
      [['P',47,53],['Q',43,258],['R',304,258],['3k',29,155],['4k',167,258],['PR',185,137]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else if(kind==='equilateral-sector'){
      add('path',{d:'M160 30 L40 238 L280 238 Z',class:'written-shade'});
      add('path',{d:'M160 30 L56 210 A208 208 0 0 0 264 210 Z',class:'written-sector'});
      add('path',{d:'M160 30 L160 238',class:'written-line','stroke-dasharray':'5 5'});
      [['P',154,22],['Q',23,248],['R',285,248],['M',155,258],['A',38,210],['B',271,210],['18 cm',69,125]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else if(kind==='trapezium-geometry'){
      add('path',{d:'M20 236 L68 91 L175 91 L300 236 Z',class:'written-sector'});
      add('path',{d:'M68 91 L68 236 M175 91 L175 236 M20 236 L175 91',class:'written-line','stroke-dasharray':'5 5'});
      add('path',{d:'M68 222 L82 222 L82 236 M175 222 L189 222 L189 236',class:'written-line'});
      [['P',6,249],['Q',62,77],['R',174,77],['S',301,252],['U',63,254],['T',169,254],['5 cm',30,273],['12 cm',77,130],['50°',256,226]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else if(kind==='farm-bearings'){
      add('path',{d:'M76 220 L160 250 L210 110 Z',class:'written-sector'});
      add('path',{d:'M165 236 L151 231 L146 245',class:'written-line'});
      add('path',{d:'M280 125 L280 57 M280 57 L274 68 M280 57 L286 68',class:'written-line'});
      [['M',59,218],['C',159,274],['D',209,102],['3 km',99,226],['5 km',192,190],['N',274,46]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else if(kind==='circle-equal-chords'){
      add('circle',{cx:160,cy:140,r:100,class:'written-line'});
      add('path',{d:'M73 190 L186 43 L259 154 L210 227 Z M73 190 L259 154 M186 43 L210 227',class:'written-line'});
      add('path',{d:'M121 110 L135 122 M190 135 L206 133',class:'written-line'});
      [['P',52,199],['Q',180,30],['R',266,158],['S',208,249],['26°',102,211]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else if(kind==='diameter-equal-chords'){
      add('circle',{cx:160,cy:140,r:105,class:'written-line'});
      add('path',{d:'M61 104 L124 41 L212 49 L259 176 L61 104',class:'written-line'});
      add('path',{d:'M85 76 L97 84 M163 38 L161 52',class:'written-line'});
      add('circle',{cx:160,cy:140,r:2.5,fill:'currentColor'});
      [['A',44,104],['B',116,29],['C',217,43],['D',267,188],['O',147,134],['50°',224,170]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }else{
      add('path',{d:'M40 50 L40 260 L250 260 A210 210 0 0 0 40 50',class:'written-sector'});
      add('path',{d:'M145 78.135 A210 210 0 0 1 250 260 L145 260 Z',class:'written-shade'});
      add('path',{d:'M40 260 L145 78.135 M145 260 L145 78.135 M132 260 L132 247 L145 247',class:'written-line'});
      [['O',22,278],['P',25,45],['M',258,278],['N',151,75],['T',140,278],['7 cm',3,155],['60°',66,242]].forEach(function(v){add('text',{x:v[1],y:v[2]},v[0]);});
    }
    if(!graph&&kind!=='right-triangle-ratio'&&kind!=='trapezium-geometry'&&kind!=='farm-bearings')add('text',{x:160,y:297,'text-anchor':'middle'},t('Not to scale'));return svg;
  }
  function render(skipCapture){
    if(skipCapture!==true)capture();current=bank.items.find(function(q){return q.id===select.value;});area.replaceChildren();checks=[];answer=null;if(!current)return;
    var q=current,entry=draft.entries[q.id],heading=el('h3',q.title);area.append(heading,el('p',t(q.origin)+(q.year?' · '+q.year+t(' · Paper ')+q.paper+t(' · Question ')+q.number+(q.subpart?'('+q.subpart+')':''):''),'practice-meta'));
    var source=el('a',q.sourceLabel);source.href=q.source;source.target='_blank';source.rel='noopener noreferrer';area.append(source,el('p',q.sourceUse,'practice-meta'));
    if(q.passage){var passage=el('section',undefined,'practice-passage');passage.append(el('h4','Read the passage'));q.passage.split(/\n\s*\n/).forEach(function(paragraph){var passageText=el('p',paragraph);passageText.lang='en';passage.append(passageText);});area.append(passage);}
    var prompt=el('p',q.prompt,'written-prompt'),figure=null;prompt.lang=q.questionLanguage||'en';area.append(prompt);if(q.figure){figure=el('figure',undefined,'written-figure');figure.append(diagram(q));if(q.figureCaption)figure.append(el('figcaption',q.figureCaption));if(!q.figureAfterAnswer)area.append(figure);}
    var label=el('label','Your written answer','form-label');label.htmlFor='written-answer';answer=el('textarea',undefined,'form-input');answer.id='written-answer';answer.rows=10;answer.maxLength=20000;answer.value=entry?entry.answer:'';answer.setAttribute('aria-describedby','written-word-count');
    var words=el('p',undefined,'practice-meta');words.id='written-word-count';
    answer.lang=q.questionLanguage||'en';
    function count(){var text=answer.value.trim();words.textContent=(text?text.split(/\s+/).length:0)+t(' words · saved only when you choose Save response');}
    answer.addEventListener('input',function(){dirty.add(q.id);count();});count();area.append(label,answer,words);
    var details=el('details',undefined,'written-explanation'),steps=el('ol'),guide=el('p',q.answer);guide.lang=q.answerLanguage||q.questionLanguage||'en';details.append(el('summary',q.subject==='Mathematics'?'Show worked solution':'Show writing guide'));q.steps.forEach(function(step){steps.append(el('li',step));});details.append(guide,steps);if(figure&&q.figureAfterAnswer)details.append(figure);area.append(details);
    var field=el('fieldset');field.append(el('legend','Self-review checklist'));
    q.checks.forEach(function(text,i){var row=el('label',undefined,'practice-option'),check=el('input');check.type='checkbox';check.checked=!!(entry&&entry.checks[i]);check.addEventListener('change',function(){dirty.add(q.id);});checks.push(check);row.append(check,el('span',text));field.append(row);});area.append(field);
    var actions=el('div',undefined,'practice-actions');actions.append(button('Save response on this device',function(){dirty.add(q.id);capture();api.write(localStorage,bank,q.id,draft.entries[q.id]);dirty.delete(q.id);trackWrittenSave(q,draft.entries[q.id]);message('Response saved on this device.');}),button('Download written-practice backup',function(){capture();download('afrotools-written-practice.json',JSON.stringify(api.normalize(draft,bank),null,2),'application/json');message('Backup downloaded. It includes responses opened or edited in this session.');}),button('Download written-practice report',function(){capture();download('afrotools-written-practice.txt',api.report(bank,draft),'text/plain;charset=utf-8');message('Written-practice report downloaded.');}));area.append(actions);
    area.append(el('p','The checklist records your own review. It does not award an official exam mark.','practice-meta'));
  }
  function tasks(){capture();select.replaceChildren();bank.items.filter(function(q){return q.collection===collection.value;}).sort(function(a,b){return (a.number||Infinity)-(b.number||Infinity)||String(a.subpart||'').localeCompare(String(b.subpart||''));}).forEach(function(q){select.add(new Option((q.number?t('Question ')+q.number+(q.subpart?'('+q.subpart+')':'')+' · ':'')+q.title,q.id));});render();}
  Array.from(new Set(bank.items.map(function(q){return q.collection;}))).forEach(function(name){collection.add(new Option(t(name),name));});
  try{draft=api.read(localStorage,bank);}catch(e){message('Saved responses could not be read. Existing storage has been kept unchanged. You can write and download a backup.');}
  collection.addEventListener('change',tasks);select.addEventListener('change',render);tasks();
  document.getElementById('written-import').addEventListener('change',async function(){var file=this.files[0];if(!file)return;try{if(file.size>4000000)throw Error('Choose a written-practice backup smaller than 4 MB.');var incoming=api.normalize(JSON.parse(await file.text()),bank);capture();Object.keys(incoming.entries).forEach(function(id){if(!draft.entries[id]){draft.entries[id]=incoming.entries[id];dirty.add(id);}});render(true);message('Backup opened. Existing session responses were kept where tasks overlapped. Save each response you want to keep on this device.');}catch(e){message(t('Backup not opened: ')+errorText(e));}this.value='';});
  function openLinkedTask(){var id=new URLSearchParams(location.hash.slice(1)).get('written');if(!id)return;var task=bank.items.find(function(q){return q.id===id;});if(!task)return;capture();collection.value=task.collection;tasks();select.value=id;render();var heading=area.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}message(t('Opened written task: ')+task.title);area.scrollIntoView({block:'start'});}
  window.addEventListener('hashchange',openLinkedTask);openLinkedTask();
  window.addEventListener('beforeunload',function(event){if(dirty.size){event.preventDefault();event.returnValue='';}});
})();

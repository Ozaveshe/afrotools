(function () {
  'use strict';
  var root = document.querySelector('[data-itax-workspace]');
  if (!root) return;
  var form = root.querySelector('form');
  var locale = root.dataset.locale === 'sw' ? 'sw' : 'en';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.itaxGuide;
  var result = root.querySelector('[data-result]');
  var checklist = root.querySelector('[data-checklist]');
  var status = root.querySelector('[data-status]');
  var actions = root.querySelector('[data-result-actions]');
  var official = root.querySelector('[data-official-link]');
  var storageKey = 'afrotools:itax-guide-workspace:v1';
  var last = null;
  var swSteps = {
    pin:['Thibitisha kama mlipakodi ni mtu binafsi au si mtu binafsi.','Soma masharti ya sasa ya KRA kwa hali ya mlipakodi.','Fungua New PIN Registration kwenye tovuti rasmi ya iTax pekee.','Kamilisha fomu ya KRA na uhifadhi hati ya uthibitisho.'],
    access:['Thibitisha anwani inaanza na https://itax.kra.go.ke/.','Tumia njia ya kurejesha nenosiri kwenye ukurasa rasmi wa kuingia.','Tumia barua pepe iliyosajiliwa na KRA pekee.','Ikiwa taarifa za akaunti au barua pepe si sahihi, simama na uwasiliane na KRA.'],
    return:['Kagua wajibu wa kodi na kipindi kinachoonekana kwenye akaunti ya iTax.','Linganisha kila aina ya mapato na rekodi husika.','Fuata maelekezo ya sasa ya KRA kwa wajibu huo.','Kagua tamko, wasilisha kwenye iTax pekee, kisha uhifadhi uthibitisho rasmi.'],
    nil:['Kagua wajibu wa kodi na kipindi kinachoonekana kwenye akaunti ya iTax.','Thibitisha hakukuwa na mapato kwa wajibu na kipindi husika.','Usitumie NIL kuficha rekodi zinazokosekana, mapato yasiyotatuliwa au wajibu usiojulikana.','Wasilisha kupitia njia rasmi ya NIL pekee na uhifadhi uthibitisho.'],
    history:['Fungua akaunti rasmi ya iTax.','Chagua Returns, kisha Consult Return.','Chagua aina ya return na kipindi kilichoonyeshwa na KRA.','Hifadhi return au uthibitisho rasmi kama rekodi.'],
    support:['Fungua mwongozo au mawasiliano rasmi ya KRA.','Eleza kazi bila kushiriki nenosiri au OTP.','Omba KRA ithibitishe wajibu, kipindi, marekebisho ya akaunti au njia ya return inayokosekana.','Hifadhi jibu la KRA au namba rasmi ya kumbukumbu.']
  };
  var text = locale === 'sw' ? {
    ready:'Sehemu ya maandalizi iko tayari. Usiingize PIN, nenosiri, OTP au rekodi ya kodi.', invalid:'Kagua chaguo na uthibitisho unaohitajika.', done:'Mpango umeandaliwa ndani ya kivinjari.', stop:'Simama na uthibitishe kabla ya kufungua njia rasmi.', changed:'Chaguo limebadilika. Tengeneza mpango mpya.', saved:'Mpango umehifadhiwa kwenye kivinjari hiki.', loaded:'Rasimu imefunguliwa. Tengeneza mpango tena.', none:'Hakuna rasimu iliyohifadhiwa.', reset:'Sehemu imerudi mwanzo.', copied:'Muhtasari umenakiliwa.', copyFail:'Kunakili hakupatikani; tumia TXT.', imported:'JSON imefunguliwa na mpango umetengenezwa upya.', importFail:'JSON haikuweza kufunguliwa.', pdfFail:'PDF haikupatikana; tumia TXT au JSON.', complete:'hatua zimekamilika', official:'Fungua njia rasmi ya KRA'
  } : {
    ready:'Preparation workspace ready. Do not enter a PIN, password, OTP, or tax record.', invalid:'Review the selections and required confirmations.', done:'Preparation plan built in this browser.', stop:'Stop and confirm the unresolved facts before opening an official route.', changed:'A selection changed. Build a fresh plan.', saved:'Plan saved in this browser.', loaded:'Draft loaded. Build the plan again.', none:'No saved draft was found.', reset:'Workspace reset.', copied:'Summary copied.', copyFail:'Copy is unavailable; use TXT instead.', imported:'JSON reopened and the plan was rebuilt.', importFail:'The JSON file could not be reopened.', pdfFail:'PDF is unavailable; use TXT or JSON.', complete:'steps complete', official:'Open official KRA route'
  };
  function field(name) { return form.elements.namedItem(name); }
  function say(message, bad) { status.textContent = message; status.classList.toggle('is-error', !!bad); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function values() {
    return { task:field('task').value, context:field('context').value, obligation:field('obligation').value, filingYear:Number(field('filingYear').value), asOfDate:field('asOfDate').value, factsConfirmed:field('factsConfirmed').checked, privacyConfirmed:field('privacyConfirmed').checked, receiptPlanConfirmed:field('receiptPlanConfirmed').checked, noIncomeConfirmed:field('noIncomeConfirmed').checked, currentSourceConfirmed:field('currentSourceConfirmed').checked };
  }
  function apply(input) {
    Object.keys(input || {}).forEach(function (key) { var control=field(key); if(!control)return; if(control.type==='checkbox')control.checked=input[key]===true; else control.value=input[key]; });
  }
  function localizedSteps() { return locale === 'sw' ? swSteps[last.inputs.task] : last.checklist; }
  function localizedReason(reason) {
    if (locale !== 'sw') return reason;
    return {
      'The active tax obligation is unknown. Confirm it in iTax or with KRA before choosing a return path.':'Wajibu wa kodi haujulikani. Uthibitishe kwenye iTax au kwa KRA kabla ya kuchagua njia ya return.',
      'KRA describes PIN Without Obligation as having no filing obligation. Do not create a NIL-return task unless KRA shows an active obligation.':'KRA inaeleza PIN Without Obligation kuwa haina wajibu wa kuwasilisha return. Usichague NIL isipokuwa KRA ionyeshe wajibu hai.',
      'No-income status for the relevant active obligation and period has not been confirmed.':'Kutokuwa na mapato kwa wajibu na kipindi husika hakujathibitishwa.'
    }[reason] || reason;
  }
  function sourceStatusLabel(value) {
    if (locale === 'sw') return value === 'reviewed-current' ? 'imekaguliwa na ni ya sasa' : 'imethibitishwa tena baada ya siku 90';
    return value === 'reviewed-current' ? 'reviewed and current' : 'reconfirmed after the 90-day review window';
  }
  function completed() { return Array.prototype.map.call(checklist.querySelectorAll('input[type=checkbox]'), function (box) { return box.checked; }); }
  function updateProgress() { var done=completed().filter(Boolean).length,total=completed().length; root.querySelector('[data-progress]').textContent=done+' / '+total+' '+text.complete; }
  function clear(message,bad) { last=null; result.hidden=true; actions.hidden=true; checklist.replaceChildren(); official.hidden=true; if(message)say(message,bad); }
  function render() {
    var title = locale === 'sw' ? (last.decision==='stop-and-confirm'?'Uamuzi: simama na uthibitishe':'Mpango wa maandalizi') : (last.decision==='stop-and-confirm'?'Decision: stop and confirm':'Preparation plan');
    result.querySelector('[data-result-title]').textContent=title;
    var reasons=result.querySelector('[data-stop-reasons]'); reasons.replaceChildren(); reasons.hidden=!last.stopReasons.length;
    last.stopReasons.forEach(function(reason){var li=document.createElement('li');li.textContent=localizedReason(reason);reasons.appendChild(li);});
    checklist.replaceChildren(); localizedSteps().forEach(function(step,index){var label=document.createElement('label'),box=document.createElement('input'),span=document.createElement('span');box.type='checkbox';box.dataset.step=String(index);span.textContent=step;label.append(box,span);checklist.appendChild(label);});
    updateProgress();
    root.querySelector('[data-source-state]').textContent=(locale==='sw'?'Vyanzo vilikaguliwa ':'Sources checked ')+last.sourceCheckedDate+' · '+sourceStatusLabel(last.sourceStatus);
    official.href=last.officialUrl; official.textContent=text.official; official.hidden=last.decision==='stop-and-confirm';
    result.hidden=false;actions.hidden=false;result.querySelector('h3').focus();say(last.decision==='stop-and-confirm'?text.stop:text.done,last.decision==='stop-and-confirm');
  }
  function build() { clear(); if(!engine||!form.reportValidity())return say(text.invalid,true); try{last=engine.calculate(values());render();}catch(error){say(error.message,true);} }
  function lines() {
    var names={pin:locale==='sw'?'Usajili wa PIN':'PIN registration',access:locale==='sw'?'Kuingia au kurejesha akaunti':'Login or account recovery',return:locale==='sw'?'Maandalizi ya return':'Return preparation',nil:locale==='sw'?'Ukaguzi wa NIL return':'NIL-return check',history:locale==='sw'?'Return ya awali':'Previous return',support:locale==='sw'?'Msaada rasmi':'Official support'};
    var out=[locale==='sw'?'Mpango wa maandalizi ya KRA iTax':'KRA iTax preparation plan',(locale==='sw'?'Kazi: ':'Task: ')+names[last.inputs.task],(locale==='sw'?'Uamuzi: ':'Decision: ')+last.decision,(locale==='sw'?'Mwaka wa return: ':'Return year: ')+last.inputs.filingYear,(locale==='sw'?'Chanzo kilikaguliwa: ':'Source checked: ')+last.sourceCheckedDate];
    last.stopReasons.forEach(function(reason){out.push((locale==='sw'?'SIMAMA: ':'STOP: ')+localizedReason(reason));});localizedSteps().forEach(function(step,index){out.push((completed()[index]?'[x] ':'[ ] ')+step);});out.push((locale==='sw'?'Njia rasmi: ':'Official route: ')+last.officialUrl);out.push(locale==='sw'?'Mpaka: mwongozo huru; hakuna kuingia, kuwasilisha return, kulipa au kuhifadhi taarifa nyeti.':'Boundary: independent guide; no login, filing, payment, or sensitive-data storage.');return out;
  }
  function record(){return{schemaVersion:1,locale:locale,englishId:'itax-guide',route:location.pathname,generatedAt:new Date().toISOString(),inputs:values(),plan:last,completed:completed()};}
  function download(content,type,name){var blob=content instanceof Blob?content:new Blob([content],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},500);}
  function pdf(){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)throw new Error('PDF unavailable');var doc=new Pdf({unit:'pt',format:[595,842],compress:false}),y=50;lines().forEach(function(line,index){doc.setFontSize(index?10:15);doc.splitTextToSize(line.normalize('NFD').replace(/[\u0300-\u036f]/g,''),490).forEach(function(part){if(y>790){doc.addPage();y=50;}doc.text(part,48,y);y+=15;});});return new Blob([doc.output('arraybuffer')],{type:'application/pdf'});}
  form.addEventListener('submit',function(event){event.preventDefault();build();});
  form.addEventListener('input',function(){if(last)clear(text.changed,true);});
  root.addEventListener('click',function(event){var button=event.target.closest('[data-action]'),action=button&&button.dataset.action;if(!action)return;if(action==='reset'){form.reset();field('asOfDate').value=today();clear(text.reset);field('task').focus();return;}if(action==='save'){localStorage.setItem(storageKey,JSON.stringify(values()));return say(text.saved);}if(action==='load'){var saved=localStorage.getItem(storageKey);if(!saved)return say(text.none,true);apply(JSON.parse(saved));clear(text.loaded);return;}if(action==='import'){field('importFile').click();return;}if(!last)return say(text.invalid,true);if(action==='copy'){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(lines().join('\n')).then(function(){say(text.copied);}).catch(function(){say(text.copyFail,true);});else say(text.copyFail,true);}else if(action==='json')download(JSON.stringify(record(),null,2)+'\n','application/json;charset=utf-8','kra-itax-preparation.json');else if(action==='txt')download('\uFEFF'+lines().join('\n')+'\n','text/plain;charset=utf-8','kra-itax-preparation.txt');else if(action==='pdf'){try{download(pdf(),'application/pdf','kra-itax-preparation.pdf');}catch(error){say(text.pdfFail,true);}}});
  field('importFile').addEventListener('change',function(){var file=field('importFile').files&&field('importFile').files[0];if(!file)return;file.text().then(function(raw){var parsed=JSON.parse(raw);apply(parsed.inputs||parsed);build();if(last&&(parsed.completed||[]).length){checklist.querySelectorAll('input').forEach(function(box,index){box.checked=parsed.completed[index]===true;});updateProgress();}say(text.imported);}).catch(function(){say(text.importFail,true);});});
  checklist.addEventListener('change',updateProgress);
  field('asOfDate').value=today();root.dataset.workflowReady='true';say(text.ready);
})();

(function () {
  'use strict';
  const lang = document.documentElement.lang;
  const copy = {
    en:{title:'Request minimum-wage notifications',disclosure:'Submitting sends your email address and selected country to AfroTools to record your notification request. Recording a request does not confirm email delivery or a schedule.',email:'Email address',submit:'Record request',invalid:'Check the selected country and enter a valid email address.',saved:'Notification request recorded.',failed:'Request was not confirmed. Your entries are retained; try again.',reportNote:'Submitting sends country, sector, monthly salary and optional city to AfroTools. Do not include names or identifying details. This is not a report to a labour authority.',reportSaved:'Report recorded. No official complaint or reward is confirmed.',reportFailed:'Report was not confirmed. Your entries are retained; nothing was queued locally.',reportInvalid:'Complete the country, sector and a valid monthly salary of zero or more.',report:'Send wage report',pending:'Sending…'},
    fr:{title:'Demander des notifications sur le salaire minimum',disclosure:'L’envoi transmet votre adresse e-mail et le pays choisi à AfroTools pour enregistrer votre demande. Cet enregistrement ne confirme ni la livraison d’un e-mail ni un calendrier d’envoi.',email:'Adresse e-mail',submit:'Enregistrer la demande',invalid:'Choisissez un pays et saisissez une adresse e-mail valide.',saved:'Demande de notification enregistrée.',failed:'Enregistrement non confirmé. Vos saisies sont conservées ; réessayez.',reportNote:'L’envoi transmet le pays, le secteur, le salaire mensuel et la ville facultative à AfroTools. N’incluez aucun nom ou détail identifiant. Ce formulaire ne saisit pas une autorité du travail.',reportSaved:'Signalement enregistré. Aucune plainte officielle ni récompense n’est confirmée.',reportFailed:'Signalement non confirmé. Vos saisies sont conservées ; aucun envoi différé n’a été enregistré localement.',reportInvalid:'Renseignez le pays, le secteur et un salaire mensuel valide, égal ou supérieur à zéro.',report:'Envoyer le signalement',pending:'Envoi en cours…'},
    sw:{title:'Omba taarifa za kima cha chini cha mshahara',disclosure:'Kutuma kunapeleka barua pepe yako na nchi uliyochagua kwa AfroTools ili kuhifadhi ombi la taarifa. Kuhifadhi ombi hakuthibitishi kutumwa kwa barua pepe wala ratiba ya taarifa.',email:'Anwani ya barua pepe',submit:'Hifadhi ombi',invalid:'Chagua nchi na uweke anwani halali ya barua pepe.',saved:'Ombi la taarifa limehifadhiwa.',failed:'Uhifadhi haujathibitishwa. Maingizo yako yamehifadhiwa kwenye fomu; jaribu tena.',reportNote:'Kutuma kunapeleka nchi, sekta, mshahara wa mwezi na jiji la hiari kwa AfroTools. Usiweke majina au maelezo yanayoweza kumtambua mtu. Hii si taarifa kwa mamlaka ya kazi.',reportSaved:'Taarifa imehifadhiwa. Hakuna malalamiko rasmi wala zawadi iliyothibitishwa.',reportFailed:'Taarifa haijathibitishwa. Maingizo yako yamebaki; hakuna taarifa iliyopangwa kutumwa baadaye kwenye kifaa.',reportInvalid:'Weka nchi, sekta na mshahara halali wa mwezi wa sifuri au zaidi.',report:'Tuma taarifa ya mshahara',pending:'Inatuma…'}
  }[lang] || null;
  if (!copy) return;
  const $ = id => document.getElementById(id), email=$('alert-email');
  if (!email) return;
  const alertButton=document.querySelector('[onclick="subscribeAlert()"]');
  const reportButton=document.querySelector('[onclick="submitViolation()"]');
  const country = () => $(lang==='fr'?'referenceCountry':'country').value;
  document.querySelector('.mw-alert-title').textContent=copy.title;
  // Existing country-change controller still writes this node.
  if (!$('alert-country-name')) { const span=document.createElement('span');span.id='alert-country-name';span.hidden=true;document.querySelector('.mw-alert-title').append(span); }
  document.querySelector('.mw-alert-sub').textContent=copy.disclosure;
  email.setAttribute('aria-label',copy.email);email.setAttribute('aria-describedby','alert-result');alertButton.textContent=copy.submit;
  document.querySelector('.mw-vf-note').textContent=copy.reportNote;
  reportButton.textContent=copy.report;
  const toggle=$('violation-toggle-btn');if(toggle)toggle.textContent=copy.report;
  function status(id,text,error){const el=$(id);el.style.display='block';el.style.color=error?'#b91c1c':'';el.textContent=text;}
  async function send(payload){const response=await fetch('/.netlify/functions/minimum-wage-alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();return response.ok && data.ok===true;}
  let alertPending=false,reportPending=false;
  window.subscribeAlert=async function(){
    if(alertPending)return;
    email.removeAttribute('aria-invalid');
    if(!country()||!email.value.trim()||!email.validity.valid){status('alert-result',copy.invalid,true);email.setAttribute('aria-invalid','true');email.focus();return;}
    const selected=country(), entered=email.value.trim();alertPending=true;alertButton.disabled=true;status('alert-result',copy.pending,false);
    try{const ok=await send({country_code:selected,email:entered});status('alert-result',ok?copy.saved:copy.failed,!ok);if(ok&&country()===selected&&email.value.trim()===entered)email.value='';}
    catch{status('alert-result',copy.failed,true);}
    finally{alertPending=false;alertButton.disabled=false;}
  };
  window.submitViolation=async function(){
    if(reportPending)return;
    const fields=['vf-country','vf-sector','vf-salary'];for(const id of fields)$(id).removeAttribute('aria-invalid');
    const invalid=fields.find(id=>!$(id).value.trim()||(id==='vf-salary'&&(!$(id).validity.valid||!Number.isFinite(Number($(id).value))||Number($(id).value)<0)));
    if(invalid){status('vf-result',copy.reportInvalid,true);$(invalid).setAttribute('aria-invalid','true');$(invalid).setAttribute('aria-describedby','vf-result');$(invalid).focus();return;}
    const values=Object.fromEntries(['vf-country','vf-sector','vf-salary','vf-city'].map(id=>[id,$(id).value.trim()]));
    reportPending=true;reportButton.disabled=true;status('vf-result',copy.pending,false);
    try{const ok=await send({type:'violation',country_code:values['vf-country'],sector:values['vf-sector'],salary:values['vf-salary'],city:values['vf-city']});status('vf-result',ok?copy.reportSaved:copy.reportFailed,!ok);if(ok)for(const id of ['vf-sector','vf-salary','vf-city'])if($(id).value.trim()===values[id])$(id).value='';}
    catch{status('vf-result',copy.reportFailed,true);}
    finally{reportPending=false;reportButton.disabled=false;}
  };
})();

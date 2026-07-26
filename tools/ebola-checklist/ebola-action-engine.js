(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EbolaActionEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const WINDOWS=new Set(['none','within21','over21','unknown']);
const OUTBREAKS=new Set(['yes','no','unknown']);
const ONSETS=new Set(['none','today','1-3','4plus','unknown']);
function assess(input){
const i=input||{},windowValue=WINDOWS.has(i.exposureWindow)?i.exposureWindow:'unknown',outbreak=OUTBREAKS.has(i.outbreakContext)?i.outbreakContext:'unknown',onset=ONSETS.has(i.symptomOnset)?i.symptomOnset:'unknown';
const contactExposure=Boolean(i.contact||i.care||i.funeral||i.contaminated||i.animal),authority=Boolean(i.authority),symptoms=Boolean(i.fever||i.weakness||i.gastro||i.bleeding||i.confusion||i.unableFluids),severe=Boolean(i.confusion||i.unableFluids),recentWindow=windowValue==='within21'||windowValue==='unknown',reasons=[];
const possibleExposure=authority||contactExposure;
if(i.confusion)reasons.push('confusion, collapse, difficulty waking or breathing selected');
if(i.unableFluids)reasons.push('unable to keep fluids down selected');
if(contactExposure)reasons.push('possible direct exposure selected');
if(authority)reasons.push('identified as a contact by public-health authorities');
if(outbreak==='yes')reasons.push('affected-area or outbreak context selected');
if(symptoms&&!severe)reasons.push('compatible but non-specific symptoms selected');
if(possibleExposure)reasons.push(windowValue==='within21'?'possible exposure within the last 21 days':windowValue==='over21'?'possible exposure reported as more than 21 days ago':'exposure timing is unknown or incomplete');
if(symptoms)reasons.push(onset==='none'?'symptoms selected but onset marked none':onset==='unknown'?'symptom onset is unknown':`symptoms started ${onset==='today'?'today':onset==='1-3'?'1–3 days ago':'4 or more days ago'}`);
if(severe){
const disclose=possibleExposure||outbreak==='yes'?' State the possible Ebola exposure or affected-area context.':'';
return result('Emergency services now',`Avoid close contact and body-fluid contact. Call local emergency services now.${disclose} If calling is possible, follow official public-health instructions for safe transport and where to receive care.`,reasons,'Do not travel independently or wait for this checklist when emergency help is available. This tool cannot diagnose Ebola.');
}
if((possibleExposure&&recentWindow&&symptoms)||(outbreak==='yes'&&symptoms)){
return result('Immediate separation and public-health contact','Avoid close contact and body-fluid contact. Immediately call the official local public-health or health-service number, describe the possible exposure or affected-area context and symptoms, and follow their testing, isolation and transport instructions.',reasons,'Do not wait for symptoms to worsen, travel without calling ahead when a call is possible, or use this checklist to self-clear.');
}
if(authority||(contactExposure&&recentWindow)){
return result('Contact public health immediately','Call the official local public-health or health-service number now. Follow their individual monitoring, testing and movement instructions; avoid contact with blood or body fluids.',reasons,'Feeling well does not remove the need for official exposure assessment. This app does not set a monitoring or isolation period.');
}
if(contactExposure&&windowValue==='over21'){
return result('Confirm the exposure timeline with public health','Contact the official local public-health or health service and give the exposure type and timing. Follow their assessment rather than using the 21-day selection as clearance.',reasons,'A self-entered date range cannot rule out exposure, replace contact tracing or end official monitoring.');
}
if(outbreak==='yes'&&symptoms){
return result('Immediate public-health contact','Call the official local public-health or health-service number now, avoid close contact and body-fluid contact, and follow their testing and transport instructions.',reasons,'Symptoms are not specific, but outbreak context means this checklist must not delay official assessment.');
}
if(symptoms){
return result('Prompt same-day clinical assessment','Contact a qualified health service today for assessment of these symptoms. If affected-area travel, an outbreak or an exposure may have been missed, call ahead and tell the service before travelling.',reasons,'These symptoms have many possible causes. This tool cannot diagnose or rule out Ebola or another urgent illness.');
}
if(outbreak==='yes'){
return result('Follow current local public-health guidance','Use the official local health authority’s current outbreak information. If authorities identify an exposure or symptoms begin, contact them immediately.',reasons,'This page has no live outbreak data and cannot decide whether you were exposed.');
}
return result('No Ebola conclusion from this checklist','Follow official local outbreak information. If public health identifies you as a contact, or symptoms or a possible exposure occur, call immediately.',reasons.length?reasons:['no possible exposure, symptom or outbreak item selected'],'This is not proof that exposure or Ebola is absent.');
}
function result(level,action,reasons,warning){return Object.freeze({level,action,reasons:Object.freeze(reasons),warning})}
return Object.freeze({assess})});

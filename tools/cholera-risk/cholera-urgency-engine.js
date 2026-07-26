(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CholeraUrgencyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TIMING=Object.freeze({
    none:'no diarrhoea timing entered',
    today:'watery diarrhoea started today',
    '1-2':'watery diarrhoea started 1–2 days ago',
    '3plus':'watery diarrhoea started 3 or more days ago',
    unknown:'diarrhoea timing is uncertain'
  });

  function assess(input){
    if(!Object.hasOwn(TIMING,input.timing)) throw new Error('Choose when watery diarrhoea started.');
    if(!['normal','sips','unable','unknown'].includes(input.drinking)) throw new Error('Choose the current ability to drink.');
    if(input.watery&&input.timing==='none') throw new Error('Choose when the watery diarrhoea started.');
    const shock=Boolean(input.collapse||input.unconscious);
    const cannotDrink=input.drinking==='unable';
    const rapidDehydration=Boolean(input.frequent||input.repeatedVomiting||input.dehydration||input.bloodyStool);
    const context=Boolean(input.outbreak||input.unsafeWater);
    const vulnerable=Boolean(input.vulnerable);
    const reasons=[];
    if(input.watery) reasons.push(TIMING[input.timing]);
    if(vulnerable) reasons.push('higher-risk age, pregnancy or existing illness context');
    const ors=' If the person is awake and can drink, use packaged oral rehydration solution exactly as its label or a health worker directs while arranging care; do not delay travel to obtain it.';

    if(shock||cannotDrink){
      if(shock) reasons.unshift('confusion, fainting, inability to sit, unconsciousness or collapse');
      if(cannotDrink) reasons.unshift('unable to drink');
      return {
        level:'Emergency rehydration-capable care now',
        action:'Go to the nearest emergency service, cholera treatment centre or rehydration-capable health facility now. Follow local emergency/public-health transport instructions. Do not force oral fluids into a person who cannot drink safely, and do not delay for this checklist.',
        reasons:[...new Set(reasons)],
        warning:'This tool cannot diagnose cholera. Shock or inability to drink can signal life-threatening dehydration and requires immediate in-person care.'
      };
    }

    if(rapidDehydration){
      if(input.frequent) reasons.unshift('very frequent or large-volume watery stools');
      if(input.repeatedVomiting) reasons.unshift('repeated vomiting');
      if(input.dehydration) reasons.unshift('dehydration warning signs');
      if(input.bloodyStool) reasons.unshift('blood in stool requires urgent assessment for cholera or another cause');
      return {
        level:'Urgent medical care now',
        action:'Go now to a health service able to assess dehydration and provide rapid treatment.'+ors+' Follow local public-health instructions and do not delay to repeat this checklist.',
        reasons:[...new Set(reasons)],
        warning:'This checklist cannot diagnose cholera, distinguish other dangerous diarrhoeal illness or replace urgent rehydration-capable care.'
      };
    }

    if(input.watery&&vulnerable){
      reasons.unshift('acute watery diarrhoea in a higher-risk context');
      return {
        level:'Same-day urgent clinical assessment',
        action:'Contact a rehydration-capable health service now and arrange assessment today.'+ors+' Escalate immediately if drinking becomes difficult or dehydration signs appear.',
        reasons:[...new Set(reasons)],
        warning:'Infants, young children, older people, pregnancy and existing illness can increase the consequences of rapid fluid loss.'
      };
    }

    if(input.watery&&context){
      reasons.unshift('acute watery diarrhoea','reported outbreak or possible contaminated food/water context');
      return {
        level:'Contact a health service and public-health team now',
        action:'Seek same-day clinical assessment and follow official local outbreak instructions.'+ors+' Watch closely for dehydration and escalate immediately.',
        reasons:[...new Set(reasons)],
        warning:'Symptoms can worsen quickly; this result is not permission to wait.'
      };
    }

    if(input.watery){
      reasons.unshift('acute watery diarrhoea');
      return {
        level:'Same-day clinical assessment',
        action:'Contact a qualified health service today.'+ors+' Cholera cannot be identified from symptoms alone and other causes may also need care.',
        reasons:[...new Set(reasons)],
        warning:'Do not use lack of known outbreak exposure to rule out cholera.'
      };
    }

    if(context){
      reasons.push('outbreak or possible contaminated food/water context without selected symptoms');
      return {
        level:'Follow official local public-health guidance',
        action:'Use current local instructions for safe water, food and outbreak response. If watery diarrhoea, vomiting or dehydration signs begin, seek care immediately.',
        reasons,
        warning:'This checklist does not verify exposure or current outbreak status.'
      };
    }

    return {
      level:'No cholera conclusion from this checklist',
      action:'Continue safe-water and hygiene practices and follow local public-health notices. Seek same-day care if acute watery diarrhoea develops.',
      reasons:['no selected watery diarrhoea, urgent sign or exposure context'],
      warning:'This is not reassurance that cholera is absent.'
    };
  }

  return Object.freeze({assess,TIMING});
});

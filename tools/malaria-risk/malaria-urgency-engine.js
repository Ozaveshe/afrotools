(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.MalariaUrgencyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TIMING_LABELS=Object.freeze({
    none:'no symptom timing entered',
    today:'symptoms started today',
    '1-2':'symptoms started 1–2 days ago',
    '3plus':'symptoms started 3 or more days ago',
    unknown:'symptom timing is uncertain'
  });

  function assess(input){
    if(!['yes','no','unknown'].includes(input.exposure)) throw new Error('Choose an exposure answer.');
    if(!Object.hasOwn(TIMING_LABELS,input.symptomTiming)) throw new Error('Choose when symptoms started.');
    if(!['none','pending','negative','positive'].includes(input.testStatus)) throw new Error('Choose the recent test status.');

    const emergency=Boolean(input.confusion||input.breathing||input.bleeding||input.unableFluids);
    const compatible=Boolean(input.fever||input.headache||input.vomiting);
    const symptomatic=compatible||emergency;
    if(symptomatic&&input.symptomTiming==='none') throw new Error('Choose when the current symptoms started.');
    const possibleExposure=input.exposure!=='no';
    const reasons=[];
    if(symptomatic) reasons.push(TIMING_LABELS[input.symptomTiming]);
    if(input.worsening) reasons.push('symptoms are worsening');
    if(input.higherRisk) reasons.push('higher-risk context');
    if(input.testStatus!=='none') reasons.push(`recent malaria test: ${input.testStatus}`);

    if(emergency){
      reasons.unshift('one or more emergency warning signs');
      return {
        level:'Emergency care now',
        action:'Go to the nearest emergency service or follow local emergency/public-health instructions now. Tell them about possible malaria exposure and any recent test. Do not delay for another checklist, download or self-treatment.',
        reasons,
        warning:'This checklist cannot diagnose malaria. Emergency signs require urgent in-person care even after a negative or pending test.'
      };
    }

    if(input.testStatus==='positive'){
      reasons.unshift('a reported positive malaria test');
      return {
        level:'Qualified malaria care today',
        action:'Contact the testing service or a qualified health facility today for result confirmation and management. Do not choose or change antimalarial medicine or dose from this checklist.',
        reasons,
        warning:'A test result needs professional interpretation and care. Worsening symptoms or any emergency sign require emergency care.'
      };
    }

    if(symptomatic&&(input.testStatus==='negative'||input.testStatus==='pending')){
      reasons.unshift('current symptoms despite a negative or pending test');
      return {
        level:'Same-day clinical reassessment',
        action:'Contact a qualified health service today. A negative test should prompt assessment for other causes, and persistent or worsening symptoms may need re-evaluation or re-testing under local clinical guidance.',
        reasons,
        warning:'Do not treat a negative or pending test as reassurance, self-start antimalarials, or delay care.'
      };
    }

    if(compatible&&(possibleExposure||input.higherRisk)){
      reasons.unshift('malaria-compatible symptom(s)',possibleExposure?'possible malaria exposure':'higher-risk context');
      return {
        level:'Prompt same-day malaria testing',
        action:'Seek parasite-based malaria testing from a qualified health service as soon as possible today. If testing is not readily available, contact an urgent health service rather than waiting or self-treating.',
        reasons:[...new Set(reasons)],
        warning:'Do not self-diagnose from symptoms or delay testing because symptoms seem mild.'
      };
    }

    if(compatible){
      reasons.unshift('malaria-compatible symptom(s) without a known exposure');
      return {
        level:'Same-day clinical assessment',
        action:'Contact a qualified health service today for assessment of malaria and other possible causes. Exposure can be uncertain.',
        reasons,
        warning:'A lack of known exposure does not rule out malaria or another serious illness.'
      };
    }

    if(possibleExposure||input.higherRisk){
      reasons.push(possibleExposure?'possible exposure without selected symptoms':'higher-risk context without selected symptoms');
      return {
        level:'No symptom-based malaria conclusion',
        action:'This checklist cannot determine infection before symptoms. Use current local travel/public-health guidance, and seek prompt testing if fever or other symptoms develop.',
        reasons:[...new Set(reasons)],
        warning:'No selected symptoms is not proof that malaria is absent and does not replace professional prevention advice.'
      };
    }

    reasons.push('no selected compatible or emergency symptoms and no known exposure');
    return {
      level:'No malaria conclusion from this checklist',
      action:'Do not use this result to rule out malaria. If symptoms develop or exposure information changes, seek qualified assessment promptly.',
      reasons,
      warning:'This is not reassurance that malaria is absent and not a substitute for testing.'
    };
  }

  return Object.freeze({assess,TIMING_LABELS});
});

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.FluidLogEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TYPES=Object.freeze({
    water:'Plain water',
    'tea-coffee':'Tea or coffee',
    milk:'Milk or milk drink',
    soup:'Soup or broth',
    other:'Other drink'
  });

  function volume(value,name,min,max){
    const parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max) throw new Error(`${name} must be between ${min} and ${max} mL.`);
    return parsed;
  }

  function total(input){
    if(!Array.isArray(input.entries)||input.entries.length===0) throw new Error('Add at least one drink entry.');
    if(input.entries.length>50) throw new Error('A single-day log can contain at most 50 drink entries.');
    const entries=input.entries.map((entry,index)=>{
      if(!Object.hasOwn(TYPES,entry.type)) throw new Error(`Choose a drink type for entry ${index+1}.`);
      const volumeMl=volume(entry.volumeMl,`Entry ${index+1} volume`,1,5000);
      const time=typeof entry.time==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(entry.time)?entry.time:'';
      return {type:entry.type,typeLabel:TYPES[entry.type],volumeMl,time};
    });
    const totalMl=entries.reduce((sum,entry)=>sum+entry.volumeMl,0);
    if(totalMl>20000) throw new Error('Combined logged fluid cannot exceed 20,000 mL. Check the entries.');
    const byType=Object.keys(TYPES).map(type=>({
      type,
      label:TYPES[type],
      volumeMl:entries.filter(entry=>entry.type===type).reduce((sum,entry)=>sum+entry.volumeMl,0)
    })).filter(item=>item.volumeMl>0);
    let targetMl=null;
    let targetDifference=null;
    let targetContext='No clinician-provided target was confirmed, so no target comparison is shown.';
    if(input.clinicalTargetMl!==null&&input.clinicalTargetMl!==undefined&&input.clinicalTargetMl!==''){
      if(input.targetConfirmed!==true) throw new Error('Confirm that the optional target was supplied by a qualified clinician, or leave it blank.');
      targetMl=volume(input.clinicalTargetMl,'Clinician-provided target',100,20000);
      targetDifference=totalMl-targetMl;
      targetContext=targetDifference===0
        ? 'The logged total equals the entered clinician-provided target. This is arithmetic, not advice.'
        : `The logged total is ${Math.abs(targetDifference).toLocaleString()} mL ${targetDifference>0?'above':'below'} the entered clinician-provided target. This is arithmetic only; do not change a clinical fluid plan without the prescribing team.`;
    }
    return {
      entries,
      entryCount:entries.length,
      byType,
      totalMl,
      targetMl,
      targetDifference,
      targetContext,
      warning:'This log does not prescribe fluid intake or replace clinical guidance for kidney, heart, pregnancy, breastfeeding, medicine-related, acute-illness or other conditions.'
    };
  }

  return Object.freeze({total,TYPES});
});

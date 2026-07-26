(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.WaistHipEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function measurement(value,name,units,optional){
    if(optional&&(value===null||value===undefined||value==='')) return null;
    const parsed=Number(value);
    const min=units==='in'?12:30;
    const max=units==='in'?100:250;
    if(!Number.isFinite(parsed)||parsed<min||parsed>max) throw new Error(`${name} must be between ${min} and ${max} ${units}.`);
    return parsed;
  }

  function calculate(input){
    if(!['cm','in'].includes(input.units)) throw new Error('Choose centimetres or inches.');
    if(!['adult','limited','under18','unsure'].includes(input.applicability)) throw new Error('Choose the measurement context.');
    if(!['none','women','men'].includes(input.reference)) throw new Error('Choose a supported reference option.');

    const waist1=measurement(input.waist,'First waist',input.units,false);
    const hip1=measurement(input.hip,'First hip',input.units,false);
    const waist2=measurement(input.repeatWaist,'Second waist',input.units,true);
    const hip2=measurement(input.repeatHip,'Second hip',input.units,true);
    const waists=waist2===null?[waist1]:[waist1,waist2];
    const hips=hip2===null?[hip1]:[hip1,hip2];
    const meanWaist=waists.reduce((sum,value)=>sum+value,0)/waists.length;
    const meanHip=hips.reduce((sum,value)=>sum+value,0)/hips.length;
    const ratio=meanWaist/meanHip;
    const low=Math.min(...waists)/Math.max(...hips);
    const high=Math.max(...waists)/Math.min(...hips);
    const waistDifference=waist2===null?null:Math.abs(waist1-waist2);
    const hipDifference=hip2===null?null:Math.abs(hip1-hip2);
    const anyRepeat=waist2!==null||hip2!==null;
    const referenceAllowed=input.applicability==='adult';
    const threshold=referenceAllowed&&input.reference==='women'?.85:referenceAllowed&&input.reference==='men'?.90:null;
    let referenceLabel='Ratio only — no population threshold applied';
    let context='No sex-specific population reference was applied.';
    let boundaryNote=anyRepeat
      ? `The entered readings produce ratios from ${low.toFixed(3)} to ${high.toFixed(3)}.`
      : 'Only one waist and hip reading were entered, so repeatability cannot be assessed.';

    if(!referenceAllowed&&input.reference!=='none'){
      context='The selected adult population reference was not applied because the measurement context is pregnancy/abdominal change, under 18, or uncertain.';
    }else if(threshold!==null){
      const atOrAbove=ratio>=threshold;
      referenceLabel=`${atOrAbove?'At or above':'Below'} the selected ${threshold.toFixed(2)} population reference`;
      context=atOrAbove
        ? 'This is a population-level conversation prompt only. It does not identify obesity, body fat or disease.'
        : 'A value below the selected reference does not rule out health concerns and is not a statement of health.';
      if(low<threshold&&high>=threshold) boundaryNote+=` The observed repeat-reading interval crosses the selected ${threshold.toFixed(2)} reference, so the threshold label is not stable across the entered readings.`;
      else if(Math.abs(ratio-threshold)<.01) boundaryNote+=` The unrounded ratio is close to the selected ${threshold.toFixed(2)} reference.`;
    }

    return {
      ratio,
      low,
      high,
      meanWaist,
      meanHip,
      waistDifference,
      hipDifference,
      anyRepeat,
      referenceApplied:threshold!==null,
      referenceLabel,
      context,
      boundaryNote,
      warning:'Waist-to-hip ratio cannot diagnose obesity, body fat, diabetes, cardiovascular disease or overall health.'
    };
  }

  return Object.freeze({calculate});
});

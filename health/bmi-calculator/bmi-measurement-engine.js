(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BmiMeasurementEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function number(value,name,min,max){
    const parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return parsed;
  }

  function optionalNumber(value,name,min,max){
    if(value===null||value===undefined||value==='') return null;
    return number(value,name,min,max);
  }

  function bmi(weightKg,heightCm){
    return weightKg/Math.pow(heightCm/100,2);
  }

  function assess(input){
    const height1=number(input.heightCm,'First height',100,250);
    const height2=optionalNumber(input.repeatHeightCm,'Second height',100,250);
    const weight1=number(input.weightKg,'First weight',25,400);
    const weight2=optionalNumber(input.repeatWeightKg,'Second weight',25,400);
    const conditions=['yes','no','unknown'].includes(input.sameConditions)?input.sameConditions:'unknown';
    const heights=height2===null?[height1]:[height1,height2];
    const weights=weight2===null?[weight1]:[weight1,weight2];
    const meanHeight=heights.reduce((sum,value)=>sum+value,0)/heights.length;
    const meanWeight=weights.reduce((sum,value)=>sum+value,0)/weights.length;
    const centre=bmi(meanWeight,meanHeight);
    const low=bmi(Math.min(...weights),Math.max(...heights));
    const high=bmi(Math.max(...weights),Math.min(...heights));
    const heightDifference=height2===null?null:Math.abs(height1-height2);
    const weightDifference=weight2===null?null:Math.abs(weight1-weight2);
    const completeRepeat=height2!==null&&weight2!==null;
    const anyRepeat=height2!==null||weight2!==null;
    const roundedLow=Number(low.toFixed(1));
    const roundedHigh=Number(high.toFixed(1));
    const displayNote=!anyRepeat
      ? 'Only one height and one weight were entered, so repeatability cannot be assessed.'
      : roundedLow===roundedHigh
        ? `All entered measurement combinations round to the same one-decimal BMI (${roundedLow.toFixed(1)}).`
        : `The entered readings produce one-decimal BMI values from ${roundedLow.toFixed(1)} to ${roundedHigh.toFixed(1)}.`;
    const conditionsNote=conditions==='yes'
      ? 'You recorded the readings under similar conditions. Their spread describes these readings only; it does not prove device accuracy.'
      : conditions==='no'
        ? 'You recorded different measurement conditions. Do not interpret the spread as scale or stadiometer repeatability.'
        : 'Measurement conditions were not confirmed, so the source of any spread is unknown.';

    return {
      bmi:centre,
      low,
      high,
      meanHeight,
      meanWeight,
      heightDifference,
      weightDifference,
      completeRepeat,
      anyRepeat,
      displayNote,
      conditionsNote,
      warning:'BMI is a screening measurement, not a diagnosis or direct measure of body fat, fitness, nutrition or health.'
    };
  }

  return Object.freeze({assess});
});

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BmiEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function number(value,name,min,max){
    const parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return parsed;
  }

  function applicability(audience){
    if(audience==='adult') return;
    if(audience==='under20') throw new Error('This calculator is for adults aged 20 or older. Children and teenagers need an age- and sex-specific growth assessment.');
    if(audience==='pregnancy') throw new Error('Adult BMI screening bands are not appropriate during pregnancy. Ask a qualified pregnancy-care professional about suitable measurements.');
    throw new Error('Confirm that this calculation is for an adult aged 20 or older.');
  }

  function calculate(input){
    applicability(input.audience);
    let bmi;
    let formula;
    let working;
    let normalized;

    if(input.units==='metric'){
      const weightKg=number(input.weightKg,'Weight',25,400);
      const heightCm=number(input.heightCm,'Height',100,250);
      const metres=heightCm/100;
      bmi=weightKg/(metres*metres);
      formula='kg ÷ metres²';
      working=`${weightKg} ÷ (${metres.toFixed(3)} × ${metres.toFixed(3)})`;
      normalized={heightCm,weightKg,totalInches:heightCm/2.54,pounds:weightKg/0.45359237};
    }else if(input.units==='imperial'){
      const feet=number(input.feet,'Feet',3,8);
      if(!Number.isInteger(feet)) throw new Error('Feet must be a whole number.');
      const inches=number(input.inches||0,'Inches',0,11.9);
      const pounds=number(input.pounds,'Weight',55,880);
      const totalInches=feet*12+inches;
      bmi=703*pounds/(totalInches*totalInches);
      formula='703 × pounds ÷ inches²';
      working=`703 × ${pounds} ÷ (${totalInches.toFixed(1)} × ${totalInches.toFixed(1)})`;
      normalized={heightCm:totalInches*2.54,weightKg:pounds*0.45359237,totalInches,pounds};
    }else{
      throw new Error('Choose metric or imperial units.');
    }

    const band=bmi<18.5?'Below 18.5 screening band':bmi<25?'18.5–24.9 screening band':bmi<30?'25.0–29.9 screening band':'30 or above screening band';
    const nearestBoundary=[18.5,25,30].reduce((best,value)=>Math.abs(bmi-value)<Math.abs(bmi-best)?value:best,18.5);
    const distance=Math.abs(bmi-nearestBoundary);
    const boundaryNote=distance<0.15
      ? `The unrounded result is close to the ${nearestBoundary} screening boundary. Small measurement differences can change the displayed band.`
      : 'The screening band uses the unrounded calculation; the displayed BMI is rounded to one decimal place.';

    return {
      bmi,
      band,
      formula,
      working,
      normalized,
      boundaryNote,
      context:'This band is a population screening reference. It does not determine body fat, fitness, nutrition, disease or individual health.',
      warning:'Do not use BMI to diagnose obesity or health, set a target weight, or delay professional assessment.'
    };
  }

  return Object.freeze({calculate});
});

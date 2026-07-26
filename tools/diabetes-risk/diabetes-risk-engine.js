(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.DiabetesRiskEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function finite(value,name,min,max){
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return n;
  }
  function integer(value,name,min,max){
    const n=finite(value,name,min,max);
    if(!Number.isInteger(n)) throw new Error(`${name} must be a whole number.`);
    return n;
  }
  function score(input){
    const age=integer(input.age,'Age',18,120);
    const heightCm=finite(input.heightCm,'Height',100,250);
    const weightKg=finite(input.weightKg,'Weight',25,400);
    if(!['female','male'].includes(input.sex)) throw new Error('Choose the sex used by the source score.');
    const bmi=weightKg/Math.pow(heightCm/100,2);
    const agePoints=age<40?0:age<50?1:age<60?2:3;
    const lowerBmiThreshold=Boolean(input.asianAmericanThreshold)?23:25;
    const weightPoints=bmi<lowerBmiThreshold?0:bmi<30?1:bmi<40?2:3;
    const breakdown=[
      {label:'Age',points:agePoints},
      {label:'Source-score sex',points:input.sex==='male'?1:0},
      {label:'Prior gestational diabetes',points:input.sex==='female'&&Boolean(input.gestational)?1:0},
      {label:'Parent or sibling with diabetes',points:Boolean(input.familyHistory)?1:0},
      {label:'Diagnosed high blood pressure',points:Boolean(input.highBloodPressure)?1:0},
      {label:'Not physically active',points:Boolean(input.inactive)?1:0},
      {label:'Weight band',points:weightPoints}
    ];
    const total=breakdown.reduce((sum,item)=>sum+item.points,0);
    const high=total>=5;
    const priorityReasons=[];
    if(input.symptoms) priorityReasons.push('You selected possible diabetes symptoms. Arrange prompt clinical assessment; do not wait because of this score.');
    if(input.pregnant) priorityReasons.push('Pregnancy uses a separate clinical testing pathway. Ask your pregnancy-care team about the appropriate timing and test.');
    if(input.previousAbnormal) priorityReasons.push('A previous abnormal glucose result needs follow-up with a qualified health professional, regardless of this score.');
    const priority=priorityReasons.length>0;
    return {
      total,bmi,breakdown,lowerBmiThreshold,priorityReasons,
      band:priority?'Do not rely on the score alone':high?'Blood-test conversation recommended':'Below the source score threshold — not a rule-out',
      message:priority?priorityReasons.join(' '):high?'This screening score is 5 or more. Ask a qualified health worker whether a blood glucose test is appropriate.':'This score is below 5, but it cannot rule out prediabetes or diabetes. Risk can still exist and only appropriate testing can answer the question.',
      warning:'This score is not a diagnosis, does not measure blood glucose and must not be used to delay testing, pregnancy care or urgent assessment.'
    };
  }
  return Object.freeze({score});
});

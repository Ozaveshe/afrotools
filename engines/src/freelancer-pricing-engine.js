(function(root){
  'use strict';
  var fields={takeHome:'Enter a monthly take-home target greater than zero.',expenses:'Enter monthly expenses of zero or more.',billableHours:'Enter monthly billable hours greater than zero.',reservePercent:'Enter a reserve percentage from zero to less than 100.',projectHours:'Enter project hours greater than zero.'};
  function calculate(input){
    input=input||{};var values={},errors={};
    Object.keys(fields).forEach(function(key){var raw=input[key],blank=raw===null||raw===undefined||String(raw).trim()==='';var number=Number(raw);if(blank||!Number.isFinite(number)||number<0||((key==='takeHome'||key==='billableHours'||key==='projectHours')&&number===0)||(key==='reservePercent'&&number>=100)){errors[key]=fields[key];}else{values[key]=number;}});
    if(Object.keys(errors).length)return {errors:errors};
    var monthlyBilling=(values.takeHome+values.expenses)/(1-values.reservePercent/100);
    var hourly=monthlyBilling/values.billableHours,project=hourly*values.projectHours;
    if(![monthlyBilling,hourly,project].every(Number.isFinite))return {errors:{takeHome:'These inputs produce a quote too large to calculate. Use smaller amounts or hours.'}};
    return {inputs:values,monthlyBilling:monthlyBilling,reserveAmount:monthlyBilling*values.reservePercent/100,hourly:hourly,project:project};
  }
  function summary(result,currency,country){
    var n=function(v){return Number(v).toFixed(2);},i=result.inputs;
    return ['Freelance pricing plan — '+country,'Currency: '+currency,'Minimum hourly rate: '+currency+' '+n(result.hourly),'Project quote ('+i.projectHours+' hours): '+currency+' '+n(result.project),'Monthly billing target: '+currency+' '+n(result.monthlyBilling),'Monthly take-home target: '+currency+' '+n(i.takeHome),'Monthly business expenses: '+currency+' '+n(i.expenses),'Monthly billable hours: '+i.billableHours,'Reserve assumption: '+i.reservePercent+'% of billing ('+currency+' '+n(result.reserveAmount)+')','Calculation: (take-home + expenses) / (1 - reserve / 100) / billable hours. Project quote = hourly rate × project hours.','Planning floor from your inputs, not a country market rate or statutory tax calculation. Excludes unpaid time beyond your billable-hours assumption; agree scope, payment terms and any applicable taxes with your client.'].join('\n');
  }
  var api={calculate:calculate,summary:summary};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.AfroTools=root.AfroTools||{};root.AfroTools.FreelancerPricing=api;}
})(typeof globalThis!=='undefined'?globalThis:this);

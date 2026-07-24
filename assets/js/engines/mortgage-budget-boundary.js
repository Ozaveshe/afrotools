(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MortgageBudgetBoundary=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var MAX_AMOUNT=1000000000000;
  function amount(value){
    if(value===''||value===null||value===undefined)return null;
    var parsed=Number(value);
    return Number.isFinite(parsed)&&parsed>=0&&parsed<=MAX_AMOUNT?parsed:null;
  }
  function calculate(input){
    input=input||{};
    var monthlyBudget=amount(input.monthlyBudget);
    var recurringCosts=amount(input.recurringCosts);
    var cushion=amount(input.cushion);
    if(monthlyBudget===null||monthlyBudget===0||recurringCosts===null||cushion===null)return {valid:false};
    var reserved=recurringCosts+cushion;
    if(!Number.isFinite(reserved)||reserved>MAX_AMOUNT)return {valid:false};
    return {
      valid:true,
      monthlyBudget:monthlyBudget,
      recurringCosts:recurringCosts,
      cushion:cushion,
      reserved:reserved,
      paymentBoundary:Math.max(0,monthlyBudget-reserved),
      shortfall:Math.max(0,reserved-monthlyBudget)
    };
  }
  return {calculate:calculate,MAX_AMOUNT:MAX_AMOUNT};
});

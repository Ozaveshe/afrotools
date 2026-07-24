(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.MicrofinanceOfferEngine=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  var FREQUENCIES=[1,4,12,26,52];
  function number(value,min,max){
    if(value===""||value===null||typeof value==="undefined")throw new Error("VALUE_REQUIRED");
    var parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max)throw new Error("INVALID_NUMBER");
    return parsed;
  }
  function choice(value,allowed,code){
    if(allowed.indexOf(value)===-1)throw new Error(code);
    return value;
  }
  function normalizeRate(quotedRatePct,basis,periodsPerYear){
    var quoted=number(quotedRatePct,0,1000)/100;
    choice(basis,["annual","monthly","period"],"INVALID_RATE_BASIS");
    number(periodsPerYear,1,52);
    if(basis==="annual")return quoted;
    if(basis==="monthly")return quoted*12;
    return quoted*periodsPerYear;
  }
  function amortizedPayment(principal,periodicRate,count){
    if(principal===0)return 0;
    if(periodicRate===0)return principal/count;
    var factor=Math.pow(1+periodicRate,count);
    var result=principal*(periodicRate*factor)/(factor-1);
    if(!Number.isFinite(result))throw new Error("UNBOUNDED_RESULT");
    return result;
  }
  function effectiveAnnualCostRate(proceeds,payments,periodsPerYear){
    if(!(proceeds>0))throw new Error("NET_PROCEEDS_REQUIRED");
    if(!Array.isArray(payments)||!payments.length)throw new Error("PAYMENTS_REQUIRED");
    function npv(rate){
      var total=-proceeds;
      for(var i=0;i<payments.length;i++){
        var payment=number(payments[i],0,1e18);
        total+=payment/Math.pow(1+rate,i+1);
      }
      return total;
    }
    if(npv(0)<=0)return 0;
    var low=0,high=1;
    while(npv(high)>0&&high<1024)high*=2;
    if(npv(high)>0)return null;
    for(var j=0;j<120;j++){
      var mid=(low+high)/2;
      if(npv(mid)>0)low=mid;else high=mid;
    }
    var result=(Math.pow(1+(low+high)/2,periodsPerYear)-1)*100;
    return Number.isFinite(result)?result:null;
  }
  function calculate(input){
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");
    var unit=String(input.currencyUnit||"").trim().toUpperCase();
    if(!unit||unit.length>12||/[\r\n<>]/.test(unit))throw new Error("CURRENCY_REQUIRED");
    var principal=number(input.principal,0.01,1e15);
    var quotedRate=number(input.quotedRatePct,0,1000);
    var basis=choice(input.rateBasis,["annual","monthly","period"],"INVALID_RATE_BASIS");
    var method=choice(input.method,["flat","reducing"],"INVALID_METHOD");
    var ppy=number(input.periodsPerYear,1,52);
    if(FREQUENCIES.indexOf(ppy)===-1)throw new Error("INVALID_FREQUENCY");
    var count=number(input.paymentCount,1,520);
    if(!Number.isInteger(count))throw new Error("INVALID_COUNT");
    var withheld=number(input.withheldFees,0,1e15);
    var financed=number(input.financedFees,0,1e15);
    var recurring=number(input.recurringCharge,0,1e15);
    var feesBearInterest=Boolean(input.financedFeesBearInterest);
    var netProceeds=principal-withheld;
    if(!(netProceeds>0))throw new Error("NET_PROCEEDS_REQUIRED");
    var openingBalance=principal+financed;
    if(!Number.isFinite(openingBalance))throw new Error("UNBOUNDED_RESULT");
    var annual=normalizeRate(quotedRate,basis,ppy);
    var periodic=annual/ppy;
    var interestBase=feesBearInterest?openingBalance:principal;
    var interestPayment=method==="reducing"?amortizedPayment(interestBase,periodic,count):0;
    var basePayment=method==="flat"?(openingBalance+interestBase*annual*count/ppy)/count:interestPayment+(feesBearInterest?0:financed/count);
    if(!Number.isFinite(basePayment+recurring))throw new Error("UNBOUNDED_RESULT");
    var rows=[],balance=openingBalance,interestBalance=interestBase,nonInterestBalance=feesBearInterest?0:financed;
    for(var i=1;i<=count;i++){
      var opening=balance;
      var interest=method==="flat"?interestBase*annual/ppy:interestBalance*periodic;
      var principalPart;
      if(method==="flat")principalPart=openingBalance/count;
      else{
        var interestPrincipal=Math.min(interestBalance,interestPayment-interest);
        var feePrincipal=Math.min(nonInterestBalance,financed/count);
        interestBalance=Math.max(0,interestBalance-interestPrincipal);
        nonInterestBalance=Math.max(0,nonInterestBalance-feePrincipal);
        principalPart=interestPrincipal+feePrincipal;
      }
      balance=Math.max(0,opening-principalPart);
      var row={period:i,opening:opening,interest:interest,principal:principalPart,charge:recurring,payment:principalPart+interest+recurring,closing:balance};
      if(![row.opening,row.interest,row.principal,row.payment,row.closing].every(Number.isFinite))throw new Error("UNBOUNDED_RESULT");
      rows.push(row);
    }
    var totalRepayment=rows.reduce(function(sum,row){return sum+row.payment;},0);
    var cost=totalRepayment-netProceeds;
    var effective=effectiveAnnualCostRate(netProceeds,rows.map(function(row){return row.payment;}),ppy);
    return {
      currencyUnit:unit,principal:principal,quotedRatePct:quotedRate,rateBasis:basis,
      normalizedNominalAnnualRatePct:annual*100,method:method,periodsPerYear:ppy,paymentCount:count,
      withheldFees:withheld,financedFees:financed,recurringCharge:recurring,
      financedFeesBearInterest:feesBearInterest,interestBase:interestBase,openingBalance:openingBalance,
      netProceeds:netProceeds,paymentPerPeriod:basePayment+recurring,totalRepayment:totalRepayment,
      totalBorrowingCost:cost,effectiveAnnualCostRatePct:effective,rows:rows
    };
  }
  return {FREQUENCIES:FREQUENCIES,normalizeRate:normalizeRate,effectiveAnnualCostRate:effectiveAnnualCostRate,calculate:calculate};
});

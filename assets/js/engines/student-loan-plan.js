(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.AfroTools=root.AfroTools||{};root.AfroTools.StudentLoanPlan=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function number(value){if(value===''||value===null||value===undefined)return NaN;return Number(value)}
function nonnegative(value){var result=number(value);return Number.isFinite(result)&&result>=0&&result<=1e15?result:NaN}
function recentDate(value,today){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;var checked=new Date(value+'T00:00:00Z'),now=today?new Date(today+'T00:00:00Z'):new Date(),age=(now-checked)/86400000;return Number.isFinite(age)&&age>=0&&age<=365}
function calculate(input,today){
  var currency=String(input.currency||'').trim().toUpperCase(),balance=number(input.statementBalance),financedFees=nonnegative(input.financedFees),rate=number(input.annualRate),months=number(input.repaymentMonths),grace=number(input.graceMonths),monthlyFee=nonnegative(input.monthlyFee),extra=nonnegative(input.extraPayment),income=nonnegative(input.monthlyNetIncome),debts=nonnegative(input.otherMonthlyDebt),source=String(input.termsSource||'').trim(),accrues=input.graceAccrual===true||input.graceAccrual==='yes'||input.graceAccrual==='true';
  if(!/^[A-Z]{3,8}$/.test(currency))return{ok:false,error:'invalid_context'};
  if(!Number.isFinite(balance)||balance<=0||balance>1e15||[financedFees,monthlyFee,extra,income,debts].some(Number.isNaN))return{ok:false,error:'invalid_amount'};
  if(!Number.isFinite(rate)||rate<0||rate>1000)return{ok:false,error:'invalid_rate'};
  if(!Number.isInteger(months)||months<1||months>360||!Number.isInteger(grace)||grace<0||grace>120)return{ok:false,error:'invalid_period'};
  if(!source||source.length>180||!recentDate(input.sourceDate,today))return{ok:false,error:'invalid_evidence'};
  var openingBalance=balance+financedFees,r=rate/100/12,current=openingBalance,rows=[],totalInterest=0,totalLoanPayments=0,totalServicingFees=0;
  for(var g=1;g<=grace;g++){var graceInterest=accrues?current*r:0;current+=graceInterest;totalInterest+=graceInterest;if(!Number.isFinite(current)||current>1e15)return{ok:false,error:'invalid_structure'};rows.push({month:g,phase:'grace',payment:0,fee:0,interest:graceInterest,principal:0,balance:current})}
  var balanceAtRepaymentStart=current,scheduled=r===0?current/months:current*r/(1-Math.pow(1+r,-months));
  if(!Number.isFinite(scheduled)||scheduled<=0)return{ok:false,error:'invalid_structure'};
  var repaymentCount=0;
  while(current>.005&&repaymentCount<months){repaymentCount++;var interest=current*r,amountDue=current+interest,base=Math.min(scheduled,amountDue),extraApplied=Math.min(extra,Math.max(0,amountDue-base)),loanPayment=base+extraApplied,principalPaid=loanPayment-interest;if(principalPaid<=0)return{ok:false,error:'invalid_structure'};current=Math.max(0,current-principalPaid);totalInterest+=interest;totalLoanPayments+=loanPayment;totalServicingFees+=monthlyFee;rows.push({month:grace+repaymentCount,phase:'repayment',payment:loanPayment,fee:monthlyFee,interest:interest,principal:principalPaid,balance:current})}
  if(current>.005)return{ok:false,error:'invalid_structure'};
  var firstRepaymentRow=rows.find(function(row){return row.phase==='repayment'}),firstCashPayment=firstRepaymentRow?firstRepaymentRow.payment+firstRepaymentRow.fee:0,totalPaid=totalLoanPayments+totalServicingFees,debtLoad=income>0?(debts+firstCashPayment)/income*100:null,cashAfter=income>0?income-debts-firstCashPayment:null;
  return{ok:true,currency:currency,statementBalance:balance,financedFees:financedFees,openingBalance:openingBalance,annualRate:rate,repaymentMonths:months,graceMonths:grace,graceAccrual:accrues,termsSource:source,sourceDate:input.sourceDate,balanceAtRepaymentStart:balanceAtRepaymentStart,scheduledPayment:scheduled,extraPayment:extra,monthlyFee:monthlyFee,firstCashPayment:firstCashPayment,repaymentCount:repaymentCount,totalTimelineMonths:grace+repaymentCount,totalInterest:totalInterest,totalLoanPayments:totalLoanPayments,totalServicingFees:totalServicingFees,totalFees:financedFees+totalServicingFees,totalPaid:totalPaid,monthlyNetIncome:income,otherMonthlyDebt:debts,debtLoadPercent:debtLoad,cashAfterPayment:cashAfter,schedule:rows}
}
return{calculate:calculate,recentDate:recentDate}});

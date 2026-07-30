'use strict';

// Exact controller extracted from tools/loan-consolidation/index.html.
// English and French route owners load this same file; keep formula changes shared.
function lcText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('loan-consolidation',key,fallback)
    : fallback;
}
var loanCount=3;
function addLoan(){
  loanCount++;
  var div=document.createElement('div');
  div.className='loan-entry';
  div.innerHTML='<h4>'+lcText('loan','Loan')+' '+loanCount+'</h4><div class="loan-entry-grid"><div class="form-group"><label>'+lcText('balance','Balance')+'</label><input aria-label="'+lcText('loan','Loan')+' '+loanCount+' '+lcText('loanBalance','balance')+'" type="number" class="lc-balance" min="0.01" step="0.01"></div><div class="form-group"><label>'+lcText('monthlyPayment','Monthly Payment')+'</label><input aria-label="'+lcText('loan','Loan')+' '+loanCount+' '+lcText('loanPayment','monthly payment')+'" type="number" class="lc-payment" min="0.01" step="0.01"></div><div class="form-group"><label>'+lcText('annualRate','Annual Rate (%)')+'</label><input aria-label="'+lcText('loan','Loan')+' '+loanCount+' '+lcText('loanRate','annual rate')+'" type="number" class="lc-rate" value="24" min="0" max="1000" step="0.01"></div></div><button type="button" aria-label="'+lcText('remove','Remove loan')+' '+loanCount+'" class="btn-del" onclick="this.closest(\'.loan-entry\').remove()">&#x2715;</button>';
  document.getElementById('loans-list').appendChild(div);
}
function simulateCurrentLoan(balance,payment,annualRate){
  var monthlyRate=annualRate/12,months=0,totalPaid=0;
  if(payment<=balance*monthlyRate)return null;
  while(balance>0.005&&months<600){
    balance+=balance*monthlyRate;
    var paid=Math.min(payment,balance);balance-=paid;totalPaid+=paid;months++;
  }
  return balance<=0.005?{months:months,totalPaid:totalPaid}:null;
}
function calcConsolidation(){
  var balances=document.querySelectorAll('.lc-balance');
  var payments=document.querySelectorAll('.lc-payment');
  var rates=document.querySelectorAll('.lc-rate');
  var totalBalance=0,totalMonthly=0,currentTotalRepayment=0,currentTerm=0;
  var error=document.getElementById('lc-error'),output=document.getElementById('lc-results');
  error.textContent='';output.classList.remove('on');
  if(!balances.length){error.textContent=lcText('addOne','Add at least one current loan.');return;}
  for(var i=0;i<balances.length;i++){
    var b=parseFloat(balances[i].value),p=parseFloat(payments[i].value),ratePercent=parseFloat(rates[i].value);
    if(!Number.isFinite(b)||b<=0||!Number.isFinite(p)||p<=0||!Number.isFinite(ratePercent)||ratePercent<0||ratePercent>1000){error.textContent=lcText('invalidLoan','Each current loan needs a positive balance and payment, plus an annual rate from 0% to 1,000%.');return;}
    var simulation=simulateCurrentLoan(b,p,ratePercent/100);
    if(!simulation){error.textContent=lcText('invalidAmortization','Each current payment must cover monthly interest and repay the loan within 600 months.');return;}
    totalBalance+=b;
    totalMonthly+=p;
    currentTotalRepayment+=simulation.totalPaid;
    currentTerm=Math.max(currentTerm,simulation.months);
  }
  var newRatePercent=parseFloat(document.getElementById('lc-new-rate').value);
  var newTenor=parseInt(document.getElementById('lc-new-tenor').value);
  var originationPercent=parseFloat(document.getElementById('lc-origination').value);
  var currency=document.getElementById('lc-currency').value;
  if(!Number.isFinite(newRatePercent)||newRatePercent<0||newRatePercent>1000||!Number.isFinite(newTenor)||newTenor<1||!Number.isFinite(originationPercent)||originationPercent<0||originationPercent>100){error.textContent=lcText('invalidOffer','Check the consolidation rate, term and fee. Rate must be 0% to 1,000% and fee 0% to 100%.');return;}
  var newRate=newRatePercent/100;
  var newMonthlyRate=newRate/12;
  var originationPct=originationPercent/100;
  var originationFee=totalBalance*originationPct;
  var consolidatedAmount=totalBalance+originationFee;
  var newMonthly=newMonthlyRate>0?consolidatedAmount*(newMonthlyRate*Math.pow(1+newMonthlyRate,newTenor))/(Math.pow(1+newMonthlyRate,newTenor)-1):consolidatedAmount/newTenor;
  var newTotal=newMonthly*newTenor;
  var totalRepaymentDifference=currentTotalRepayment-newTotal;
  var monthlyDiff=totalMonthly-newMonthly;
  var termDifference=newTenor-currentTerm;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  var lowerTotal=totalRepaymentDifference>0.005;
  var verdictBox=document.getElementById('lc-verdict-box');
  verdictBox.className='verdict '+(lowerTotal?'go':'no-go');
  document.getElementById('lc-verdict-val').textContent=lowerTotal?lcText('lower','Lower modeled total repayment'):totalRepaymentDifference<-0.005?lcText('higher','Higher modeled total repayment'):lcText('equal','Equal modeled total repayment');
  document.getElementById('lc-verdict-sub').textContent=lcText('currentTotal','Current total')+' '+fmt(currentTotalRepayment)+' '+lcText('overUpTo','over up to')+' '+currentTerm+' '+lcText('months','months')+' ; '+lcText('consolidationTotal','consolidation total')+' '+fmt(newTotal)+' '+lcText('over','over')+' '+newTenor+' '+lcText('months','months')+', '+lcText('including','including')+' '+fmt(originationFee)+' '+lcText('financedFee','financed fee')+'.';
  document.getElementById('lc-current-monthly').textContent=fmt(totalMonthly);
  document.getElementById('lc-new-monthly').textContent=fmt(newMonthly);
  document.getElementById('lc-monthly-savings').textContent=(monthlyDiff>=0?'+':'-')+fmt(Math.abs(monthlyDiff));
  document.getElementById('lc-total-savings').textContent=(totalRepaymentDifference>=0?'+':'-')+fmt(Math.abs(totalRepaymentDifference));
  document.getElementById('lc-breakeven').textContent=termDifference===0?lcText('sameTerm','Same term'):Math.abs(termDifference)+' '+lcText('months','months')+' '+(termDifference>0?lcText('longer','longer'):lcText('shorter','shorter'));
  document.getElementById('lc-total-balance').textContent=fmt(totalBalance);
  output.classList.add('on');output.focus({preventScroll:true});
}

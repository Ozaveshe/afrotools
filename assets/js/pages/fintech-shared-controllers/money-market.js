'use strict';

// Exact controller extracted from tools/money-market/index.html.
// English and French route owners load this same file; keep formula changes shared.
function mmfText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('money-market',key,fallback)
    : fallback;
}
function calcMMF(){
  var currency=document.getElementById('mmf-currency').value;
  var amount=parseFloat(document.getElementById('mmf-amount').value);
  var mmfPercent=parseFloat(document.getElementById('mmf-rate').value);
  var fdPercent=parseFloat(document.getElementById('mmf-fd-rate').value);
  var days=parseInt(document.getElementById('mmf-days').value);
  var error=document.getElementById('mmf-error'),output=document.getElementById('mmf-results');error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(mmfPercent)||mmfPercent<=-100||mmfPercent>1000||!Number.isFinite(fdPercent)||fdPercent<=-100||fdPercent>1000||!Number.isFinite(days)||days<1){error.textContent=mmfText('invalid','Enter an amount above zero and annual rates above -100% and no more than 1,000%.');return false;}
  var mmfRate=mmfPercent/100,fdRate=fdPercent/100;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  var mmfPeriodRate=Math.pow(1+mmfRate,days/365)-1;
  var mmfTotal=amount*(1+mmfPeriodRate);
  var mmfReturn=mmfTotal-amount;
  var dailyAccrual=amount*(Math.pow(1+mmfRate,1/365)-1);
  var weeklyYield=amount*(Math.pow(1+mmfRate,7/365)-1);
  var fdReturn=amount*fdRate*(days/365);
  var diff=mmfReturn-fdReturn;
  document.getElementById('mmf-total').textContent=fmt(mmfReturn);
  var separator=window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ';
  document.getElementById('mmf-sub').textContent=mmfText('totalValue','Total value')+separator+fmt(mmfTotal)+' | '+mmfText('period','Period')+separator+days+' '+mmfText('days','days');
  document.getElementById('mmf-daily').textContent=fmt(dailyAccrual);
  document.getElementById('mmf-weekly').textContent=fmt(weeklyYield);
  document.getElementById('mmf-vs-fd').textContent=(diff>=0?'+':'-')+fmt(Math.abs(diff));
  document.getElementById('mmf-liquidity').textContent=(mmfPeriodRate*100).toFixed(4)+'%';
  var tbody=document.getElementById('mmf-compare');
  tbody.innerHTML='<tr class="highlight"><td>'+mmfText('fund','Money Market Fund')+'</td><td>'+mmfPercent.toFixed(2)+'% '+mmfText('annualEffective','annual effective')+'</td><td>'+fmt(mmfReturn)+'</td></tr><tr><td>'+mmfText('deposit','Fixed Deposit')+' ('+days+' '+mmfText('days','days')+')</td><td>'+fdPercent.toFixed(2)+'% '+mmfText('simpleAnnual','simple annual')+'</td><td>'+fmt(fdReturn)+'</td></tr>';
  output.classList.add('on');output.focus({preventScroll:true});return true;
}
function moneyMarketSummary(){
  if(!calcMMF())return '';
  var separator=window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ';
  return mmfText('summary','Money market comparison')+separator+document.getElementById('mmf-total').textContent+' '+mmfText('estimatedReturn','estimated MMF return for')+' '+document.getElementById('mmf-days').value+' '+mmfText('days','days')+' ; '+mmfText('daily','daily accrual')+' '+document.getElementById('mmf-daily').textContent+' ; '+mmfText('weekly','7-day yield')+' '+document.getElementById('mmf-weekly').textContent+' ; '+mmfText('difference','difference vs fixed deposit')+' '+document.getElementById('mmf-vs-fd').textContent+'. '+mmfText('verify','Verify the live fund factsheet, fees, liquidity, tax, and regulator status before investing.');
}
var mmfCopy=document.getElementById('mmf-copy');
if(mmfCopy){
  mmfCopy.addEventListener('click',function(){
    var text=moneyMarketSummary();
    if(!text)return;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text);
      mmfCopy.textContent=mmfText('copied','Copied');
      setTimeout(function(){mmfCopy.textContent=mmfText('copy','Copy comparison brief');},1600);
    }
  });
}

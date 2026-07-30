'use strict';

// Exact controller extracted from tools/thrift-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function thriftText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('thrift-calc',key,fallback)
    : fallback;
}
function calcThrift(){
  var type=document.getElementById('tc-type').value;
  var members=Number(document.getElementById('tc-members').value);
  var monthly=Number(document.getElementById('tc-monthly').value);
  var yourPos=Number(document.getElementById('tc-your-pos').value);
  var rate=Number(document.getElementById('tc-rate').value);
  var bankRate=Number(document.getElementById('tc-bank-rate').value);
  var error=document.getElementById('tc-error');
  var results=document.getElementById('tc-results');
  if(!Number.isInteger(members)||members<2||members>100||!Number.isInteger(yourPos)||yourPos<1||yourPos>members||!Number.isFinite(monthly)||monthly<=0||!Number.isFinite(rate)||rate<0||!Number.isFinite(bankRate)||bankRate<0){
    error.textContent=thriftText('invalid','Enter 2–100 members, a position within the group, a positive contribution, and non-negative annual rates.');error.classList.add('on');results.classList.remove('on');return;
  }
  error.classList.remove('on');
  var totalContributed=monthly*members;
  var cyclePot=monthly*members;
  function contributionFV(annualRate){var r=Math.pow(1+annualRate/100,1/12)-1;return r===0?monthly*members:monthly*(Math.pow(1+r,members)-1)/r;}
  var bankEquiv=contributionFV(bankRate);
  var rotating=type==='rotating';
  var lumpSum=rotating?cyclePot:contributionFV(rate);
  var monthsWait=rotating?yourPos:members;
  var modeledYield=rotating?0:rate;
  var currency=document.getElementById('tc-currency').value;
  var money=new Intl.NumberFormat(undefined,{style:'currency',currency:currency,maximumFractionDigits:2});
  function fmt(n){return money.format(n);}
  document.getElementById('tc-lump').textContent=fmt(lumpSum);
  document.getElementById('tc-sub').textContent=thriftText('atMonth','At month')+' '+monthsWait+' '+thriftText('of','of')+' '+members+' | '+thriftText('groupTotal','Group total')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+fmt(cyclePot);
  document.getElementById('tc-contributed').textContent=fmt(totalContributed);
  document.getElementById('tc-receive').textContent=fmt(lumpSum);
  document.getElementById('tc-months-wait').textContent=monthsWait+' '+thriftText('months','months');
  document.getElementById('tc-implicit-return').textContent=modeledYield.toFixed(2)+'%';
  document.getElementById('tc-bank-equiv').textContent=fmt(bankEquiv);
  document.getElementById('tc-cycle-total').textContent=fmt(cyclePot);
  var verdict=rotating
    ?thriftText('rotation','Zero-fee rotation: you contribute')+' '+fmt(totalContributed)+' '+thriftText('overCycle','over the full cycle and receive the same nominal pot at month')+' '+yourPos+'. '+thriftText('timing','Position changes timing, not nominal return.')
    :thriftText('atRate','At the entered')+' '+rate.toFixed(2)+'% '+thriftText('planEnds','annual effective rate, the contribution plan ends at')+' '+fmt(lumpSum)+'. '+thriftText('bankEnds','The same month-end contributions at the entered bank rate end at')+' '+fmt(bankEquiv)+'.';
  document.getElementById('tc-verdict').textContent=verdict;
  results.classList.add('on');
}

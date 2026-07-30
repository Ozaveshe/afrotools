'use strict';

// Exact controller extracted from tools/fixed-deposit/index.html.
// English and French route owners load this same file; keep formula changes shared.
function fdText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('fixed-deposit',key,fallback)
    : fallback;
}
function fillFDRate(){
  document.getElementById('fd-results').classList.remove('on');
}
function fmt(n,sym){return sym+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function calcFD(){
  var sel=document.getElementById('fd-country');
  var opt=sel.options[sel.selectedIndex];
  var sym=opt.getAttribute('data-sym');
  var principal=parseFloat(document.getElementById('fd-amount').value);
  var annualRate=parseFloat(document.getElementById('fd-rate').value);
  var months=parseInt(document.getElementById('fd-tenor').value,10);
  var taxRate=parseFloat(document.getElementById('fd-tax').value);
  var compound=document.getElementById('fd-compound').value==='compound';
  var error=document.getElementById('fd-error');
  if(!Number.isFinite(principal)||principal<=0||!Number.isFinite(annualRate)||annualRate<0||annualRate>100||!Number.isFinite(taxRate)||taxRate<0||taxRate>100||!Number.isFinite(months)||months<=0){
    error.textContent=fdText('invalid','Enter a principal above zero and annual rate and tax values from 0% to 100%.');
    error.classList.add('on');
    document.getElementById('fd-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var r=annualRate/100;
  var grossInterest,total;
  if(compound){
    var monthlyRate=r/12;
    total=principal*Math.pow(1+monthlyRate,months);
    grossInterest=total-principal;
  } else {
    grossInterest=principal*r*(months/12);
    total=principal+grossInterest;
  }
  var taxAmt=grossInterest*(taxRate/100);
  var netInterest=grossInterest-taxAmt;
  var netTotal=principal+netInterest;
  var monthlyEq=netInterest/months;
  var ear=compound?Math.pow(1+r/12,12)-1:r;
  var netEar=ear*(1-taxRate/100);
  document.getElementById('fd-total').textContent=fmt(netTotal,sym);
  document.getElementById('fd-total-sub').textContent=fdText('principal','Principal')+': '+fmt(principal,sym)+' + '+fdText('netInterest','Net Interest')+': '+fmt(netInterest,sym);
  document.getElementById('fd-interest').textContent=fmt(grossInterest,sym);
  document.getElementById('fd-tax-amt').textContent=fmt(taxAmt,sym);
  document.getElementById('fd-net-interest').textContent=fmt(netInterest,sym);
  document.getElementById('fd-monthly').textContent=fmt(monthlyEq,sym);
  document.getElementById('fd-ear').textContent=(ear*100).toFixed(2)+'%';
  document.getElementById('fd-net-ear').textContent=(netEar*100).toFixed(2)+'%';
  // Build schedule
  var tbody=document.getElementById('fd-schedule');
  tbody.innerHTML='';
  var bal=principal;
  for(var m=1;m<=months;m++){
    var mInt=compound?bal*(r/12):principal*(r/12);
    if(compound)bal+=mInt; else bal=principal+principal*(r/12)*m;
    var row='<tr><td>'+fdText('month','Month')+' '+m+'</td><td>'+fmt(m===1?principal:bal-mInt,sym)+'</td><td>'+fmt(mInt,sym)+'</td><td>'+fmt(bal,sym)+'</td></tr>';
    tbody.innerHTML+=row;
  }
  document.getElementById('fd-results').classList.add('on');
  document.getElementById('fd-results').focus();
}

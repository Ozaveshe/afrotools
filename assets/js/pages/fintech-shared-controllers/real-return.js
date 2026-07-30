'use strict';

// Exact controller extracted from tools/real-return/index.html.
// English and French route owners load this same file; keep formula changes shared.
function rrText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('real-return',key,fallback)
    : fallback;
}
function fillRRInflation(){
  document.getElementById('rr-results').classList.remove('on');
}
function calcRealReturn(){
  var sel=document.getElementById('rr-country');
  var opt=sel.options[sel.selectedIndex];
  var sym=opt.getAttribute('data-sym');
  var nominal=parseFloat(document.getElementById('rr-nominal').value)/100;
  var inflation=parseFloat(document.getElementById('rr-inflation').value)/100;
  var amount=parseFloat(document.getElementById('rr-amount').value);
  var years=parseInt(document.getElementById('rr-years').value,10);
  var error=document.getElementById('rr-error');
  if(!Number.isFinite(nominal)||nominal<=-1||!Number.isFinite(inflation)||inflation<=-1||!Number.isFinite(amount)||amount<=0||!Number.isFinite(years)||years<=0){
    error.textContent=rrText('invalid','Enter an amount above zero and nominal return and inflation rates greater than −100%.');
    error.classList.add('on');
    document.getElementById('rr-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  // Fisher equation
  var realRate=((1+nominal)/(1+inflation))-1;
  var nominalVal=(nominal*100).toFixed(2)+'%';
  var inflationVal=(inflation*100).toFixed(2)+'%';
  var realVal=(realRate*100).toFixed(2)+'%';
  // Purchasing power after years
  var ppFuture=amount*Math.pow(1+realRate,years);
  var approximation=nominal-inflation;
  function fmt(n){return sym+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('rr-nominal-val').textContent=nominalVal;
  document.getElementById('rr-inflation-val').textContent=inflationVal;
  document.getElementById('rr-real-val').textContent=realVal;
  document.getElementById('rr-purchasing-power').textContent=fmt(ppFuture);
  document.getElementById('rr-yrs-label').textContent=years+' '+(years>1?rrText('yearsShort','yrs'):rrText('yearShort','yr'));
  document.getElementById('rr-approx').textContent=(approximation*100).toFixed(2)+'%';
  document.getElementById('rr-real').textContent=(realRate*100).toFixed(2)+'%';
  document.getElementById('rr-sub').textContent=rrText('nominal','Nominal')+': '+nominalVal+' | '+rrText('inflation','Inflation')+': '+inflationVal;
  var hero=document.getElementById('rr-hero');
  hero.className='res-hero '+(realRate>=0?'positive':'negative');
  var verdict=document.getElementById('rr-verdict');
  if(realRate<0){
    verdict.innerHTML='<div class="warn-box">'+rrText('negative','This constant-rate scenario has a <strong>negative real return</strong>, so the projected amount loses purchasing power. Review taxes, fees and the inflation measure before using the result.')+'</div>';
  } else {
    verdict.innerHTML='<div class="info-box">'+rrText('positiveStart','Your real return is <strong>positive</strong> at')+' '+(realRate*100).toFixed(2)+'%. '+rrText('positiveMiddle','Your purchasing power is growing. In')+' '+years+' '+(years>1?rrText('yearsShort','years'):rrText('yearShort','year'))+', '+fmt(amount)+' '+rrText('positiveEnd','will have the purchasing power of')+' '+fmt(ppFuture)+' '+rrText('today','today')+'.</div>';
  }
  document.getElementById('rr-results').classList.add('on');
  document.getElementById('rr-results').focus();
}

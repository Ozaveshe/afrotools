'use strict';

// Exact controller extracted from tools/mobile-vs-bank/index.html.
// English and French route owners load this same file; keep formula changes shared.
var MB_DATA={KE:'KES',NG:'NGN',GH:'GHS',UG:'UGX',TZ:'TZS',ZA:'ZAR',RW:'RWF',ZM:'ZMW',ET:'ETB',CM:'XAF',CI:'XOF',SN:'XOF',MW:'MWK',MZ:'MZN',BW:'BWP'};
function mbText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('mobile-vs-bank',key,fallback)
    : fallback;
}
function fillMB(){
  document.getElementById('mb-results').classList.remove('on');
}
function mbProviderName(id,fallback){
  var node=document.getElementById(id);
  var value=node?String(node.value||'').trim():'';
  return value||fallback;
}
function mbEscape(value){
  return String(value).replace(/[&<>"']/g,function(character){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];
  });
}
function calcMB(){
  var country=document.getElementById('mb-country').value;
  var amount=parseFloat(document.getElementById('mb-amount').value);
  var mmFlat=parseFloat(document.getElementById('mb-mm-fee').value);
  var mmPct=parseFloat(document.getElementById('mb-mm-pct').value)/100;
  var bankFlat=parseFloat(document.getElementById('mb-bank-fee').value);
  var bankPct=parseFloat(document.getElementById('mb-bank-pct').value)/100;
  var error=document.getElementById('mb-error');
  var values=[amount,mmFlat,mmPct,bankFlat,bankPct];
  if(values.some(function(value){return !Number.isFinite(value)||value<0;})||amount<=0||mmPct>1||bankPct>1){
    error.textContent=mbText('invalid','Enter an amount above zero and fee values from 0% to 100%.');
    error.classList.add('on');
    document.getElementById('mb-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var currency=MB_DATA[country]||mbText('amount','Amount');
  var d={
    mmName:mbProviderName('mb-mm-provider',mbText('mobileQuote','Mobile money quote')),
    bankName:mbProviderName('mb-bank-provider',mbText('bankQuote','Bank transfer quote'))
  };
  var mmFee=mmFlat+amount*mmPct;
  var bankFee=bankFlat+amount*bankPct;
  var mmEffective=(mmFee/amount)*100;
  var bankEffective=(bankFee/amount)*100;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.querySelectorAll('.winner-badge').forEach(function(node){node.remove();});
  document.getElementById('mb-mm-total-fee').textContent=fmt(mmFee);
  document.getElementById('mb-mm-name').textContent=d.mmName;
  document.getElementById('mb-mm-detail').textContent=mbText('flat','Flat')+': '+fmt(mmFlat)+' + '+(mmPct*100).toFixed(2)+'% | '+mbText('effectiveFee','Effective fee')+': '+mmEffective.toFixed(2)+'%';
  document.getElementById('mb-bank-total-fee').textContent=fmt(bankFee);
  document.getElementById('mb-bank-name').textContent=d.bankName;
  document.getElementById('mb-bank-detail').textContent=mbText('flat','Flat')+': '+fmt(bankFlat)+' + '+(bankPct*100).toFixed(2)+'% | '+mbText('effectiveFee','Effective fee')+': '+bankEffective.toFixed(2)+'%';
  if(Math.abs(mmFee-bankFee)<0.005){
    document.getElementById('mb-mm-card').className='compare-card winner';
    document.getElementById('mb-bank-card').className='compare-card winner';
    document.getElementById('mb-mm-name').insertAdjacentHTML('beforebegin','<div class="winner-badge">'+mbText('sameEnteredCost','SAME ENTERED COST')+'</div>');
    document.getElementById('mb-bank-name').insertAdjacentHTML('beforebegin','<div class="winner-badge">'+mbText('sameEnteredCost','SAME ENTERED COST')+'</div>');
  } else if(mmFee<bankFee){
    document.getElementById('mb-mm-card').className='compare-card winner';
    document.getElementById('mb-bank-card').className='compare-card loser';
    document.getElementById('mb-mm-name').insertAdjacentHTML('beforebegin','<div class="winner-badge">'+mbText('cheapest','CHEAPEST')+'</div>');
  } else {
    document.getElementById('mb-bank-card').className='compare-card winner';
    document.getElementById('mb-mm-card').className='compare-card loser';
    document.getElementById('mb-bank-name').insertAdjacentHTML('beforebegin','<div class="winner-badge">'+mbText('cheapest','CHEAPEST')+'</div>');
  }
  // Build comparison table for different amounts
  var amounts=[amount*0.1,amount*0.5,amount,amount*2,amount*5];
  var headers='<tr><th>'+mbEscape(mbText('amount','Amount'))+'</th><th>'+mbEscape(d.mmName)+'</th><th>'+mbEscape(d.bankName)+'</th><th>'+mbEscape(mbText('cheaper','Cheaper'))+'</th></tr>';
  var rows='';
  for(var i=0;i<amounts.length;i++){
    var a=amounts[i];
    var mf=mmFlat+a*mmPct;
    var bf=bankFlat+a*bankPct;
    var cheaper=Math.abs(mf-bf)<0.005?mbText('sameCost','Same cost'):(mf<bf?d.mmName:d.bankName);
    var isCurrent=Math.abs(a-amount)<1;
    rows+='<tr'+(isCurrent?' class="best"':'')+'>'
      +'<td>'+fmt(a)+'</td>'
      +'<td>'+fmt(mf)+'</td>'
      +'<td>'+fmt(bf)+'</td>'
      +'<td>'+mbEscape(cheaper)+'</td>'
      +'</tr>';
  }
  document.getElementById('mb-table').innerHTML=headers+rows;
  document.getElementById('mb-results').classList.add('on');
  document.getElementById('mb-results').focus();
}

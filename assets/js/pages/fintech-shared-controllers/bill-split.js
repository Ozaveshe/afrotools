'use strict';

// Exact controller extracted from tools/bill-split/index.html.
// English and French route owners load this same file; keep formula changes shared.
var personCount=4;
function bsText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('bill-split',key,fallback)
    : fallback;
}
function toggleSplitMethod(){
  var method=document.getElementById('bs-method').value;
  var pctInputs=document.querySelectorAll('#bs-people .pct-input');
  for(var i=0;i<pctInputs.length;i++){
    pctInputs[i].style.display=method==='custom'?'block':'none';
  }
}
function addPerson(){
  var div=document.createElement('div');
  div.className='person-row';
  var method=document.getElementById('bs-method').value;
  div.innerHTML='<input aria-label="'+bsText('person','Person')+' '+(personCount+1)+' '+bsText('name','name')+'" type="text" placeholder="'+bsText('person','Person')+' '+(personCount+1)+' '+bsText('name','name')+'" value="'+bsText('person','Person')+' '+(personCount+1)+'">'
    +'<input aria-label="'+bsText('person','Person')+' '+(personCount+1)+' '+bsText('percentage','percentage')+'" type="number" class="pct-input" placeholder="%" value="0" style="display:'+(method==='custom'?'block':'none')+'">'
    +'<button type="button" aria-label="'+bsText('remove','Remove person')+' '+(personCount+1)+'" class="btn-rm" onclick="removePerson(this)">✕</button>';
  document.getElementById('bs-people').appendChild(div);
  personCount++;
}
function removePerson(btn){
  var rows=document.querySelectorAll('#bs-people .person-row');
  if(rows.length>2){btn.parentNode.remove();}
}
function calcBillSplit(){
  var total=parseFloat(document.getElementById('bs-total').value);
  var tipPercent=parseFloat(document.getElementById('bs-tip').value);
  var method=document.getElementById('bs-method').value;
  var currency=document.getElementById('bs-currency').value;
  var error=document.getElementById('bs-error');var output=document.getElementById('bs-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(total)||total<=0||!Number.isFinite(tipPercent)||tipPercent<0||tipPercent>100){error.textContent=bsText('invalid','Enter a bill above zero and an added charge from 0% to 100%.');return;}
  var subtotalCents=Math.round(total*100);
  var grandCents=Math.round(total*(1+tipPercent/100)*100);
  var tipCents=grandCents-subtotalCents;
  var rows=document.querySelectorAll('#bs-people .person-row');
  var names=[],pcts=[];
  for(var i=0;i<rows.length;i++){
    var nameInput=rows[i].querySelector('input[type="text"]');
    var pctInput=rows[i].querySelector('.pct-input');
    names.push(nameInput?(nameInput.value.trim()||(bsText('person','Person')+' '+(i+1))):bsText('person','Person')+' '+(i+1));
    pcts.push(pctInput&&method==='custom'?parseFloat(pctInput.value):0);
  }
  var n=names.length;
  if(n<2){error.textContent=bsText('keepTwo','Keep at least two people in the split.');return;}
  var amountCents=[];
  if(method==='equal'){
    var base=Math.floor(grandCents/n);var remainder=grandCents-base*n;
    for(var j=0;j<n;j++) amountCents.push(base+(j<remainder?1:0));
  } else {
    var totalPct=pcts.reduce(function(a,b){return a+b;},0);
    if(pcts.some(function(p){return !Number.isFinite(p)||p<0||p>100;})||Math.abs(totalPct-100)>0.001){error.textContent=bsText('customInvalid','Custom percentages must each be from 0% to 100% and total exactly 100%.');return;}
    var fractions=[];var allocated=0;
    for(var k=0;k<n;k++){var raw=grandCents*pcts[k]/100;var whole=Math.floor(raw);amountCents.push(whole);allocated+=whole;fractions.push({index:k,fraction:raw-whole});}
    fractions.sort(function(a,b){return b.fraction-a.fraction||a.index-b.index;});
    for(var extra=0;extra<grandCents-allocated;extra++)amountCents[fractions[extra%fractions.length].index]++;
  }
  function fmtCents(cents){return currency+' '+(cents/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('bs-primary-label').textContent=method==='equal'?bsText('equalShare','Per Person (Equal Split)'):bsText('averageShare','Average Share');
  document.getElementById('bs-per-person').textContent=fmtCents(Math.round(grandCents/n));
  document.getElementById('bs-sub').textContent=bsText('total','Total')+': '+fmtCents(grandCents)+' | '+n+' '+bsText('people','people');
  document.getElementById('bs-subtotal').textContent=fmtCents(subtotalCents);
  document.getElementById('bs-tip-amt').textContent=fmtCents(tipCents);
  document.getElementById('bs-grand-total').textContent=fmtCents(grandCents);
  document.getElementById('bs-people-count').textContent=n+' '+bsText('people','people');
  var cards=document.getElementById('bs-person-cards');cards.replaceChildren();
  for(var m=0;m<names.length;m++){
    var card=document.createElement('div');card.className='person-card';var name=document.createElement('div');name.className='person-name';name.textContent=names[m];var amount=document.createElement('div');amount.className='person-amt';amount.textContent=fmtCents(amountCents[m]);var pct=document.createElement('div');pct.className='person-pct';pct.textContent=(amountCents[m]/grandCents*100).toFixed(2)+'% '+bsText('ofTotal','of total');card.append(name,amount,pct);cards.appendChild(card);
  }
  output.classList.add('on');output.focus();
}

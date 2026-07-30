'use strict';

// Exact controller extracted from tools/stock-portfolio/index.html.
// English and French route owners load this same file; keep formula changes shared.
function spText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('stock-portfolio',key,fallback)
    : fallback;
}
var currentCurrency='NGN';
function setExchange(cur,sym,btn){
  currentCurrency=cur;
  document.querySelectorAll('.etab').forEach(function(b){b.classList.remove('active');b.setAttribute('aria-pressed','false');});
  btn.classList.add('active');
  btn.setAttribute('aria-pressed','true');
}
function addRow(){
  var tbody=document.getElementById('holdings-tbody');
  var tr=document.createElement('tr');
  var n=tbody.children.length+1;
  tr.innerHTML='<td><input aria-label="'+spText('holding','Holding')+' '+n+' '+spText('ticker','ticker')+'" type="text" placeholder="'+spText('ticker','Ticker')+'"></td><td><input type="number" placeholder="100" min="0" step="any" aria-label="'+spText('holding','Holding')+' '+n+' '+spText('shares','shares')+'"></td><td><input type="number" placeholder="0" min="0" step="any" aria-label="'+spText('holding','Holding')+' '+n+' '+spText('buyPrice','buy price per share')+'"></td><td><input type="number" placeholder="0" min="0" step="any" aria-label="'+spText('holding','Holding')+' '+n+' '+spText('currentPrice','current price per share')+'"></td><td><button type="button" class="btn-del" onclick="delRow(this)" aria-label="'+spText('delete','Delete holding')+' '+n+'">&#x2715;</button></td>';
  tbody.appendChild(tr);
}
function delRow(btn){btn.closest('tr').remove();}
function calcPortfolio(){
  var rows=document.querySelectorAll('#holdings-tbody tr');
  var totalValue=0,totalCost=0;
  var items=[];
  var invalid=false;
  rows.forEach(function(row,index){
    var inputs=row.querySelectorAll('input');
    var name=inputs[0].value.trim()||(spText('holding','Holding')+' '+(index+1));
    var raw=[inputs[1].value,inputs[2].value,inputs[3].value];
    if(raw.every(function(value){return value==='';})&&!inputs[0].value.trim())return;
    var shares=Number(raw[0]);
    var buyPrice=Number(raw[1]);
    var curPrice=Number(raw[2]);
    if(!Number.isFinite(shares)||!Number.isFinite(buyPrice)||!Number.isFinite(curPrice)||shares<=0||buyPrice<=0||curPrice<0){invalid=true;return;}
      var cost=shares*buyPrice;
      var value=shares*curPrice;
      var gain=value-cost;
      var returnPct=gain/cost*100;
      totalValue+=value;
      totalCost+=cost;
      items.push({name,shares,buyPrice,curPrice,cost,value,gain,returnPct});
  });
  var error=document.getElementById('sp-error');
  var results=document.getElementById('sp-results');
  if(invalid||!items.length){error.textContent=invalid?spText('invalid','Each used row needs positive shares and buy price, plus a non-negative current price.'):spText('empty','Enter at least one complete holding.');error.classList.add('on');results.classList.remove('on');return;}
  error.classList.remove('on');
  var totalGain=totalValue-totalCost;
  var totalReturn=totalGain/totalCost*100;
  var money=new Intl.NumberFormat(undefined,{style:'currency',currency:currentCurrency,maximumFractionDigits:2});
  function fmt(n){return money.format(n);}
  document.getElementById('sp-total-value').textContent=fmt(totalValue);
  document.getElementById('sp-total-cost').textContent=fmt(totalCost);
  var gainEl=document.getElementById('sp-total-gain');
  gainEl.textContent=(totalGain>=0?'+':'')+fmt(totalGain);
  gainEl.className='metric-val '+(totalGain>=0?'green':'red');
  var retEl=document.getElementById('sp-return-pct');
  retEl.textContent=(totalReturn>=0?'+':'')+totalReturn.toFixed(1)+'%';
  retEl.className='metric-val '+(totalReturn>=0?'green':'red');
  var tbody=document.getElementById('sp-table-body');
  tbody.innerHTML='';
  items.forEach(function(item){
    var alloc=totalValue>0?((item.value/totalValue)*100).toFixed(1):'0';
    var tr=document.createElement('tr');
    [item.name,item.shares.toLocaleString(),fmt(item.buyPrice),fmt(item.curPrice),fmt(item.value),(item.gain>=0?'+':'')+fmt(item.gain),(item.returnPct>=0?'+':'')+item.returnPct.toFixed(1)+'%',alloc+'%'].forEach(function(value,i){var td=document.createElement('td');td.textContent=value;if(i===0)td.style.fontWeight='700';if(i===5||i===6)td.className=(item.gain>=0?'gain':'loss');tr.appendChild(td);});
    tbody.appendChild(tr);
  });
  results.classList.add('on');
}

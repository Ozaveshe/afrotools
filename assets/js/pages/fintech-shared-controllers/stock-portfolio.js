'use strict';

// Exact controller extracted from tools/stock-portfolio/index.html.
// English and French route owners load this same file; keep formula changes shared.
function spText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('stock-portfolio',key,fallback)
    : fallback;
}
var currentCurrency='NGN';
var spCurrentPortfolio=null;
function spLine(value){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,500);}
function spMoney(currency){return new Intl.NumberFormat(undefined,{style:'currency',currency:currency,maximumFractionDigits:currency==='XOF'?0:2});}
function spReadReference(){
  var dateInput=document.getElementById('sp-quote-date');
  var sourceInput=document.getElementById('sp-quote-source');
  var date=dateInput?dateInput.value.trim():'';
  if(dateInput){
    spMarkInvalid(dateInput,false);
    var parsed=date?new Date(date+'T00:00:00Z'):null;
    if((dateInput.validity&&dateInput.validity.badInput)||(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10)))){
      var error=document.getElementById('sp-error');
      error.textContent=spText('quoteDateInvalid','Enter a valid quote date that is not in the future.');error.classList.add('on');spMarkInvalid(dateInput,true);dateInput.focus();return null;
    }
  }
  return {date:date,source:sourceInput?spLine(sourceInput.value):''};
}
function spMarkInvalid(input,invalid){
  var described=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(function(id){return id&&id!=='sp-error';});
  if(invalid){input.setAttribute('aria-invalid','true');described.push('sp-error');}
  else input.removeAttribute('aria-invalid');
  if(described.length)input.setAttribute('aria-describedby',described.join(' '));
  else input.removeAttribute('aria-describedby');
}
function spInvalidatePortfolio(){
  spCurrentPortfolio=null;
  var download=document.getElementById('sp-download');if(download)download.disabled=true;
  var reference=document.getElementById('sp-result-reference');if(reference)reference.textContent='';
  var dateInput=document.getElementById('sp-quote-date');if(dateInput)spMarkInvalid(dateInput,false);
  document.getElementById('sp-results').classList.remove('on');
  document.getElementById('sp-table-body').innerHTML='';
  ['sp-total-value','sp-total-cost','sp-total-gain','sp-return-pct'].forEach(function(id){document.getElementById(id).textContent='';});
  var error=document.getElementById('sp-error');
  error.classList.remove('on');
  error.textContent='';
  document.querySelectorAll('#holdings-tbody tr').forEach(function(row){row.querySelectorAll('input').forEach(function(input){spMarkInvalid(input,false);});});
}
function setExchange(cur,sym,btn){
  if(currentCurrency!==cur)spInvalidatePortfolio();
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
  spInvalidatePortfolio();
}
function delRow(btn){btn.closest('tr').remove();spInvalidatePortfolio();}
function calcPortfolio(){
  spInvalidatePortfolio();
  var reference=spReadReference();if(!reference)return;
  var rows=document.querySelectorAll('#holdings-tbody tr');
  var totalValue=0,totalCost=0;
  var items=[];
  var invalid=false;
  var outOfRange=false;
  var firstInvalid=null;
  rows.forEach(function(row,index){
    var inputs=row.querySelectorAll('input');
    var name=inputs[0].value.trim()||(spText('holding','Holding')+' '+(index+1));
    var raw=[inputs[1].value,inputs[2].value,inputs[3].value];
    var badInput=raw.some(function(value,i){return inputs[i+1].validity&&inputs[i+1].validity.badInput;});
    if(raw.every(function(value){return value.trim()==='';})&&!inputs[0].value.trim()&&!badInput)return;
    var shares=Number(raw[0]);
    var buyPrice=Number(raw[1]);
    var curPrice=Number(raw[2]);
    var values=[shares,buyPrice,curPrice];
    var rowInvalid=false;
    raw.forEach(function(value,i){
      var input=inputs[i+1];
      if(value.trim()===''||(input.validity&&input.validity.badInput)||!Number.isFinite(values[i])||(i<2?values[i]<=0:values[i]<0)){
        rowInvalid=true;spMarkInvalid(input,true);if(!firstInvalid)firstInvalid=input;
      }
    });
    if(rowInvalid){invalid=true;return;}
      var cost=shares*buyPrice;
      var value=shares*curPrice;
      var gain=value-cost;
      var returnPct=gain/cost*100;
      if(cost<=0||(curPrice>0&&value===0)||![cost,value,gain,returnPct,totalValue+value,totalCost+cost].every(Number.isFinite)){
        outOfRange=true;
        [inputs[1],inputs[2],inputs[3]].forEach(function(input){spMarkInvalid(input,true);});
        if(!firstInvalid)firstInvalid=inputs[1];
        return;
      }
      totalValue+=value;
      totalCost+=cost;
      items.push({name,shares,buyPrice,curPrice,cost,value,gain,returnPct});
  });
  var error=document.getElementById('sp-error');
  var results=document.getElementById('sp-results');
  if(invalid||outOfRange||!items.length){
    error.textContent=invalid?spText('invalid','Each used row needs positive shares and buy price, plus a non-negative current price.'):outOfRange?spText('outOfRange','These holdings are outside the supported numeric range. Adjust the amounts or quantities and try again.'):spText('empty','Enter at least one complete holding.');
    error.classList.add('on');
    if(firstInvalid)firstInvalid.focus();
    return;
  }
  error.classList.remove('on');
  var totalGain=totalValue-totalCost;
  var totalReturn=totalGain/totalCost*100;
  var money=spMoney(currentCurrency);
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
  spCurrentPortfolio={currency:currentCurrency,quoteDate:reference.date,source:reference.source,totalValue:totalValue,totalCost:totalCost,totalGain:totalGain,totalReturn:totalReturn,items:items};
  var referenceNode=document.getElementById('sp-result-reference');
  if(referenceNode)referenceNode.textContent=spText('manualValuation','Manual price-only valuation')+' · '+currentCurrency+(reference.date?' · '+spText('quoteDate','Quote date')+': '+reference.date:'')+(reference.source?' · '+spText('priceSource','Price source')+': '+reference.source:'');
  var download=document.getElementById('sp-download');if(download)download.disabled=false;
  results.classList.add('on');
}
var spHoldingsBody=document.getElementById('holdings-tbody');
if(spHoldingsBody)spHoldingsBody.addEventListener('input',function(event){
  if(event.target.tagName==='INPUT')spInvalidatePortfolio();
});
['sp-quote-date','sp-quote-source'].forEach(function(id){var input=document.getElementById(id);if(input)['input','change'].forEach(function(type){input.addEventListener(type,spInvalidatePortfolio);});});
function spBuildPortfolioSummary(){
  if(!spCurrentPortfolio)return '';
  var p=spCurrentPortfolio,money=spMoney(p.currency);
  var lines=['AfroTools stock portfolio valuation','Manual prices entered by you; no live quote fetched.','Currency: '+p.currency];
  if(p.quoteDate)lines.push('Quote date (all current prices): '+p.quoteDate);
  if(p.source)lines.push('Price source entered by you: '+spLine(p.source));
  lines.push('','Total value: '+money.format(p.totalValue),'Total cost: '+money.format(p.totalCost),'Gain / loss: '+money.format(p.totalGain),'Return: '+p.totalReturn.toFixed(2)+'%','');
  p.items.forEach(function(item){lines.push(spLine(item.name)+' | Shares: '+item.shares+' | Buy price: '+item.buyPrice+' '+p.currency+' | Current price: '+item.curPrice+' '+p.currency+' | Value: '+money.format(item.value));});
  lines.push('','Price-only calculation; excludes dividends, trading fees and taxes.','Displayed money uses the currency fraction digits; entered prices and quantities above retain their numeric precision.');
  return lines.join('\n')+'\n';
}
function spDownloadPortfolio(){
  var text=spBuildPortfolioSummary();if(!text)return;
  var url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  var link=document.createElement('a');link.href=url;link.download='afrotools-stock-valuation-'+spCurrentPortfolio.currency+(spCurrentPortfolio.quoteDate?'-'+spCurrentPortfolio.quoteDate:'')+'.txt';
  document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);
}

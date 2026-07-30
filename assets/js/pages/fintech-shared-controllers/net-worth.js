'use strict';

// Exact controller extracted from tools/net-worth/index.html.
// English and French route owners load this same file; keep formula changes shared.
function nwText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('net-worth',key,fallback)
    : fallback;
}
function addItemRow(listId){
  var list=document.getElementById(listId);
  var row=document.createElement('div');
  row.className='item-row';
row.innerHTML='<input aria-label="'+nwText('itemName','Item name')+'" type="text" placeholder="'+nwText('itemName','Item name')+'"><input aria-label="'+nwText('amount','Line item amount')+'" type="number" placeholder="0" value="0"><button type="button" aria-label="'+nwText('remove','Remove item')+'" class="btn-del-row" onclick="this.closest(\'.item-row\').remove()">&#x2715;</button>';
  list.appendChild(row);
}
function calcNetWorth(){
  var sym=document.getElementById('nw-currency').value;
  var error=document.getElementById('nw-error'),output=document.getElementById('nw-results'),valid=true;
  error.textContent='';output.classList.remove('on');
  function sumList(listId){
    var rows=document.querySelectorAll('#'+listId+' .item-row');
    var total=0;
    rows.forEach(function(row){
      var inputs=row.querySelectorAll('input');
      var raw=inputs[1].value.trim(),amount=raw===''?0:parseFloat(raw);
      if(!Number.isFinite(amount)||amount<0){valid=false;return;}
      total+=amount;
    });
    return total;
  }
  var assets=sumList('assets-list');
  var liabilities=sumList('liabilities-list');
  if(!valid){error.textContent=nwText('invalid','Every asset and liability amount must be zero or more.');return;}
  if(assets===0&&liabilities===0){error.textContent=nwText('empty','Enter at least one asset or liability amount.');return;}
  var netWorth=assets-liabilities;
  var dta=assets>0?(liabilities/assets)*100:0;
  function fmt(n){return sym+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('nw-total').textContent=fmt(netWorth);
  document.getElementById('nw-sub').textContent=nwText('assets','Assets')+' : '+fmt(assets)+' − '+nwText('liabilities','Liabilities')+' : '+fmt(liabilities);
  document.getElementById('nw-assets').textContent=fmt(assets);
  document.getElementById('nw-liabilities').textContent=fmt(liabilities);
  document.getElementById('nw-dta').textContent=dta.toFixed(1)+'%';
  document.getElementById('nw-dta-fill').style.width=Math.min(100,dta)+'%';
  document.getElementById('nw-dta-text').textContent=assets>0?nwText('ratioPrefix','Liabilities equal')+' '+dta.toFixed(1)+'% '+nwText('ratioSuffix','of entered assets. This ratio is descriptive, not a financial-health score.'):nwText('noAssets','No entered assets; the debt-to-asset ratio is not meaningful.');
  output.classList.add('on');output.focus({preventScroll:true});
}

'use strict';

// Exact controller extracted from tools/invoice-factoring/index.html.
// English and French route owners load this same file; keep formula changes shared.
function ifText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('invoice-factoring',key,fallback)
    : fallback;
}
var lastFactoringResult=null;
function factoringInputs(){
  return {
    currency:document.getElementById('if-currency').value,
    invoice:parseFloat(document.getElementById('if-invoice').value),
    advancePct:parseFloat(document.getElementById('if-advance').value)/100,
    baseFeePct:parseFloat(document.getElementById('if-fee').value)/100,
    days:parseInt(document.getElementById('if-days').value,10),
    additional:parseFloat(document.getElementById('if-additional').value),
    recourse:document.getElementById('if-recourse').value
  };
}
function calcInvoiceFactoring(){
  var data=factoringInputs();
  var status=document.getElementById('if-status'),output=document.getElementById('if-results');status.textContent='';output.classList.remove('on');lastFactoringResult=null;
  if(!Number.isFinite(data.invoice)||data.invoice<=0||!Number.isFinite(data.advancePct)||data.advancePct<=0||data.advancePct>=1||!Number.isFinite(data.baseFeePct)||data.baseFeePct<0||!Number.isFinite(data.days)||data.days<1||data.days>3650||!Number.isFinite(data.additional)||data.additional<0){status.textContent=ifText('invalid','Enter an invoice above zero, an advance rate between 0% and 100%, non-negative fees, and 1 to 3,650 days.');return null;}
  var advance=data.invoice*data.advancePct;
  var totalFee=data.invoice*data.baseFeePct+data.additional;
  if(totalFee>=data.invoice){status.textContent=ifText('invalidFees','Total entered fees must be less than the invoice value.');return null;}
  var reserve=data.invoice-advance;
  var reserveRelease=Math.max(0,reserve-totalFee);
  var feeShortfall=Math.max(0,totalFee-reserve);
  var totalReceived=Math.max(0,data.invoice-totalFee);
  var costPct=data.invoice?totalFee/data.invoice*100:0;
  var apr=(Math.pow(1+totalFee/advance,365/data.days)-1)*100;
  lastFactoringResult={currency:data.currency,invoice:data.invoice,advancePct:data.advancePct,baseFeePct:data.baseFeePct,recourse:data.recourse,days:data.days,additional:data.additional,advance:advance,totalFee:totalFee,reserve:reserve,reserveRelease:reserveRelease,feeShortfall:feeShortfall,totalReceived:totalReceived,costPct:costPct,apr:apr};
  function fmt(n){return data.currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('if-cash-today').textContent=fmt(advance);
  document.getElementById('if-sub').textContent=data.days+' '+ifText('dayFacility','day facility')+' | '+(data.recourse==='nonrecourse'?ifText('nonRecourse','non-recourse model'):ifText('recourse','recourse model'));
  document.getElementById('if-advance-amt').textContent=fmt(advance);
  document.getElementById('if-total-fee').textContent=fmt(totalFee);
  document.getElementById('if-reserve').textContent=fmt(reserve);
  document.getElementById('if-reserve-release').textContent=fmt(reserveRelease);
  document.getElementById('if-total-received').textContent=fmt(totalReceived);
  document.getElementById('if-cost-pct').textContent=costPct.toFixed(2)+'%';
  document.getElementById('if-apr').textContent=apr.toFixed(2)+'%';
  var flow=document.getElementById('if-flow');
  flow.innerHTML='<div class="flow-step"><div class="flow-num">1</div><div class="flow-label">'+ifText('invoice','Invoice')+'</div><div class="flow-val">'+fmt(data.invoice)+'</div></div>'
    +'<div class="flow-step"><div class="flow-num">2</div><div class="flow-label">'+ifText('advance','Advance')+' ('+Math.round(data.advancePct*100)+'%)</div><div class="flow-val">'+fmt(advance)+'</div></div>'
    +'<div class="flow-step"><div class="flow-num">3</div><div class="flow-label">'+ifText('fees','Fees')+'</div><div class="flow-val">-'+fmt(totalFee)+'</div></div>'
    +'<div class="flow-step"><div class="flow-num">4</div><div class="flow-label">'+ifText('reserveRelease','Reserve release')+'</div><div class="flow-val">'+fmt(reserveRelease)+'</div></div>'
    +'<div class="flow-step"><div class="flow-num">5</div><div class="flow-label">'+ifText('totalReceived','Total received')+'</div><div class="flow-val">'+fmt(totalReceived)+'</div></div>';
  var verdict=ifText('annualizedProxy','Annualized cost proxy')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+apr.toFixed(2)+'%. '+ifText('compare','Compare this entered offer with alternatives over the same cash amount and duration.');
  var shortfall=feeShortfall>0?ifText('feeExceeds','Fee exceeds the reserve by')+' '+fmt(feeShortfall)+'. '+ifText('askDeduction','Ask whether part is deducted from the advance.'):ifText('reserveCovers','Reserve can cover modeled fees if the debtor pays on time.');
  document.getElementById('if-decision').innerHTML='<h3>'+ifText('decision','Decision handoff')+'</h3><ul><li>'+verdict+'</li><li>'+ifText('askReserve','Ask when the reserve is released and whether debtor notice is required.')+'</li><li>'+ifText('compareAlternatives','Compare against overdraft, supplier credit, customer discount, or waiting for payment.')+'</li><li>'+shortfall+'</li></ul>';
  document.getElementById('if-status').textContent=ifText('localStatus','Factoring scenario calculated locally. No invoice data was sent.');
  output.classList.add('on');output.focus({preventScroll:true});
  var saveBtn=document.querySelector('save-result-button[tool-slug="invoice-factoring"]');
  if(saveBtn&&typeof saveBtn.setData==='function'){
    saveBtn.setData({inputs:{currency:data.currency,invoice:data.invoice,advanceRatePercent:data.advancePct*100,feePercent:data.baseFeePct*100,days:data.days,recourse:data.recourse},outputs:{cashToday:advance,totalFee:totalFee,reserveRelease:reserveRelease,totalReceived:totalReceived,annualizedCostProxyPercent:apr}});
  }
  var shareBtn=document.querySelector('share-result-button[tool-slug="invoice-factoring"]');
  if(shareBtn&&typeof shareBtn.setResult==='function'){
    shareBtn.setResult({headline:ifText('estimate','Invoice factoring estimate'),mainValue:fmt(advance)+' '+ifText('grossAdvance','gross advance'),subValues:[{label:ifText('totalFee','Total fee'),value:fmt(totalFee)},{label:ifText('reserveRelease','Reserve release'),value:fmt(reserveRelease)},{label:ifText('costProxy','Annualized cost proxy'),value:apr.toFixed(2)+'%'}],inputs:{invoice:data.invoice,days:data.days,recourse:data.recourse}});
  }
  return lastFactoringResult;
}
function factoringSummary(){
  var r=lastFactoringResult||calcInvoiceFactoring();
  if(!r)return '';
  return ifText('summaryPrefix','Invoice factoring estimate: invoice')+' '+r.currency+' '+r.invoice.toFixed(2)+', '+ifText('summaryAdvance','gross advance')+' '+r.currency+' '+r.advance.toFixed(2)+', '+ifText('summaryFee','total fee')+' '+r.currency+' '+r.totalFee.toFixed(2)+', '+ifText('summaryReserve','reserve release')+' '+r.currency+' '+r.reserveRelease.toFixed(2)+', '+ifText('summaryReceived','total received')+' '+r.currency+' '+r.totalReceived.toFixed(2)+', '+ifText('summaryCost','annualized cost proxy')+' '+r.apr.toFixed(2)+'%. '+ifText('verify','Verify recourse, debtor notice, fee timing, reserve release, penalties, and tax treatment before signing.');
}
function copyFactoringSummary(){
  var text=factoringSummary();
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){document.getElementById('if-status').textContent=ifText('copied','Summary copied.');});
  }else{
    document.getElementById('if-status').textContent=text;
  }
}
function downloadFactoringCsv(){
  var r=lastFactoringResult||calcInvoiceFactoring();
  if(!r)return;
  var isFr=window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench();
  var rows=isFr
    ? [['indicateur','valeur'],['devise',r.currency],['valeur_facture',r.invoice.toFixed(2)],['taux_avance_pourcentage',(r.advancePct*100).toFixed(2)],['frais_base_pourcentage',(r.baseFeePct*100).toFixed(2)],['type_recours',r.recourse==='nonrecourse'?'sans_recours':'avec_recours'],['jours_encours',r.days],['frais_fixes',r.additional.toFixed(2)],['avance_brute',r.advance.toFixed(2)],['frais_totaux',r.totalFee.toFixed(2)],['reserve_retenue',r.reserve.toFixed(2)],['liberation_reserve_estimee',r.reserveRelease.toFixed(2)],['total_recu',r.totalReceived.toFixed(2)],['cout_pourcentage',r.costPct.toFixed(2)],['indicateur_cout_annualise_pourcentage',r.apr.toFixed(2)]]
    : [['metric','value'],['currency',r.currency],['invoice_value',r.invoice.toFixed(2)],['advance_rate_percent',(r.advancePct*100).toFixed(2)],['base_fee_percent',(r.baseFeePct*100).toFixed(2)],['recourse_type',r.recourse],['days_outstanding',r.days],['flat_fees',r.additional.toFixed(2)],['gross_advance',r.advance.toFixed(2)],['total_fee',r.totalFee.toFixed(2)],['reserve_held',r.reserve.toFixed(2)],['reserve_release_estimate',r.reserveRelease.toFixed(2)],['total_received',r.totalReceived.toFixed(2)],['cost_percent',r.costPct.toFixed(2)],['annualized_cost_proxy_percent',r.apr.toFixed(2)]];
  var csv=rows.map(function(row){return row.map(function(cell){return '"'+String(cell).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download=isFr?'afrotools-affacturage.csv':'afrotools-invoice-factoring.csv';
  a.dataset.noGate='true';
  a.dataset.noPdfGate='true';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  document.getElementById('if-status').textContent=ifText('downloaded','CSV downloaded.');
}
document.getElementById('if-calc').addEventListener('click',calcInvoiceFactoring);
document.getElementById('if-copy').addEventListener('click',copyFactoringSummary);
document.getElementById('if-csv').addEventListener('click',downloadFactoringCsv);

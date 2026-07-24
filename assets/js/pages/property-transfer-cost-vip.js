(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.propertyTransferQuote;
  var config = window.PropertyTransferCostPage || {};
  if (!engine) return;
  var result = null;
  var status = document.getElementById('pt-status');
  var currency = document.getElementById('pt-currency');
  var jurisdiction = document.getElementById('pt-jurisdiction');
  function value(id) { return Number(document.getElementById(id).value); }
  function input() {
    return { purchasePrice:value('pt-price'),transferTax:value('pt-tax'),legalFees:value('pt-legal'),registrationFees:value('pt-registration'),valuationFees:value('pt-valuation'),agentFees:value('pt-agent'),lenderFees:value('pt-lender'),otherCosts:value('pt-other') };
  }
  function money(number) { return new Intl.NumberFormat(config.locale || 'en',{style:'currency',currency:currency.options[currency.selectedIndex].dataset.code,maximumFractionDigits:2}).format(number); }
  function percent(number) { return new Intl.NumberFormat(config.locale || 'en',{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2}).format(number); }
  function set(id,text){document.getElementById(id).textContent=text;}
  function renderHandoff() {
    var key = jurisdiction.value;
    var handoff = config.handoffs[key] || config.handoffs.other;
    set('pt-support-title', handoff.title);
    set('pt-support-copy', handoff.copy);
    var link = document.getElementById('pt-support-link');
    link.hidden = !handoff.href;
    link.style.display = handoff.href ? 'inline-flex' : 'none';
    if (handoff.href) { link.href = handoff.href; link.textContent = handoff.label; }
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      result = engine.reconcile(input());
      set('pt-total',money(result.totalTransferCosts)); set('pt-share',percent(result.transferCostShare)); set('pt-cash',money(result.purchasePlusCosts)); set('pt-coverage',result.quotedLineCount+' / '+engine.costFields.length);
      set('pt-tax-result',money(result.input.transferTax)); set('pt-legal-result',money(result.input.legalFees)); set('pt-registration-result',money(result.input.registrationFees)); set('pt-valuation-result',money(result.input.valuationFees)); set('pt-agent-result',money(result.input.agentFees)); set('pt-lender-result',money(result.input.lenderFees)); set('pt-other-result',money(result.input.otherCosts));
      status.textContent = config.updated;
    } catch (error) { result=null; status.textContent=error.message; }
  }
  function ensure(){if(!result)calculate();return result;}
  function rows(){return [[config.labels.total,money(result.totalTransferCosts)],[config.labels.share,percent(result.transferCostShare)],[config.labels.cash,money(result.purchasePlusCosts)],[config.labels.coverage,result.quotedLineCount+' / '+engine.costFields.length],[config.labels.tax,money(result.input.transferTax)],[config.labels.legal,money(result.input.legalFees)],[config.labels.registration,money(result.input.registrationFees)],[config.labels.valuation,money(result.input.valuationFees)],[config.labels.agent,money(result.input.agentFees)],[config.labels.lender,money(result.input.lenderFees)],[config.labels.other,money(result.input.otherCosts)]];}
  function summary(){return [config.reportTitle].concat(rows().map(function(r){return r[0]+': '+r[1];}),[config.zeroNote,config.disclaimer]).join('\n');}
  function copy(){if(!ensure())return;if(!navigator.clipboard){status.textContent=config.copyUnavailable;return;}navigator.clipboard.writeText(summary()).then(function(){status.textContent=config.copied;}).catch(function(){status.textContent=config.copyUnavailable;});}
  function json(){if(!ensure())return;var payload={schemaVersion:1,tool:'property-transfer-cost',jurisdiction:jurisdiction.value,currency:currency.options[currency.selectedIndex].dataset.code,inputs:result.input,results:{totalTransferCosts:result.totalTransferCosts,transferCostShare:result.transferCostShare,purchasePlusCosts:result.purchasePlusCosts,quotedLineCount:result.quotedLineCount},definitions:engine.formulaParameters};var url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));var link=document.createElement('a');link.href=url;link.download=config.jsonFilename;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);status.textContent=config.downloaded;}
  async function pdf(){if(!ensure())return;try{if(!window.AfroTools||!window.AfroTools.pdf)throw new Error(config.pdfUnavailable);await window.AfroTools.pdf.generate({noGate:true,skipGate:true,title:config.reportTitle,subtitle:config.reportSubtitle,country:config.countryLabel(jurisdiction.value),toolId:'property-transfer-cost',heroStats:rows().slice(0,4).map(function(r,i){return{label:r[0],value:r[1],highlight:i===0};}),sections:[{title:config.breakdownTitle,rows:rows().slice(4).map(function(r){return{label:r[0],value:r[1]};})},{title:config.boundaryTitle,rows:[{label:config.boundaryLabel,value:config.zeroNote}]}],disclaimer:config.disclaimer});status.textContent=config.pdfReady;}catch(error){status.textContent=error.message;}}
  document.getElementById('pt-form').addEventListener('submit',calculate);document.getElementById('pt-form').addEventListener('reset',function(){setTimeout(function(){renderHandoff();calculate();},0);});document.getElementById('pt-form').addEventListener('input',function(){status.textContent=config.changed;});currency.addEventListener('change',calculate);jurisdiction.addEventListener('change',renderHandoff);document.getElementById('pt-copy').addEventListener('click',copy);document.getElementById('pt-json').addEventListener('click',json);document.getElementById('pt-pdf').addEventListener('click',pdf);renderHandoff();calculate();
})();

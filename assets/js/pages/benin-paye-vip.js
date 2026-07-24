(function () {
  'use strict';
  var config = window.BeninPayePage || {};
  var engine = window.AfroTools && window.AfroTools.beninPaye;
  var grossInput = document.getElementById('grossSalary');
  var monthInput = document.getElementById('payMonth');
  var riskInput = document.getElementById('riskRate');
  var results = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var lastResult = null;
  var locale = config.locale || 'en';
  function format(value) { return 'XOF ' + Math.round(Number(value || 0)).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en'); }
  function setText(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function clearResult(message, error) { lastResult = null; results.classList.remove('on'); status.textContent = message; status.classList.toggle('error', Boolean(error)); }
  function calculate() {
    var gross = Number(grossInput.value);
    if (!engine) return clearResult(config.engineError, true);
    if (!Number.isFinite(gross) || gross <= 0) return clearResult(config.validationError, true);
    lastResult = engine.calculate({ grossMonthly: gross, month: monthInput.value, riskRate: Number(riskInput.value) / 100 });
    setText('netMonthly', format(lastResult.netMonthly));
    setText('grossResult', format(lastResult.grossMonthly));
    setText('employeeCnss', format(lastResult.employeeCnssMonthly));
    setText('taxBase', format(lastResult.taxBaseMonthly));
    setText('baseIts', format(lastResult.baseItsMonthly));
    setText('ortbLevy', format(lastResult.ortbLevy));
    setText('itsMonthly', format(lastResult.itsMonthly));
    setText('employerRate', (lastResult.employerRate * 100).toFixed(1) + '%');
    setText('employerCnss', format(lastResult.employerCnssMonthly));
    setText('employerCost', format(lastResult.employerCostMonthly));
    setText('effectiveRate', (lastResult.effectiveDeductionRate * 100).toFixed(1) + '%');
    setText('annualSummary', config.annualSummary(format(lastResult.netAnnual), format(lastResult.itsAnnual), format(lastResult.employeeCnssAnnual), format(lastResult.annualOrtb)));
    results.classList.add('on'); status.classList.remove('error'); status.textContent = config.success;
  }
  function summaryText() { return config.summary({ gross: format(lastResult.grossMonthly), cnss: format(lastResult.employeeCnssMonthly), its: format(lastResult.itsMonthly), levy: format(lastResult.ortbLevy), net: format(lastResult.netMonthly), employerRate: (lastResult.employerRate * 100).toFixed(1) + '%', employerCost: format(lastResult.employerCostMonthly) }); }
  async function copyText(value) { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value); var area=document.createElement('textarea'); area.value=value; area.setAttribute('readonly',''); area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn').addEventListener('click', function () { grossInput.value=''; monthInput.value='standard'; riskInput.value='1'; clearResult(config.cleared,false); grossInput.focus(); });
  [grossInput,monthInput,riskInput].forEach(function(input){ input.addEventListener('input',function(){ if(lastResult) clearResult(config.changed,false); }); input.addEventListener('keydown',function(event){ if(event.key==='Enter') calculate(); }); });
  document.getElementById('copyBtn').addEventListener('click',async function(){ if(!lastResult)return; await copyText(summaryText()); status.textContent=config.copied; });
  document.getElementById('shareBtn').addEventListener('click',async function(){ var data={title:config.shareTitle,url:config.canonical}; if(navigator.share) await navigator.share(data); else {await copyText(data.url); status.textContent=config.linkCopied;} });
  document.getElementById('pdfBtn').addEventListener('click',async function(){
    if(!lastResult)return; if(!window.AfroTools||!window.AfroTools.pdf){status.textContent=config.pdfLoading;return;}
    await window.AfroTools.pdf.generate({filename:config.pdfFilename,title:config.pdfTitle,subtitle:config.pdfSubtitle,country:'Benin',currency:'XOF',summary:[{label:config.labels.gross,value:format(lastResult.grossMonthly)},{label:config.labels.cnss,value:format(lastResult.employeeCnssMonthly)},{label:config.labels.its,value:format(lastResult.itsMonthly)},{label:config.labels.net,value:format(lastResult.netMonthly)}],sections:[{heading:config.labels.taxBuild,rows:[[config.labels.taxBase,format(lastResult.taxBaseMonthly)],[config.labels.baseIts,format(lastResult.baseItsMonthly)],[config.labels.levy,format(lastResult.ortbLevy)]]},{heading:config.labels.employer,rows:[[config.labels.employerRate,(lastResult.employerRate*100).toFixed(1)+'%'],[config.labels.employerCost,format(lastResult.employerCostMonthly)]]},{heading:config.labels.source,rows:[[config.labels.checked,'Benin CGI 2025 Articles 119-129; CNSS Benin contribution rules - 22 July 2026'],[config.labels.use,config.planningDisclaimer]]}],skipGate:true});
    status.textContent=config.pdfReady;
  });
}());

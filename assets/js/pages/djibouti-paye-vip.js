(function () {
  'use strict';
  var copy = window.DjiboutiPayePage || {};
  var engine = window.AfroTools && window.AfroTools.djiboutiPaye;
  var gross = document.getElementById('grossSalary');
  var employmentType = document.getElementById('employmentType');
  var resultCard = document.getElementById('resultsCard');
  var status = document.getElementById('status');
  var result = null;
  function money(value) { return 'DJF ' + Math.round(Number(value || 0)).toLocaleString(copy.numberLocale || 'en'); }
  function set(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function reset(message, error) { result = null; resultCard.classList.remove('on'); status.textContent = message; status.classList.toggle('error', Boolean(error)); }
  function calculate() {
    if (!engine) return reset(copy.engineError, true);
    var value = Number(gross.value);
    if (!Number.isFinite(value) || value <= 0) return reset(copy.validationError, true);
    result = engine.calculate({ grossMonthly: value, employmentType: employmentType.value });
    set('netMonthly', money(result.netMonthly)); set('grossResult', money(result.grossMonthly)); set('employeeCnss', money(result.employeeCnssMonthly));
    set('contributionBase', money(result.contributionBase)); set('taxableIncome', money(result.taxableIncome)); set('roundedTaxableIncome', money(result.roundedTaxableIncome)); set('itsMonthly', money(result.itsMonthly));
    set('effectiveRate', (result.effectiveDeductionRate * 100).toFixed(1) + '%'); set('employerCnss', money(result.employerCnssMonthly)); set('employerCost', money(result.employerCostMonthly));
    set('annualSummary', copy.annualSummary(money(result.netAnnual), money(result.itsAnnual), money(result.employeeCnssAnnual), money(result.employerCnssAnnual)));
    resultCard.classList.add('on'); status.classList.remove('error'); status.textContent = copy.success;
  }
  async function clipboard(text) { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text); var f=document.createElement('textarea');f.value=text;f.setAttribute('readonly','');f.style.position='fixed';f.style.opacity='0';document.body.appendChild(f);f.select();document.execCommand('copy');f.remove(); }
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn').addEventListener('click', function () { gross.value='';employmentType.value='professional';reset(copy.cleared,false);gross.focus(); });
  [gross,employmentType].forEach(function(node){node.addEventListener('input',function(){if(result)reset(copy.changed,false);});node.addEventListener('keydown',function(event){if(event.key==='Enter')calculate();});});
  document.getElementById('copyBtn').addEventListener('click',async function(){if(!result)return;await clipboard(copy.summary({gross:money(result.grossMonthly),cnss:money(result.employeeCnssMonthly),tax:money(result.itsMonthly),net:money(result.netMonthly),employer:money(result.employerCostMonthly)}));status.textContent=copy.copied;});
  document.getElementById('shareBtn').addEventListener('click',async function(){var payload={title:copy.shareTitle,url:copy.canonical};if(navigator.share)await navigator.share(payload);else{await clipboard(payload.url);status.textContent=copy.linkCopied;}});
  document.getElementById('pdfBtn').addEventListener('click',async function(){if(!result)return;if(!(window.AfroTools&&window.AfroTools.pdf)){status.textContent=copy.pdfLoading;return;}await window.AfroTools.pdf.generate({filename:copy.pdfFilename,title:copy.pdfTitle,subtitle:copy.pdfSubtitle,country:'Djibouti',currency:'DJF',summary:[{label:copy.labels.net,value:money(result.netMonthly)},{label:copy.labels.gross,value:money(result.grossMonthly)},{label:copy.labels.cnss,value:money(result.employeeCnssMonthly)},{label:copy.labels.tax,value:money(result.itsMonthly)}],sections:[{heading:copy.labels.taxBuild,rows:[[copy.labels.contributionBase,money(result.contributionBase)],[copy.labels.taxable,money(result.taxableIncome)],[(copy.labels.roundedTaxable||copy.labels.taxable),money(result.roundedTaxableIncome)],[copy.labels.effective,(result.effectiveDeductionRate*100).toFixed(1)+'%']]},{heading:copy.labels.employer,rows:[[copy.labels.employerCnss,money(result.employerCnssMonthly)],[copy.labels.employerCost,money(result.employerCostMonthly)]]},{heading:copy.labels.source,rows:[[copy.labels.checked,'Djibouti Finance Law 2022 Article 7; CGI Articles 6 and 14; CNSS contribution rules - 22 July 2026'],[copy.labels.use,copy.planningDisclaimer]]}],skipGate:true});status.textContent=copy.pdfReady;});
}());

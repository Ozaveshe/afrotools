(function () {
  'use strict';
  var cfg = window.MortgagePlannerPage || {};
  document.body.classList.add('mortgage-planner-page');
  var engine = window.AfroTools && window.AfroTools.mortgagePlanner;
  var form = document.getElementById('mortgageForm');
  if (!form || !engine) return;
  var latest = null;
  function el(id) { return document.getElementById(id); }
  function n(id) { return Number(el(id).value); }
  function money(value) {
    try { return new Intl.NumberFormat(cfg.numberLocale || 'en', { style: 'currency', currency: el('currency').value, maximumFractionDigits: 2 }).format(value); }
    catch (_) { return el('currency').value + ' ' + Number(value || 0).toLocaleString(cfg.numberLocale || 'en', { maximumFractionDigits: 2 }); }
  }
  function pct(value) { return Number(value || 0).toLocaleString(cfg.numberLocale || 'en', { maximumFractionDigits: 2 }) + '%'; }
  function pdfMoney(value) { return el('currency').value + ' ' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function status(message, error) { el('status').textContent = message; el('status').classList.toggle('error', !!error); }
  function read() { return { propertyPrice:n('propertyPrice'),deposit:n('deposit'),annualRate:n('annualRate'),termYears:n('termYears'),upfrontCosts:n('upfrontCosts'),monthlyCosts:n('monthlyCosts'),stressIncrease:n('stressIncrease'),confirmedAssumptions:el('confirmedAssumptions').checked }; }
  function render(result) {
    latest = result;
    el('monthlyResult').textContent = money(result.allInMonthly);
    el('piResult').textContent = money(result.monthlyPrincipalInterest);
    el('loanResult').textContent = money(result.principal);
    el('interestResult').textContent = money(result.totalInterest);
    el('totalResult').textContent = money(result.totalAllInPayments);
    el('upfrontResult').textContent = money(result.upfrontCash);
    el('ltvResult').textContent = pct(result.ltv);
    el('tipResult').textContent = pct(result.tip);
    el('fiveYearResult').textContent = money(result.comparisonPayments);
    el('fiveYearPrincipalResult').textContent = money(result.comparisonPrincipal);
    el('stressResult').textContent = money(result.stressMonthly);
    el('stressDeltaResult').textContent = money(result.stressDelta);
    el('stressRateResult').textContent = pct(result.stressRate);
    el('scheduleRows').innerHTML = result.schedule.map(function (row) { return '<tr><td>'+cfg.year+' '+row.year+'</td><td>'+money(row.principalPaid)+'</td><td>'+money(row.interestPaid)+'</td><td>'+money(row.balance)+'</td></tr>'; }).join('');
    el('resultsCard').classList.add('on');
    status(cfg.success, false);
  }
  function summary() { return [cfg.pdfTitle, cfg.labels.monthly+': '+money(latest.allInMonthly), cfg.labels.pi+': '+money(latest.monthlyPrincipalInterest), cfg.labels.loan+': '+money(latest.principal), cfg.labels.interest+': '+money(latest.totalInterest), cfg.labels.total+': '+money(latest.totalAllInPayments), cfg.labels.upfront+': '+money(latest.upfrontCash), 'LTV: '+pct(latest.ltv), 'TIP: '+pct(latest.tip), cfg.labels.stress+': '+money(latest.stressMonthly)+' @ '+pct(latest.stressRate), cfg.sourceNote].join('\n'); }
  form.addEventListener('submit', function (event) { event.preventDefault(); try { render(engine.calculate(read())); el('resultsCard').focus(); } catch (error) { latest=null; el('resultsCard').classList.remove('on'); status((cfg.errors && cfg.errors[error.message]) || error.message, true); } });
  form.addEventListener('input', function () { if (latest) status(cfg.changed, false); });
  el('clearBtn').addEventListener('click', function () { form.reset(); latest=null; el('resultsCard').classList.remove('on'); status(cfg.cleared, false); });
  el('copyBtn').addEventListener('click', function () { if (!latest) return; navigator.clipboard.writeText(summary()).then(function(){status(cfg.copied,false);}).catch(function(){status(cfg.copyError,true);}); });
  el('shareBtn').addEventListener('click', function () {
    var payload={title:cfg.shareTitle,url:cfg.canonical};
    if(navigator.share) navigator.share(payload).then(function(){status(cfg.linkShared,false);}).catch(function(){status(cfg.shareError,true);});
    else navigator.clipboard.writeText(cfg.canonical).then(function(){status(cfg.linkCopied,false);}).catch(function(){status(cfg.shareError,true);});
  });
  el('pdfBtn').addEventListener('click', function () {
    if (!latest) return;
    try {
      var JsPdf = window.jspdf && window.jspdf.jsPDF;
      if (!JsPdf) throw new Error('runtime');
      var doc = new JsPdf({unit:'mm',format:'a4'}), y=18;
      doc.setProperties({title:cfg.pdfTitle,subject:cfg.pdfSubtitle,creator:'AfroTools'});
      doc.setFillColor(16,42,64); doc.rect(0,0,210,38,'F'); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.text('AfroTools',16,15); doc.setFontSize(15); doc.text(cfg.pdfTitle,16,27);
      doc.setTextColor(19,32,51); y=50; doc.setFontSize(10); doc.setFont('helvetica','normal');
      var rows=[[cfg.labels.price,pdfMoney(latest.propertyPrice)],[cfg.labels.deposit,pdfMoney(latest.deposit)],[cfg.labels.loan,pdfMoney(latest.principal)],[cfg.labels.rate,latest.annualRate.toFixed(2)+'%'],[cfg.labels.term,String(latest.termYears)+' '+cfg.years],[cfg.labels.monthly,pdfMoney(latest.allInMonthly)],[cfg.labels.pi,pdfMoney(latest.monthlyPrincipalInterest)],[cfg.labels.interest,pdfMoney(latest.totalInterest)],[cfg.labels.total,pdfMoney(latest.totalAllInPayments)],[cfg.labels.upfront,pdfMoney(latest.upfrontCash)],['LTV',latest.ltv.toFixed(2)+'%'],['TIP',latest.tip.toFixed(2)+'%'],[cfg.labels.stress,pdfMoney(latest.stressMonthly)+' @ '+latest.stressRate.toFixed(2)+'%']];
      rows.forEach(function(row){doc.setTextColor(95,111,130);doc.text(row[0],18,y);doc.setTextColor(19,32,51);doc.setFont('helvetica','bold');doc.text(row[1],192,y,{align:'right'});doc.setFont('helvetica','normal');doc.setDrawColor(216,225,233);doc.line(18,y+3,192,y+3);y+=10;});
      doc.setFillColor(255,248,232);doc.roundedRect(18,y+2,174,27,2,2,'F');doc.setTextColor(85,63,24);doc.setFontSize(8);doc.text(doc.splitTextToSize(cfg.pdfDisclaimer,162),24,y+11);y+=38;
      doc.setTextColor(95,111,130);doc.text(cfg.sourceNote,18,y);doc.text('Generated '+new Date().toISOString().slice(0,10),18,y+7);
      var blob=doc.output('blob'), url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=cfg.pdfFilename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
      window.dispatchEvent(new CustomEvent('afro-pdf-generated',{detail:{blob:blob,fileName:cfg.pdfFilename,toolSlug:'mortgage-calculator'}}));status(cfg.pdfReady,false);
    } catch (_) { status(cfg.pdfError,true); }
  });
})();

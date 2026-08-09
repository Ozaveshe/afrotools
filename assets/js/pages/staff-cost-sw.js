(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.staffCostPlanner;
  if (!engine) return;
  var result = null;
  var status = document.getElementById('scp-status');
  var currency = 'USD';
  function number(id) { return Number(document.getElementById(id).value || 0); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function input() {
    return {
      currency: document.getElementById('scp-currency').value,
      headcount: number('scp-headcount'),
      horizonMonths: number('scp-horizon'),
      monthlySalary: number('scp-salary'),
      monthlyEmployerObligations: number('scp-obligations'),
      monthlyBenefits: number('scp-benefits'),
      monthlyOtherRecurring: number('scp-recurring'),
      recruitmentCost: number('scp-recruitment'),
      equipmentCost: number('scp-equipment'),
      annualExtras: number('scp-annual-extras'),
      contingencyPercent: number('scp-contingency'),
      sourceLabel: document.getElementById('scp-source-label').value,
      sourceCheckedDate: document.getElementById('scp-source-date').value,
      asOfDate: today(),
      employeeStatusConfirmed: document.getElementById('scp-status-confirm').checked,
      obligationEvidenceConfirmed: document.getElementById('scp-source-confirm').checked
    };
  }
  function money(value) {
    try { return new Intl.NumberFormat('sw', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(value); }
    catch (_) { return currency + ' ' + Number(value).toLocaleString('sw', { maximumFractionDigits: 2 }); }
  }
  function metric(label, value) { return '<div class="scp-metric"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
  function rows() {
    return [
      ['Mishahara kwa muda wote', money(result.salaryForHorizon)],
      ['Wajibu wa mwajiri kwa mtu kwa mwezi', money(result.perPerson.employerObligations)],
      ['Manufaa na bima kwa mtu kwa mwezi', money(result.perPerson.benefits)],
      ['Gharama nyingine za kila mwezi kwa mtu', money(result.perPerson.otherRecurring)],
      ['Gharama ya timu kila mwezi', money(result.teamRecurringMonthly)],
      ['Uajiri na vifaa', money(result.oneOffTeam)],
      ['Manufaa ya mwaka ndani ya muda', money(result.annualExtrasForHorizon)],
      ['Akiba ya mipango (' + result.contingencyPercent.toFixed(2) + '%)', money(result.contingency)],
      ['Jumla ya bajeti ya wafanyakazi', money(result.horizonTotal)]
    ];
  }
  function errorMessage(message) {
    if (/three-letter currency/.test(message)) return 'Ingiza msimbo wa sarafu wenye herufi tatu, kwa mfano KES, TZS, UGX au ZAR.';
    if (/Headcount/.test(message)) return 'Idadi ya wafanyakazi lazima iwe namba kamili kati ya 1 na 100,000.';
    if (/Planning horizon/.test(message)) return 'Muda wa mpango lazima uwe miezi kamili 1 hadi 60.';
    if (/reviewed as employment/.test(message)) return 'Thibitisha kuwa uhusiano wa kazi ulikaguliwa kama ajira kabla ya kukokotoa.';
    if (/employer-obligation amount/.test(message) || /current authority/.test(message)) return 'Thibitisha kuwa wajibu wa mwajiri unatokana na chanzo cha sasa cha mamlaka, mishahara au mtaalamu.';
    if (/Name the authority/.test(message)) return 'Taja mamlaka, ratiba ya mishahara au chanzo cha mtaalamu kilichotumika.';
    if (/valid date/.test(message)) return 'Ingiza tarehe halali ya chanzo.';
    if (/cannot be after/.test(message)) return 'Tarehe ya chanzo haiwezi kuwa baada ya tarehe ya kukokotoa.';
    if (/over one year old/.test(message)) return 'Chanzo cha wajibu wa mwajiri kina zaidi ya mwaka mmoja. Kikague tena kabla ya kukokotoa.';
    if (/greater than zero/.test(message)) return 'Mshahara wa kila mwezi lazima uwe zaidi ya sifuri.';
    if (/must not exceed 100/.test(message)) return 'Akiba ya mipango haiwezi kuzidi 100%.';
    if (/zero or more/.test(message)) return 'Kiasi hiki lazima kiwe sifuri au zaidi.';
    return 'Kagua data na ushahidi ulioweka kabla ya kutumia matokeo.';
  }
  function render() {
    document.getElementById('scp-total').textContent = money(result.horizonTotal);
    document.getElementById('scp-result-note').textContent = result.headcount + ' wafanyakazi kwa miezi ' + result.horizonMonths + '. Chanzo kilikaguliwa siku ' + result.sourceAgeDays + ' zilizopita.';
    document.getElementById('scp-metrics').innerHTML = metric('Wastani wa mpango kwa mwezi', money(result.monthlyPlanningAverage)) + metric('Gharama ya kila mwezi kwa mtu', money(result.perPerson.recurringMonthly)) + metric('Gharama kwa mtu kwa muda wote', money(result.costPerPersonForHorizon)) + metric('Gharama juu ya mshahara', money(result.loadAboveSalary) + ' (' + result.loadPercent.toFixed(2) + '%)');
    document.getElementById('scp-breakdown').innerHTML = rows().map(function (row) { return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td></tr>'; }).join('');
    document.getElementById('scp-evidence').textContent = 'Ushahidi uliotumika: ' + result.sourceLabel + ' — ulikaguliwa ' + result.sourceCheckedDate + '. Jina hili huingia kwenye faili za ndani lakini halihifadhiwi na AfroTools.';
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try { result = engine.calculate(input()); currency = result.currency; render(); status.textContent = 'Bajeti iko tayari. Data haijaondoka kwenye kivinjari hiki.'; }
    catch (error) { result = null; document.getElementById('scp-total').textContent = 'Hakuna bajeti'; document.getElementById('scp-result-note').textContent = 'Tatua ujumbe wa ushahidi kabla ya kutumia namba.'; document.getElementById('scp-metrics').innerHTML = ''; document.getElementById('scp-breakdown').innerHTML = ''; document.getElementById('scp-evidence').textContent = ''; status.textContent = errorMessage(error.message); }
  }
  function summary() { return ['Muhtasari wa gharama za wafanyakazi', result.headcount + ' wafanyakazi — miezi ' + result.horizonMonths, 'Sarafu: ' + result.currency].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }), ['Ushahidi: ' + result.sourceLabel + ' (ulikaguliwa ' + result.sourceCheckedDate + ')', 'Kikomo: mpango wa mwajiri tu; hakuna PAYE, mshahara halisi, uamuzi wa hadhi ya mfanyakazi, kuachishwa kazi, uwasilishaji au ushauri wa kisheria.']).join('\n'); }
  function copy() { if (!result) calculate(); if (!result) return; if (!navigator.clipboard) { status.textContent = 'Kunakili hakupatikani kwenye kivinjari hiki.'; return; } navigator.clipboard.writeText(summary()).then(function () { status.textContent = 'Muhtasari umenakiliwa ndani ya kifaa.'; }).catch(function () { status.textContent = 'Kunakili kumeshindikana.'; }); }
  function csvCell(cell) { var text = String(cell); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
  function csv() { if (!result) calculate(); if (!result) return; var data = [['Muhtasari wa gharama za wafanyakazi'], ['Idadi ya wafanyakazi', result.headcount], ['Muda wa mpango kwa miezi', result.horizonMonths], ['Sarafu', result.currency], ['Chanzo cha ushahidi', result.sourceLabel], ['Tarehe ya chanzo', result.sourceCheckedDate]].concat(rows()); var content = '\uFEFF' + data.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n'); var url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); var a = document.createElement('a'); a.href = url; a.download = 'bajeti-ya-wafanyakazi.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); status.textContent = 'CSV imepakuliwa ndani ya kifaa.'; }
  async function pdf() { if (!result) calculate(); if (!result) return; if (!window.AfroTools || !window.AfroTools.pdf) { status.textContent = 'Maktaba ya PDF haipatikani.'; return; } await window.AfroTools.pdf.generate({ noGate: true, skipGate: true, title: 'Muhtasari wa Gharama za Wafanyakazi', subtitle: result.headcount + ' wafanyakazi — miezi ' + result.horizonMonths, toolId: 'staff-cost', country: 'Mpango wa mwajiri kwa ushahidi wa mtumiaji', heroStats: [{ label: 'Jumla ya bajeti', value: money(result.horizonTotal), highlight: true }, { label: 'Wastani kwa mwezi', value: money(result.monthlyPlanningAverage) }, { label: 'Gharama kwa mtu', value: money(result.perPerson.recurringMonthly) }, { label: 'Juu ya mshahara', value: result.loadPercent.toFixed(2) + '%' }], sections: [{ title: 'Mgawanyo wa bajeti', rows: rows().slice(0, -1).map(function (row) { return { label: row[0], value: row[1] }; }) }, { title: 'Kikomo cha ushahidi', rows: [{ label: 'Jina la chanzo', value: result.sourceLabel }, { label: 'Chanzo kilikaguliwa', value: result.sourceCheckedDate }, { label: 'Hadhi ya ajira', value: 'Mtumiaji amethibitisha ukaguzi' }] }], source: 'Makundi ya gharama yanafuata muktadha wa IAS 19. Mtumiaji hutoa na kuthibitisha wajibu wa mwajiri na sheria ya sasa.', disclaimer: 'Makadirio ya kupanga tu. Hayakokotoi PAYE au mshahara halisi, hayaamui hadhi ya mfanyakazi, dhima ya kuachishwa kazi, uwasilishaji, wala ushauri wa kodi au sheria.' }); status.textContent = 'PDF imetengenezwa ndani ya kifaa.'; }
  document.getElementById('scp-form').addEventListener('submit', calculate);
  document.getElementById('scp-form').addEventListener('reset', function () { setTimeout(function () { document.getElementById('scp-source-date').value = today(); result = null; document.getElementById('scp-total').textContent = 'Hakuna bajeti'; status.textContent = 'Data imefutwa.'; }, 0); });
  document.getElementById('scp-copy').addEventListener('click', copy);
  document.getElementById('scp-csv').addEventListener('click', csv);
  document.getElementById('scp-pdf').addEventListener('click', pdf);
  document.getElementById('scp-source-date').value = today();
  calculate();
})();

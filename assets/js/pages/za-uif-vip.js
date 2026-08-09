(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.zaUif;
  if (!engine) return;
  var requestedLocale = document.body.getAttribute('data-locale');
  var locale = requestedLocale === 'fr' || requestedLocale === 'sw' ? requestedLocale : 'en';
  var latestMemo = '';
  var copyButton = document.getElementById('uif-copy');
  var status = document.getElementById('uif-status');
  var initializing = true;

  var text = {
    en: {
      employee: 'Employee monthly', employer: 'Employer monthly', combined: 'Combined monthly', period: 'Team / period total',
      base: 'Contribution base', cap: 'The official R17,712 monthly ceiling was applied.', noCap: 'The remuneration is below the official monthly ceiling.',
      estimate: 'Planning estimate', days: 'Planning days', rate: 'Sliding replacement rate', daily: 'Daily income used',
      first: 'Days at sliding rate', second: 'Days at 20% rate', benefitWarning: 'UIF decides eligibility, verified credit days, claim dates and the approved amount. This estimate is not a claim decision.',
      maternityDaily: 'Daily maternity estimate', employerPay: 'Employer pay entered', maternityWarning: 'Maternity planning uses 66% of the capped benefit basis for up to 121 days, then limits the top-up so employer pay plus this estimate does not exceed the actual normal remuneration entered. UIF makes the final decision.',
      copied: 'Summary copied.', copyFail: 'Copy is unavailable in this browser.', invalid: 'Enter valid amounts within the displayed limits.', ready: 'Estimate ready. No input left this browser.', changed: 'Inputs changed. Calculate again.', reset: 'Calculator reset.',
      contributionMemo: 'South Africa UIF contribution estimate', benefitMemo: 'South Africa UIF benefit planning estimate', sourceDate: '9 August 2026'
    },
    fr: {
      employee: 'Part salariée mensuelle', employer: 'Part employeur mensuelle', combined: 'Total mensuel', period: 'Total équipe / période',
      base: 'Base de cotisation', cap: 'Le plafond mensuel officiel de R17 712 a été appliqué.', noCap: 'La rémunération est inférieure au plafond mensuel officiel.',
      estimate: 'Estimation de planification', days: 'Jours de planification', rate: 'Taux de remplacement dégressif', daily: 'Revenu journalier utilisé',
      first: 'Jours au taux dégressif', second: 'Jours au taux de 20 %', benefitWarning: "L'UIF détermine l'éligibilité, les jours de crédit vérifiés, les dates et le montant approuvé. Cette estimation n'est pas une décision de demande.",
      maternityDaily: 'Estimation maternité journalière', employerPay: 'Salaire employeur saisi', maternityWarning: "La planification maternité applique 66 % à la base de prestation plafonnée pendant 121 jours maximum, puis limite le complément pour que le salaire employeur et l'estimation ne dépassent pas la rémunération normale réelle saisie. L'UIF décide du montant final.",
      copied: 'Résumé copié.', copyFail: "La copie n'est pas disponible dans ce navigateur.", invalid: 'Saisissez des montants valides dans les limites affichées.', ready: 'Estimation prête. Aucune donnée n’a quitté ce navigateur.', changed: 'Données modifiées. Recalculez.', reset: 'Calculateur réinitialisé.',
      contributionMemo: 'Estimation des cotisations UIF en Afrique du Sud', benefitMemo: 'Estimation de planification des prestations UIF en Afrique du Sud', sourceDate: '9 août 2026'
    },
    sw: {
      employee: 'Sehemu ya mfanyakazi kwa mwezi', employer: 'Sehemu ya mwajiri kwa mwezi', combined: 'Jumla ya mwezi', period: 'Jumla ya timu na kipindi',
      base: 'Msingi wa mchango', cap: 'Kikomo rasmi cha R17,712 kwa mwezi kimetumika.', noCap: 'Malipo yako chini ya kikomo rasmi cha mwezi.',
      estimate: 'Makadirio ya kupanga', days: 'Siku za kupanga', rate: 'Kiwango cha mapato mbadala', daily: 'Mapato ya siku yaliyotumika',
      first: 'Siku za kiwango kinachobadilika', second: 'Siku za kiwango cha 20%', benefitWarning: 'UIF huamua ustahiki, siku za mikopo zilizothibitishwa, tarehe za dai na kiasi kinachoidhinishwa. Haya si maamuzi ya dai.',
      maternityDaily: 'Makadirio ya uzazi kwa siku', employerPay: 'Malipo ya mwajiri yaliyowekwa', maternityWarning: 'Mpango wa uzazi hutumia 66% ya msingi wa mafao wenye kikomo kwa siku zisizozidi 121, kisha hupunguza nyongeza ili malipo ya mwajiri pamoja na makadirio haya yasizidi malipo ya kawaida uliyoweka. UIF hufanya uamuzi wa mwisho.',
      copied: 'Muhtasari umenakiliwa.', copyFail: 'Kunakili hakupatikani kwenye kivinjari hiki.', invalid: 'Weka kiasi halali ndani ya mipaka iliyoonyeshwa.', ready: 'Makadirio yako tayari. Hakuna taarifa iliyoondoka kwenye kivinjari hiki.', changed: 'Taarifa imebadilika. Kokotoa tena.', reset: 'Kikokotoo kimerudishwa mwanzo.',
      contributionMemo: 'Makadirio ya michango ya UIF Afrika Kusini', benefitMemo: 'Makadirio ya kupanga mafao ya UIF Afrika Kusini', sourceDate: '9 Agosti 2026'
    }
  }[locale];

  function number(id) { return Number(document.getElementById(id).value); }
  function money(value) { return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : locale === 'sw' ? 'sw-ZA' : 'en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(value); }
  function decimal(value, digits) { return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : locale === 'sw' ? 'sw-ZA' : 'en-ZA', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value); }
  function metric(label, value) { return '<div class="uif-metric"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
  function clearResults(message) {
    document.querySelectorAll('.uif-results').forEach(function (node) { node.innerHTML = ''; });
    latestMemo = '';
    if (message) status.textContent = message;
  }
  function validForm(form) {
    var invalid = Array.from(form.querySelectorAll('input')).find(function (input) {
      var value = Number(input.value);
      return !Number.isFinite(value) || (input.min !== '' && value < Number(input.min)) || (input.max !== '' && value > Number(input.max));
    });
    if (!invalid) return true;
    clearResults();
    status.textContent = text.invalid;
    invalid.focus();
    return false;
  }
  function finish(resultId) {
    status.textContent = text.ready;
    var result = document.getElementById(resultId);
    result.setAttribute('tabindex', '-1');
    if (!initializing) result.focus({ preventScroll: true });
  }

  function showContribution(event) {
    if (event) event.preventDefault();
    if (!validForm(document.getElementById('uif-contribution-form'))) return;
    try {
      var result = engine.calculateContribution({ monthlyRemuneration: number('uif-remuneration'), employees: number('uif-employees'), months: number('uif-months') });
      document.getElementById('uif-contribution-results').innerHTML =
        '<div class="uif-metrics">' + metric(text.employee, money(result.employeeMonthly)) + metric(text.employer, money(result.employerMonthly)) + metric(text.combined, money(result.combinedMonthly)) + metric(text.period, money(result.teamPeriodTotal)) + '</div>' +
        '<p class="uif-result-note"><strong>' + text.base + ': ' + money(result.contributionBase) + '.</strong> ' + (result.ceilingApplied ? text.cap : text.noCap) + '</p>';
      latestMemo = [text.contributionMemo, text.base + ': ' + money(result.contributionBase), text.employee + ': ' + money(result.employeeMonthly), text.employer + ': ' + money(result.employerMonthly), text.combined + ': ' + money(result.combinedMonthly), text.period + ': ' + money(result.teamPeriodTotal), 'SARS UIF | ' + text.sourceDate].join('\n');
      finish('uif-contribution-results');
    } catch (error) { status.textContent = text.invalid; }
  }

  function showBenefit(event) {
    if (event) event.preventDefault();
    if (!validForm(document.getElementById('uif-benefit-form'))) return;
    try {
      var result = engine.calculateBenefitPlan({ averageMonthlyRemuneration: number('uif-average'), availableCreditDays: number('uif-credits'), requestedDays: number('uif-requested') });
      document.getElementById('uif-benefit-results').innerHTML =
        '<div class="uif-metrics">' + metric(text.estimate, money(result.estimatedBenefit)) + metric(text.days, String(result.payableDays)) + metric(text.rate, decimal(result.replacementRatePercent, 2) + '%') + metric(text.daily, money(result.dailyIncome)) + metric(text.first, String(result.slidingTierDays)) + metric(text.second, String(result.secondTierDays)) + '</div>' +
        '<p class="uif-warning"><strong>' + text.benefitWarning + '</strong></p>';
      latestMemo = [text.benefitMemo, text.estimate + ': ' + money(result.estimatedBenefit), text.days + ': ' + result.payableDays, text.rate + ': ' + decimal(result.replacementRatePercent, 2) + '%', text.first + ': ' + result.slidingTierDays, text.second + ': ' + result.secondTierDays, text.benefitWarning, 'UIF Easy Aid Guide | ' + text.sourceDate].join('\n');
      finish('uif-benefit-results');
    } catch (error) { status.textContent = text.invalid; }
  }

  function showMaternity(event) {
    if (event) event.preventDefault();
    if (!validForm(document.getElementById('uif-maternity-form'))) return;
    try {
      var result = engine.calculateMaternityPlan({ averageMonthlyRemuneration: number('uif-maternity-average'), employerMonthlyPay: number('uif-employer-pay'), requestedDays: number('uif-maternity-days') });
      document.getElementById('uif-maternity-results').innerHTML =
        '<div class="uif-metrics">' + metric(text.estimate, money(result.estimatedBenefit)) + metric(text.days, String(result.payableDays)) + metric(text.maternityDaily, money(result.dailyBenefit)) + metric(text.employerPay, money(result.employerMonthlyPay)) + '</div>' +
        '<p class="uif-warning"><strong>' + text.maternityWarning + '</strong></p>';
      latestMemo = [text.benefitMemo, text.estimate + ': ' + money(result.estimatedBenefit), text.days + ': ' + result.payableDays, text.maternityDaily + ': ' + money(result.dailyBenefit), text.employerPay + ': ' + money(result.employerMonthlyPay), text.maternityWarning, 'UIF maternity benefits | ' + text.sourceDate].join('\n');
      finish('uif-maternity-results');
    } catch (error) { status.textContent = text.invalid; }
  }

  function activateTab(button) {
    document.querySelectorAll('.uif-tab').forEach(function (tab) { tab.setAttribute('aria-selected', String(tab === button)); });
    document.querySelectorAll('.uif-panel').forEach(function (panel) { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
  }

  document.querySelectorAll('.uif-tab').forEach(function (button, index, buttons) {
    button.addEventListener('click', function () { activateTab(button); });
    button.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      var next = (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); activateTab(buttons[next]);
    });
  });
  document.getElementById('uif-contribution-form').addEventListener('submit', showContribution);
  document.getElementById('uif-benefit-form').addEventListener('submit', showBenefit);
  document.getElementById('uif-maternity-form').addEventListener('submit', showMaternity);
  document.querySelectorAll('.uif-form-grid').forEach(function (form) {
    form.addEventListener('input', function () { if (latestMemo) clearResults(text.changed); });
  });
  document.querySelectorAll('[data-uif-reset]').forEach(function (button) {
    button.addEventListener('click', function () {
      var form = document.getElementById(button.getAttribute('data-uif-reset'));
      form.reset();
      clearResults(text.reset);
      form.querySelector('input').focus();
    });
  });
  document.getElementById('uif-example-contribution').addEventListener('click', function () {
    document.getElementById('uif-remuneration').value = '25000'; document.getElementById('uif-employees').value = '8'; document.getElementById('uif-months').value = '1'; showContribution();
  });
  document.getElementById('uif-example-benefit').addEventListener('click', function () {
    document.getElementById('uif-average').value = '12000'; document.getElementById('uif-credits').value = '260'; document.getElementById('uif-requested').value = '260'; showBenefit();
  });
  document.getElementById('uif-example-maternity').addEventListener('click', function () {
    document.getElementById('uif-maternity-average').value = '12000'; document.getElementById('uif-employer-pay').value = '5000'; document.getElementById('uif-maternity-days').value = '121'; showMaternity();
  });
  copyButton.addEventListener('click', function () {
    if (!latestMemo) showContribution();
    if (!navigator.clipboard || !navigator.clipboard.writeText) { status.textContent = text.copyFail; return; }
    navigator.clipboard.writeText(latestMemo).then(function () { status.textContent = text.copied; }).catch(function () { status.textContent = text.copyFail; });
  });
  showContribution();
  initializing = false;
})();

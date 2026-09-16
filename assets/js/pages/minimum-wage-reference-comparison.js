(function () {
  'use strict';
  const E = window.AfroTools && window.AfroTools.MinWageEngine;
  const salary = document.getElementById('compliance-salary');
  if (!E || !salary) return;
  const sw = document.documentElement.lang === 'sw';
  const $ = id => document.getElementById(id);
  const copy = sw ? {
    invalid:'Weka mshahara wa mwezi ulio halali, sifuri au zaidi.',
    missing:'Hakuna kiwango kinachoweza kulinganishwa katika rekodi hii. Hakiki sheria na sekta husika; kutokuwepo kwa rekodi hakuthibitishi kwamba hakuna kima cha chini.',
    above:'Mshahara unafikia kiwango cha rejea kilichochaguliwa', below:'Mshahara uko chini ya kiwango cha rejea kilichochaguliwa',
    national:'Kiwango cha taifa kilichorekodiwa', salary:'Mshahara kwa mwezi', reference:'Rejea kwa mwezi', difference:'Tofauti',
    assumptions:'Ubadilishaji wa kulinganisha: saa 8 kwa siku, siku 22 kwa mwezi kwa viwango vya saa au siku. Huu si uthibitisho wa kufuata sheria; hakiki saa halisi, sekta, eneo na tarehe ya kiwango.',
    monthly:'Linganisha kipindi na masharti husika. Huu si uthibitisho wa kufuata sheria; hakiki sekta, eneo na tarehe ya kiwango.',
    changed:'Ingizo limebadilika. Hakiki tena ili kupata ulinganisho mpya.', effective:'Tarehe ya kiwango iliyorekodiwa'
  } : {
    invalid:'Enter a valid monthly salary of zero or more.',
    missing:'This record has no comparable rate. Check the applicable law and sector; a missing record does not establish that no minimum wage exists.',
    above:'Pay meets the selected reference', below:'Pay is below the selected reference',
    national:'Recorded national reference', salary:'Monthly salary', reference:'Monthly reference', difference:'Difference',
    assumptions:'Comparison conversion: 8 hours per day and 22 days per month for hourly or daily rates. This does not establish legal compliance; check actual hours, sector, location and rate date.',
    monthly:'Check the applicable period and conditions. This does not establish legal compliance; verify sector, location and rate date.',
    changed:'Input changed. Check again for an updated comparison.', effective:'Recorded effective date'
  };
  const result = $('compliance-result'); result.setAttribute('role','status');
  salary.setAttribute('aria-describedby','cr-detail');
  function clear(message) {
    result.className = 'mw-compliance-result'; result.style.display = message ? 'block' : 'none';
    $('cr-title').textContent = ''; $('cr-detail').textContent = message || ''; $('cr-action').textContent = '';
    $('what-to-do').className = 'mw-what-to-do'; salary.removeAttribute('aria-invalid');
  }
  for (const id of ['compliance-salary','country','state-select']) $(id).addEventListener(id === 'compliance-salary' ? 'input' : 'change', () => clear(copy.changed));
  window.checkCompliance = function () {
    clear();
    const value = Number(salary.value);
    if (!salary.value.trim() || !Number.isFinite(value) || value < 0 || !salary.validity.valid) {
      clear(copy.invalid); salary.setAttribute('aria-invalid','true'); salary.focus(); return;
    }
    const c = E.getCountry($('country').value);
    const sector = c && (E.getStateRates(c.code) || []).find(row => row.code === $('state-select').value);
    const basis = sector ? sector.basis || c.basis : c && c.basis;
    const amount = sector ? sector.rate : c && (basis === 'hourly' ? c.hourly : basis === 'daily' ? c.daily : c.monthly);
    const minimum = basis === 'hourly' ? amount * 8 * 22 : basis === 'daily' ? amount * 22 : amount;
    if (!(minimum > 0) || !Number.isFinite(minimum)) { clear(copy.missing); return; }
    const fmt = n => new Intl.NumberFormat(sw ? 'sw' : 'en', {maximumFractionDigits:2}).format(n) + ' ' + c.currency;
    result.style.display = 'block'; result.className = 'mw-compliance-result ' + (value >= minimum ? 'pass' : 'fail');
    $('cr-title').textContent = value >= minimum ? copy.above : copy.below;
    $('cr-detail').textContent = (sector ? sector.name : copy.national) + '. ' + copy.salary + ': ' + fmt(value) + '; ' + copy.reference + ': ' + fmt(minimum) + '; ' + copy.difference + ': ' + fmt(value - minimum) + '. ' + (basis === 'monthly' ? copy.monthly : copy.assumptions);
    $('cr-action').textContent = copy.effective + ': ' + (sector && sector.effectiveDate || c.effectiveDate) + '. ' + c.law;
  };
})();

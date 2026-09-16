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

  // These are explicit comparison assumptions, not a statutory monthly conversion.
  const currencyAmount = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const monthlyAmount = (amount, basis) => currencyAmount(basis === 'hourly' ? amount * 8 * 22 : basis === 'daily' ? amount * 22 : amount);
  const labels = sw ? {
    recorded:'Thamani ya mwezi iliyorekodiwa', derived:'Makadirio ya mwezi kwa ulinganisho',
    basis:'Msingi wa kiwango', monthly:'mwezi', daily:'siku', hourly:'saa',
    limits:'Rekodi ya katalogi; tarehe ya kuanza si tarehe ya uhakiki. Uhalali wa sasa na masharti ya matumizi hayajathibitishwa hapa. Hakiki chanzo rasmi.',
    fx:'USD hutumia ubadilishaji wa katalogi usio na tarehe; si bei ya sasa.',
    recordViews:'Jedwali, ulinganisho wa nchi na pengo la gharama za maisha hutumia thamani ya mwezi iliyorekodiwa. Kadi ya mshahara na ukaguzi wa malipo hutumia makadirio ya siku 22, saa 8 kwa siku pale kiwango ni cha siku au saa. Thamani hizi zinaweza kutofautiana.',
    precision:'Ulinganisho unazungushwa hadi desimali mbili; si uthibitisho wa kufuata sheria.',
    headers:['Nchi','Msimbo wa nchi','Sarafu','Thamani ya mwezi iliyorekodiwa','Makadirio ya mwezi kwa ulinganisho','Msingi wa kiwango','Kiwango kwa msingi huo','Masharti ya ubadilishaji','USD ya rekodi (makadirio)','Tarehe ya kiwango iliyorekodiwa','Sheria iliyorekodiwa','Mipaka ya chanzo','Mipaka ya USD'],
    unset:'Hakuna rekodi', exact:'Kiwango cha mwezi kilichorekodiwa; hakuna ubadilishaji', derivedRule:'Siku 22 kwa mwezi; saa 8 kwa siku kwa kiwango cha saa'
  } : {
    recorded:'Recorded monthly value', derived:'Derived monthly comparison estimate',
    basis:'Rate basis', monthly:'month', daily:'day', hourly:'hour',
    limits:'Catalogue record; effective date is not verification date. Current validity and eligibility are not established here. Check the official source.',
    fx:'USD uses an undated catalogue exchange conversion; not a current quote.',
    recordViews:'The table, country comparison and living-cost gap use recorded monthly values. The wage card and pay check use 22 days per month and 8 hours per day when the rate is daily or hourly. These values can differ.',
    precision:'Comparison rounds to two decimal places; it does not establish legal compliance.',
    headers:['Country','Country code','Currency','Recorded monthly value','Derived monthly comparison estimate','Rate basis','Rate in that basis','Conversion assumptions','Recorded USD (approximate)','Recorded effective date','Recorded law','Source limits','USD limits'],
    unset:'No record', exact:'Recorded monthly rate; no conversion', derivedRule:'22 days per month; 8 hours per day for hourly rates'
  };
  const nativeName = c => { try { return new Intl.DisplayNames([sw ? 'sw' : 'en'], {type:'region'}).of(c.code) || c.name; } catch (_) { return c.name; } };
  const number = n => new Intl.NumberFormat(sw ? 'sw' : 'en', {minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  function selectedReference(c, sector) {
    const basis = sector ? sector.basis || c.basis : c.basis;
    const amount = sector ? sector.rate : basis === 'hourly' ? c.hourly : basis === 'daily' ? c.daily : c.monthly;
    return {basis, amount, monthly:monthlyAmount(amount,basis)};
  }
  function showBasis() {
    const c = E.getCountry($('country').value); if (!c || !$('r-monthly')) return;
    const sector = (E.getStateRates(c.code) || []).find(row => row.code === $('state-select').value);
    const ref = selectedReference(c,sector);
    $('r-monthly').textContent = ref.monthly > 0 ? number(ref.monthly) + ' ' + c.currency : labels.unset;
    $('r-monthly-sub').textContent = ref.basis === 'monthly' ? labels.recorded : labels.derived;
    const details=$('r-details'); if (!details) return;
    let note=$('monthly-basis-note');
    if (!note) { note=document.createElement('p'); note.id='monthly-basis-note'; details.append(note); }
    note.textContent = labels.basis + ': ' + (labels[ref.basis] || ref.basis) + ' (' + number(ref.amount) + ' ' + c.currency + '). ' + (ref.basis === 'monthly' ? labels.exact : labels.derivedRule) + '. ' + labels.recorded + ': ' + (c.monthly > 0 ? number(c.monthly) + ' ' + c.currency : labels.unset) + '. ' + labels.precision + ' ' + labels.limits;
    // The USD badge belongs to the recorded catalogue amount, not this derived card.
    if ($('r-usd')) $('r-usd').textContent = (c.usdMonthly ? '≈ USD ' + number(c.usdMonthly) : labels.unset) + ' — ' + labels.recorded + '. ' + labels.fx;
  }
  // Wrap source-owned renderers so initial/default and later programmatic selections agree.
  for (const name of ['renderCountry','onStateChange']) {
    if (typeof window[name] !== 'function') continue;
    const original=window[name]; window[name]=function(){const output=original.apply(this,arguments);showBasis();return output;};
  }
  if (typeof document.querySelector === 'function') {
    const table=document.querySelector('.mw-country-table');
    if (table) { const note=document.createElement('p');note.id='monthly-record-view-note';note.textContent=labels.recordViews+' '+labels.fx;table.parentElement.insertBefore(note,table); }
  }
  function csv() {
    const rows=[labels.headers];
    for (const c of E.getAllCountries('name')) {
      const ref=selectedReference(c,null);
      rows.push([nativeName(c),c.code,c.currency,c.monthly>0?c.monthly.toFixed(2):labels.unset,ref.monthly>0?ref.monthly.toFixed(2):labels.unset,labels[ref.basis]||ref.basis,ref.amount>0?ref.amount:labels.unset,ref.basis==='monthly'?labels.exact:labels.derivedRule,c.usdMonthly||labels.unset,c.effectiveDate,c.law,labels.limits,labels.fx]);
    }
    return rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  }
  // This download exports the country catalogue, not a user's salary or selected sector.
  window.doExportCSV=function(){const blob=new Blob([csv()],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='afrotools-minimum-wage-reference-'+(sw?'sw':'en')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

  const result = $('compliance-result'); result.setAttribute('role','status');
  salary.setAttribute('aria-describedby','cr-detail');
  salary.setAttribute('step','0.01');
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
    const minimum = monthlyAmount(amount, basis);
    if (!(minimum > 0) || !Number.isFinite(minimum)) { clear(copy.missing); return; }
    const fmt = n => new Intl.NumberFormat(sw ? 'sw' : 'en', {maximumFractionDigits:2}).format(n) + ' ' + c.currency;
    result.style.display = 'block'; result.className = 'mw-compliance-result ' + (currencyAmount(value) >= minimum ? 'pass' : 'fail');
    $('cr-title').textContent = currencyAmount(value) >= minimum ? copy.above : copy.below;
    $('cr-detail').textContent = (sector ? sector.name : copy.national) + '. ' + copy.salary + ': ' + fmt(value) + '; ' + copy.reference + ': ' + fmt(minimum) + '; ' + copy.difference + ': ' + fmt(currencyAmount(value) - minimum) + '. ' + (basis === 'monthly' ? copy.monthly : copy.assumptions);
    $('cr-action').textContent = copy.effective + ': ' + (sector && sector.effectiveDate || c.effectiveDate) + '. ' + c.law;
  };
})();

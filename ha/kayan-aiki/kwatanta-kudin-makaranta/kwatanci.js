(() => {
  'use strict';
  const form = document.getElementById('schoolCompare');
  const currency = form.elements.currency;
  const result = document.getElementById('schoolComparisonResult');
  const download = document.getElementById('saveSchoolComparison');
  let report = '';

  function clearResult() {
    report = '';
    result.textContent = '';
    download.disabled = true;
    for (const input of form.querySelectorAll('input')) input.setCustomValidity('');
  }
  form.addEventListener('input', clearResult);
  form.addEventListener('change', clearResult);
  form.addEventListener('invalid', event => {
    const field = event.target;
    if (field.validity.customError) return;
    if (field.name.startsWith('count')) {
      field.setCustomValidity('Shigar da cikakken adadi daga 1 zuwa 12.');
    } else {
      field.setCustomValidity('Shigar da kuɗi daga sifili zuwa sama.');
    }
  }, true);

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    const code = currency.value;
    const format = new Intl.NumberFormat('ha-NG', {style:'currency', currency:code, currencyDisplay:'code'});
    const digits = format.resolvedOptions().maximumFractionDigits;
    const scale = 10 ** digits;
    const money = minor => format.format(minor / scale);
    function minorAmount(field) {
      if (field.value === '') return 0;
      const value = field.valueAsNumber;
      const minor = Math.round(value * scale);
      if (!Number.isSafeInteger(minor) || value < 0 || Number((minor / scale).toFixed(digits)) !== value) {
        field.setCustomValidity('Duba adadin kuɗin. Adadin lambobin bayan ɗigo da za a iya amfani da su: ' + digits + '.');
        field.reportValidity();
        return null;
      }
      return minor;
    }
    const schools = [];
    for (const letter of ['A','B']) {
      const tuitionField = form.elements['tuition'+letter];
      const tuition = minorAmount(tuitionField);
      if (tuition === null) return;
      const extras = minorAmount(form.elements['extras'+letter]);
      if (extras === null) return;
      const count = form.elements['count'+letter].valueAsNumber;
      const annual = tuition * count + extras;
      if (!Number.isSafeInteger(annual)) {
        tuitionField.setCustomValidity('Adadin ya yi yawa. Duba kuɗin da ka shigar.');
        tuitionField.reportValidity();
        return;
      }
      const name = form.elements['name'+letter].value.trim();
      schools.push({name:'Makaranta '+letter+(name ? ' — '+name : ''), tuition, count, extras, annual});
    }
    const [a,b] = schools;
    const gap = Math.abs(a.annual-b.annual);
    const conclusion = gap === 0 ? 'Kuɗin makarantun biyu iri ɗaya ne a shekara.' :
      (a.annual < b.annual ? a.name : b.name)+' ta fi rahusa da '+money(gap)+' a shekara.';
    const lines = ['Kwatancen kuɗin makarantu na shekara ɗaya ('+code+')'];
    for (const school of schools) {
      lines.push('', school.name, 'Kuɗin karatu: '+money(school.tuition)+' × '+school.count+' = '+money(school.tuition*school.count),
        'Sauran kuɗin shekara: '+money(school.extras), 'Jimillar shekara: '+money(school.annual));
    }
    lines.push('',conclusion);
    report = lines.join('\n');
    result.textContent = report;
    download.disabled = false;
  });

  download.addEventListener('click', () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([report+'\n'], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kwatancen-kudin-makarantu-'+currency.value+'.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function clarifyBudget() {
    const income = document.getElementById('haSchoolIncome');
    if (!income) return;
    const budget = income.closest('[data-ha-runtime]');
    const calculate = budget.querySelector('[data-ha-calculate]');
    const output = budget.querySelector('[data-ha-output]');
    form.closest('section').after(budget);
    const note = document.createElement('p');
    income.closest('label').parentElement.before(note);
    function labelOutput() {
      const context = document.createElement('small');
      context.dataset.budgetUnit = '';
      context.textContent = 'Nau’in kuɗi: '+currency.value+' · Tsawon lokaci: shekara ɗaya.';
      const old = output.querySelector('[data-budget-unit]');
      if (old) old.remove();
      output.append(document.createElement('br'),context);
    }
    function updateBudget() {
      note.textContent = 'Yi amfani da '+currency.value+' a duk guraben nan. Rubuta kuɗin da ake da su da kashewa na shekara ɗaya.';
      calculate.click();
    }
    calculate.addEventListener('click',labelOutput);
    currency.addEventListener('change',updateBudget);
    updateBudget();
  }
  if (document.getElementById('haSchoolIncome')) clarifyBudget();
  else document.addEventListener('DOMContentLoaded', clarifyBudget, {once:true});
})();

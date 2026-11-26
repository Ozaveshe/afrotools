(() => {
  'use strict';
  const form = document.getElementById('planForm');
  const usage = document.querySelector('[data-data-usage="yo"]');
  const country = form.elements.country;
  const archive = document.getElementById('planArchive');
  const output = document.getElementById('planResult');
  const save = document.getElementById('savePlans');
  const catalog = window.TELECOM_DATA;
  const planner = window.AfroTools.engines.telecomPlanning;
  const names = new Intl.DisplayNames(['yo'], {type:'region'});
  for (const [code, market] of Object.entries(catalog.countries)) {
    country.add(new Option(names.of(code) + ' (' + market.currency + ')', code));
  }
  country.value = 'NG';
  function needed() {
    const values = Object.fromEntries(new FormData(usage));
    return window.AfroTools.dataUsage.validate(values,'yo').length ? null : window.AfroTools.dataUsage.estimate(values,'yo');
  }
  function money(value) {
    return new Intl.NumberFormat('yo', {style:'currency',currency:catalog.countries[country.value].currency,currencyDisplay:'code'}).format(value);
  }
  function refresh() {
    output.textContent = '';
    save.disabled = true;
    const gb = needed();
    if (gb === null || gb === 0) {
      archive.textContent = 'Tẹ iye wákàtí lílo dátà tó pé kí o lè fi àwọn ètò wé ara wọn.';
      return;
    }
    const plans = planner.dataPlans(catalog, {country:country.value}).plans || [];
    const fit = plans.filter(p => p.volumeGB >= gb && planner.validityDays(p.validity) >= 30 && p.volume !== 'Unlimited' && p.price > 0)
      .sort((a,b) => a.price-b.price)[0];
    const record = fit ? fit.operator + ' · ' + fit.volumeGB + ' GB · ' + money(fit.price) + ' · ọjọ́ ' + planner.validityDays(fit.validity) :
      'Kò sí àpẹẹrẹ tó tó fún ọjọ́ 30 nínú àkọsílẹ̀ yìí.';
    archive.textContent = gb + ' GB fún ọjọ́ 30. Àpẹẹrẹ láti inú àkọsílẹ̀ AfroTools (' + catalog.lastUpdated + '): ' + record + '. Jẹ́risi iye owó tuntun lọ́dọ̀ olùpèsè.';
  }
  form.addEventListener('input', refresh);
  usage.addEventListener('input', refresh);
  usage.addEventListener('reset', () => setTimeout(refresh,0));
  country.addEventListener('change', () => {
    for (const input of form.querySelectorAll('input')) input.value = '';
    refresh();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    refresh();
    const gb = needed();
    if (!gb) { usage.requestSubmit(); return; }
    const plans = ['A','B'].map(id => ({
      name:form.elements['name'+id].value.trim() || ('Ètò '+id),
      price:Number(form.elements['price'+id].value), gb:Number(form.elements['gb'+id].value),
      days:Number(form.elements['days'+id].value)
    }));
    const fits = plans.filter(p => p.gb >= gb && p.days >= 30).sort((a,b) => a.price-b.price);
    let choice = 'Kò sí ètò kan tó ní GB àti ọjọ́ tó fún oṣù náà.';
    if (fits.length) choice = fits.length === 2 && fits[0].price === fits[1].price ? 'Àwọn ètò méjèèjì tó, iye owó wọn sì dọ́gba.' :
      'Yan '+fits[0].name+' fún ọjọ́ 30: '+money(fits[0].price)+'.';
    const details = plans.map(p => p.name+' · '+p.gb+' GB · ọjọ́ '+p.days+' · '+money(p.price)+' · '+money(p.price/p.gb)+'/GB'+
      (p.gb < gb ? ' · GB kò tó' : '')+(p.days < 30 ? ' · ọjọ́ kò tó' : ''));
    output.textContent = [names.of(country.value)+' · '+gb+' GB fún ọjọ́ 30','Orísun iye owó: àwọn iye tí o tẹ láti ọ̀dọ̀ olùpèsè.',...details,choice].join('\n');
    save.disabled = false;
  });
  save.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([output.textContent+'\n'+archive.textContent], {type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download='afiwe-eto-data.txt'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  refresh();
})();

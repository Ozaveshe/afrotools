(() => {
  'use strict';
  const form = document.getElementById('planCompare');
  const fields = form.elements;
  const result = document.getElementById('planResult');
  const copy = document.getElementById('planCopy');
  const download = document.getElementById('planDownload');
  const status = document.getElementById('planStatus');
  let report = '';

  function clearResult() {
    report = '';
    result.textContent = '';
    status.textContent = '';
    copy.disabled = true;
    download.disabled = true;
  }

  function numberFormat(options) {
    return new Intl.NumberFormat('ha-NG', options);
  }

  function currencyFormat(options) {
    return numberFormat({style: 'currency', currency: fields.currency.value, currencyDisplay: 'code', ...options});
  }

  function setPriceStep() {
    const digits = currencyFormat().resolvedOptions().maximumFractionDigits;
    for (const field of [fields.priceA, fields.priceB]) field.step = String(10 ** -digits);
  }

  form.addEventListener('input', event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    clearResult();
  });
  form.addEventListener('change', () => {
    clearResult();
    setPriceStep();
    for (const field of [fields.priceA, fields.priceB]) field.setCustomValidity('');
  });
  form.addEventListener('invalid', event => {
    const field = event.target;
    const label = field.labels[0].textContent.trim();
    const message = field.validity.valueMissing ? 'Cika wannan gurbi.' :
      field.name.toLowerCase().includes('days') ? 'Shigar da cikakkiyar rana ɗaya ko fiye.' :
      field.name.startsWith('price') ? 'Duba farashin da adadin lambobin bayan digo na kuɗin da ka zaɓa.' :
      'Shigar da GB daga 0.001 zuwa sama, da lambobi uku ko ƙasa da haka bayan digo.';
    field.setCustomValidity(message);
    if (field === form.querySelector('input:invalid, select:invalid')) {
      clearResult();
      status.textContent = label + ' — ' + message;
    }
  }, true);

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    const needGb = fields.needGb.valueAsNumber;
    const needDays = fields.needDays.valueAsNumber;
    const amount = currencyFormat();
    const unitRate = currencyFormat({minimumFractionDigits: 0, maximumFractionDigits: 4});
    const digits = amount.resolvedOptions().maximumFractionDigits;
    const measure = numberFormat({maximumFractionDigits: 3});
    const plans = ['A', 'B'].map(key => {
      const name = fields['name' + key].value.trim();
      const price = fields['price' + key].valueAsNumber;
      const gb = fields['gb' + key].valueAsNumber;
      const days = fields['days' + key].valueAsNumber;
      return {label: 'Kunshi ' + key + (name ? ' — ' + name : ''), price, gb, days, fits: gb >= needGb && days >= needDays};
    });
    const safeGb = gb => Number.isSafeInteger(Math.round(gb * 1000));
    if (!Number.isSafeInteger(needDays) || !safeGb(needGb) || plans.some(p =>
      !Number.isSafeInteger(Math.round(p.price * 10 ** digits)) || !safeGb(p.gb) || !Number.isSafeInteger(p.days))) {
      status.textContent = 'Adadin ya yi yawa. Duba kuɗi, GB da kwanakin da ka shigar.';
      return;
    }
    const lines = ['Kwatancen kunshin intanet', 'Bukatarka: ' + measure.format(needGb) + ' GB na tsawon kwanaki ' + measure.format(needDays) + '.'];
    for (const p of plans) {
      const gaps = [];
      if (p.gb < needGb) gaps.push('GB bai isa ba');
      if (p.days < needDays) gaps.push('kwanakin aiki ba su isa ba');
      lines.push('', p.label, 'Farashi: ' + amount.format(p.price) + ' · ' + measure.format(p.gb) + ' GB · Kwanaki: ' + measure.format(p.days),
        'Farashin GB ɗaya: ' + unitRate.format(p.price / p.gb),
        'Farashin rana ɗaya: ' + unitRate.format(p.price / p.days),
        p.fits ? 'Ya cika bukatarka.' : 'Bai cika bukatarka ba: ' + gaps.join('; ') + '.');
    }
    const eligible = plans.filter(p => p.fits).sort((a, b) => a.price - b.price);
    let verdict = 'Babu kunshin da ya cika duka bukatun da ka shigar.';
    if (eligible.length === 1) verdict = eligible[0].label + ' kaɗai ya cika bukatarka.';
    if (eligible.length === 2) verdict = eligible[0].price === eligible[1].price
      ? 'Duka sun cika bukatarka kuma farashinsu ɗaya ne.'
      : eligible[0].label + ' ya fi araha da ' + amount.format(eligible[1].price - eligible[0].price) + '. Duka sun cika bukatarka.';
    lines.push('', verdict, 'Ana kwatanta saye sau ɗaya daga farashin da ka shigar.');
    report = lines.join('\n');
    result.textContent = report;
    copy.disabled = false;
    download.disabled = false;
  });

  copy.addEventListener('click', async () => {
    const text = report;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (report === text) status.textContent = 'An kwafi sakamakon.';
    } catch {
      if (report !== text) return;
      const range = document.createRange();
      range.selectNodeContents(result);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'An zaɓi rubutun sakamakon. Yi amfani da umarnin kwafi na na’urarka.';
    }
  });
  download.addEventListener('click', () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([report + '\n'], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kwatancen-kunshin-intanet-' + fields.currency.value + '.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  setPriceStep();
})();

(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.swZakat;
  var form = document.getElementById('sw-zakat-form');
  var resultPanel = document.getElementById('sw-zakat-result');
  var status = document.getElementById('sw-zakat-status');
  var exportButton = document.getElementById('sw-zakat-csv');
  var copyButton = document.getElementById('sw-zakat-copy');
  var printButton = document.getElementById('sw-zakat-print');
  var latest = null;

  if (!engine || !form || !resultPanel || !status) return;

  var assetLabels = {
    cash: 'Fedha taslimu',
    savings: 'Akiba za benki na pochi za simu',
    goldValue: 'Thamani ya dhahabu',
    silverValue: 'Thamani ya fedha',
    inventory: 'Bidhaa za biashara',
    investments: 'Uwekezaji unaohusika',
    receivables: 'Madai yanayotarajiwa kulipwa'
  };

  function field(id) { return form.elements[id]; }
  function value(id) { return field(id).value; }
  function inputs() {
    return {
      currency: value('currency'),
      nisabBasis: value('nisabBasis'),
      cash: value('cash'),
      savings: value('savings'),
      goldGrams: value('goldGrams'),
      goldPrice: value('goldPrice'),
      silverGrams: value('silverGrams'),
      silverPrice: value('silverPrice'),
      inventory: value('inventory'),
      investments: value('investments'),
      receivables: value('receivables'),
      debts: value('debts'),
      customNisab: value('customNisab'),
      hawlDate: value('hawlDate'),
      hawlMet: field('hawlMet').checked
    };
  }

  function money(number) {
    try {
      return new Intl.NumberFormat('sw', { style: 'currency', currency: value('currency'), maximumFractionDigits: 2 }).format(number);
    } catch (error) {
      return value('currency') + ' ' + new Intl.NumberFormat('sw', { maximumFractionDigits: 2 }).format(number);
    }
  }

  function text(id, valueToSet) { document.getElementById(id).textContent = valueToSet; }
  function clear(message) {
    latest = null;
    resultPanel.hidden = true;
    resultPanel.querySelectorAll('[data-result-value]').forEach(function (node) { node.textContent = '—'; });
    document.getElementById('sw-zakat-breakdown').replaceChildren();
    document.getElementById('sw-zakat-next').replaceChildren();
    exportButton.disabled = true;
    copyButton.disabled = true;
    printButton.disabled = true;
    status.dataset.state = 'changed';
    status.textContent = message || 'Thamani zimebadilika. Hesabu tena ili kupata matokeo mapya.';
  }

  function localError(error) {
    var messages = {
      INVALID_AMOUNT: 'Weka namba halali isiyo hasi katika sehemu iliyoangaziwa.',
      INVALID_BASIS: 'Chagua msingi halali wa nisab.',
      ZERO_PRICE: 'Bei ya metali ya msingi wa nisab lazima iwe zaidi ya sifuri.',
      ZERO_NISAB: 'Kiasi maalum cha nisab lazima kiwe zaidi ya sifuri.',
      INVALID_DATE: 'Weka tarehe halali ya mapitio ya hawl.'
    };
    clear(messages[error.code] || 'Kagua thamani ulizoingiza, kisha ujaribu tena.');
    status.dataset.state = 'error';
    if (error.field && field(error.field)) field(error.field).focus();
  }

  function renderBreakdown(result) {
    var list = document.getElementById('sw-zakat-breakdown');
    list.replaceChildren();
    Object.keys(result.assets).forEach(function (key) {
      var item = document.createElement('li');
      var label = document.createElement('span');
      var amount = document.createElement('strong');
      label.textContent = assetLabels[key];
      amount.textContent = money(result.assets[key]);
      item.append(label, amount);
      list.appendChild(item);
    });
    [['Jumla ya mali inayohusika', result.grossAssets], ['Madeni yanayokatwa', -result.debts], ['Mali halisi inayohusika', result.zakatableWealth]].forEach(function (row) {
      var item = document.createElement('li');
      var label = document.createElement('span');
      var amount = document.createElement('strong');
      label.textContent = row[0];
      amount.textContent = money(row[1]);
      item.append(label, amount);
      list.appendChild(item);
    });
  }

  function renderSteps(result) {
    var steps = [];
    if (!result.aboveNisab) steps.push('Mali iko chini ya nisab iliyochaguliwa kwa ' + money(result.remainingToNisab) + '; hifadhi kumbukumbu na ukague tena wakati unaofaa.');
    else if (!result.hawlMet) steps.push('Mali iko juu ya nisab, lakini hawl haijathibitishwa; hakiki sharti hilo kabla ya malipo.');
    else steps.push('Tenga makadirio ya ' + money(result.zakatDue) + ' na uthibitishe wapokeaji wanaostahili au taasisi unayoiamini.');
    steps.push('Hakiki bei za dhahabu na fedha siku ya malipo, kisha hesabu tena.');
    steps.push('Muulize msomi mwenye sifa kuhusu mali isiyo ya kawaida, vito, biashara, pensheni, crypto, madeni yenye mgogoro na uwekezaji mchanganyiko.');
    var list = document.getElementById('sw-zakat-next');
    list.replaceChildren();
    steps.forEach(function (step) { var item = document.createElement('li'); item.textContent = step; list.appendChild(item); });
  }

  function calculate(event) {
    if (event) event.preventDefault();
    try {
      latest = engine.calculate(inputs());
    } catch (error) {
      localError(error);
      return null;
    }
    resultPanel.hidden = false;
    text('sw-zakat-wealth', money(latest.zakatableWealth));
    text('sw-zakat-due', money(latest.zakatDue));
    text('sw-zakat-nisab', money(latest.nisab));
    text('sw-zakat-hawl', latest.hawlMet ? 'Hawl imetiwa alama kuwa imetimia' : 'Hawl inahitaji uhakiki');
    text('sw-zakat-verdict', !latest.aboveNisab ? 'Chini ya nisab' : !latest.hawlMet ? 'Hakiki hawl' : 'Makadirio ya zakat');
    text('sw-zakat-note', !latest.aboveNisab ? 'Kwa msingi uliochaguliwa, mali halisi iko chini ya nisab.' : !latest.hawlMet ? 'Nisab imefikiwa, lakini makadirio hayasababishi malipo mpaka sharti la hawl likaguliwe.' : 'Asilimia 2.5 imetumika kwa mali halisi kwa sababu nisab na alama ya hawl zimetimia katika pembejeo zako.');
    renderBreakdown(latest);
    renderSteps(latest);
    exportButton.disabled = false;
    copyButton.disabled = false;
    printButton.disabled = false;
    status.dataset.state = 'success';
    status.textContent = 'Matokeo yamehesabiwa ndani ya kifaa. Hakuna pembejeo iliyotumwa.';
    return latest;
  }

  function rows() {
    return [
      ['Sehemu', 'Thamani'],
      ['Sarafu', latest.input.currency],
      ['Msingi wa nisab', latest.input.nisabBasis],
      ['Kiwango cha nisab', String(latest.nisab)],
      ['Mali halisi inayohusika', String(latest.zakatableWealth)],
      ['Zakat inayokadiriwa', String(latest.zakatDue)],
      ['Hawl imethibitishwa na mtumiaji', latest.hawlMet ? 'Ndiyo' : 'Hapana'],
      ['Mapitio ya chanzo', engine.sourceReviewedOn],
      ['Tahadhari', 'Makadirio ya elimu tu; thibitisha masuala maalum na msomi mwenye sifa.']
    ].concat(Object.keys(latest.assets).map(function (key) { return [assetLabels[key], String(latest.assets[key])]; }), [['Madeni yanayokatwa', String(latest.debts)]]);
  }

  function summary() { return rows().slice(1).map(function (row) { return row[0] + ': ' + row[1]; }).join('\n'); }
  function csv() {
    if (!latest) return;
    var content = rows().map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'makadirio-zakat-afrotools.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = 'CSV imepakuliwa ndani ya kifaa.';
  }
  function copy() {
    if (!latest) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) { status.textContent = 'Kunakili hakupatikani; tumia CSV.'; return; }
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = 'Muhtasari umenakiliwa ndani ya kifaa.'; })
      .catch(function () { status.textContent = 'Kunakili hakupatikani; tumia CSV.'; });
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { setTimeout(function () { clear('Mfano umerudishwa. Hesabu tena.'); }, 0); });
  form.addEventListener('input', function () { if (latest) clear(); });
  form.addEventListener('change', function () { if (latest) clear(); });
  exportButton.addEventListener('click', csv);
  copyButton.addEventListener('click', copy);
  printButton.addEventListener('click', function () { if (latest) window.print(); });
  clear('Jaza mali, madeni na msingi wa nisab, kisha hesabu ndani ya kifaa.');

  window.__SW_ZAKAT_TEST__ = { engine: engine, calculate: calculate, get latest() { return latest; }, inputs: inputs, rows: rows };
})();

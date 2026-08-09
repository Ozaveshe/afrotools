(function () {
  'use strict';

  var root = document.querySelector('[data-funeral-budget-fr]');
  if (!root || !window.FuneralBudgetEngine) return;

  var itemIds = ['care', 'venue', 'food', 'transport', 'documents', 'other'];
  var form = document.getElementById('fb-form');
  var output = document.getElementById('fb-result-list');
  var primary = document.getElementById('fb-primary-value');
  var status = document.getElementById('fb-status');
  var error = document.getElementById('fb-error');
  var last = null;

  var labels = {
    invalid: 'Saisissez une valeur valide dans chaque champ.',
    total: 'Total du plan',
    subtotal: 'Sous-total',
    buffer: 'Marge d’urgence',
    gap: 'Besoin de financement',
    share: 'Par foyer ou contributeur',
    daily: 'Objectif par jour',
    updated: 'Plan calculé sur cet appareil.',
    reset: 'Le formulaire et les résultats ont été réinitialisés.',
    copied: 'Résumé copié.',
    json: 'Fichier JSON téléchargé.',
    txt: 'Fichier TXT téléchargé.',
    reopened: 'Budget JSON rouvert et recalculé.',
    badFile: 'Ce fichier JSON ne correspond pas à un budget funéraire AfroTools.',
    boundary: 'Plan familial fondé sur vos coûts, sans prix moyen, obligation religieuse ni recommandation de cérémonie.'
  };

  function value(id) { return document.getElementById(id).value.trim(); }
  function money(number, currency) {
    return Number(number).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + currency;
  }
  function clearValidation() {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) { field.removeAttribute('aria-invalid'); });
    error.textContent = '';
    error.dataset.show = 'false';
  }
  function clearResult() {
    last = null;
    output.replaceChildren();
    primary.textContent = '—';
    status.textContent = '';
  }
  function currentInput() {
    return {
      currency: value('fb-currency'),
      items: itemIds.map(function (id) {
        return { label: document.querySelector('[data-item-label="' + id + '"]').textContent, amount: value('fb-' + id) };
      }),
      bufferPercent: value('fb-buffer'),
      availableFund: value('fb-fund'),
      confirmedBenefit: value('fb-benefit'),
      contributors: value('fb-contributors'),
      days: value('fb-days')
    };
  }
  function render(result) {
    primary.textContent = money(result.total, result.currency);
    output.replaceChildren();
    [
      [labels.subtotal, result.subtotal],
      [labels.buffer, result.buffer],
      [labels.gap, result.gap],
      [labels.share, result.perContributor],
      [labels.daily, result.perDay]
    ].forEach(function (row) {
      var box = document.createElement('div');
      var name = document.createElement('span');
      var amount = document.createElement('strong');
      box.className = 'rm-result';
      name.textContent = row[0];
      amount.textContent = money(row[1], result.currency);
      box.append(name, amount);
      output.appendChild(box);
    });
  }
  function fail(message) {
    var invalid = form.querySelector(':invalid');
    clearResult();
    error.textContent = message || labels.invalid;
    error.dataset.show = 'true';
    status.textContent = '';
    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      invalid.focus();
    }
  }
  function calculate(event) {
    if (event) event.preventDefault();
    clearValidation();
    if (!form.checkValidity()) {
      fail(labels.invalid);
      return null;
    }
    try {
      last = window.FuneralBudgetEngine.calculate(currentInput());
    } catch (exception) {
      fail(labels.invalid);
      return null;
    }
    render(last);
    status.textContent = labels.updated;
    return last;
  }
  function ensureResult() { return last || calculate(); }
  function summary(result) {
    return [
      labels.total + ' : ' + money(result.total, result.currency),
      labels.gap + ' : ' + money(result.gap, result.currency),
      labels.share + ' : ' + money(result.perContributor, result.currency),
      labels.boundary
    ].join('\n');
  }
  function payload(result) {
    return { schemaVersion: 1, methodology: result.methodology, input: currentInput(), result: result };
  }
  function download(filename, content, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }
  function restoreInput(input) {
    if (!input || !Array.isArray(input.items) || input.items.length !== itemIds.length) throw new Error('INVALID_INPUT');
    document.getElementById('fb-currency').value = input.currency;
    itemIds.forEach(function (id, index) { document.getElementById('fb-' + id).value = input.items[index].amount; });
    document.getElementById('fb-buffer').value = input.bufferPercent;
    document.getElementById('fb-fund').value = input.availableFund;
    document.getElementById('fb-benefit').value = input.confirmedBenefit;
    document.getElementById('fb-contributors').value = input.contributors;
    document.getElementById('fb-days').value = input.days;
  }

  document.getElementById('fb-copy').addEventListener('click', function () {
    var result = ensureResult();
    if (!result) return;
    copyText(summary(result)).then(function () { status.textContent = labels.copied; });
  });
  document.getElementById('fb-json').addEventListener('click', function () {
    var result = ensureResult();
    if (!result) return;
    download('budget-funeraire-familial.json', JSON.stringify(payload(result), null, 2), 'application/json');
    status.textContent = labels.json;
  });
  document.getElementById('fb-txt').addEventListener('click', function () {
    var result = ensureResult();
    if (!result) return;
    download('budget-funeraire-familial.txt', summary(result) + '\n', 'text/plain;charset=utf-8');
    status.textContent = labels.txt;
  });
  document.getElementById('fb-import').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var data = JSON.parse(text);
      if (data.schemaVersion !== 1 || data.methodology !== 'user-entered-funeral-budget') throw new Error('INVALID_FILE');
      restoreInput(data.input);
      var result = calculate();
      if (!result) throw new Error('INVALID_FILE');
      status.textContent = labels.reopened;
    }).catch(function () { fail(labels.badFile); }).finally(function () { event.target.value = ''; });
  });
  form.addEventListener('submit', calculate);
  form.addEventListener('input', function () { clearValidation(); clearResult(); });
  form.addEventListener('reset', function () {
    setTimeout(function () { clearValidation(); clearResult(); status.textContent = labels.reset; }, 0);
  });
}());

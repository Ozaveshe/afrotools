(function () {
  'use strict';

  var app = document.querySelector('[data-ng-cit-app]');
  var engine = window.AfroTools && window.AfroTools.NigeriaCit;
  if (!app || !engine) return;

  var explicitThemeStyles = document.createElement('style');
  explicitThemeStyles.textContent =
    'html[data-theme="dark"]{--cit-ink:#eff7f2;--cit-muted:#b8c9bf;--cit-line:#3b5148;' +
    '--cit-paper:#0b1712;--cit-card:#14241e;--cit-soft:#19372a;--cit-warn:#382f17}' +
    'html[data-theme="dark"] .cit-field input,html[data-theme="dark"] .cit-field select{border-color:#61786c}' +
    'html[data-theme="dark"] .cit-card a{color:#8cddb5}' +
    'html[data-theme="dark"] .cit-warning,html[data-theme="dark"] .cit-alert{color:#f2dc9c;border-color:#826b31}' +
    'html[data-theme="dark"] .cit-button.secondary{color:#93ddb9}';
  document.head.appendChild(explicitThemeStyles);

  var form = app.querySelector('form');
  var result = app.querySelector('[data-result]');
  var error = app.querySelector('[data-error]');
  var status = app.querySelector('[data-export-status]');
  var lastSummary = '';
  var language = (document.documentElement.lang || 'en').split('-')[0];
  var errors = {
    en: {
      scope: 'Confirm the calculator scope before calculating.',
      number: 'Enter zero or a positive number in every amount field.'
    },
    fr: {
      scope: 'Confirmez le périmètre du calculateur avant le calcul.',
      number: 'Saisissez zéro ou un nombre positif dans chaque champ.'
    },
    ha: {
      scope: 'Tabbatar da iyakar kalkuleta kafin lissafi.',
      number: 'Shigar da sifili ko adadi mai kyau a kowane fili.'
    },
    yo: {
      scope: 'Jẹ́rìí ààlà kalkulẹ́tọ̀ kí o tó ṣe ìṣirò.',
      number: 'Fi odo tàbí nọ́mbà rere sínú gbogbo ààyè iye.'
    }
  };

  function field(name) {
    return app.querySelector('[name="' + name + '"]');
  }

  function value(name) {
    return field(name).value;
  }

  function checked(name) {
    return field(name).checked;
  }

  function number(name) {
    return Number(value(name));
  }

  function money(amount) {
    return new Intl.NumberFormat(app.dataset.locale || 'en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2
    }).format(amount);
  }

  function text(key) {
    return app.dataset[key] || key;
  }

  function set(selector, content) {
    app.querySelector(selector).textContent = content;
  }

  function fail(message, target) {
    result.hidden = true;
    error.textContent = message;
    (target || field('scopeConfirmed')).focus();
  }

  function compute() {
    error.textContent = '';
    var messages = errors[language] || errors.en;
    var names = ['turnover', 'fixedAssets', 'totalProfits', 'assessableProfits'];

    if (!checked('scopeConfirmed')) {
      fail(messages.scope, field('scopeConfirmed'));
      return;
    }

    for (var i = 0; i < names.length; i += 1) {
      if (!Number.isFinite(number(names[i])) || number(names[i]) < 0) {
        fail(messages.number, field(names[i]));
        return;
      }
    }

    try {
      var output = engine.calculate({
        turnover: number('turnover'),
        fixedAssets: number('fixedAssets'),
        totalProfits: number('totalProfits'),
        assessableProfits: number('assessableProfits'),
        professionalServices: checked('professionalServices'),
        mneGroup: checked('mneGroup'),
        scopeConfirmed: true
      });

      set('[data-total]', money(output.total));
      app.querySelector('[data-total]').dataset.amount = String(output.total);
      set('[data-classification]', output.smallCompany ? text('smallLabel') : text('otherLabel'));
      set('[data-cit]', money(output.cit) + ' (' + (output.citRate * 100).toFixed(0) + '%)');
      set('[data-levy]', money(output.developmentLevy) + ' (' + (output.developmentLevyRate * 100).toFixed(0) + '%)');
      set('[data-cit-base]', money(output.totalProfits));
      set('[data-levy-base]', money(output.assessableProfits));
      set(
        '[data-formula]',
        money(output.totalProfits) + ' × ' + (output.citRate * 100).toFixed(0) +
          '% + ' + money(output.assessableProfits) + ' × ' +
          (output.developmentLevyRate * 100).toFixed(0) + '% = ' + money(output.total)
      );

      app.querySelector('[data-etr-warning]').hidden = !output.etrReview;
      lastSummary = [
        text('summaryTitle'),
        text('regimeLabel') + ': ' + output.regime,
        text('classificationLabel') + ': ' + (output.smallCompany ? text('smallLabel') : text('otherLabel')),
        text('turnoverLabel') + ': ' + money(output.turnover),
        text('assetsLabel') + ': ' + money(output.fixedAssets),
        text('citBaseLabel') + ': ' + money(output.totalProfits),
        text('levyBaseLabel') + ': ' + money(output.assessableProfits),
        'CIT: ' + money(output.cit) + ' (' + (output.citRate * 100).toFixed(0) + '%)',
        text('levyLabel') + ': ' + money(output.developmentLevy) + ' (' + (output.developmentLevyRate * 100).toFixed(0) + '%)',
        text('totalLabel') + ': ' + money(output.total),
        text('formulaLabel') + ': ' + app.querySelector('[data-formula]').textContent,
        text('scopeNote')
      ].join('\n');
      result.hidden = false;
      result.focus();
    } catch (calculationError) {
      fail(messages.number);
    }
  }

  function copy() {
    if (!lastSummary) return;
    function done() {
      status.textContent = text('copiedLabel');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastSummary).then(done).catch(function () {
        status.textContent = text('copyError');
      });
    } else {
      status.textContent = text('copyError');
    }
  }

  function download() {
    if (!lastSummary) return;
    var blob = new Blob([lastSummary + '\n'], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nigeria-cit-estimate.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    status.textContent = text('downloadedLabel');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    compute();
  });
  app.querySelector('[data-copy]').addEventListener('click', copy);
  app.querySelector('[data-download]').addEventListener('click', download);
})();

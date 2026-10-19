(function (global) {
  'use strict';

  var STRINGS = {
    'fire-calc': {
      invalidAgeRange: 'Weka umri wa sasa wa miaka kamili 18 hadi 70 na umri unaolenga wa miaka kamili 20 hadi 80, ulio mkubwa kuliko umri wa sasa.',
      outOfRange: 'Thamani hizi zinatoa makadirio nje ya wigo wa namba unaotumika. Punguza kiasi au viwango kisha ujaribu tena.',
      invalidAge: 'Umri unaolenga lazima uwe mkubwa kuliko umri wa sasa.',
      invalidAmounts: 'Weka matumizi, akiba na michango isiyo hasi, pamoja na matumizi ya uzeeni yaliyo juu ya sifuri.',
      invalidRates: 'Kiwango cha faida na mfumuko lazima viwe juu ya -100% na visizidi 1,000%; kiwango cha kutoa lazima kiwe juu ya 0% na kisizidi 20%.',
      targetSpending: 'Matumizi katika mwaka unaolenga',
      perMonth: 'mwezi',
      realReturn: 'Hali ya faida halisi',
      year: 'mwaka',
      years: 'miaka',
      monthlyShort: 'mwezi'
    },
    'property-vs-stocks': {
      invalid: 'Kagua kiasi na hali ulizoingiza. Gharama lazima ziwe 0% hadi 100%; makadirio ya faida lazima yawe juu ya -100% na yasizidi 1,000%.',
      propertyGain: 'Faida halisi baada ya gharama za ununuzi, uendeshaji na uuzaji ulizoingiza',
      stockGain: 'Faida ya jumla ya hisa',
      included: 'Imejumuishwa'
    },
    'stock-portfolio': {
      holding: 'Nafasi',
      ticker: 'alama ya hisa',
      shares: 'idadi ya hisa',
      buyPrice: 'bei ya ununuzi kwa hisa',
      currentPrice: 'bei ya sasa kwa hisa',
      delete: 'Futa nafasi',
      invalid: 'Kila mstari unaotumiwa unahitaji idadi chanya ya hisa na bei chanya ya ununuzi, pamoja na bei ya sasa isiyo hasi.',
      outOfRange: 'Nafasi hizi ziko nje ya wigo wa namba unaotumika. Rekebisha kiasi au idadi kisha ujaribu tena.',
      empty: 'Weka angalau nafasi moja iliyokamilika.'
    }
  };

  global.AfroToolsFintechI18n = {
    isFrench: function () { return false; },
    isSwahili: function () { return true; },
    text: function (toolId, key, fallback) {
      return STRINGS[toolId] && Object.prototype.hasOwnProperty.call(STRINGS[toolId], key)
        ? STRINGS[toolId][key]
        : fallback;
    }
  };

  function preparePortfolioTableReading() {
    var table = document.querySelector('#sp-results .table-wrap table');
    if (!table || table.querySelectorAll('thead th').length !== 8) return;
    var wrap = table.parentElement;
    wrap.classList.add('portfolio-results-scroll');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', "Matokeo ya hisa — jedwali linalosogezwa");
    wrap.setAttribute('aria-describedby', 'sp-table-reading-hint');
    table.querySelectorAll('thead th').forEach(function (header) { header.setAttribute('scope', 'col'); });
    if (!document.getElementById('sp-table-reading-hint')) {
      var hint = document.createElement('p');
      hint.id = 'sp-table-reading-hint';
      hint.className = 'portfolio-table-hint';
      hint.textContent = "Sogeza jedwali kushoto au kulia ili kuona safu zote.";
      wrap.parentNode.insertBefore(hint, wrap);
    }
  }

  preparePortfolioTableReading();

  var configs = [
    { selector: '[data-sw-fire-form]', result: 'fire-results', error: 'fire-error', calculate: 'calcFIRE' },
    { selector: '[data-sw-property-stocks-form]', result: 'pvs-results', error: 'pvs-error', calculate: 'calcPvS' },
    { selector: '[data-sw-stock-portfolio-form]', result: 'sp-results', error: 'sp-error', calculate: 'calcPortfolio' }
  ];

  configs.forEach(function (config) {
    var form = document.querySelector(config.selector);
    if (!form) return;
    var result = form.querySelector('#' + config.result);
    var error = form.querySelector('#' + config.error);

    function clearStaleResult() {
      if (result) result.classList.remove('on');
      if (error) {
        error.textContent = '';
        error.classList.remove('on');
      }
    }

    form.addEventListener('input', clearStaleResult);
    form.addEventListener('change', clearStaleResult);
    form.addEventListener('click', function (event) {
      if (event.target.closest('.etab,.btn-add,.btn-del')) clearStaleResult();
    });
    form.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && event.target.tagName !== 'BUTTON') {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearStaleResult();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (typeof global[config.calculate] === 'function') global[config.calculate]();
      if (result && result.classList.contains('on')) result.focus({ preventScroll: true });
    });
  });
}(window));

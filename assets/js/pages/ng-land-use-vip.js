(function () {
  'use strict';
  var root = document.querySelector('[data-ng-land-use]');
  var engine = window.NG_LAND_USE;
  if (!root || !engine) return;
  var locale = root.dataset.locale || 'en';
  var text = {
    en: {
      date: 'This verified planner supports Lagos assessments dated from 25 May 2020 through 23 July 2026.',
      rate: 'Enter the annual charge rate printed on the current demand notice (0% to 3.5%).',
      discount: 'The notice discount must be blank or between 0% and 100%.',
      assessed: 'Enter a positive assessed property value from the official notice.',
      land: 'Land area and the official land rate must be zero or positive.',
      building: 'Building area and the official building rate must be zero or positive.',
      factors: 'Depreciation and relief factors must be from 0% to 100%.',
      total: 'The component formula must produce a positive assessed value.',
      ready: 'Planning calculation ready. No input left this browser.',
      changed: 'Inputs changed. Calculate again.',
      copied: 'Calculation copied locally.',
      exported: 'Local export created.',
      assessedMode: 'Used the assessed value entered from the notice.',
      componentMode: 'Built the assessed value from the section 7 component formula.'
    },
    fr: {
      date: 'Ce planificateur vérifié couvre les avis de Lagos du 25 mai 2020 au 23 juillet 2026.',
      rate: 'Saisissez le taux annuel indiqué sur l’avis actuel (de 0 % à 3,5 %).',
      discount: 'La remise de l’avis doit être vide ou comprise entre 0 % et 100 %.',
      assessed: 'Saisissez une valeur imposable positive provenant de l’avis officiel.',
      land: 'La surface et le taux foncier officiels doivent être nuls ou positifs.',
      building: 'La surface bâtie et le taux de construction officiels doivent être nuls ou positifs.',
      factors: 'Les facteurs de dépréciation et d’allègement doivent être compris entre 0 % et 100 %.',
      total: 'La formule par composantes doit produire une valeur positive.',
      ready: 'Calcul indicatif prêt. Aucune donnée n’a quitté ce navigateur.',
      changed: 'Données modifiées. Recalculez.',
      copied: 'Calcul copié localement.',
      exported: 'Export local créé.',
      assessedMode: 'Valeur imposable reprise de l’avis.',
      componentMode: 'Valeur construite avec la formule par composantes de l’article 7.'
    }
  }[locale];
  var form = document.getElementById('luc-form');
  var componentFields = document.getElementById('luc-component-fields');
  var assessedField = document.getElementById('luc-assessed-field');
  var results = document.getElementById('luc-results');
  var error = document.getElementById('luc-error');
  var status = document.getElementById('luc-status');
  var actions = document.querySelectorAll('[data-luc-action]');
  var current = null;

  function value(id) { return document.getElementById(id).value; }
  function mode() { return document.querySelector('input[name="luc-mode"]:checked').value; }
  function input() {
    return {
      assessmentDate: value('luc-date'),
      mode: mode(),
      assessedValue: value('luc-assessed'),
      landArea: value('luc-land-area'),
      landRate: value('luc-land-rate'),
      buildingArea: value('luc-building-area'),
      buildingRate: value('luc-building-rate'),
      depreciationPct: value('luc-depreciation'),
      reliefFactorPct: value('luc-relief'),
      chargeRatePct: value('luc-rate'),
      discountRatePct: value('luc-discount')
    };
  }
  function money(value) {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2
    }).format(value);
  }
  function percent(value) {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-NG', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  }
  function set(id, value) { document.getElementById(id).textContent = value; }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function clear(message) {
    current = null;
    results.hidden = true;
    enable(false);
    if (message) status.textContent = message;
  }
  function syncMode() {
    var componentMode = mode() === 'components';
    componentFields.hidden = !componentMode;
    assessedField.hidden = componentMode;
  }
  function summary() {
    return [
      root.dataset.pdfTitle,
      root.dataset.assessedLabel + ': ' + money(current.assessedValue),
      root.dataset.rateLabel + ': ' + percent(current.chargeRate),
      root.dataset.grossLabel + ': ' + money(current.grossCharge),
      root.dataset.discountLabel + ': ' + money(current.discountAmount),
      root.dataset.payableLabel + ': ' + money(current.payable),
      root.dataset.boundary
    ].join('\n');
  }
  document.querySelectorAll('input[name="luc-mode"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      syncMode();
      if (current) clear(text.changed);
    });
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var result = engine.calculate(input());
    if (!result.ok) {
      clear();
      error.textContent =
        result.error === 'unsupported_date' ? text.date :
        result.error === 'invalid_charge_rate' ? text.rate :
        result.error === 'invalid_discount' ? text.discount :
        result.error === 'invalid_assessed_value' ? text.assessed :
        result.error === 'invalid_land_component' ? text.land :
        result.error === 'invalid_building_component' ? text.building :
        result.error === 'invalid_factors' ? text.factors : text.total;
      return;
    }
    current = result;
    error.textContent = '';
    set('luc-payable', money(result.payable));
    set('luc-assessed-result', money(result.assessedValue));
    set('luc-rate-result', percent(result.chargeRate));
    set('luc-gross-result', money(result.grossCharge));
    set('luc-discount-result', money(result.discountAmount));
    set('luc-monthly-result', money(result.monthlyPlanningEquivalent));
    set('luc-mode-note', result.mode === 'assessed' ? text.assessedMode : text.componentMode);
    set('luc-boundary', result.boundary);
    results.hidden = false;
    enable(true);
    status.textContent = text.ready;
  });
  form.addEventListener('input', function () { if (current) clear(text.changed); });
  document.getElementById('luc-reset').addEventListener('click', function () {
    form.reset();
    syncMode();
    error.textContent = '';
    status.textContent = '';
    clear();
  });

  function cell(value) {
    var string = String(value);
    if (/^[=+\-@]/.test(string)) string = "'" + string;
    return '"' + string.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = text.exported;
  }
  document.getElementById('luc-copy').addEventListener('click', function () {
    var done = function () { status.textContent = text.copied; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary()).then(done).catch(function () {
        window.prompt(root.dataset.copyPrompt, summary());
        done();
      });
    } else {
      window.prompt(root.dataset.copyPrompt, summary());
      done();
    }
  });
  document.getElementById('luc-csv').addEventListener('click', function () {
    var rows = [
      ['item', 'value'],
      ['assessment_date', current.assessmentDate],
      ['mode', current.mode],
      ['assessed_value', current.assessedValue],
      ['annual_charge_rate', current.chargeRate],
      ['gross_charge', current.grossCharge],
      ['notice_discount_rate', current.discountRate],
      ['notice_discount_amount', current.discountAmount],
      ['planning_payable', current.payable]
    ];
    download('lagos-land-use-charge-plan.csv', 'text/csv;charset=utf-8', rows.map(function (row) {
      return row.map(cell).join(',');
    }).join('\n'));
  });
  document.getElementById('luc-json').addEventListener('click', function () {
    download('lagos-land-use-charge-plan.json', 'application/json', JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      privacy: 'Local Lagos Land Use Charge planning calculation. Contains user-entered property values.',
      calculation: current
    }, null, 2));
  });
  document.getElementById('luc-pdf').addEventListener('click', async function () {
    if (window.AfroTools && window.AfroTools.pdf) {
      await window.AfroTools.pdf.generate({
        toolId: 'ng-land-use',
        category: 'finance',
        title: root.dataset.pdfTitle,
        subtitle: engine.RULES.scheme + ' · ' + current.assessmentDate,
        noGate: true,
        skipGate: true,
        heroStats: [
          [root.dataset.payableLabel, money(current.payable)],
          [root.dataset.assessedLabel, money(current.assessedValue)],
          [root.dataset.rateLabel, percent(current.chargeRate)]
        ],
        sections: [{
          title: root.dataset.breakdownTitle,
          rows: [
            [root.dataset.grossLabel, money(current.grossCharge)],
            [root.dataset.discountLabel, money(current.discountAmount)],
            [root.dataset.monthlyLabel, money(current.monthlyPlanningEquivalent)],
            [root.dataset.modeLabel, current.mode]
          ]
        }],
        source: engine.RULES.source + ' · reviewed ' + engine.RULES.verifiedThrough,
        disclaimer: root.dataset.pdfDisclaimer
      });
      status.textContent = text.exported;
    } else {
      window.print();
    }
  });
  syncMode();
  clear();
})();

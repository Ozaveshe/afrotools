(function frenchPayeParity(global) {
  'use strict';

  var DAY = 86400000;
  var MAX_SOURCE_AGE_DAYS = 366;
  var CONFIGS = {
    'ao-paye': {
      country: 'Angola', currency: 'AOA', symbol: 'Kz', period: 'monthly',
      checkedOn: '2026-03-26', employeeRate: 0.03, employerRate: 0.08, employeeDeductible: true,
      bands: [[100000, 0], [150000, 0.10], [200000, 0.15], [300000, 0.20], [500000, 0.215], [1000000, 0.225], [1500000, 0.235], [2000000, 0.245], [Infinity, 0.25]]
    },
    'bw-paye': {
      country: 'Botswana', currency: 'BWP', symbol: 'P', period: 'annual',
      checkedOn: '2026-01-01', bands: [[48000, 0], [84000, 0.05], [120000, 0.125], [156000, 0.1875], [Infinity, 0.25]]
    },
    'eg-paye': {
      country: 'Égypte', currency: 'EGP', symbol: 'EGP', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.11, employeeCapAnnual: 174000,
      employerRate: 0.1875, employerCapAnnual: 174000, employeeDeductible: true, personalAllowance: 20000,
      bands: [[40000, 0], [55000, 0.10], [70000, 0.15], [200000, 0.20], [400000, 0.225], [1200000, 0.25], [Infinity, 0.275]],
      exclusionAdjustments: [[600000, 0], [700000, 1500], [800000, 2250], [900000, 26000], [1000000, 45000], [1200000, 274750]]
    },
    'sz-paye': {
      country: 'Eswatini', currency: 'SZL', symbol: 'E', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.05, employeeCapMonthly: 215,
      employerRate: 0.05, employerCapMonthly: 215, employeeDeductible: true, rebateAnnual: 8200,
      bands: [[100000, 0.20], [150000, 0.25], [200000, 0.30], [Infinity, 0.33]]
    },
    'ls-paye': {
      country: 'Lesotho', currency: 'LSL', symbol: 'M', period: 'annual',
      checkedOn: '2026-01-01', rebateAnnual: 11640,
      bands: [[74040, 0.20], [Infinity, 0.30]]
    },
    'ly-paye': {
      country: 'Libye', currency: 'LYD', symbol: 'LYD', period: 'monthly',
      checkedOn: '2026-01-01', employeeRate: 0.06125, employerRate: 0.1435,
      employeeDeductible: true, stampRate: 0.005,
      bands: [[1000, 0.05], [Infinity, 0.10]]
    },
    'mw-paye': {
      country: 'Malawi', currency: 'MWK', symbol: 'MWK', period: 'monthly',
      checkedOn: '2026-07-01', employeeRate: 0.05, employerRate: 0.10, employeeDeductible: true,
      bands: [[170000, 0], [1570000, 0.30], [10000000, 0.35], [Infinity, 0.40]]
    },
    'mu-paye': {
      country: 'Maurice', currency: 'MUR', symbol: 'Rs', period: 'annual',
      checkedOn: '2026-01-01', customContribution: 'mauritius',
      bands: [[500000, 0], [1000000, 0.10], [Infinity, 0.20]]
    },
    'mz-paye': {
      country: 'Mozambique', currency: 'MZN', symbol: 'MT', period: 'monthly',
      checkedOn: '2026-04-06', employeeRate: 0.03, employerRate: 0.04, employeeDeductible: true,
      bands: [[3500, 0.10], [14000, 0.15], [42000, 0.20], [126000, 0.25], [Infinity, 0.32]]
    },
    'na-paye': {
      country: 'Namibie', currency: 'NAD', symbol: 'N$', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.009, employeeCapMonthly: 99,
      employerRate: 0.009, employerCapMonthly: 99,
      bands: [[100000, 0], [150000, 0.18], [350000, 0.25], [550000, 0.28], [850000, 0.30], [1550000, 0.32], [Infinity, 0.37]]
    },
    'sc-paye': {
      country: 'Seychelles', currency: 'SCR', symbol: 'SCR', period: 'monthly',
      checkedOn: '2026-01-01', employeeRate: 0.05, employerRate: 0.05,
      bands: [[8555.50, 0], [10000, 0.15], [83333, 0.20], [Infinity, 0.30]]
    },
    'za-paye': {
      country: 'Afrique du Sud', currency: 'ZAR', symbol: 'R', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.01, employeeCapAnnual: 212544,
      employerRate: 0.01, employerCapAnnual: 212544, rebateAnnual: 17235,
      bands: [[237100, 0.18], [370500, 0.26], [512800, 0.31], [673000, 0.36], [857900, 0.39], [1817000, 0.41], [Infinity, 0.45]]
    },
    'sd-paye': {
      country: 'Soudan', currency: 'SDG', symbol: 'SDG', period: 'monthly',
      checkedOn: '2026-01-01', employeeRate: 0.08, employerRate: 0.17, employeeDeductible: true,
      bands: [[10000, 0], [40000, 0.05], [70000, 0.10], [Infinity, 0.15]]
    },
    'tz-paye': {
      country: 'Tanzanie', currency: 'TZS', symbol: 'TSh', period: 'monthly',
      checkedOn: '2026-01-01', employeeRate: 0.10, employerRate: 0.10, employeeDeductible: true,
      bands: [[270000, 0], [520000, 0.08], [760000, 0.20], [1000000, 0.25], [Infinity, 0.30]]
    },
    'zm-paye': {
      country: 'Zambie', currency: 'ZMW', symbol: 'K', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.05, employeeCapMonthly: 1708.20,
      employerRate: 0.05, employerCapMonthly: 1708.20,
      bands: [[61200, 0], [85200, 0.20], [110400, 0.30], [Infinity, 0.37]]
    },
    'zw-paye': {
      country: 'Zimbabwe', currency: 'USD', symbol: 'US$', period: 'annual',
      checkedOn: '2026-01-01', employeeRate: 0.045, employeeCapMonthly: 31.50,
      employerRate: 0.045, employerCapMonthly: 31.50, levyRate: 0.03,
      bands: [[1200, 0], [3600, 0.20], [12000, 0.25], [24000, 0.30], [36000, 0.35], [Infinity, 0.40]]
    }
  };

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function routeId() {
    var path = global.location.pathname.replace(/\/+$/, '');
    var match = path.match(/\/([a-z]{2}-paye)$/i);
    return match ? match[1].toLowerCase() : '';
  }

  function money(config, value) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function ageDays(date) {
    var checked = new Date(date + 'T00:00:00Z').getTime();
    return Number.isFinite(checked) ? Math.floor((Date.now() - checked) / DAY) : Infinity;
  }

  function progressiveTax(amount, bands) {
    var remaining = Math.max(0, amount);
    var previous = 0;
    var tax = 0;
    var breakdown = [];
    bands.forEach(function (band) {
      if (remaining <= 0) return;
      var upper = band[0];
      var width = upper === Infinity ? remaining : Math.max(0, upper - previous);
      var inBand = Math.min(remaining, width);
      var bandTax = inBand * band[1];
      tax += bandTax;
      breakdown.push({ rate: band[1], income: inBand, tax: bandTax });
      remaining -= inBand;
      previous = upper;
    });
    return { tax: tax, breakdown: breakdown };
  }

  function cappedContribution(grossMonthly, rate, monthlyCap, annualCap) {
    if (!rate) return 0;
    var monthly = grossMonthly * rate;
    if (Number.isFinite(monthlyCap)) monthly = Math.min(monthly, monthlyCap);
    if (Number.isFinite(annualCap)) monthly = Math.min(monthly, annualCap * rate / 12);
    return monthly;
  }

  function calculate(config, grossMonthly) {
    var employeeMonthly;
    var employerMonthly;
    if (config.customContribution === 'mauritius') {
      employeeMonthly = grossMonthly * (grossMonthly <= 50000 ? 0.015 : 0.03)
        + Math.min(grossMonthly, 28570) * 0.01;
      employerMonthly = grossMonthly * 0.015;
    } else {
      employeeMonthly = cappedContribution(
        grossMonthly,
        config.employeeRate,
        config.employeeCapMonthly,
        config.employeeCapAnnual
      );
      employerMonthly = cappedContribution(
        grossMonthly,
        config.employerRate,
        config.employerCapMonthly,
        config.employerCapAnnual
      );
    }
    var annual = config.period === 'annual';
    var grossBasis = annual ? grossMonthly * 12 : grossMonthly;
    var employeeBasis = annual ? employeeMonthly * 12 : employeeMonthly;
    var taxable = Math.max(
      0,
      grossBasis - (config.employeeDeductible ? employeeBasis : 0) - (config.personalAllowance || 0)
    );
    var taxResult = progressiveTax(taxable, config.bands);
    var taxBasis = taxResult.tax;
    if (config.exclusionAdjustments) {
      config.exclusionAdjustments.forEach(function (entry) {
        if (taxable > entry[0]) taxBasis = taxResult.tax + entry[1];
      });
    }
    taxBasis = Math.max(0, taxBasis - (config.rebateAnnual || 0));
    if (config.levyRate) taxBasis += taxBasis * config.levyRate;
    var taxMonthly = annual ? taxBasis / 12 : taxBasis;
    var stampMonthly = config.stampRate
      ? Math.max(0, grossMonthly - employeeMonthly - taxMonthly) * config.stampRate
      : 0;
    var deductionsMonthly = employeeMonthly + taxMonthly + stampMonthly;
    return {
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      employeeMonthly: employeeMonthly,
      employerMonthly: employerMonthly,
      taxableMonthly: annual ? taxable / 12 : taxable,
      taxMonthly: taxMonthly,
      stampMonthly: stampMonthly,
      deductionsMonthly: deductionsMonthly,
      netMonthly: Math.max(0, grossMonthly - deductionsMonthly),
      employerCostMonthly: grossMonthly + employerMonthly,
      effectiveRate: grossMonthly > 0 ? (taxMonthly / grossMonthly) * 100 : 0
    };
  }

  function addStyles() {
    if (document.getElementById('fr-paye-parity-styles')) return;
    var style = document.createElement('style');
    style.id = 'fr-paye-parity-styles';
    style.textContent = [
      '.fr-paye-native{max-width:820px;margin:0 auto;padding:22px;border:1px solid #dbe3ed;border-radius:14px;background:var(--color-bg-card,#fff);color:var(--color-text,#0f172a)}',
      '.fr-paye-native h2{margin:0 0 8px}.fr-paye-native__lead,.fr-paye-native__meta{color:var(--color-text-muted,#475569);line-height:1.6}',
      '.fr-paye-native form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end;margin:20px 0}',
      '.fr-paye-native label{display:grid;gap:7px;font-weight:750}.fr-paye-native input{min-height:46px;padding:10px 12px;border:1px solid #94a3b8;border-radius:8px;font:inherit}',
      '.fr-paye-native button{min-height:46px;padding:10px 16px;border:0;border-radius:8px;background:#0062cc;color:#fff;font-weight:800;cursor:pointer}',
      '.fr-paye-native__actions{display:flex;gap:8px;flex-wrap:wrap}.fr-paye-native__actions button{background:#334155}',
      '.fr-paye-native [data-results]{margin-top:18px;border-top:1px solid #dbe3ed;padding-top:16px}.fr-paye-native dl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 18px}.fr-paye-native dt{color:var(--color-text-muted,#475569)}.fr-paye-native dd{margin:0;font-weight:800;text-align:right}',
      '.fr-paye-native [data-error]{color:#b91c1c;font-weight:750}.fr-paye-native [data-status]{min-height:1.5em;color:#166534;font-weight:700}',
      '@media(max-width:560px){.fr-paye-native form{grid-template-columns:1fr}.fr-paye-native button{width:100%}.fr-paye-native dl{grid-template-columns:1fr}.fr-paye-native dd{text-align:left;margin-bottom:7px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function initialize() {
    var id = routeId();
    var hubMode = global.location.pathname.replace(/\/+$/, '') === '/fr/salary-tax/paye';
    if (hubMode) id = 'ao-paye';
    var config = CONFIGS[id];
    var mount = id ? document.getElementById(id + '-app') : null;
    if (hubMode) {
      mount = document.createElement('div');
      mount.id = 'fr-paye-hub-calculator';
      var hubMain = document.querySelector('main');
      if (hubMain) hubMain.insertBefore(mount, hubMain.firstChild);
    }
    if (!config || !mount) return;
    addStyles();
    mount.innerHTML = [
      '<section class="fr-paye-native" data-fr-paye-native data-fr-finance-workflow-owner="true" aria-labelledby="fr-paye-native-title">',
      '<h2 id="fr-paye-native-title">Calcul PAYE natif en français — ' + config.country + '</h2>',
      '<p class="fr-paye-native__lead">Saisissez un salaire brut mensuel. Le moteur applique localement le même barème, les mêmes plafonds et les mêmes retenues par défaut que le propriétaire anglais.</p>',
      '<form novalidate>',
      hubMode ? '<label for="frPayeCountry">Pays et barème<select id="frPayeCountry" name="country">' + Object.keys(CONFIGS).map(function (key) { return '<option value="' + key + '">' + CONFIGS[key].country + '</option>'; }).join('') + '</select></label>' : '',
      '<label for="frPayeGross">Salaire brut mensuel (' + config.currency + ')<input id="frPayeGross" name="grossMonthly" type="number" min="0" step="0.01" inputmode="decimal" required value="500000"></label>',
      '<button type="submit" data-calculate>Calculer le salaire net</button>',
      '</form>',
      '<p data-error role="alert"></p><p data-status role="status" aria-live="polite"></p>',
      '<section id="frPayeResults" data-results hidden tabindex="-1" aria-labelledby="fr-paye-results-title">',
      '<h3 id="fr-paye-results-title">Résultat de la simulation</h3><dl data-result-rows></dl>',
      '</section>',
      '<div class="fr-paye-native__actions"><button type="button" data-reset>Réinitialiser</button></div>',
      '<p class="fr-paye-native__meta">Source et paramètres du propriétaire anglais vérifiés le <time data-checked-date datetime="' + config.checkedOn + '">' + config.checkedOn + '</time>. Estimation de planification uniquement : elle ne remplace ni une fiche de paie, ni une déclaration, ni l’avis de l’autorité fiscale.</p>',
      '<p class="fr-paye-native__meta">Confidentialité : calcul et exports effectués dans ce navigateur, sans compte ni adresse e-mail.</p>',
      '</section>'
    ].join('');
    var app = mount.querySelector('[data-fr-paye-native]');
    var form = app.querySelector('form');
    var input = app.querySelector('#frPayeGross');
    var country = app.querySelector('#frPayeCountry');
    var results = app.querySelector('[data-results]');
    var rows = app.querySelector('[data-result-rows]');
    var error = app.querySelector('[data-error]');
    var status = app.querySelector('[data-status]');

    function render(event) {
      if (event) event.preventDefault();
      if (country && CONFIGS[country.value]) {
        config = CONFIGS[country.value];
        var checkedDate = app.querySelector('[data-checked-date]');
        checkedDate.dateTime = config.checkedOn;
        checkedDate.textContent = config.checkedOn;
        input.labels[0].firstChild.textContent = 'Salaire brut mensuel (' + config.currency + ')';
      }
      error.textContent = '';
      status.textContent = '';
      if (ageDays(config.checkedOn) > MAX_SOURCE_AGE_DAYS) {
        results.hidden = true;
        error.textContent = 'Source trop ancienne : aucun calcul n’est produit. Vérifiez le barème auprès de l’autorité compétente.';
        return;
      }
      var gross = Number(input.value);
      if (!Number.isFinite(gross) || gross <= 0) {
        results.hidden = true;
        error.textContent = 'Saisissez un salaire brut mensuel positif.';
        return;
      }
      var result = calculate(config, gross);
      var outputRows = [
        ['Salaire brut mensuel', money(config, result.grossMonthly)],
        ['Retenues sociales salariées', money(config, result.employeeMonthly)],
        ['Revenu imposable mensuel', money(config, result.taxableMonthly)],
        ['PAYE mensuel estimé', money(config, result.taxMonthly)]
      ];
      if (result.stampMonthly > 0) outputRows.push(['Droit de timbre mensuel', money(config, result.stampMonthly)]);
      outputRows.push(
        ['Total des retenues mensuelles', money(config, result.deductionsMonthly)],
        ['Salaire net mensuel estimé', money(config, result.netMonthly)],
        ['Salaire net annuel estimé', money(config, result.netMonthly * 12)],
        ['Coût employeur mensuel', money(config, result.employerCostMonthly)],
        ['Taux effectif PAYE', result.effectiveRate.toFixed(2) + ' %']
      );
      rows.innerHTML = outputRows.map(function (row) {
        return '<dt>' + clean(row[0]) + '</dt><dd>' + clean(row[1]) + '</dd>';
      }).join('');
      results.hidden = false;
      status.textContent = 'Simulation calculée localement avec les paramètres vérifiés le ' + config.checkedOn + '.';
      results.focus({ preventScroll: true });
    }

    form.addEventListener('submit', render);
    if (country) country.addEventListener('change', function () {
      status.textContent = 'Barème sélectionné : ' + CONFIGS[country.value].country + '. Lancez le calcul pour actualiser le résultat.';
      results.hidden = true;
    });
    app.querySelector('[data-reset]').addEventListener('click', function () {
      form.reset();
      results.hidden = true;
      rows.innerHTML = '';
      error.textContent = '';
      status.textContent = 'Simulation réinitialisée. Aucune donnée n’a été envoyée.';
      input.focus();
    });
  }

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.frenchPayeParity = {
    calculate: calculate,
    configs: CONFIGS
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}(window));

(function () {
  'use strict';

  window.AfroWidgets = window.AfroWidgets || {};

  // GRA Act 1178, effective 1 September 2026. Monthly chargeable-income bands.
  var bands = [
    { width: 588, rate: 0 },
    { width: 80, rate: 0.05 },
    { width: 100, rate: 0.10 },
    { width: 2900, rate: 0.175 },
    { width: 16000, rate: 0.25 },
    { width: 30332, rate: 0.30 },
    { width: Infinity, rate: 0.35 }
  ];
  // SSNIT's 2026 maximum insurable earning is GHS 69,000 per month.
  var ssnitMonthlyCap = 69000;

  function format(amount) {
    return 'GH₵ ' + Math.round(amount).toLocaleString('en-GH');
  }

  function calculate(gross) {
    var ssnit = Math.min(gross, ssnitMonthlyCap) * 0.055;
    var chargeable = Math.max(0, gross - ssnit);
    var remaining = chargeable;
    var tax = 0;
    for (var i = 0; i < bands.length && remaining > 0; i++) {
      var portion = Math.min(remaining, bands[i].width);
      tax += portion * bands[i].rate;
      remaining -= portion;
    }
    return {
      gross: gross,
      ssnit: ssnit,
      chargeable: chargeable,
      tax: tax,
      net: gross - ssnit - tax,
      effectiveRate: gross > 0 ? tax / gross * 100 : 0
    };
  }

  window.AfroWidgets.gh_paye = function (container, options) {
    options = options || {};
    container.innerHTML = '<div class="aw-title">🇬🇭 Ghana PAYE + SSNIT Calculator</div>' +
      '<div class="aw-field"><label class="aw-label" for="awGhGross">Monthly Gross Salary (GH₵)</label>' +
      '<input class="aw-input" id="awGhGross" type="text" inputmode="decimal" placeholder="e.g. 10,000"></div>' +
      '<button class="aw-btn aw-btn--primary" id="awGhCalc">Calculate PAYE</button>' +
      '<div id="awGhResult" aria-live="polite"></div>' +
      '<p class="aw-note">Quick resident estimate: gross equals basic pay, with no reliefs, bonus or voluntary pension. For different basic pay, use the <a href="https://afrotools.com/ghana/gh-paye">full Ghana PAYE calculator</a>. Bands: <a href="https://gra.gov.gh/news/portfolio/amendments-income-tax-act-2026-act-1178/">GRA Act 1178</a>; cap: <a href="https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf">SSNIT 2026</a>.</p>' +
      (options.footerHTML || '');

    var input = container.querySelector('#awGhGross');
    var button = container.querySelector('#awGhCalc');
    var result = container.querySelector('#awGhResult');
    button.addEventListener('click', function () {
      var gross = parseFloat((input.value || '').replace(/[^0-9.]/g, '')) || 0;
      if (gross <= 0) {
        result.textContent = 'Enter a monthly gross salary above zero.';
        return;
      }
      var estimate = calculate(gross);
      result.innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly Take-Home (GRA Sep 2026)</div>' +
        '<div class="aw-result-main">' + format(estimate.net) + '</div></div>' +
        '<div class="aw-result-box"><div class="aw-result-row"><span>Gross Salary</span><span>' + format(estimate.gross) + '</span></div>' +
        '<div class="aw-result-row"><span>SSNIT (5.5%, GHS 69,000 monthly base cap)</span><span>-' + format(estimate.ssnit) + '</span></div>' +
        '<div class="aw-result-row"><span>Chargeable Income</span><span>' + format(estimate.chargeable) + '</span></div>' +
        '<hr class="aw-divider"><div class="aw-result-row"><span>PAYE Tax</span><span>-' + format(estimate.tax) + '</span></div>' +
        '<div class="aw-result-row"><span>Effective Rate</span><span>' + estimate.effectiveRate.toFixed(1) + '%</span></div>' +
        '<hr class="aw-divider"><div class="aw-result-row"><span>Net Salary</span><span>' + format(estimate.net) + '</span></div>' +
        '<div class="aw-result-row"><span>Annual Net</span><span>' + format(12 * estimate.net) + '</span></div></div>';
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') button.click();
    });
  };
})();

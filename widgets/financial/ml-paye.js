/**
 * AfroTools — Mali PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤330k, 5% 330-630k, 13% 630k-1.5M, 30% 1.5-3.6M, 40% above 3.6M
 * INPS 3.6% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ml_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (ITS)
    var BANDS = [
      { limit: 330000, rate: 0 },
      { limit: 300000, rate: 0.05 },
      { limit: 870000, rate: 0.13 },
      { limit: 2100000, rate: 0.30 },
      { limit: Infinity, rate: 0.40 }
    ];

    function calculate(grossAnnual) {
      var inps = grossAnnual * 0.036;
      var taxable = Math.max(0, grossAnnual - inps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - inps - tax;
      return {
        gross: grossAnnual, inps: inps, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDF1 Mali PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awMlGross" type="text" inputmode="numeric" placeholder="e.g. 400,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMlCalc">Calculate PAYE</button>' +
      '<div id="awMlResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMlCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awMlGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awMlResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>INPS (3.6%)</span><span>-' + fmt(R.inps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>ITS Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMlGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMlCalc').click();
    });
  };
})();

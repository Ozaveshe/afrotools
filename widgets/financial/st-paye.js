/**
 * AfroTools — Sao Tome & Principe PAYE Widget (DGTF 2025)
 * Annual bands: 0% ≤2.5M, 10% 2.5-5M, 15% 5-10M, 20% 10-20M, 25% above 20M
 * INSS 6% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.st_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'STN ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGTF annual progressive bands
    var BANDS = [
      { limit: 2500000, rate: 0 },
      { limit: 2500000, rate: 0.10 },
      { limit: 5000000, rate: 0.15 },
      { limit: 10000000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ];

    function calculate(grossAnnual) {
      var inss = grossAnnual * 0.06;
      var taxable = Math.max(0, grossAnnual - inss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - inss - tax;
      return {
        gross: grossAnnual, inss: inss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDF9 S\u00e3o Tom\u00e9 & Pr\u00edncipe PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (STN)</label>' +
        '<input class="aw-input" id="awStGross" type="text" inputmode="numeric" placeholder="e.g. 1,500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awStCalc">Calculate PAYE</button>' +
      '<div id="awStResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awStCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awStGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awStResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGTF 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>INSS (6%)</span><span>-' + fmt(R.inss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awStGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awStCalc').click();
    });
  };
})();

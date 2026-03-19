/**
 * AfroTools — Guinea PAYE Widget (DNI 2025)
 * Annual bands: 0% ≤5M, 5% 5-10M, 10% 10-15M, 15% 15-20M, 20% 20-50M, 25% 50-100M, 35% above
 * CNSS 5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gn_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FG ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DNI annual progressive bands
    var BANDS = [
      { limit: 5000000, rate: 0 },
      { limit: 5000000, rate: 0.05 },
      { limit: 5000000, rate: 0.10 },
      { limit: 5000000, rate: 0.15 },
      { limit: 30000000, rate: 0.20 },
      { limit: 50000000, rate: 0.25 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnss = grossAnnual * 0.05;
      var taxable = Math.max(0, grossAnnual - cnss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - cnss - tax;
      return {
        gross: grossAnnual, cnss: cnss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDF3 Guinea PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FG)</label>' +
        '<input class="aw-input" id="awGnGross" type="text" inputmode="numeric" placeholder="e.g. 5,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGnCalc">Calculate PAYE</button>' +
      '<div id="awGnResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGnCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awGnGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awGnResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DNI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (5%)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGnGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGnCalc').click();
    });
  };
})();

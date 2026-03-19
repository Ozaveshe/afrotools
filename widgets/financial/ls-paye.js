/**
 * AfroTools — Lesotho PAYE Widget (LRA 2025/26)
 * Annual bands: 20% ≤M72k, 30% above M72k
 * Tax credit M10,560/yr. No mandatory pension
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ls_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'M' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // LRA annual progressive bands
    var BANDS = [
      { limit: 72000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(grossAnnual) {
      var tax = 0, rem = grossAnnual;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      tax = Math.max(0, tax - 10560);
      var net = grossAnnual - tax;
      return {
        gross: grossAnnual, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF1\uD83C\uDDF8 Lesotho PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (LSL)</label>' +
        '<input class="aw-input" id="awLsGross" type="text" inputmode="numeric" placeholder="e.g. 12,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awLsCalc">Calculate PAYE</button>' +
      '<div id="awLsResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awLsCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awLsGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awLsResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (LRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE (after M10,560 credit)</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awLsGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awLsCalc').click();
    });
  };
})();

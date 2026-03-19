/**
 * AfroTools — Botswana PAYE Widget (BURS 2025/26)
 * Annual bands: 0% ≤P48k, 5% 48-72k, 12.5% 72-96k, 18.75% 96-120k, 25% above 120k
 * No mandatory social security
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.bw_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'P' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // BURS annual progressive bands
    var BANDS = [
      { limit: 48000, rate: 0 },
      { limit: 24000, rate: 0.05 },
      { limit: 24000, rate: 0.125 },
      { limit: 24000, rate: 0.1875 },
      { limit: Infinity, rate: 0.25 }
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
      var net = grossAnnual - tax;
      return {
        gross: grossAnnual, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE7\uD83C\uDDFC Botswana PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (BWP)</label>' +
        '<input class="aw-input" id="awBwGross" type="text" inputmode="numeric" placeholder="e.g. 15,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awBwCalc">Calculate PAYE</button>' +
      '<div id="awBwResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awBwCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awBwGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awBwResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (BURS 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awBwGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awBwCalc').click();
    });
  };
})();

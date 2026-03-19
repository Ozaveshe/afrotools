/**
 * AfroTools — Eritrea PAYE Widget (MoF 2025/26)
 * Monthly 7-band: 0% ≤600, 2% 600-1500, 5% 1500-6000, 10% 6000-15000,
 * 15% 15000-36000, 20% 36000-60000, 30% above
 * No social security
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.er_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'ERN ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // MoF monthly progressive bands
    var BANDS = [
      { limit: 600, rate: 0 },
      { limit: 900, rate: 0.02 },
      { limit: 4500, rate: 0.05 },
      { limit: 9000, rate: 0.10 },
      { limit: 21000, rate: 0.15 },
      { limit: 24000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(gross) {
      var tax = 0, rem = gross;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - tax;
      return {
        gross: gross, tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEA\uD83C\uDDF7 Eritrea PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (ERN)</label>' +
        '<input class="aw-input" id="awErGross" type="text" inputmode="numeric" placeholder="e.g. 10,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awErCalc">Calculate PAYE</button>' +
      '<div id="awErResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awErCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awErGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awErResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MoF 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awErGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awErCalc').click();
    });
  };
})();

/**
 * AfroTools — Malawi PAYE Widget (MRA 2025/26)
 * Monthly bands: 0% ≤MWK 100k, 25% 100-400k, 30% 400k-1.5M, 35% above 1.5M
 * No mandatory pension
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.mw_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MWK ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // MRA monthly progressive bands
    var BANDS = [
      { limit: 100000, rate: 0 },
      { limit: 300000, rate: 0.25 },
      { limit: 1100000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
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
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDFC Malawi PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MWK)</label>' +
        '<input class="aw-input" id="awMwGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMwCalc">Calculate PAYE</button>' +
      '<div id="awMwResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMwCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awMwGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awMwResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MRA 2025/26)</div>' +
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

    container.querySelector('#awMwGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMwCalc').click();
    });
  };
})();

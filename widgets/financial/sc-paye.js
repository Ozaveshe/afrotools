/**
 * AfroTools — Seychelles PAYE Widget (SRC 2025/26)
 * Monthly bands: 0% ≤SCR 8,555.50, 15% above
 * SSF 2.5% (not deductible from tax)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.sc_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'SCR ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // SRC monthly progressive bands
    var BANDS = [
      { limit: 8555.50, rate: 0 },
      { limit: Infinity, rate: 0.15 }
    ];

    function calculate(gross) {
      var ssf = gross * 0.025;
      var tax = 0, rem = gross;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - ssf - tax;
      return {
        gross: gross, ssf: ssf, tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDE8 Seychelles PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (SCR)</label>' +
        '<input class="aw-input" id="awScGross" type="text" inputmode="numeric" placeholder="e.g. 30,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awScCalc">Calculate PAYE</button>' +
      '<div id="awScResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awScCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awScGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awScResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (SRC 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>SSF (2.5%)</span><span>-' + fmt(R.ssf) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awScGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awScCalc').click();
    });
  };
})();

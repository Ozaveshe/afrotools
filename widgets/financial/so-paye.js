/**
 * AfroTools — Somalia PAYE Widget (MoF 2025/26)
 * Flat 5% on all employment income
 * No formal social security system
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.so_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'SOS ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    function calculate(gross) {
      var tax = gross * 0.05;
      var net = gross - tax;
      return {
        gross: gross, tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDF4 Somalia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (SOS)</label>' +
        '<input class="aw-input" id="awSoGross" type="text" inputmode="numeric" placeholder="e.g. 5,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awSoCalc">Calculate PAYE</button>' +
      '<div id="awSoResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awSoCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awSoGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awSoResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MoF 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE (flat 5%)</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awSoGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awSoCalc').click();
    });
  };
})();

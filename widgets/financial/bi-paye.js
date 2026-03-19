/**
 * AfroTools — Burundi PAYE Widget (OBR 2025/26)
 * Monthly bands: 0% ≤150k, 20% 150-200k, 30% above 200k
 * INSS 4% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.bi_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'BIF ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // OBR monthly progressive bands
    var BANDS = [
      { limit: 150000, rate: 0 },
      { limit: 50000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(gross) {
      var inss = gross * 0.04;
      var taxable = Math.max(0, gross - inss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - inss - tax;
      return {
        gross: gross, inss: inss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE7\uD83C\uDDEE Burundi PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (BIF)</label>' +
        '<input class="aw-input" id="awBiGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awBiCalc">Calculate PAYE</button>' +
      '<div id="awBiResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awBiCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awBiGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awBiResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (OBR 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>INSS (4%)</span><span>-' + fmt(R.inss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awBiGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awBiCalc').click();
    });
  };
})();

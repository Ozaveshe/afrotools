/**
 * AfroTools — Mauritania PAYE Widget (DGI 2025/26)
 * Monthly bands: 0% ≤6k, 15% 6-15k, 25% 15-21k, 30% 21-30k, 40% above 30k
 * CNSS 1% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.mr_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MRU ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI monthly progressive bands (ITS)
    var BANDS = [
      { limit: 6000, rate: 0 },
      { limit: 9000, rate: 0.15 },
      { limit: 6000, rate: 0.25 },
      { limit: 9000, rate: 0.30 },
      { limit: Infinity, rate: 0.40 }
    ];

    function calculate(gross) {
      var cnss = gross * 0.01;
      var taxable = Math.max(0, gross - cnss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - cnss - tax;
      return {
        gross: gross, cnss: cnss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDF7 Mauritania PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MRU)</label>' +
        '<input class="aw-input" id="awMrGross" type="text" inputmode="numeric" placeholder="e.g. 50,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMrCalc">Calculate PAYE</button>' +
      '<div id="awMrResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMrCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awMrGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awMrResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (1%)</span><span>-' + fmt(R.cnss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>ITS Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMrGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMrCalc').click();
    });
  };
})();

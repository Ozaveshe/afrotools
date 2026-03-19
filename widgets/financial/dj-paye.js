/**
 * AfroTools — Djibouti PAYE Widget (DGI 2025/26)
 * Monthly bands: 0% ≤50k, 2% 50-150k, 15% 150-500k, 18% 500k-1M, 20% 1-2M, 30% above
 * Social Security 4% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.dj_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'DJF ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI monthly progressive bands (ITS)
    var BANDS = [
      { limit: 50000, rate: 0 },
      { limit: 100000, rate: 0.02 },
      { limit: 350000, rate: 0.15 },
      { limit: 500000, rate: 0.18 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(gross) {
      var ss = gross * 0.04;
      var taxable = Math.max(0, gross - ss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - ss - tax;
      return {
        gross: gross, ss: ss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE9\uD83C\uDDEF Djibouti PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (DJF)</label>' +
        '<input class="aw-input" id="awDjGross" type="text" inputmode="numeric" placeholder="e.g. 200,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awDjCalc">Calculate PAYE</button>' +
      '<div id="awDjResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awDjCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awDjGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awDjResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>Social Security (4%)</span><span>-' + fmt(R.ss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>ITS Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awDjGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awDjCalc').click();
    });
  };
})();

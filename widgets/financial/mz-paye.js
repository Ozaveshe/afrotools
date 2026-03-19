/**
 * AfroTools — Mozambique PAYE Widget (AT 2025/26)
 * Monthly bands: 0% ≤42k, 10% 42-100k, 15% 100-225k, 20% 225-500k, 25% 500k-1.125M, 32% above
 * INSS 3% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.mz_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MZN ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // AT monthly progressive bands (IRPS)
    var BANDS = [
      { limit: 42000, rate: 0 },
      { limit: 58000, rate: 0.10 },
      { limit: 125000, rate: 0.15 },
      { limit: 275000, rate: 0.20 },
      { limit: 625000, rate: 0.25 },
      { limit: Infinity, rate: 0.32 }
    ];

    function calculate(gross) {
      var inss = gross * 0.03;
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
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDFF Mozambique PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MZN)</label>' +
        '<input class="aw-input" id="awMzGross" type="text" inputmode="numeric" placeholder="e.g. 150,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMzCalc">Calculate PAYE</button>' +
      '<div id="awMzResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMzCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awMzGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awMzResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (AT 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>INSS (3%)</span><span>-' + fmt(R.inss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRPS Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMzGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMzCalc').click();
    });
  };
})();

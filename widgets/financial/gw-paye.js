/**
 * AfroTools — Guinea-Bissau PAYE Widget (DGCI 2025/26)
 * Monthly bands: 0% ≤25k, 10% 25-50k, 15% 50-100k, 20% 100-200k, 30% above
 * INSS 8% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gw_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGCI monthly progressive bands
    var BANDS = [
      { limit: 25000, rate: 0 },
      { limit: 25000, rate: 0.10 },
      { limit: 50000, rate: 0.15 },
      { limit: 100000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(gross) {
      var inss = gross * 0.08;
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
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDFC Guinea-Bissau PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awGwGross" type="text" inputmode="numeric" placeholder="e.g. 200,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGwCalc">Calculate PAYE</button>' +
      '<div id="awGwResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGwCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awGwGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awGwResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGCI 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>INSS (8%)</span><span>-' + fmt(R.inss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGwGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGwCalc').click();
    });
  };
})();

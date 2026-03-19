/**
 * AfroTools — Gabon PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤1.5M, 5% 1.5-1.92M, 10% 1.92-2.5M, 15% 2.5-3.5M, 20% 3.5-5M,
 * 25% 5-7.5M, 30% 7.5-10M, 35% above 10M
 * CNSS 2.5% (cap 1.5M/mo = 18M/yr) + CNAMGS 2%
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ga_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IRPP)
    var BANDS = [
      { limit: 1500000, rate: 0 },
      { limit: 420000, rate: 0.05 },
      { limit: 580000, rate: 0.10 },
      { limit: 1000000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: 2500000, rate: 0.25 },
      { limit: 2500000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnssCeiling = 1500000 * 12;
      var cnssBase = Math.min(grossAnnual, cnssCeiling);
      var cnss = cnssBase * 0.025;
      var cnamgs = grossAnnual * 0.02;
      var totalSS = cnss + cnamgs;
      var taxable = Math.max(0, grossAnnual - totalSS);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - totalSS - tax;
      return {
        gross: grossAnnual, cnss: cnss, cnamgs: cnamgs, totalSS: totalSS,
        taxable: taxable, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDE6 Gabon PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awGaGross" type="text" inputmode="numeric" placeholder="e.g. 800,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGaCalc">Calculate PAYE</button>' +
      '<div id="awGaResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGaCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awGaGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awGaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (2.5%, cap 1.5M/mo)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>CNAMGS (2%)</span><span>-' + fmt(R.cnamgs / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRPP Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGaCalc').click();
    });
  };
})();

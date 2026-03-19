/**
 * AfroTools — Cote d'Ivoire PAYE Widget (DGI 2025)
 * IS annual bands: 0% ≤300k, 1.6% 300k-526k, 3.67% 526k-942k, 7.5% 942k-1.62M,
 * 14% 1.62M-2.7M, 18.5% 2.7M-4.86M, 25% 4.86M-9M, 30% 9M-15M, 35% above 15M
 * CNPS 6.3% + CN 1.5%
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ci_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IS - Impot sur les Salaires)
    var BANDS = [
      { limit: 300000, rate: 0 },
      { limit: 226000, rate: 0.016 },
      { limit: 416000, rate: 0.0367 },
      { limit: 678000, rate: 0.075 },
      { limit: 1080000, rate: 0.14 },
      { limit: 2160000, rate: 0.185 },
      { limit: 4140000, rate: 0.25 },
      { limit: 6000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnpsCeiling = 70000 * 12;
      var cnpsBase = Math.min(grossAnnual, cnpsCeiling);
      var cnps = cnpsBase * 0.063;
      var cn = grossAnnual * 0.015;
      var taxable = Math.max(0, grossAnnual - cnps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var totalTax = tax + cn;
      var net = grossAnnual - cnps - totalTax;
      return {
        gross: grossAnnual, cnps: cnps, cn: cn, taxable: taxable,
        tax: tax, totalTax: totalTax, net: net,
        effectiveRate: grossAnnual > 0 ? totalTax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE8\uD83C\uDDEE C\u00f4te d\'Ivoire PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awCiGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awCiCalc">Calculate PAYE</button>' +
      '<div id="awCiResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awCiCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awCiGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awCiResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNPS (6.3%)</span><span>-' + fmt(R.cnps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IS Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>CN (1.5%)</span><span style="color:#dc2626">-' + fmt(R.cn / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awCiGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awCiCalc').click();
    });
  };
})();

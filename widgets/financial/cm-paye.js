/**
 * AfroTools — Cameroon PAYE Widget (DGI 2025)
 * Annual bands: 10% ≤2M, 15% 2M-3M, 25% 3M-5M, 35% above 5M
 * CNPS 4.2% (cap 750k/mo), CAC 10% on tax
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.cm_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands
    var BANDS = [
      { limit: 2000000, rate: 0.10 },
      { limit: 1000000, rate: 0.15 },
      { limit: 2000000, rate: 0.25 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnpsCeiling = 750000 * 12;
      var cnpsBase = Math.min(grossAnnual, cnpsCeiling);
      var cnps = cnpsBase * 0.042;
      var taxable = Math.max(0, grossAnnual - cnps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var cac = tax * 0.10;
      var totalTax = tax + cac;
      var net = grossAnnual - cnps - totalTax;
      return {
        gross: grossAnnual, cnps: cnps, taxable: taxable,
        tax: tax, cac: cac, totalTax: totalTax, net: net,
        effectiveRate: grossAnnual > 0 ? totalTax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE8\uD83C\uDDF2 Cameroon PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awCmGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awCmCalc">Calculate PAYE</button>' +
      '<div id="awCmResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awCmCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awCmGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awCmResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNPS (4.2%, cap 750k/mo)</span><span>-' + fmt(R.cnps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRPP Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>CAC (10% on tax)</span><span style="color:#dc2626">-' + fmt(R.cac / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awCmGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awCmCalc').click();
    });
  };
})();

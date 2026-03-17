/**
 * AfroTools — Uganda PAYE Widget (URA 2025/26)
 * Real URA 5-band monthly tax, NSSF 5% (NOT deductible) from ug-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ug_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'UGX ' + Math.round(n).toLocaleString('en-UG'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // URA monthly bands (on FULL gross — NSSF is NOT deductible)
    // 0% first 235,000; 10% 235,001-335,000; 20% 335,001-410,000; 30% 410,001-10,000,000; 40% above 10,000,000
    function calcMonthlyPAYE(gross) {
      var income = Math.max(0, gross);
      if (income <= 235000) return { tax: 0 };
      var tax = 0;
      if (income > 235000) tax += Math.min(income - 235000, 100000) * 0.10;
      if (income > 335000) tax += Math.min(income - 335000, 75000) * 0.20;
      if (income > 410000) tax += Math.min(income - 410000, 9590000) * 0.30;
      if (income > 10000000) tax += (income - 10000000) * 0.40;
      return { tax: tax };
    }

    function calculate(gross, includeNSSF) {
      var nssf = includeNSSF ? gross * 0.05 : 0;
      // PAYE on full gross (NSSF NOT deductible in Uganda)
      var r = calcMonthlyPAYE(gross);
      var lstAnnual = gross * 12 * 0.01;
      var lstMonthly = lstAnnual / 12;
      var net = gross - nssf - r.tax - lstMonthly;
      return { gross: gross, nssf: nssf, tax: r.tax, lstMonthly: lstMonthly, net: net, effectiveRate: gross > 0 ? r.tax / gross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDFA\uD83C\uDDEC Uganda PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (UGX)</label>' +
        '<input class="aw-input" id="awUgGross" type="text" inputmode="numeric" placeholder="e.g. 3,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awUgCalc">Calculate PAYE</button>' +
      '<div id="awUgResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awUgCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awUgGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awUgResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (URA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSF (5%, not deductible)</span><span>-' + fmt(R.nssf) + '</span></div>' +
          '<div class="aw-result-row"><span>PAYE on full gross</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>LST (~1%/yr, averaged)</span><span>-' + fmt(R.lstMonthly) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awUgGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awUgCalc').click();
    });
  };
})();

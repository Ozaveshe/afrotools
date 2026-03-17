/**
 * AfroTools — Ethiopia PAYE Widget (ERCA 2025/26)
 * Real ERCA 7-band monthly tax, pension 7% from et-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.et_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'ETB ' + Math.round(n).toLocaleString('en-ET'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // ERCA monthly bands on taxable income (gross minus pension 7%)
    // 0% first 600, 10% 601-1650, 15% 1651-3200, 20% 3201-5250, 25% 5251-7800, 30% 7801-10900, 35% above 10900
    function calcMonthlyPAYE(taxable) {
      var income = Math.max(0, taxable);
      if (income <= 600) return { tax: 0 };
      var tax = 0;
      // 10% on 601-1650
      if (income > 600) tax += Math.min(income - 600, 1050) * 0.10;
      // 15% on 1651-3200
      if (income > 1650) tax += Math.min(income - 1650, 1550) * 0.15;
      // 20% on 3201-5250
      if (income > 3200) tax += Math.min(income - 3200, 2050) * 0.20;
      // 25% on 5251-7800
      if (income > 5250) tax += Math.min(income - 5250, 2550) * 0.25;
      // 30% on 7801-10900
      if (income > 7800) tax += Math.min(income - 7800, 3100) * 0.30;
      // 35% above 10900
      if (income > 10900) tax += (income - 10900) * 0.35;
      return { tax: tax };
    }

    function calculate(gross, includePension) {
      var pensionCap = 15000; // salary ceiling
      var pensionBase = Math.min(gross, pensionCap);
      var pension = includePension ? pensionBase * 0.07 : 0;
      var taxable = Math.max(0, gross - pension);
      var r = calcMonthlyPAYE(taxable);
      var net = gross - pension - r.tax;
      return { gross: gross, pension: pension, taxable: taxable, tax: r.tax, net: net, effectiveRate: gross > 0 ? r.tax / gross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEA\uD83C\uDDF9 Ethiopia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (ETB)</label>' +
        '<input class="aw-input" id="awEtGross" type="text" inputmode="numeric" placeholder="e.g. 20,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awEtCalc">Calculate PAYE</button>' +
      '<div id="awEtResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awEtCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awEtGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awEtResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (ERCA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>Pension (7%, cap ETB 15k)</span><span>-' + fmt(R.pension) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awEtGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awEtCalc').click();
    });
  };
})();

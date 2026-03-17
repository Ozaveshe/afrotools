/**
 * AfroTools — Morocco PAYE Widget (DGI 2025)
 * Real DGI 6-band annual tax, CNSS 4.48% capped from ma-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ma_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'MAD ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // DGI annual bands
    // 0% on 0-30,000; 10% 30,001-50,000; 20% 50,001-60,000; 30% 60,001-80,000; 34% 80,001-180,000; 38% above 180,000
    function calcDGI(taxableIncome) {
      var income = Math.max(0, taxableIncome);
      if (income <= 30000) return { tax: 0 };
      var tax = 0;
      if (income > 30000) tax += Math.min(income - 30000, 20000) * 0.10;
      if (income > 50000) tax += Math.min(income - 50000, 10000) * 0.20;
      if (income > 60000) tax += Math.min(income - 60000, 20000) * 0.30;
      if (income > 80000) tax += Math.min(income - 80000, 100000) * 0.34;
      if (income > 180000) tax += (income - 180000) * 0.38;
      return { tax: tax };
    }

    function calculate(annualGross, includeCNSS) {
      var cnssRaw = annualGross * 0.0448;
      var cnss = includeCNSS ? Math.min(cnssRaw, 72000) : 0;
      var taxable = Math.max(0, annualGross - cnss);
      var r = calcDGI(taxable);
      var net = annualGross - cnss - r.tax;
      return { gross: annualGross, cnss: cnss, taxable: taxable, tax: r.tax, net: net, effectiveRate: annualGross > 0 ? r.tax / annualGross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDE6 Morocco PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Annual Gross Salary (MAD)</label>' +
        '<input class="aw-input" id="awMaGross" type="text" inputmode="numeric" placeholder="e.g. 200,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMaCalc">Calculate Tax</button>' +
      '<div id="awMaResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMaCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awMaGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awMaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (4.48%, cap MAD 72k)</span><span>-' + fmt(R.cnss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>DGI Income Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Monthly Net</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMaCalc').click();
    });
  };
})();

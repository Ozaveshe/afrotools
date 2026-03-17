/**
 * AfroTools — Tanzania PAYE Widget (TRA 2025/26)
 * Real TRA 5-band monthly tax, NSSF 10% from tz-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.tz_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'TZS ' + Math.round(n).toLocaleString('en-TZ'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // TRA monthly bands (on taxable = gross minus NSSF)
    // 0% first 270,000; 8% 270,001-520,000; 20% 520,001-760,000; 25% 760,001-1,000,000; 30% above 1,000,000
    function calcMonthlyPAYE(taxable) {
      var income = Math.max(0, taxable);
      if (income <= 270000) return { tax: 0 };
      var tax = 0;
      if (income > 270000) tax += Math.min(income - 270000, 250000) * 0.08;
      if (income > 520000) tax += Math.min(income - 520000, 240000) * 0.20;
      if (income > 760000) tax += Math.min(income - 760000, 240000) * 0.25;
      if (income > 1000000) tax += (income - 1000000) * 0.30;
      return { tax: tax };
    }

    function calculate(gross, includeNSSF) {
      var nssf = includeNSSF ? gross * 0.10 : 0;
      var taxable = Math.max(0, gross - nssf);
      var r = calcMonthlyPAYE(taxable);
      var net = gross - nssf - r.tax;
      var sdl = gross * 0.035; // employer only
      var wcf = gross * 0.005; // employer only
      return { gross: gross, nssf: nssf, taxable: taxable, tax: r.tax, net: net, sdl: sdl, wcf: wcf, empCost: gross + gross * 0.10 + sdl + wcf, effectiveRate: gross > 0 ? r.tax / gross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF9\uD83C\uDDFF Tanzania PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (TZS)</label>' +
        '<input class="aw-input" id="awTzGross" type="text" inputmode="numeric" placeholder="e.g. 1,500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awTzCalc">Calculate PAYE</button>' +
      '<div id="awTzResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awTzCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awTzGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awTzResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (TRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSF (10%, no cap)</span><span>-' + fmt(R.nssf) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-size:12px;opacity:.7"><span>Employer SDL (3.5%)</span><span>' + fmt(R.sdl) + '</span></div>' +
          '<div class="aw-result-row" style="font-size:12px;opacity:.7"><span>Employer WCF (0.5%)</span><span>' + fmt(R.wcf) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awTzGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awTzCalc').click();
    });
  };
})();

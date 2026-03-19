/**
 * AfroTools — Libya PAYE Widget (MoF 2025)
 * Flat taxes: 10% income tax + 3% Jihad tax + 1% stamp duty
 * Social Security 3.75% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ly_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'LYD ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    function calculate(gross) {
      var ss = gross * 0.0375;
      var incomeTax = gross * 0.10;
      var jihadTax = gross * 0.03;
      var stampDuty = gross * 0.01;
      var totalTax = incomeTax + jihadTax + stampDuty;
      var net = gross - ss - totalTax;
      return {
        gross: gross, ss: ss,
        incomeTax: incomeTax, jihadTax: jihadTax, stampDuty: stampDuty,
        totalTax: totalTax, net: net,
        effectiveRate: gross > 0 ? totalTax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF1\uD83C\uDDFE Libya PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (LYD)</label>' +
        '<input class="aw-input" id="awLyGross" type="text" inputmode="numeric" placeholder="e.g. 5,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awLyCalc">Calculate PAYE</button>' +
      '<div id="awLyResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awLyCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awLyGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awLyResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MoF 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>Social Security (3.75%)</span><span>-' + fmt(R.ss) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Income Tax (10%)</span><span style="color:#dc2626">-' + fmt(R.incomeTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Jihad Tax (3%)</span><span style="color:#dc2626">-' + fmt(R.jihadTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Stamp Duty (1%)</span><span style="color:#dc2626">-' + fmt(R.stampDuty) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awLyGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awLyCalc').click();
    });
  };
})();

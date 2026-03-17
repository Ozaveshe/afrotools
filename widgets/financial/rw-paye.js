/**
 * AfroTools — Rwanda PAYE Widget (RRA 2025/26)
 * Real RRA 3-band monthly tax, RSSB 6% (deductible) from rw-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.rw_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'RWF ' + Math.round(n).toLocaleString('en-RW'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // RRA monthly bands (on taxable = gross minus RSSB)
    // 0% first 30,000; 20% 30,001-100,000; 30% above 100,000
    function calcMonthlyPAYE(taxable) {
      var income = Math.max(0, taxable);
      if (income <= 30000) return { tax: 0 };
      var tax = 0;
      if (income > 30000) tax += Math.min(income - 30000, 70000) * 0.20;
      if (income > 100000) tax += (income - 100000) * 0.30;
      return { tax: tax };
    }

    function calculate(gross, includeRSSB) {
      var rssb = includeRSSB ? gross * 0.06 : 0;
      var taxable = Math.max(0, gross - rssb);
      var r = calcMonthlyPAYE(taxable);
      var empRssb = gross * 0.06;
      var maternity = gross * 0.003;
      var net = gross - rssb - r.tax;
      return { gross: gross, rssb: rssb, taxable: taxable, tax: r.tax, net: net, empRssb: empRssb, maternity: maternity, effectiveRate: gross > 0 ? r.tax / gross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF7\uD83C\uDDFC Rwanda PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (RWF)</label>' +
        '<input class="aw-input" id="awRwGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awRwCalc">Calculate PAYE</button>' +
      '<div id="awRwResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awRwCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awRwGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awRwResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (RRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>RSSB Pension (6%)</span><span>-' + fmt(R.rssb) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-size:12px;opacity:.7"><span>Employer RSSB (6%)</span><span>' + fmt(R.empRssb) + '</span></div>' +
          '<div class="aw-result-row" style="font-size:12px;opacity:.7"><span>Employer Maternity (0.3%)</span><span>' + fmt(R.maternity) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awRwGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awRwCalc').click();
    });
  };
})();

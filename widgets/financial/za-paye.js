/**
 * AfroTools — South Africa PAYE Widget (SARS 2025/26)
 * SARS 7-band annual tax, rebates by age, UIF, retirement deduction
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.za_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'R ' + Math.round(n).toLocaleString('en-ZA'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // SARS 2025/26 annual bands (progressive, limit = band width)
    var BANDS = [
      { limit: 237100, rate: 0.18 },
      { limit: 133400, rate: 0.26 },
      { limit: 142300, rate: 0.31 },
      { limit: 160200, rate: 0.36 },
      { limit: 184900, rate: 0.39 },
      { limit: 959100, rate: 0.41 },
      { limit: Infinity, rate: 0.45 }
    ];

    var REBATES = { under65: 17235, '65to74': 26679, '75plus': 29824 };
    var THRESHOLDS = { under65: 95750, '65to74': 148217, '75plus': 165689 };
    var UIF_MONTHLY_CAP = 17712;
    var RETIREMENT_CAP = 350000;

    function progressiveTax(income) {
      var tax = 0, rem = Math.max(0, income);
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      return tax;
    }

    function compute(gross, ageGroup, retirementInput) {
      var retCap = Math.min(gross * 0.275, RETIREMENT_CAP);
      var retirement = Math.min(retirementInput, retCap);
      var taxableIncome = Math.max(0, gross - retirement);
      var grossTax = progressiveTax(taxableIncome);
      var rebate = REBATES[ageGroup] || REBATES.under65;
      var paye = Math.max(0, grossTax - rebate);
      var uif = Math.min(gross, UIF_MONTHLY_CAP * 12) * 0.01;
      var netAnnual = gross - uif - paye;
      return {
        gross: gross, retirement: retirement,
        taxableIncome: taxableIncome, grossTax: grossTax,
        rebate: rebate, paye: paye, uif: uif,
        netAnnual: netAnnual, netMonthly: netAnnual / 12,
        effectiveRate: gross > 0 ? paye / gross * 100 : 0,
        threshold: THRESHOLDS[ageGroup] || THRESHOLDS.under65
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDFF\uD83C\uDDE6 South Africa PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Annual Gross Income (R)</label>' +
        '<input class="aw-input" id="awZaGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Age Group</label>' +
          '<select class="aw-select" id="awZaAge"><option value="under65">Under 65</option><option value="65to74">65\u201374</option><option value="75plus">75+</option></select>' +
        '</div>' +
        '<div class="aw-field"><label class="aw-label">Retirement (R/yr)</label>' +
          '<input class="aw-input" id="awZaRet" type="text" inputmode="numeric" placeholder="0" value="0">' +
        '</div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awZaCalc">Calculate PAYE</button>' +
      '<div id="awZaResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awZaCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awZaGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var age = container.querySelector('#awZaAge').value;
      var ret = parseFloat((container.querySelector('#awZaRet').value || '').replace(/[^0-9.]/g, '')) || 0;
      var R = compute(gross, age, ret);
      container.querySelector('#awZaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (SARS 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.netMonthly) + '</div>' +
        '</div>' +
        '<div class="aw-result-box">' +
          '<div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div>' +
          (R.retirement > 0 ? '<div class="aw-result-row"><span>Retirement Deduction</span><span>-' + fmt(R.retirement) + '</span></div>' : '') +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxableIncome) + '</span></div>' +
          '<div class="aw-result-row"><span>Gross Tax</span><span>' + fmt(R.grossTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Rebate</span><span>-' + fmt(R.rebate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE</span><span>-' + fmt(R.paye) + '</span></div>' +
          '<div class="aw-result-row"><span>UIF (1%)</span><span>-' + fmt(R.uif) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Annual Net</span><span>' + fmt(R.netAnnual) + '</span></div>' +
          '<div class="aw-result-row"><span>Monthly Net</span><span>' + fmt(R.netMonthly) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awZaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awZaCalc').click();
    });
  };
})();

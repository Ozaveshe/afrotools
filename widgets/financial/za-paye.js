/**
 * AfroTools — South Africa PAYE Widget (SARS 2025/26)
 * Real SARS bands, rebates, UIF from za-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.za_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'R' + Math.round(n).toLocaleString('en-ZA'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // SARS 2025/26 annual bands
    var SARS_BANDS = [
      { from: 1, to: 237100, rate: 0.18 },
      { from: 237101, to: 370500, rate: 0.26 },
      { from: 370501, to: 512800, rate: 0.31 },
      { from: 512801, to: 673000, rate: 0.36 },
      { from: 673001, to: 857900, rate: 0.39 },
      { from: 857901, to: 1817000, rate: 0.41 },
      { from: 1817001, to: Infinity, rate: 0.45 }
    ];

    var REBATES = { under65: 17235, '65to74': 26679, '75plus': 29824 };
    var THRESHOLDS = { under65: 95750, '65to74': 148217, '75plus': 165689 };
    var UIF_ANNUAL_CEILING = 212544;

    function calcTax(taxableIncome) {
      var grossTax = 0;
      for (var i = 0; i < SARS_BANDS.length; i++) {
        var b = SARS_BANDS[i];
        if (taxableIncome < b.from) break;
        var upper = isFinite(b.to) ? b.to : taxableIncome;
        var inc = Math.min(taxableIncome, upper) - (b.from - 1);
        grossTax += inc * b.rate;
        if (taxableIncome <= upper) break;
      }
      return grossTax;
    }

    function compute(gross, ageGroup, retirementRaw, includeUIF, medMembers) {
      var retCap = Math.min(gross * 0.275, 350000);
      var retirement = Math.min(retirementRaw, retCap);
      var taxableIncome = Math.max(0, gross - retirement);
      var grossTax = calcTax(taxableIncome);
      var rebate = REBATES[ageGroup] || REBATES.under65;
      var mtcMonthly = 0;
      if (medMembers >= 1) mtcMonthly += 364;
      if (medMembers >= 2) mtcMonthly += 364;
      if (medMembers >= 3) mtcMonthly += (medMembers - 2) * 246;
      var mtcAnnual = mtcMonthly * 12;
      var paye = Math.max(0, Math.max(0, grossTax - rebate) - mtcAnnual);
      var uifBase = Math.min(gross, UIF_ANNUAL_CEILING);
      var uif = includeUIF ? uifBase * 0.01 : 0;
      var netAnnual = gross - uif - paye;
      return { gross: gross, retirement: retirement, taxableIncome: taxableIncome, grossTax: grossTax, rebate: rebate, mtcAnnual: mtcAnnual, paye: paye, uif: uif, netAnnual: netAnnual, netMonthly: netAnnual / 12, effectiveRate: gross > 0 ? paye / gross * 100 : 0, threshold: THRESHOLDS[ageGroup] || THRESHOLDS.under65 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDFF\uD83C\uDDE6 South Africa PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Annual Gross Income (R)</label>' +
        '<input class="aw-input" id="awZaGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Age Group</label>' +
          '<select class="aw-select" id="awZaAge"><option value="under65">Under 65</option><option value="65to74">65-74</option><option value="75plus">75+</option></select>' +
        '</div>' +
        '<div class="aw-field"><label class="aw-label">Retirement (R/yr)</label>' +
          '<input class="aw-input" id="awZaRet" type="text" inputmode="numeric" placeholder="0" value="0">' +
        '</div>' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Medical Members</label>' +
          '<select class="aw-select" id="awZaMed"><option value="0">None</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select>' +
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
      var med = parseInt(container.querySelector('#awZaMed').value) || 0;
      var R = compute(gross, age, ret, true, med);
      container.querySelector('#awZaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (SARS 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.netMonthly) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div>' +
          (R.retirement > 0 ? '<div class="aw-result-row"><span>Retirement Deduction</span><span>-' + fmt(R.retirement) + '</span></div>' : '') +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxableIncome) + '</span></div>' +
          '<div class="aw-result-row"><span>Gross Tax</span><span>' + fmt(R.grossTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Rebate</span><span>-' + fmt(R.rebate) + '</span></div>' +
          (R.mtcAnnual > 0 ? '<div class="aw-result-row"><span>Medical Credits</span><span>-' + fmt(R.mtcAnnual) + '</span></div>' : '') +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE</span><span style="color:#dc2626">-' + fmt(R.paye) + '</span></div>' +
          '<div class="aw-result-row"><span>UIF (1%)</span><span style="color:#dc2626">-' + fmt(R.uif) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.netAnnual) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Monthly Net</span><span style="color:#007AFF">' + fmt(R.netMonthly) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awZaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awZaCalc').click();
    });
  };
})();

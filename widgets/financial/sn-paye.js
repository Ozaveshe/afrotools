/**
 * AfroTools — Senegal PAYE Widget (DGID 2025)
 * Real bands: 0% first XOF 630k; 20% 630k-1.5M; 30% 1.5M-4M; 35% 4M-8M; 37% 8M-13.5M; 40% above 13.5M
 * CSS 5.6% employee (deductible)
 */
(function(){
'use strict';
window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.sn_paye = function(container, opts) {
  opts = opts || {};
  var fmt = function(n){ return 'XOF ' + Math.round(n).toLocaleString('en'); };
  var pct = function(r){ return r.toFixed(1) + '%'; };
  var BANDS = [
    { limit: 630000, rate: 0 }, { limit: 870000, rate: 0.20 }, { limit: 2500000, rate: 0.30 },
    { limit: 4000000, rate: 0.35 }, { limit: 5500000, rate: 0.37 }, { limit: Infinity, rate: 0.40 }
  ];
  function calculate(gross) {
    var css = gross * 0.056;
    var taxable = Math.max(0, gross - css), tax = 0, rem = taxable;
    for (var i = 0; i < BANDS.length; i++) { if (rem <= 0) break; var b = BANDS[i]; var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem); tax += chunk * b.rate; rem -= chunk; }
    return { gross: gross, css: css, taxable: taxable, tax: tax, net: gross - css - tax, effectiveRate: gross > 0 ? tax / gross * 100 : 0 };
  }
  container.innerHTML = '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDF3 Senegal PAYE Calculator</div><div class="aw-field"><label class="aw-label">Annual Gross Salary (XOF)</label><input class="aw-input" id="awSnG" type="text" inputmode="numeric" placeholder="e.g. 12,000,000"></div><button class="aw-btn aw-btn--primary" id="awSnC">Calculate PAYE</button><div id="awSnR"></div>' + (opts.footerHTML || '');
  container.querySelector('#awSnC').addEventListener('click', function() {
    var gross = parseFloat((container.querySelector('#awSnG').value || '').replace(/[^0-9.]/g, '')) || 0; if (!gross) return;
    var R = calculate(gross);
    container.querySelector('#awSnR').innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly Take-Home (DGID 2025)</div><div class="aw-result-main">' + fmt(R.net / 12) + '</div></div><div style="margin-top:12px"><div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div><div class="aw-result-row"><span>CSS (5.6%)</span><span>-' + fmt(R.css) + '</span></div><div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div><hr class="aw-divider"><div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div><div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div><hr class="aw-divider"><div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div><div class="aw-result-row" style="font-weight:700"><span>Monthly Net</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div></div>';
  });
  container.querySelector('#awSnG').addEventListener('keydown', function(e) { if (e.key === 'Enter') container.querySelector('#awSnC').click(); });
};
})();

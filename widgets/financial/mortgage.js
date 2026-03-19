(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.mortgage = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Mortgage Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Loan Amount</label><input class="aw-input" id="aw-loan" type="number" min="0" inputmode="decimal" placeholder="e.g. 500000"></div>' +
      '<div class="aw-field"><label class="aw-label">Annual Interest Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 10"></div>' +
      '<div class="aw-field"><label class="aw-label">Loan Term (years)</label><input class="aw-input" id="aw-term" type="number" min="1" max="50" inputmode="numeric" value="20"></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var P = parseFloat(container.querySelector('#aw-loan').value) || 0;
      var annualRate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var years = parseInt(container.querySelector('#aw-term').value) || 0;
      if (P <= 0 || annualRate <= 0 || years <= 0) return;

      var r = annualRate / 100 / 12;
      var n = years * 12;
      var monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      var totalPaid = monthly * n;
      var totalInterest = totalPaid - P;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Monthly Payment</div>' +
        '<div class="aw-result-main">' + fmt(monthly) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Interest</span><span>' + fmt(totalInterest) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Paid</span><span>' + fmt(totalPaid) + '</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

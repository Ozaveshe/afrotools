(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.car_loan = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Car Loan Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Vehicle Price</label><input class="aw-input" id="aw-price" type="number" min="0" inputmode="decimal" placeholder="e.g. 5000000"></div>' +
      '<div class="aw-field"><label class="aw-label">Down Payment</label><input class="aw-input" id="aw-down" type="number" min="0" inputmode="decimal" value="0"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Interest Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.1" inputmode="decimal" value="15"></div>' +
        '<div class="aw-field"><label class="aw-label">Term (months)</label><input class="aw-input" id="aw-term" type="number" min="1" inputmode="numeric" value="48"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var price = parseFloat(container.querySelector('#aw-price').value) || 0;
      var down = parseFloat(container.querySelector('#aw-down').value) || 0;
      var rate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var term = parseInt(container.querySelector('#aw-term').value) || 0;
      if (price <= 0 || term <= 0) return;

      var loan = Math.max(0, price - down);
      var r = rate / 100 / 12;
      var monthly = r > 0 ? loan * r * Math.pow(1 + r, term) / (Math.pow(1 + r, term) - 1) : loan / term;
      var totalPaid = monthly * term;
      var totalInterest = totalPaid - loan;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Monthly Payment</div>' +
        '<div class="aw-result-main">' + fmt(monthly) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Loan Amount</span><span>' + fmt(loan) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Interest</span><span>' + fmt(totalInterest) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Cost</span><span>' + fmt(totalPaid + down) + '</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

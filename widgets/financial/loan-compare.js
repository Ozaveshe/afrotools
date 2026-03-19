(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.loan_compare = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function loanFields(n) {
      return '<div style="flex:1;min-width:180px">' +
        '<div class="aw-title" style="font-size:0.95rem">Loan ' + n + '</div>' +
        '<div class="aw-field"><label class="aw-label">Amount</label><input class="aw-input" id="aw-amt' + n + '" type="number" min="0" inputmode="decimal" placeholder="e.g. 500000"></div>' +
        '<div class="aw-field"><label class="aw-label">Rate (%)</label><input class="aw-input" id="aw-rate' + n + '" type="number" min="0" step="0.01" inputmode="decimal" placeholder="15"></div>' +
        '<div class="aw-field"><label class="aw-label">Term (months)</label><input class="aw-input" id="aw-term' + n + '" type="number" min="1" inputmode="numeric" placeholder="60"></div>' +
        '<div class="aw-field"><label class="aw-label">Fees</label><input class="aw-input" id="aw-fees' + n + '" type="number" min="0" inputmode="decimal" value="0"></div>' +
        '<div class="aw-result-box" id="aw-res' + n + '" style="display:none"></div>' +
      '</div>';
    }

    container.innerHTML =
      '<div class="aw-title">Loan Comparison</div>' +
      '<div class="aw-row">' + loanFields(1) + loanFields(2) + '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc" style="margin-top:8px">Compare Loans</button>' +
      '<div class="aw-result-box" id="aw-verdict" style="display:none"></div>' +
      (opts.footerHTML || '');

    function calcLoan(n) {
      var amt = parseFloat(container.querySelector('#aw-amt' + n).value) || 0;
      var rate = parseFloat(container.querySelector('#aw-rate' + n).value) || 0;
      var term = parseInt(container.querySelector('#aw-term' + n).value) || 0;
      var fees = parseFloat(container.querySelector('#aw-fees' + n).value) || 0;
      if (amt <= 0 || rate <= 0 || term <= 0) return null;

      var principal = amt + fees;
      var r = rate / 100 / 12;
      var monthly = principal * r * Math.pow(1 + r, term) / (Math.pow(1 + r, term) - 1);
      var totalCost = monthly * term;
      var totalInterest = totalCost - principal;

      var res = container.querySelector('#aw-res' + n);
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-row"><span class="aw-result-label">Monthly</span><span>' + fmt(monthly) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Interest</span><span>' + fmt(totalInterest) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total</span><span>' + fmt(totalCost) + '</span></div>';

      return { monthly: monthly, interest: totalInterest, total: totalCost };
    }

    function calc() {
      var r1 = calcLoan(1);
      var r2 = calcLoan(2);
      var verdict = container.querySelector('#aw-verdict');
      if (r1 && r2) {
        verdict.style.display = 'block';
        if (r1.total < r2.total) {
          verdict.innerHTML = '<div class="aw-result-main">Loan 1 saves ' + fmt(r2.total - r1.total) + '</div>';
        } else if (r2.total < r1.total) {
          verdict.innerHTML = '<div class="aw-result-main">Loan 2 saves ' + fmt(r1.total - r2.total) + '</div>';
        } else {
          verdict.innerHTML = '<div class="aw-result-main">Both loans cost the same</div>';
        }
      }
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

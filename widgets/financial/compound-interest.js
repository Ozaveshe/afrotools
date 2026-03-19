(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.compound_interest = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Compound Interest Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Principal</label><input class="aw-input" id="aw-principal" type="number" min="0" inputmode="decimal" placeholder="e.g. 100000"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Annual Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.1" inputmode="decimal" value="10"></div>' +
        '<div class="aw-field"><label class="aw-label">Years</label><input class="aw-input" id="aw-years" type="number" min="1" inputmode="numeric" value="5"></div>' +
      '</div>' +
      '<div class="aw-field"><label class="aw-label">Compounding</label><select class="aw-select" id="aw-n"><option value="1">Annually</option><option value="4">Quarterly</option><option value="12" selected>Monthly</option><option value="365">Daily</option></select></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var P = parseFloat(container.querySelector('#aw-principal').value) || 0;
      var rate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var t = parseInt(container.querySelector('#aw-years').value) || 0;
      var n = parseInt(container.querySelector('#aw-n').value) || 12;
      if (P <= 0 || t <= 0) return;

      var r = rate / 100;
      var A = P * Math.pow(1 + r / n, n * t);
      var interest = A - P;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Final Amount</div>' +
        '<div class="aw-result-main">' + fmt(A) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Interest Earned</span><span>' + fmt(interest) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Principal</span><span>' + fmt(P) + '</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

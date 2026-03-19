(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.inflation_calc = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Inflation Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Current Amount</label><input class="aw-input" id="aw-amt" type="number" min="0" inputmode="decimal" placeholder="e.g. 100000"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Inflation Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.1" inputmode="decimal" value="10"></div>' +
        '<div class="aw-field"><label class="aw-label">Years</label><input class="aw-input" id="aw-years" type="number" min="1" max="50" inputmode="numeric" value="5"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var amt = parseFloat(container.querySelector('#aw-amt').value) || 0;
      var rate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var years = parseInt(container.querySelector('#aw-years').value) || 0;
      if (amt <= 0 || years <= 0) return;

      var purchasingPower = amt / Math.pow(1 + rate / 100, years);
      var lost = amt - purchasingPower;
      var futureEquiv = amt * Math.pow(1 + rate / 100, years);

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Future Purchasing Power</div>' +
        '<div class="aw-result-main">' + fmt(purchasingPower) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Purchasing Power Lost</span><span>' + fmt(lost) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">You\'d Need</span><span>' + fmt(futureEquiv) + ' to match today</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

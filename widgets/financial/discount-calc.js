(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.discount_calc = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Discount Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Original Price</label><input class="aw-input" id="aw-orig" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Discount 1 (%)</label><input class="aw-input" id="aw-d1" type="number" min="0" max="100" step="0.1" inputmode="decimal" placeholder="e.g. 20"></div>' +
        '<div class="aw-field"><label class="aw-label">Discount 2 (%)</label><input class="aw-input" id="aw-d2" type="number" min="0" max="100" step="0.1" inputmode="decimal" placeholder="0" value="0"></div>' +
      '</div>' +
      '<div class="aw-field"><label class="aw-label">Tax % (optional)</label><input class="aw-input" id="aw-tax" type="number" min="0" step="0.1" inputmode="decimal" value="0"></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var orig = parseFloat(container.querySelector('#aw-orig').value) || 0;
      var d1 = parseFloat(container.querySelector('#aw-d1').value) || 0;
      var d2 = parseFloat(container.querySelector('#aw-d2').value) || 0;
      var tax = parseFloat(container.querySelector('#aw-tax').value) || 0;
      if (orig <= 0) return;

      var price = orig * (1 - d1 / 100);
      if (d2 > 0) price = price * (1 - d2 / 100);
      var beforeTax = price;
      if (tax > 0) price = price * (1 + tax / 100);

      var savings = orig - beforeTax;
      var effectiveDiscount = (savings / orig) * 100;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Final Price</div>' +
        '<div class="aw-result-main">' + fmt(price) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Savings</span><span>' + fmt(savings) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Effective Discount</span><span>' + effectiveDiscount.toFixed(1) + '%</span></div>' +
        (tax > 0 ? '<div class="aw-result-row"><span class="aw-result-label">Tax Added</span><span>' + fmt(price - beforeTax) + '</span></div>' : '');
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

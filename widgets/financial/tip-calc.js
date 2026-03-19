(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.tip_calc = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Tip Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Bill Amount</label><input class="aw-input" id="aw-bill" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Tip %</label><input class="aw-input" id="aw-pct" type="number" min="0" max="100" inputmode="numeric" value="15"></div>' +
        '<div class="aw-field"><label class="aw-label">Split</label><input class="aw-input" id="aw-split" type="number" min="1" max="50" inputmode="numeric" value="1"></div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="aw-quick"></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var quickTips = [10, 15, 18, 20, 25];
    var quickEl = container.querySelector('#aw-quick');
    quickTips.forEach(function(p) {
      var b = document.createElement('button');
      b.className = 'aw-btn';
      b.textContent = p + '%';
      b.addEventListener('click', function() {
        container.querySelector('#aw-pct').value = p;
        calc();
      });
      quickEl.appendChild(b);
    });

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var bill = parseFloat(container.querySelector('#aw-bill').value) || 0;
      var pct = parseFloat(container.querySelector('#aw-pct').value) || 0;
      var split = parseInt(container.querySelector('#aw-split').value) || 1;
      if (bill <= 0) return;

      var tip = bill * pct / 100;
      var total = bill + tip;
      var perPerson = total / split;
      var tipPer = tip / split;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-row"><span class="aw-result-label">Tip Amount</span><span class="aw-result-main">' + fmt(tip) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total</span><span class="aw-result-main">' + fmt(total) + '</span></div>' +
        (split > 1 ? '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span class="aw-result-label">Per Person</span><span class="aw-result-main">' + fmt(perPerson) + '</span></div>' +
          '<div class="aw-result-row"><span class="aw-result-label">Tip Per Person</span><span>' + fmt(tipPer) + '</span></div>' : '');
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

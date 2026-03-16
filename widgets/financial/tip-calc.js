(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.tip_calc = function(container, opts) {
    var t = opts.theme || 'light';
    container.innerHTML =
      '<div class="aw-title">💳 Tip Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Bill Amount</label><input class="aw-input" id="aw-bill" type="number" min="0" step="0.01" placeholder="0.00"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Tip %</label><input class="aw-input" id="aw-tip-pct" type="number" min="0" max="100" value="15"></div>' +
        '<div class="aw-field"><label class="aw-label">Split</label><input class="aw-input" id="aw-split" type="number" min="1" max="50" value="1"></div>' +
      '</div>' +
      '<div class="aw-field" style="display:flex;gap:6px;flex-wrap:wrap" id="aw-quick-tips"></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var quickTips = [10, 15, 18, 20, 25];
    var quickContainer = container.querySelector('#aw-quick-tips');
    quickTips.forEach(function(p) {
      var b = document.createElement('button');
      b.textContent = p + '%';
      b.style.cssText = 'padding:6px 14px;border-radius:6px;border:1.5px solid #e2e8f0;background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:inherit';
      b.addEventListener('click', function() {
        container.querySelector('#aw-tip-pct').value = p;
        calc();
      });
      quickContainer.appendChild(b);
    });

    function calc() {
      var bill = parseFloat(container.querySelector('#aw-bill').value) || 0;
      var pct = parseFloat(container.querySelector('#aw-tip-pct').value) || 0;
      var split = parseInt(container.querySelector('#aw-split').value) || 1;
      if (bill <= 0) return;
      var tip = bill * pct / 100;
      var total = bill + tip;
      var perPerson = total / split;
      var tipPer = tip / split;
      var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };
      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-row"><span class="aw-result-label">Tip Amount</span><span class="aw-result-main">' + fmt(tip) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total</span><span class="aw-result-main">' + fmt(total) + '</span></div>' +
        (split > 1 ? '<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Per Person</span><span class="aw-result-main">' + fmt(perPerson) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Tip Per Person</span><span>' + fmt(tipPer) + '</span></div>' : '');
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

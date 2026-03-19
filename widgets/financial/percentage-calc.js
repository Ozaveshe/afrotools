(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.percentage_calc = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Percentage Calculator</div>' +
      '<div class="aw-tabs" id="aw-tabs">' +
        '<button class="aw-tab aw-tab--active" data-mode="0">X% of Y</button>' +
        '<button class="aw-tab" data-mode="1">X is ?% of Y</button>' +
        '<button class="aw-tab" data-mode="2">% Change</button>' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label" id="aw-lbl1">Percentage</label><input class="aw-input" id="aw-v1" type="number" step="any" inputmode="decimal" placeholder="0"></div>' +
        '<div class="aw-field"><label class="aw-label" id="aw-lbl2">Value</label><input class="aw-input" id="aw-v2" type="number" step="any" inputmode="decimal" placeholder="0"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };
    var mode = 0;
    var labels = [['Percentage', 'Value'], ['X', 'Y'], ['Old Value', 'New Value']];

    var tabs = container.querySelectorAll('.aw-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('aw-tab--active'); });
        tab.classList.add('aw-tab--active');
        mode = parseInt(tab.getAttribute('data-mode'));
        container.querySelector('#aw-lbl1').textContent = labels[mode][0];
        container.querySelector('#aw-lbl2').textContent = labels[mode][1];
        container.querySelector('#aw-res').style.display = 'none';
      });
    });

    function calc() {
      var a = parseFloat(container.querySelector('#aw-v1').value) || 0;
      var b = parseFloat(container.querySelector('#aw-v2').value) || 0;
      var result, label;

      if (mode === 0) {
        result = a * b / 100;
        label = a + '% of ' + b;
      } else if (mode === 1) {
        if (b === 0) return;
        result = (a / b) * 100;
        label = a + ' is ' + result.toFixed(2) + '% of ' + b;
      } else {
        if (a === 0) return;
        result = ((b - a) / a) * 100;
        label = 'Change from ' + a + ' to ' + b;
      }

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">' + label + '</div>' +
        '<div class="aw-result-main">' + fmt(result) + (mode !== 0 ? '%' : '') + '</div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();

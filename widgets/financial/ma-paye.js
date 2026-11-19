(function () {
  'use strict';
  var script = document.currentScript;
  var engineUrl = new URL('../../engines/morocco-paye.js', script.src).href;
  var enginePromise;
  function loadSalary() {
    if (window.AfroTools && window.AfroTools.moroccoPaye) return Promise.resolve(window.AfroTools.moroccoPaye);
    if (!enginePromise) enginePromise = new Promise(function (resolve, reject) {
      var dependency = document.createElement('script');
      dependency.src = engineUrl;
      dependency.onload = function () { resolve(window.AfroTools.moroccoPaye); };
      dependency.onerror = function () { enginePromise = null; reject(new Error('Calculator unavailable. Try again.')); };
      document.head.appendChild(dependency);
    });
    return enginePromise;
  }
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.ma_paye = function (root) {
    root.innerHTML = '<div class="aw-title">Morocco salary estimate · 2026</div><form><label class="aw-label">Monthly gross salary (MAD)<input class="aw-input" id="awMaGross" type="number" min="0.01" step="0.01" required></label><button class="aw-btn aw-btn--primary" id="awMaCalc">Calculate PAYE</button></form><div id="awMaResult" role="status"></div>';
    var input = root.querySelector('input');
    var output = root.querySelector('[role=status]');
    var format = new Intl.NumberFormat('en', { style: 'currency', currency: 'MAD' });
    input.addEventListener('input', function () { output.textContent = ''; });
    root.querySelector('form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var gross = input.valueAsNumber;
      try {
        var api = await loadSalary();
        if (gross !== input.valueAsNumber) return;
        var r = api.calculate(gross, 'monthly');
        output.replaceChildren();
        var rows = [['Monthly net pay', r.annualNet / 12], ['Monthly income tax', r.incomeTax / 12], ['Monthly CNSS', r.cnss / 12], ['Monthly AMO', r.amo / 12], ['Monthly taxable income', r.taxable / 12], ['Annual net pay', r.annualNet]];
        rows.forEach(function (row) {
          var line = document.createElement('p'); line.className = 'aw-result-row'; line.textContent = row[0] + ' · ' + format.format(row[1]); output.appendChild(line);
        });
        output.append('Equal monthly salary, ordinary private sector, no dependants. CNSS rates are planning assumptions.');
      } catch (error) { output.textContent = 'Unable to estimate this salary. Check the amount and try again.'; }
    });
  };
})();

(function () {
  'use strict';

  function initialize() {
    var button = document.querySelector('.calc-btn');
    var input = document.getElementById('grossSalary');
    var label = document.querySelector('.f-label-text');
    if (!button || !input || typeof window._grossToNet !== 'function') return;
    var forward = window.calculate;
    var mode = 'gross';
    var modes = document.createElement('div');
    modes.className = 'mode-toggle';
    modes.innerHTML = '<button type="button" class="mode-btn on" data-mode="gross" aria-pressed="true">Gross → Net</button><button type="button" class="mode-btn" data-mode="net" aria-pressed="false">Net → Gross</button>';
    button.parentNode.insertBefore(modes, button);
    var originalLabel = label ? label.textContent : '';

    modes.addEventListener('click', function (event) {
      var selected = event.target.closest('[data-mode]');
      if (!selected) return;
      mode = selected.dataset.mode;
      modes.querySelectorAll('button').forEach(function (item) {
        item.classList.toggle('on', item === selected);
        item.setAttribute('aria-pressed', String(item === selected));
      });
      if (label) label.textContent = mode === 'net' ? 'Desired annual take-home (K)' : originalLabel;
      window.clearCalculation('Enter an annual amount and calculate.');
    });

    window.calculate = function () {
      if (mode === 'gross') return forward();
      var target = Number(input.value);
      var basicText = document.getElementById('basicSalary').value.trim();
      var basic = basicText === '' ? 0 : Number(basicText);
      if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(basic) || basic < 0) {
        window.clearCalculation('Enter a positive take-home amount and a non-negative basic salary.');
        return;
      }
      var lower = Math.max(target, basic);
      if (window._grossToNet(lower) > target + 0.01) {
        window.clearCalculation('The desired take-home is too low for this basic salary. Reduce the basic salary or increase the take-home amount.');
        return;
      }
      var upper = Math.max(lower * 2, 1);
      for (var expansion = 0; expansion < 32 && window._grossToNet(upper) < target; expansion++) upper *= 2;
      if (!Number.isFinite(upper) || window._grossToNet(upper) < target) {
        window.clearCalculation('Could not find a gross salary for this amount. Check the inputs.');
        return;
      }
      for (var iteration = 0; iteration < 80; iteration++) {
        var mid = (lower + upper) / 2;
        if (window._grossToNet(mid) < target) lower = mid;
        else upper = mid;
      }
      var gross = Math.round(upper * 100) / 100;
      input.value = String(gross);
      try { forward(); } finally { input.value = String(target); }
      if (window.RESULT) {
        document.getElementById('calculationStatus').textContent += ' Required annual gross salary: ' + window.fmt(gross) + '.';
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}());

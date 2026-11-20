(function () {
  'use strict';

  function initialize() {
    var button = document.querySelector('.calc-btn');
    var input = document.getElementById('grossSalary');
    var label = document.querySelector('.f-label-text');
    var sliderLabel = document.querySelector('.slider-label');
    var sw = document.documentElement.lang === 'sw';
    if (!button || !input || typeof window._grossToNet !== 'function') return;
    var forward = window.calculate;
    var mode = 'gross';
    window.CALC_MODE = mode;
    var modes = document.createElement('div');
    modes.className = 'mode-toggle';
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', sw ? 'Mwelekeo wa hesabu' : 'Calculation direction');
    modes.innerHTML = '<button type="button" class="mode-btn on" data-mode="gross" aria-pressed="true">' + (sw ? 'Ghafi → Halisi' : 'Gross → Net') + '</button><button type="button" class="mode-btn" data-mode="net" aria-pressed="false">' + (sw ? 'Halisi → Ghafi' : 'Net → Gross') + '</button>';
    button.parentNode.insertBefore(modes, button);
    var originalLabel = label ? label.textContent : '';
    var originalSliderLabel = sliderLabel ? sliderLabel.textContent : '';
    var originalAriaLabel = input.getAttribute('aria-label');

    modes.addEventListener('click', function (event) {
      var selected = event.target.closest('[data-mode]');
      if (!selected || selected.dataset.mode === mode) return;
      mode = selected.dataset.mode;
      window.CALC_MODE = mode;
      if (window.RESULT) input.value = String(Math.round((mode === 'net' ? window.RESULT.netAnnual : window.RESULT.gross) * 100) / 100);
      var slider = document.getElementById('salarySlider');
      if (slider) slider.value = input.value;
      modes.querySelectorAll('button').forEach(function (item) {
        item.classList.toggle('on', item === selected);
        item.setAttribute('aria-pressed', String(item === selected));
      });
      var annualTargetLabel = sw ? 'Mshahara halisi wa mwaka unaolengwa (K)' : 'Desired annual take-home (K)';
      if (label) label.textContent = mode === 'net' ? annualTargetLabel : originalLabel;
      if (sliderLabel) sliderLabel.textContent = mode === 'net' ? annualTargetLabel : originalSliderLabel;
      if (mode === 'net') input.setAttribute('aria-label', annualTargetLabel);
      else if (originalAriaLabel) input.setAttribute('aria-label', originalAriaLabel);
      else input.removeAttribute('aria-label');
      window.clearCalculation(sw ? 'Weka kiasi cha mwaka kisha ukokotoe.' : 'Enter an annual amount and calculate.');
    });

    window.calculate = function () {
      if (mode === 'gross') return forward();
      var target = Number(input.value);
      var basicInput = document.getElementById('basicSalary');
      var basicText = basicInput ? basicInput.value.trim() : '';
      var basic = basicText === '' ? 0 : Number(basicText);
      if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(basic) || basic < 0) {
        window.clearCalculation(sw ? 'Weka mshahara halisi wa mwaka ulio zaidi ya sifuri.' : 'Enter a positive take-home amount and a non-negative basic salary.');
        return;
      }
      var lower = Math.max(target, basic);
      if (window._grossToNet(lower) > target + 0.01) {
        window.clearCalculation(sw ? 'Kiasi halisi kinacholengwa ni kidogo mno kwa mshahara huu wa msingi.' : 'The desired take-home is too low for this basic salary. Reduce the basic salary or increase the take-home amount.');
        return;
      }
      var upper = Math.max(lower * 2, 1);
      for (var expansion = 0; expansion < 32 && window._grossToNet(upper) < target; expansion++) upper *= 2;
      if (!Number.isFinite(upper) || window._grossToNet(upper) < target) {
        window.clearCalculation(sw ? 'Hesabu haikupata mshahara ghafi. Hakiki kiasi ulichoandika.' : 'Could not find a gross salary for this amount. Check the inputs.');
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
        document.getElementById('calculationStatus').textContent = (sw ? 'Mshahara ghafi wa mwaka unaohitajika: K ' : 'Required annual gross salary: K ') + gross.toLocaleString(sw ? 'sw-ZM' : 'en-ZM', { maximumFractionDigits: 2 }) + '.';
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}());

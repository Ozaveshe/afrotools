/* global RESULT, PERIOD, fmt */
(function () {
  'use strict';

  function initialize() {
    var button = document.querySelector('.calc-btn');
    var input = document.getElementById('grossSalary');
    var card = document.getElementById('resultsCard');
    if (!button || !input || !card || typeof window._grossToNet !== 'function') return;
    var forward = window.calculate;
    var changePeriod = window.setPeriod;
    var mode = 'gross';
    var label = document.querySelector('.f-label-text');
    var sliderLabel = document.querySelector('.slider-label');
    var originalLabel = label ? label.textContent : '';
    var originalSliderLabel = sliderLabel ? sliderLabel.textContent : '';
    var modes = document.createElement('div');
    modes.className = 'mode-toggle';
    modes.innerHTML = '<button type="button" class="mode-btn on" data-mode="gross" aria-pressed="true">Gross → Net</button><button type="button" class="mode-btn" data-mode="net" aria-pressed="false">Net → Gross</button>';
    button.parentNode.insertBefore(modes, button);
    var status = document.createElement('p');
    status.id = 'zimbabwe-paye-status';
    status.className = 'tool-inline-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    button.insertAdjacentElement('afterend', status);

    function result() { return typeof RESULT === 'undefined' ? null : RESULT; }
    function period() { return typeof PERIOD === 'undefined' ? 'annual' : PERIOD; }
    function money(value) { return fmt(value); }
    function syncInput() {
      var slider = document.getElementById('salarySlider');
      var display = document.getElementById('sliderVal');
      if (slider) slider.value = input.value;
      if (display) display.textContent = money(Number(input.value));
    }
    function clear(message, invalid) {
      RESULT = null;
      card.classList.remove('on');
      status.textContent = message;
      input.setAttribute('aria-invalid', String(!!invalid));
      var ai = document.getElementById('aiBtn');
      if (ai) { ai.disabled = true; ai.textContent = 'Calculate first to unlock →'; }
    }
    function paint() {
      var current = result();
      if (!current) return;
      card.hidden = false;
      card.style.removeProperty('display');
      card.removeAttribute('aria-hidden');
      card.classList.add('on');
      var monthly = period() === 'monthly';
      var unit = monthly ? 'month' : 'year';
      var title = monthly ? 'Monthly' : 'Annual';
      var gross = monthly ? current.monthlyGross : current.gross;
      var net = monthly ? current.monthlyNet : current.netAnnual;
      document.querySelector('.res-hero-label').textContent = mode === 'net'
        ? 'Required ' + title + ' Gross Salary' : title + ' Take-Home Pay';
      document.getElementById('resAmount').textContent = money(mode === 'net' ? gross : net);
      document.getElementById('resGross').textContent = 'Gross: ' + money(gross) + '/' + unit
        + ' · Take-home: ' + money(net) + '/' + unit;
      status.textContent = mode === 'net'
        ? 'Required annual gross salary: ' + money(current.gross) + '.'
        : 'Calculation updated.';
    }
    function selectMode(selected) {
      clearTimeout(window._sliderDebounce);
      var previous = result();
      mode = selected.dataset.mode;
      window.CALC_MODE = mode;
      modes.querySelectorAll('button').forEach(function (item) {
        item.classList.toggle('on', item === selected);
        item.setAttribute('aria-pressed', String(item === selected));
      });
      if (previous) input.value = String(Math.round(mode === 'net' ? previous.netAnnual : previous.gross));
      if (label) label.textContent = mode === 'net' ? 'Desired annual take-home (USD)' : originalLabel;
      if (sliderLabel) sliderLabel.textContent = mode === 'net' ? 'Desired Annual Take-Home' : originalSliderLabel;
      input.setAttribute('aria-label', mode === 'net' ? 'Desired annual take-home in US dollars' : 'Annual gross salary in US dollars');
      var slider = document.getElementById('salarySlider');
      if (slider) slider.setAttribute('aria-label', input.getAttribute('aria-label'));
      syncInput();
      clear('Enter an annual amount and calculate.', false);
    }
    modes.addEventListener('click', function (event) {
      var selected = event.target.closest('[data-mode]');
      if (selected) selectMode(selected);
    });
    window.setCalcMode = function (selectedMode, selectedButton) {
      var selected = selectedButton && selectedButton.dataset.mode === selectedMode
        ? selectedButton : modes.querySelector('[data-mode="' + (selectedMode === 'net' ? 'net' : 'gross') + '"]');
      selectMode(selected);
    };
    window.CALC_MODE = 'gross';
    window.calculate = function () {
      clearTimeout(window._sliderDebounce);
      var entered = Number(input.value);
      if (!Number.isFinite(entered) || entered <= 0) {
        clear('Enter a positive annual amount in US dollars.', true);
        input.focus();
        return;
      }
      input.setAttribute('aria-invalid', 'false');
      if (mode === 'gross') {
        forward();
        paint();
        return;
      }
      // Invert the existing annual forward calculation; keep its tax and pension rules.
      var lower = Math.ceil(entered);
      var upper = Math.max(lower * 2, 1);
      for (var expansion = 0; expansion < 32 && window._grossToNet(upper) < entered; expansion++) upper *= 2;
      if (!Number.isSafeInteger(upper) || window._grossToNet(upper) < entered) {
        clear('Could not find a gross salary for this amount. Check the input.', true);
        return;
      }
      while (lower < upper) {
        var middle = Math.floor((lower + upper) / 2);
        if (window._grossToNet(middle) >= entered) upper = middle;
        else lower = middle + 1;
      }
      input.value = String(upper);
      try { forward(); } finally { input.value = String(entered); syncInput(); }
      paint();
    };
    window.setPeriod = function (selected, periodButton) {
      changePeriod(selected, periodButton);
      paint();
    };
    input.setAttribute('aria-label', 'Annual gross salary in US dollars');
    input.addEventListener('beforeinput', function () { clearTimeout(window._sliderDebounce); });
    var salarySlider = document.getElementById('salarySlider');
    if (salarySlider) salarySlider.setAttribute('aria-label', input.getAttribute('aria-label'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
}());

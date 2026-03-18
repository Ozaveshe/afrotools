/**
 * AFROTOOLS — Net-to-Gross Reverse Calculator
 * ═══════════════════════════════════════════════════════════
 * Shared library that adds "Net → Gross" mode to any PAYE calculator.
 *
 * Requirements:
 *   1. Page must define window._grossToNet(gross) → net (pure function)
 *   2. Page must have .calc-btn, #resAmount, #resLabel, #resGross, #grossSalary
 *   3. Page must set window.RESULT after calculate()
 *
 * Usage (in each PAYE page, before </script>):
 *   window._grossToNet = function(g) {
 *     const social = isOn('nssf') ? g * 0.10 : 0;
 *     return g - social - calcMonthlyPAYE(g - social).tax;
 *   };
 */
(function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────
  window.CALC_MODE = window.CALC_MODE || 'gross';

  // ── BINARY SEARCH ────────────────────────────────────────
  function reverseCalc(desiredNet) {
    const fn = window._grossToNet;
    if (!fn) return desiredNet;
    let lo = desiredNet, hi = desiredNet * 3;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const net = fn(mid);
      if (Math.abs(net - desiredNet) < 1) return mid;
      if (net < desiredNet) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ── INJECT MODE TOGGLE UI ────────────────────────────────
  function injectToggle() {
    const calcBtn = document.querySelector('.calc-btn');
    if (!calcBtn || !window._grossToNet) return;
    if (document.querySelector('.mode-toggle')) return; // already injected

    const toggle = document.createElement('div');
    toggle.className = 'mode-toggle';
    toggle.innerHTML = `
      <button class="mode-btn on" onclick="setCalcMode('gross',this)">Gross &rarr; Net</button>
      <button class="mode-btn" onclick="setCalcMode('net',this)">Net &rarr; Gross</button>
    `;
    calcBtn.parentNode.insertBefore(toggle, calcBtn);
  }

  // ── MODE SWITCH HANDLER ──────────────────────────────────
  window.setCalcMode = function (mode, btn) {
    window.CALC_MODE = mode;
    document.querySelectorAll('.mode-toggle .mode-btn').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');

    const isNet = mode === 'net';
    // Update input labels
    var labelEl = document.querySelector('.slider-label') || document.querySelector('#sliderLabelText');
    var inputLabel = document.querySelector('.f-label-text');
    if (labelEl) labelEl.textContent = isNet ? 'Desired Monthly Take-Home' : (labelEl.getAttribute('data-orig') || labelEl.textContent);
    if (inputLabel) {
      if (!inputLabel.getAttribute('data-orig')) inputLabel.setAttribute('data-orig', inputLabel.textContent);
      inputLabel.textContent = isNet ? 'Desired take-home amount' : inputLabel.getAttribute('data-orig');
    }

    // Re-calculate if results already showing
    if (window.RESULT && typeof window.calculate === 'function') {
      window.calculate();
    }
  };

  // ── HOOK INTO CALCULATE ──────────────────────────────────
  // Wrap the page's calculate() to handle net-to-gross mode
  function hookCalculate() {
    if (!window._grossToNet) return;
    var origCalc = window.calculate;
    if (!origCalc || origCalc._hooked) return;

    window.calculate = function () {
      if (window.CALC_MODE === 'net') {
        var input = document.getElementById('grossSalary');
        var desiredNet = parseFloat(input.value) || 0;
        if (desiredNet <= 0) { origCalc(); return; }

        // Find gross via binary search
        var foundGross = reverseCalc(desiredNet);
        // Set input to found gross and run normal calculate
        input.value = Math.round(foundGross);

        // Update slider if exists
        var slider = document.getElementById('salarySlider');
        if (slider) slider.value = Math.round(foundGross);
        var sliderVal = document.getElementById('sliderVal');
        if (sliderVal && window.fmt) sliderVal.textContent = window.fmt(foundGross);

        // Run original calculate with the found gross
        origCalc();

        // Now override the hero to show "Required Gross" instead of "Take-Home"
        updateHeroForNetMode(foundGross, desiredNet);
      } else {
        origCalc();
        // Reset hero label back to take-home when in gross mode
        var lbl = document.getElementById('resLabel') || document.querySelector('.res-hero-label');
        if (lbl && window.RESULT) {
          var p = window.PERIOD || 'monthly';
          lbl.textContent = (p === 'monthly' ? 'Monthly' : 'Annual') + ' Take-Home Pay';
        }
      }
    };
    window.calculate._hooked = true;
  }

  // ── UPDATE HERO FOR NET MODE ─────────────────────────────
  function updateHeroForNetMode(foundGross, desiredNet) {
    var R = window.RESULT;
    if (!R) return;
    var f = window.fmt || function (n) { return Math.round(n).toLocaleString(); };
    var period = window.PERIOD || 'monthly';
    var isMonthly = period === 'monthly';

    // Determine if page uses monthly or annual base
    var isAnnualBase = R.annualGross && !R.monthly && R.gross === R.annualGross;

    var label = document.getElementById('resLabel') || document.querySelector('.res-hero-label');
    var amount = document.getElementById('resAmount') || document.querySelector('.res-hero-amount');
    var grossEl = document.getElementById('resGross') || document.querySelector('.res-hero-gross');

    if (label) label.textContent = 'Required ' + (isMonthly ? 'Monthly' : 'Annual') + ' Gross';
    if (amount) {
      var displayGross = isAnnualBase ? foundGross : (isMonthly ? foundGross : foundGross * 12);
      amount.textContent = f(displayGross);
    }

    // Net values
    var netMo = R.netMonthly || R.net || 0;
    var netAn = R.annualNet || (netMo * 12) || 0;
    var displayNet = isMonthly ? netMo : netAn;
    var grossDisplay = isAnnualBase ? foundGross : (isMonthly ? foundGross : foundGross * 12);
    var periodLbl = isMonthly ? 'month' : 'year';

    if (grossEl) grossEl.textContent = 'Gross: ' + f(grossDisplay) + '/' + periodLbl + ' \u00B7 Take-home: ' + f(displayNet) + '/' + periodLbl;
  }

  // ── HOOK INTO SETPERIOD ──────────────────────────────────
  function hookSetPeriod() {
    if (!window._grossToNet) return;
    var origSetPeriod = window.setPeriod;
    if (!origSetPeriod || origSetPeriod._hooked) return;

    window.setPeriod = function (period, btn) {
      origSetPeriod(period, btn);

      // If in net mode, override hero display
      if (window.CALC_MODE === 'net' && window.RESULT) {
        var R = window.RESULT;
        var f = window.fmt || function (n) { return Math.round(n).toLocaleString(); };
        var isMonthly = period === 'monthly';
        var grossVal = R.gross || R.annualGross || 0;
        var isAnnualBase = R.annualGross && !R.monthly;

        var label = document.getElementById('resLabel') || document.querySelector('.res-hero-label');
        var amount = document.getElementById('resAmount') || document.querySelector('.res-hero-amount');
        var grossEl = document.getElementById('resGross') || document.querySelector('.res-hero-gross');

        if (label) label.textContent = 'Required ' + (isMonthly ? 'Monthly' : 'Annual') + ' Gross';

        if (amount) {
          var d = isAnnualBase ? 1 : (isMonthly ? 1 : 12);
          amount.textContent = f(grossVal * (isAnnualBase ? (isMonthly ? 1/12 : 1) : d));
        }

        var netMo = R.netMonthly || R.net || 0;
        var displayNet = isMonthly ? netMo : (R.annualNet || netMo * 12);
        var displayGross = isAnnualBase ? (isMonthly ? grossVal/12 : grossVal) : (isMonthly ? grossVal : grossVal * 12);
        var periodLbl = isMonthly ? 'month' : 'year';

        if (grossEl) grossEl.textContent = 'Gross: ' + f(displayGross) + '/' + periodLbl + ' \u00B7 Take-home: ' + f(displayNet) + '/' + periodLbl;
      }
    };
    window.setPeriod._hooked = true;
  }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    // Wait for _grossToNet to be defined
    if (!window._grossToNet) {
      setTimeout(init, 200);
      return;
    }
    injectToggle();
    hookCalculate();
    hookSetPeriod();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
})();

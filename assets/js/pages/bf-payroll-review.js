(function (global) {
  'use strict';
  // No salary calculation or storage mutation belongs in this temporary gate.
  var locale = document.documentElement.lang.split('-')[0];
  var messages = {
    en: 'Calculation and result exports remain unavailable pending review. Your inputs have not been cleared.',
    fr: 'Le calcul et les exports restent indisponibles jusqu’à la vérification. Vos données saisies sont conservées.',
    sw: 'Hesabu na upakuaji wa matokeo havipatikani hadi uhakiki ukamilike. Taarifa ulizoingiza hazijafutwa.'
  };
  function explain(event) {
    global.RESULT = null;
    if (event && event.preventDefault) event.preventDefault();
    var status = document.getElementById('bf-review-action');
    if (status) status.textContent = messages[locale] || messages.en;
    var panel = document.getElementById('bf-payroll-review');
    if (panel) panel.focus({ preventScroll: true });
    return null;
  }
  global.RESULT = null;
  ['calculate','calcNetForGross','renderRows','renderChart','generatePdf','downloadPdfSummary','openPdfModal','submitPdf','shareResult','getAI','sendChat','setChart','setPeriod'].forEach(function (name) { global[name] = explain; });
  global.onSlider = function (input) {
    var gross = document.getElementById('grossSalary');
    if (gross) gross.value = input.value;
    var label = document.getElementById('sliderVal');
    if (label) label.textContent = Number(input.value || 0).toLocaleString(locale) + ' XOF';
  };
  global.onInput = function (input) {
    var slider = document.getElementById('salarySlider');
    if (slider) slider.value = input.value;
    var label = document.getElementById('sliderVal');
    if (label) label.textContent = Number(input.value || 0).toLocaleString(locale) + ' XOF';
  };
  global.setPreset = function (value) {
    var input = document.getElementById('grossSalary');
    if (input) { input.value = value; global.onInput(input); }
  };
  global.togItem = function (element) { element.classList.toggle('on'); };
  global.setSector = function (value, button) {
    document.querySelectorAll('.sec-btn').forEach(function (item) { item.classList.toggle('on', item === button); });
  };
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.id === 'grossSalary') explain(event);
  });
})(window);

(function () {
  'use strict';
  var engine = window.AfroToolsDrugDose;
  var form = document.getElementById('dose-form');
  if (!engine || !form) return;

  var basis = document.getElementById('dose-basis');
  var mode = document.getElementById('output-mode');
  var weightFields = document.getElementById('weight-fields');
  var liquidFields = document.getElementById('liquid-fields');
  var solidFields = document.getElementById('solid-fields');
  var errorSummary = document.getElementById('error-summary');
  var errorList = document.getElementById('error-list');
  var resultPanel = document.getElementById('result-panel');
  var currentResult = null;

  function toggleFields() {
    weightFields.hidden = basis.value !== 'weight';
    liquidFields.hidden = mode.value !== 'liquid';
    solidFields.hidden = mode.value !== 'solid';
  }

  function clearErrors() {
    errorSummary.hidden = true;
    errorList.textContent = '';
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (field) {
      field.removeAttribute('aria-invalid');
    });
  }

  function renderErrors(errors) {
    clearErrors();
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (field) field.setAttribute('aria-invalid', 'true');
      var item = document.createElement('li');
      if (field) {
        var link = document.createElement('a');
        link.href = '#' + error.field;
        link.textContent = error.message;
        link.addEventListener('click', function (event) {
          event.preventDefault();
          field.focus();
        });
        item.appendChild(link);
      } else {
        item.textContent = error.message;
      }
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function values() {
    return {
      instructionConfirmed: document.getElementById('instruction-confirmed').checked,
      medicationName: document.getElementById('medication-name').value,
      basis: basis.value,
      prescribedDose: document.getElementById('prescribed-dose').value,
      doseUnit: document.getElementById('dose-unit').value,
      weight: document.getElementById('body-weight').value,
      weightUnit: document.getElementById('weight-unit').value,
      mode: mode.value,
      concentrationMass: document.getElementById('concentration-mass').value,
      concentrationUnit: document.getElementById('concentration-unit').value,
      concentrationVolume: document.getElementById('concentration-volume').value,
      unitStrength: document.getElementById('unit-strength').value,
      strengthUnit: document.getElementById('strength-unit').value
    };
  }

  function renderResult(result) {
    currentResult = result;
    document.getElementById('result-value').textContent = result.display;
    document.getElementById('result-formula').textContent = result.formula;
    var details = document.getElementById('result-details');
    details.textContent = '';
    result.inputSummary.forEach(function (entry) {
      var term = document.createElement('dt');
      var description = document.createElement('dd');
      term.textContent = entry.label;
      description.textContent = entry.value;
      details.appendChild(term);
      details.appendChild(description);
    });
    var caution = document.getElementById('result-caution');
    caution.textContent = '';
    var heading = document.createElement('h3');
    heading.textContent = 'Confirm before use';
    caution.appendChild(heading);
    var list = document.createElement('ul');
    result.warnings.forEach(function (warning) {
      var item = document.createElement('li');
      item.textContent = warning;
      list.appendChild(item);
    });
    caution.appendChild(list);
    resultPanel.hidden = false;
    resultPanel.focus();
    resultPanel.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function worksheetText() {
    if (!currentResult) return '';
    var name = currentResult.medicationName || 'Not entered';
    return [
      'MEDICATION ARITHMETIC WORKSHEET — NOT A PRESCRIPTION',
      '',
      'Created locally: ' + new Date().toISOString(),
      'Medication label name: ' + name,
      'Instruction format: ' + (currentResult.basis === 'weight' ? 'User-supplied amount per kilogram' : 'User-supplied fixed amount'),
      currentResult.inputSummary.map(function (entry) { return entry.label + ': ' + entry.value; }).join('\n'),
      'Arithmetic: ' + currentResult.formula,
      'Result: ' + currentResult.display,
      '',
      'CONFIRM BEFORE USE',
      currentResult.warnings.map(function (warning) { return '- ' + warning; }).join('\n'),
      '',
      'This worksheet does not diagnose, prescribe, select a medicine, confirm a safe dose, set frequency or duration, or adjust for children, pregnancy, breastfeeding, kidney or liver disease, allergies, interactions, or multiple medicines.',
      'Possible overdose, poisoning, wrong medicine, or severe reaction: contact local emergency services, a poison centre, pharmacist, or urgent medical service now.',
      '',
      'Safety context checked 2026-07-26:',
      '- WHO Medication Without Harm: https://www.who.int/initiatives/medication-without-harm',
      '- WHO Patient safety: https://www.who.int/news-room/fact-sheets/detail/patient-safety',
      '- FDA oral-liquid dosing designations: https://www.fda.gov/media/88498/download'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    resultPanel.hidden = true;
    currentResult = null;
    var result = engine.calculate(values());
    if (!result.ok) {
      renderErrors(result.errors);
      return;
    }
    renderResult(result);
  });

  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      toggleFields();
      clearErrors();
      resultPanel.hidden = true;
      currentResult = null;
    }, 0);
  });
  basis.addEventListener('change', toggleFields);
  mode.addEventListener('change', toggleFields);
  document.getElementById('print-button').addEventListener('click', function () {
    if (currentResult) window.print();
  });
  document.getElementById('download-button').addEventListener('click', function () {
    if (!currentResult) return;
    var blob = new Blob([worksheetText()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'medication-arithmetic-worksheet.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
  toggleFields();
})();

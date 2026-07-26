(function () {
  'use strict';
  var engine = window.AfroToolsVaccineHandoff;
  var form = document.getElementById('programme-form');
  if (!engine || !form) return;

  var country = document.getElementById('country');
  var ageBand = document.getElementById('age-band');
  var recordStatus = document.getElementById('record-status');
  var recordProduct = document.getElementById('record-product');
  var errorSummary = document.getElementById('error-summary');
  var errorList = document.getElementById('error-list');
  var handoff = document.getElementById('handoff');
  var current = null;

  function clearErrors() {
    errorSummary.hidden = true;
    errorList.textContent = '';
    [country, ageBand, recordStatus].forEach(function (field) { field.removeAttribute('aria-invalid'); });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (field) field.setAttribute('aria-invalid', 'true');
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + error.field;
      link.textContent = error.message;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (field) field.focus();
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function render(result) {
    current = result;
    var status = document.getElementById('source-status');
    status.textContent = '';
    var heading = document.createElement('h3');
    heading.textContent = result.country;
    var programme = document.createElement('p');
    programme.innerHTML = '<strong></strong>';
    programme.querySelector('strong').textContent = result.programme;
    var note = document.createElement('p');
    note.textContent = result.sourceNote;
    status.appendChild(heading);
    status.appendChild(programme);
    status.appendChild(note);

    var official = document.getElementById('official-link');
    if (result.officialUrl) {
      official.href = result.officialUrl;
      official.textContent = 'Open ' + result.country + ' official programme source';
      official.hidden = false;
    } else {
      official.hidden = true;
      official.removeAttribute('href');
      official.textContent = '';
    }

    var list = document.getElementById('question-list');
    list.textContent = '';
    result.questions.forEach(function (question) {
      var item = document.createElement('li');
      item.textContent = question;
      list.appendChild(item);
    });
    handoff.hidden = false;
    handoff.focus();
    handoff.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function briefText() {
    if (!current) return '';
    return [
      'VACCINATION PROGRAMME VISIT BRIEF - NOT A SCHEDULE OR MEDICAL RECORD',
      '',
      'Created locally: ' + new Date().toISOString(),
      'Country/programme: ' + current.country,
      'Age band: ' + current.ageBand,
      'Reason for clarification: ' + current.recordStatus,
      'Record product text: ' + (current.recordProduct || 'Not entered'),
      'Programme source: ' + current.programme,
      'Official source URL: ' + (current.officialUrl || 'No safely verified country page configured'),
      'WHO country-reported schedule portal: ' + current.whoUrl,
      'Source status checked: ' + current.checkedDate,
      'Source note: ' + current.sourceNote,
      '',
      'QUESTIONS FOR THE QUALIFIED VACCINATION PROVIDER',
      current.questions.map(function (question, index) { return (index + 1) + '. ' + question; }).join('\n'),
      '',
      'NO COMPLETION VERDICT',
      'This brief does not say which vaccine is due, calculate dates or catch-up intervals, recommend or withhold a product, establish a contraindication, or say vaccination is complete.',
      'Trouble breathing, wheezing, face/lip/throat swelling, collapse, seizure, blue lips, shock or unresponsiveness requires immediate local emergency care.',
      'This document is not a vaccination card, certificate, appointment, medical record or proof that a dose was given.'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    handoff.hidden = true;
    current = null;
    var result = engine.prepare({
      country: country.value,
      ageBand: ageBand.value,
      recordStatus: recordStatus.value,
      recordProduct: recordProduct.value
    });
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    render(result);
  });
  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      clearErrors();
      handoff.hidden = true;
      current = null;
    }, 0);
  });
  document.getElementById('print-button').addEventListener('click', function () {
    if (current) window.print();
  });
  document.getElementById('download-button').addEventListener('click', function () {
    if (!current) return;
    var blob = new Blob([briefText()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'vaccination-programme-visit-brief.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
})();

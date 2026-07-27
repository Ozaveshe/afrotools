(function () {
  'use strict';
  var root = document.querySelector('[data-visa-family]');
  if (!root) return;
  var form = root.querySelector('form');
  var origin = form.elements.origin;
  var output = root.querySelector('[data-result]');
  var destinationCode = root.dataset.destinationCode;
  var destinationName = root.dataset.destinationName;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!origin.value) {
      output.textContent = 'Choose a passport country before preparing the verification brief.';
      origin.focus();
      return;
    }
    if (origin.value === destinationCode) {
      output.textContent = 'Choose a different passport country. Domestic travel is outside this visa-route worksheet.';
      origin.focus();
      return;
    }
    var originName = origin.options[origin.selectedIndex].textContent;
    output.innerHTML = '';
    var heading = document.createElement('strong');
    heading.textContent = originName + ' passport → ' + destinationName + ': no live verdict';
    var list = document.createElement('ul');
    [
      'Confirm the rule for this nationality, travel purpose and intended stay with the destination authority or embassy.',
      'Check passport validity, transit, onward-travel, vaccination and proof-of-funds conditions.',
      'Confirm whether an embassy, official electronic portal or arrival process applies.',
      'Confirm current fees and processing time before any non-refundable booking.'
    ].forEach(function (text) {
      var item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    output.appendChild(heading);
    output.appendChild(list);
    output.focus();
  });
  root.querySelector('[data-action=reset]').addEventListener('click', function () {
    form.reset();
    output.textContent = '';
    origin.focus();
  });
}());

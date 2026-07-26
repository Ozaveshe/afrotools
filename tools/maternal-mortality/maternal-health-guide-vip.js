(function () {
  'use strict';

  var engine = window.MaternalHealthGuide;
  var form = document.getElementById('maternal-guide-form');
  var result = document.getElementById('maternal-guide-result');
  var status = document.getElementById('maternal-guide-status');
  var downloadButton = document.getElementById('download-guide');
  var printButton = document.getElementById('print-guide');
  var resetButton = document.getElementById('reset-guide');
  var currentGuide = null;

  if (!engine || !form || !result || !status) return;

  function selectedFactorIds() {
    return Array.prototype.slice.call(
      form.querySelectorAll('input[name="conversation-factor"]:checked')
    ).map(function (input) { return input.value; });
  }

  function addTextElement(parent, tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderGuide(guide) {
    result.replaceChildren();
    result.classList.add('is-visible');
    result.setAttribute('tabindex', '-1');

    addTextElement(result, 'p', 'result-kicker', 'Conversation timing');
    addTextElement(result, 'h2', 'result-title', guide.headline);
    addTextElement(result, 'p', 'result-limit', guide.limit);

    var topicsTitle = guide.selectedFactors.length
      ? 'Topics to raise with the maternity team'
      : 'No factors selected';
    addTextElement(result, 'h3', '', topicsTitle);

    if (guide.selectedFactors.length) {
      var list = document.createElement('ul');
      list.className = 'result-list';
      guide.selectedFactors.forEach(function (factor) {
        var item = document.createElement('li');
        addTextElement(item, 'strong', '', factor.label);
        addTextElement(item, 'span', '', factor.prompt);
        list.appendChild(item);
      });
      result.appendChild(list);
    } else {
      addTextElement(
        result,
        'p',
        '',
        'No discussion factors were selected. This does not classify the pregnancy or rule out a problem.'
      );
    }

    addTextElement(result, 'h3', '', 'Next WHO reference contacts');
    var contacts = document.createElement('ul');
    contacts.className = 'contact-list';
    guide.nextContacts.forEach(function (contact) {
      addTextElement(contacts, 'li', '', contact.label + ' — ' + contact.timing);
    });
    result.appendChild(contacts);
    addTextElement(result, 'p', 'result-note', guide.scheduleLimit);
    addTextElement(
      result,
      'p',
      'result-source',
      'Country context: ' + guide.countryName + '. Sources reviewed ' + guide.sourceReviewDate + '.'
    );

    downloadButton.disabled = false;
    printButton.disabled = false;
    status.textContent = 'Conversation guide ready. No input was saved or sent.';
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    currentGuide = engine.buildGuide({
      country: document.getElementById('mm-country').value,
      week: document.getElementById('mm-week').valueAsNumber,
      factorIds: selectedFactorIds()
    });

    if (!currentGuide.ok) {
      status.textContent = currentGuide.errors.join(' ');
      document.getElementById('mm-week').focus();
      return;
    }
    renderGuide(currentGuide);
  });

  downloadButton.addEventListener('click', function () {
    if (!currentGuide || !currentGuide.ok) return;
    var blob = new Blob([engine.toText(currentGuide)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'maternal-health-conversation-guide.txt';
    anchor.setAttribute('data-no-pdf-gate', 'true');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = 'Text guide downloaded locally. No input was sent.';
  });

  printButton.addEventListener('click', function () {
    if (!currentGuide || !currentGuide.ok) return;
    status.textContent = 'Opening the browser print dialog. Choose “Save as PDF” for a local PDF.';
    window.print();
  });

  resetButton.addEventListener('click', function () {
    form.reset();
    document.getElementById('mm-week').value = '20';
    currentGuide = null;
    result.replaceChildren();
    result.classList.remove('is-visible');
    downloadButton.disabled = true;
    printButton.disabled = true;
    status.textContent = 'Form cleared. Nothing was stored.';
    document.getElementById('mm-country').focus();
  });
})();

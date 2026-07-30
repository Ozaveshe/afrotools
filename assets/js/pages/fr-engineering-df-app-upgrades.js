(function () {
  'use strict';

  function render(form) {
    var id = form.getAttribute('data-df-form');
    var result = document.querySelector('[data-df-result="' + id + '"]');
    if (!result) return;

    var reviewed = Array.prototype.map.call(form.elements, function (control) {
      if (!control.name || control.type === 'submit' || control.type === 'button') return '';
      var label = control.getAttribute('aria-label');
      if (!label && control.labels && control.labels[0]) {
        label = control.labels[0].textContent.trim();
      }
      var displayedValue = control.value;
      if (control.tagName === 'SELECT' && control.selectedOptions && control.selectedOptions[0]) {
        displayedValue = control.selectedOptions[0].textContent.trim();
      }
      return label ? label + ' : ' + displayedValue : '';
    }).filter(Boolean).join(' ; ');
    var base = result.getAttribute('data-df-base') ||
      result.textContent.trim() ||
      'Résultat prêt — vérifiez les données et les hypothèses ci-dessous.';

    result.textContent = base + (reviewed ? ' Données vérifiées : ' + reviewed + '.' : '');
  }

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-df-form]');
    if (!form) return;
    event.preventDefault();
    render(form);
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-df-copy]');
    if (!button) return;
    var id = button.getAttribute('data-df-copy');
    var result = document.querySelector('[data-df-result="' + id + '"]');
    var summary = result ? result.textContent.trim() : '';
    if (!summary) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(function () {
        button.textContent = 'Copié';
        window.setTimeout(function () {
          button.textContent = 'Copier le résumé';
        }, 1200);
      });
    } else {
      window.prompt('Copier le résumé', summary);
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-df-form]'), render);
}());

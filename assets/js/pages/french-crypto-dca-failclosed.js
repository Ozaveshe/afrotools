(function frenchCryptoDcaFailClosed(global) {
  'use strict';

  var form = document.getElementById('dca-replay-form');
  var submit = document.getElementById('dca-submit');
  var status = document.getElementById('dca-status');
  var results = document.getElementById('dca-results');
  if (!form || !submit || !status || !results) return;

  function unavailableReceipt() {
    var asset = document.getElementById('dca-asset');
    var currency = document.getElementById('dca-currency');
    var start = document.getElementById('dca-start');
    var end = document.getElementById('dca-end');
    status.dataset.state = 'error';
    status.textContent = 'Les prix historiques sont indisponibles pour '
      + asset.options[asset.selectedIndex].textContent + ' en '
      + currency.options[currency.selectedIndex].textContent + ', du '
      + start.value + ' au ' + end.value
      + '. Aucun ancien prix ni aucune estimation de secours n’a été utilisé.';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    global.setTimeout(function () {
      var pending = /demande|chargement|request/i.test(status.textContent);
      if (results.hidden && (!status.textContent.trim() || pending)) unavailableReceipt();
    }, 750);
  });

  submit.addEventListener('click', function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.dispatchEvent(new SubmitEvent('submit', {
      bubbles: true,
      cancelable: true,
      submitter: submit
    }));
  });

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.frenchCryptoDcaFailClosed = {
    ready: true,
    unavailableReceipt: unavailableReceipt
  };
}(window));

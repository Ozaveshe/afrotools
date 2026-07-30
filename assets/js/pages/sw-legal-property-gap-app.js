(function () {
  'use strict';

  var root = document.querySelector('[data-sw-legal-property-app]');
  if (!root) return;
  var englishId = root.getAttribute('data-english-id');
  var form = root.querySelector('[data-workflow-form]');
  var fieldsRoot = root.querySelector('[data-fields]');
  var output = root.querySelector('[data-result]');
  var status = root.querySelector('[data-status]');
  var exports = root.querySelector('[data-export-bar]');
  var contract = null;
  var lastInput = null;
  var lastResult = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function say(message, error) {
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(error));
  }

  function fieldMarkup(field) {
    var id = 'sw-gap-' + field.name;
    if (field.type === 'checkbox') {
      return '<label class="mp-check" for="' + id + '"><input id="' + id + '" name="' +
        escapeHtml(field.name) + '" type="checkbox"><span>' + escapeHtml(field.label) + '</span></label>';
    }
    if (field.type === 'select') {
      return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><select id="' + id +
        '" name="' + escapeHtml(field.name) + '" required>' + (field.options || []).map(function (option) {
          return '<option value="' + escapeHtml(option[0]) + '">' + escapeHtml(option[1]) + '</option>';
        }).join('') + '</select></label>';
    }
    var attributes = field.type === 'number'
      ? ' inputmode="decimal" step="' + escapeHtml(field.step == null ? 'any' : field.step) +
        '" min="' + escapeHtml(field.min == null ? 0 : field.min) + '"'
      : field.type === 'date' ? '' : ' autocomplete="off"';
    return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><input id="' + id +
      '" name="' + escapeHtml(field.name) + '" type="' + escapeHtml(field.type) + '"' + attributes +
      ' required></label>';
  }

  function collect() {
    var input = {};
    contract.fields.forEach(function (field) {
      var control = form.elements[field.name];
      input[field.name] = field.type === 'checkbox' ? control.checked : control.value.trim();
    });
    return input;
  }

  function labelFor(key) {
    return (contract.resultLabels && contract.resultLabels[key]) ||
      'Kipimo cha matokeo';
  }

  function formatValue(value) {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('sw-KE', { maximumFractionDigits: 2 }).format(value);
    }
    if (value === true) return 'Ndiyo';
    if (value === false) return 'Hapana';
    return String(value == null ? '' : value);
  }

  function resultData(result) {
    var fields = result.resultFields || {};
    var translated = {};
    Object.keys(fields).forEach(function (key) {
      translated[labelFor(key)] = formatValue(fields[key]);
    });
    return translated;
  }

  function render(result) {
    lastResult = result;
    var translated = resultData(result);
    output.hidden = false;
    output.innerHTML = '<p class="mp-result-label">Matokeo ya ndani</p><p data-result-summary>' +
      escapeHtml(contract.resultIntro) + '</p><dl>' +
      Object.keys(translated).map(function (key) {
        return '<div><dt>' + escapeHtml(key) + '</dt><dd>' + escapeHtml(translated[key]) + '</dd></div>';
      }).join('') + '</dl><p class="mp-result-boundary">' +
      'Haya ni makadirio au rasimu ya kupanga tu. Thibitisha ada, sheria, haki, masharti, muda na uamuzi kwa mamlaka rasmi au mtaalamu mwenye sifa.</p>';
    exports.hidden = false;
    output.focus();
  }

  function serializable() {
    return {
      schemaVersion: 1,
      lugha: 'sw',
      zana: contract.name,
      englishId: contract.englishId,
      swahiliRoute: contract.swahiliRoute,
      inputs: lastInput,
      result: resultData(lastResult),
      source: contract.source,
      boundary: 'Makadirio au rasimu ya kupanga tu; si ushauri wa kisheria, uwasilishaji rasmi, idhini, haki iliyohakikishwa au uamuzi wa mamlaka.'
    };
  }

  function lines() {
    var data = serializable();
    var items = ['Zana: ' + data.zana, 'Njia: ' + data.swahiliRoute];
    Object.keys(data.result).forEach(function (key) { items.push(key + ': ' + data.result[key]); });
    items.push('Chanzo: ' + data.source.label, data.boundary);
    return items;
  }

  function download(content, type, filename) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function requireResult() {
    if (lastResult) return true;
    say('Kamilisha mtiririko kwanza kabla ya kupakua.', true);
    return false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!contract || !window.AfroTools || !window.AfroTools.FrenchMortgagePropertyEngine) {
      say('Injini ya ndani haipatikani. Mtiririko umefungwa kwa usalama.', true);
      return;
    }
    if (!form.reportValidity()) {
      lastResult = null;
      output.hidden = true;
      exports.hidden = true;
      say('Jaza kila sehemu inayohitajika kwa thamani halali.', true);
      return;
    }
    lastInput = collect();
    var result = window.AfroTools.FrenchMortgagePropertyEngine.run(contract, lastInput, {
      legalEngine: window.AfroTools.LegalEngine
    });
    if (!result || !result.ok) {
      lastResult = null;
      output.hidden = true;
      exports.hidden = true;
      say('Hakuna matokeo yaliyotolewa. Kagua thamani ulizoingiza.', true);
      return;
    }
    render(result);
    say('Matokeo yamesasishwa kwenye kivinjari hiki.');
  });

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'reset') {
      form.reset();
      output.hidden = true;
      exports.hidden = true;
      lastInput = null;
      lastResult = null;
      say('Fomu imewekwa upya.');
      var first = form.querySelector('input,select');
      if (first) first.focus();
    } else if (action === 'copy' && requireResult()) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lines().join('\n')).then(function () {
          say('Muhtasari umenakiliwa.');
        }).catch(function () { say('Kunakili hakupatikani; tumia TXT.', true); });
      } else {
        say('Kunakili hakupatikani; tumia TXT.', true);
      }
    } else if (action === 'txt' && requireResult()) {
      download('\uFEFF' + lines().join('\n') + '\n', 'text/plain;charset=utf-8', englishId + '-sw.txt');
    } else if (action === 'json' && requireResult()) {
      download(JSON.stringify(serializable(), null, 2) + '\n', 'application/json;charset=utf-8', englishId + '-sw.json');
    } else if (action === 'pdf' && requireResult()) {
      var pdf = window.AfroTools.FrenchMortgagePropertyEngine.createPdf(contract.name, lines());
      download(pdf, 'application/pdf', englishId + '-sw.pdf');
    } else if (action === 'print' && requireResult()) {
      window.print();
    }
  });

  fetch('/data/registry/swahili-legal-property-gaps.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('manifest');
      return response.json();
    })
    .then(function (manifest) {
      contract = manifest.rows.find(function (row) { return row.englishId === englishId; });
      if (!contract) throw new Error('contract');
      fieldsRoot.innerHTML = contract.fields.map(fieldMarkup).join('');
      contract.fields.forEach(function (field) {
        var control = form.elements[field.name];
        if (field.type === 'checkbox') control.checked = field.fixtureValue === 'true';
        else control.value = field.fixtureValue;
      });
      root.querySelector('[data-workflow-control]').textContent = contract.workflowControl;
      root.setAttribute('data-workflow-ready', 'true');
      say('Mtiririko wa ndani uko tayari. Data haiondoki kwenye kivinjari.');
    })
    .catch(function () {
      form.querySelectorAll('button,input,select').forEach(function (control) { control.disabled = true; });
      say('Mkataba wa njia haukupatikana. Mtiririko umefungwa kwa usalama.', true);
    });
}());

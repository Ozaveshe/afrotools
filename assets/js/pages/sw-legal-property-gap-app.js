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
  var sourcePanel = root.querySelector('[data-tool-verification-panel]');
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
    var required = field.required === false ? '' : ' required';
    if (field.type === 'checkbox') {
      return '<label class="mp-check" for="' + id + '"><input id="' + id + '" name="' +
        escapeHtml(field.name) + '" type="checkbox"><span>' + escapeHtml(field.label) + '</span></label>';
    }
    if (field.type === 'select') {
      return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><select id="' + id +
        '" name="' + escapeHtml(field.name) + '"' + required + '>' + (field.options || []).map(function (option) {
          return '<option value="' + escapeHtml(option[0]) + '">' + escapeHtml(option[1]) + '</option>';
        }).join('') + '</select></label>';
    }
    var attributes = field.type === 'number'
      ? ' inputmode="decimal" step="' + escapeHtml(field.step == null ? 'any' : field.step) +
        '" min="' + escapeHtml(field.min == null ? 0 : field.min) + '"' +
        (field.max == null ? '' : ' max="' + escapeHtml(field.max) + '"')
      : field.type === 'date' ? '' : ' autocomplete="off"';
    return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><input id="' + id +
      '" name="' + escapeHtml(field.name) + '" type="' + escapeHtml(field.type) + '"' + attributes +
      required + '></label>';
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

  function parserValidPdf(title, reportLines) {
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf) return null;
    var documentPdf = new JsPdf({ unit: 'pt', format: 'a4', compress: false });
    var margin = 48;
    var pageWidth = documentPdf.internal.pageSize.getWidth();
    var pageHeight = documentPdf.internal.pageSize.getHeight();
    var maxWidth = pageWidth - margin * 2;
    var y = 54;

    function clean(value) {
      return String(value == null ? '' : value)
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7e]/g, '?');
    }

    function addLines(value, size, weight, leading) {
      documentPdf.setFont('helvetica', weight || 'normal');
      documentPdf.setFontSize(size);
      documentPdf.splitTextToSize(clean(value), maxWidth).forEach(function (line) {
        if (y > pageHeight - margin) {
          documentPdf.addPage();
          y = margin;
        }
        documentPdf.text(line, margin, y);
        y += leading;
      });
    }

    addLines(title, 14, 'bold', 18);
    y += 6;
    (reportLines || []).forEach(function (line) { addLines(line, 10, 'normal', 14); });
    documentPdf.setProperties({
      title: clean(title),
      creator: 'AfroTools',
      subject: 'Swahili local-first legal planning worksheet'
    });
    return new Uint8Array(documentPdf.output('arraybuffer'));
  }

  function resultData(result) {
    var fields = result.resultFields || {};
    var translated = {};
    Object.keys(fields).forEach(function (key) {
      translated[labelFor(key)] = formatValue(fields[key]);
    });
    return translated;
  }

  function disclosureContext(input) {
    if (!contract || !contract.parserValidPdf) return null;
    if (contract.jurisdictionSources) {
      return contract.jurisdictionSources[(input && input.country) || form.elements.country.value] || null;
    }
    return contract.source || null;
  }

  function availabilityText(source) {
    if (source.availability === 'official-source') {
      return 'Chanzo rasmi kimeunganishwa kwa mamlaka hii pekee.';
    }
    if (source.availability === 'external-reference') {
      return 'Rejea ya nje imeunganishwa; thibitisha mamlaka, sheria na masharti ya sasa kabla ya kuitumia.';
    }
    if (source.availability === 'planning-default') {
      return 'Thamani hizi ni za kupanga tu; hakuna chanzo rasmi kilichounganishwa kwa mamlaka hii.';
    }
    return 'Kiungo cha chanzo cha nje hakipatikani; uthibitishaji wa mkono unahitajika.';
  }

  function updateSourcePanel(input) {
    var source = disclosureContext(input);
    if (!source || !sourcePanel || !sourcePanel.querySelector('[data-source-availability]')) return;
    var jurisdiction = sourcePanel.querySelector('[data-source-jurisdiction]');
    var jurisdictionValue = jurisdiction && jurisdiction.querySelector('span');
    var link = sourcePanel.querySelector('[data-source-link]');
    var label = sourcePanel.querySelector('[data-source-label]');
    var availability = sourcePanel.querySelector('[data-source-availability]');
    var checked = sourcePanel.querySelector('[data-source-checked] span');
    var confidence = sourcePanel.querySelector('[data-source-confidence]');
    if (jurisdiction) jurisdiction.hidden = !source.jurisdiction;
    if (jurisdictionValue) jurisdictionValue.textContent = source.jurisdiction || '';
    if (link) {
      link.hidden = !source.url;
      link.textContent = source.label;
      link.setAttribute('href', source.url || '#');
    }
    if (label) {
      label.hidden = Boolean(source.url);
      label.textContent = source.label;
    }
    availability.setAttribute('data-source-state', source.availability || 'unavailable');
    availability.textContent = availabilityText(source);
    if (checked) checked.textContent = source.checkedAt || 'Haijathibitishwa';
    if (confidence) confidence.textContent = source.confidence;
  }

  function render(result) {
    lastResult = result;
    var translated = resultData(result);
    var disclosure = disclosureContext(lastInput);
    var disclosureMarkup = disclosure
      ? '<div class="mp-result-source" data-result-source>' +
        (disclosure.jurisdiction ? '<p><strong>Mamlaka iliyochaguliwa:</strong> ' + escapeHtml(disclosure.jurisdiction) + '</p>' : '') +
        '<p><strong>Hali ya chanzo:</strong> ' + escapeHtml(availabilityText(disclosure)) + '</p>' +
        '<p><strong>Uhakika wa chanzo:</strong> ' + escapeHtml(disclosure.confidence) + '</p></div>'
      : '';
    output.hidden = false;
    output.innerHTML = '<p class="mp-result-label">Matokeo ya ndani</p><p data-result-summary>' +
      escapeHtml(contract.resultIntro) + '</p><dl>' +
      Object.keys(translated).map(function (key) {
        return '<div><dt>' + escapeHtml(key) + '</dt><dd>' + escapeHtml(translated[key]) + '</dd></div>';
      }).join('') + '</dl>' + disclosureMarkup + '<p class="mp-result-boundary">' +
      'Haya ni makadirio au rasimu ya kupanga tu. Thibitisha ada, sheria, haki, masharti, muda na uamuzi kwa mamlaka rasmi au mtaalamu mwenye sifa.</p>';
    exports.hidden = false;
    output.focus();
  }

  function serializable() {
    var disclosure = disclosureContext(lastInput);
    var data = {
      schemaVersion: 1,
      lugha: 'sw',
      zana: contract.name,
      englishId: contract.englishId,
      swahiliRoute: contract.swahiliRoute,
      inputs: lastInput,
      result: resultData(lastResult),
      source: disclosure || contract.source,
      boundary: 'Makadirio au rasimu ya kupanga tu; si ushauri wa kisheria, uwasilishaji rasmi, idhini, haki iliyohakikishwa au uamuzi wa mamlaka.'
    };
    if (disclosure && disclosure.jurisdiction) data.jurisdiction = disclosure.jurisdiction;
    return data;
  }

  function lines() {
    var data = serializable();
    var items = ['Zana: ' + data.zana, 'Njia: ' + data.swahiliRoute];
    Object.keys(data.result).forEach(function (key) { items.push(key + ': ' + data.result[key]); });
    if (contract.parserValidPdf) {
      if (data.jurisdiction) items.push('Mamlaka iliyochaguliwa: ' + data.jurisdiction);
      items.push(
        'Chanzo: ' + data.source.label,
        'Hali ya chanzo: ' + availabilityText(data.source),
        'Uhakika wa chanzo: ' + data.source.confidence
      );
    } else {
      items.push('Chanzo: ' + data.source.label);
    }
    items.push(data.boundary);
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

  function initialValue(field) {
    if (Object.prototype.hasOwnProperty.call(field, 'initialValue')) return field.initialValue;
    return field.fixtureValue;
  }

  function applyInitialValues() {
    contract.fields.forEach(function (field) {
      var control = form.elements[field.name];
      var value = initialValue(field);
      if (field.type === 'checkbox') control.checked = value === true || value === 'true';
      else control.value = value == null ? '' : value;
    });
  }

  function applyCountryPreset(country) {
    var preset = contract && contract.countryPresets && contract.countryPresets[country];
    if (!preset) return;
    Object.keys(preset).forEach(function (name) {
      if (form.elements[name]) form.elements[name].value = preset[name];
    });
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

  form.addEventListener('input', function () {
    if (!contract || !contract.clearStaleOnInput || !lastResult) return;
    lastInput = null;
    lastResult = null;
    output.hidden = true;
    output.innerHTML = '';
    exports.hidden = true;
    say('Maingizo yamebadilika. Kokotoa tena ili kupata matokeo mapya.');
  });

  form.addEventListener('change', function (event) {
    if (!contract || event.target.name !== 'country') return;
    applyCountryPreset(event.target.value);
    updateSourcePanel({ country: event.target.value });
  });

  root.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'reset') {
      form.reset();
      applyInitialValues();
      updateSourcePanel();
      output.hidden = true;
      output.innerHTML = '';
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
    } else if (action === 'import') {
      var importInput = root.querySelector('[data-import-json]');
      if (importInput) importInput.click();
    } else if (action === 'pdf' && requireResult()) {
      var pdf = contract.parserValidPdf ? parserValidPdf(contract.name, lines()) : null;
      if (!pdf && contract.parserValidPdf && window.AfroTools.SwahiliLocalPdf) {
        pdf = await window.AfroTools.SwahiliLocalPdf.create(contract.name, lines());
      }
      if (!pdf) pdf = window.AfroTools.FrenchMortgagePropertyEngine.createPdf(contract.name, lines());
      download(pdf, 'application/pdf', englishId + '-sw.pdf');
    } else if (action === 'print' && requireResult()) {
      window.print();
    }
  });

  root.addEventListener('change', function (event) {
    if (!event.target.matches('[data-import-json]') || !event.target.files || !event.target.files[0]) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(String(reader.result || ''));
        if (payload.lugha !== 'sw' || payload.englishId !== englishId || !payload.inputs) throw new Error('owner');
        contract.fields.forEach(function (field) {
          var control = form.elements[field.name];
          if (!control || !Object.prototype.hasOwnProperty.call(payload.inputs, field.name)) return;
          if (field.type === 'checkbox') control.checked = Boolean(payload.inputs[field.name]);
          else control.value = String(payload.inputs[field.name]);
        });
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        say('JSON imefunguliwa tena na matokeo yamekokotolewa upya kwenye kivinjari.');
      } catch (_) {
        say('JSON hii si ya zana hii au haina muundo salama unaotarajiwa.', true);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = function () { say('JSON haikuweza kusomwa.', true); };
    reader.readAsText(event.target.files[0]);
  });

  fetch(root.getAttribute('data-contract-manifest') || '/data/registry/swahili-legal-property-gaps.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('manifest');
      return response.json();
    })
    .then(function (manifest) {
      contract = manifest.rows.find(function (row) { return row.englishId === englishId; });
      if (!contract) throw new Error('contract');
      fieldsRoot.innerHTML = contract.fields.map(fieldMarkup).join('');
      applyInitialValues();
      updateSourcePanel();
      root.querySelector('[data-workflow-control]').textContent = contract.workflowControl;
      root.setAttribute('data-workflow-ready', 'true');
      say('Mtiririko wa ndani uko tayari. Data haiondoki kwenye kivinjari.');
    })
    .catch(function () {
      form.querySelectorAll('button,input,select').forEach(function (control) { control.disabled = true; });
      say('Mkataba wa njia haukupatikana. Mtiririko umefungwa kwa usalama.', true);
    });
}());

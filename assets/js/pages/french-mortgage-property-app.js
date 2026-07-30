(function () {
  'use strict';

  var root = document.querySelector('[data-fr-mortgage-property-app]');
  if (!root) return;
  var englishId = root.getAttribute('data-english-id');
  var form = root.querySelector('[data-workflow-form]');
  var fieldsRoot = root.querySelector('[data-fields]');
  var output = root.querySelector('[data-result]');
  var status = root.querySelector('[data-status]');
  var exportBar = root.querySelector('[data-export-bar]');
  var presentation = window.AfroTools && window.AfroTools.FrenchMortgagePropertyPresentation;
  var contract = null;
  var lastResult = null;
  var lastInput = null;
  var artwork = root.querySelector('[data-route-artwork]');

  function markArtworkState() {
    if (!artwork) return;
    artwork.setAttribute(
      'data-artwork-state',
      artwork.complete && artwork.naturalWidth > 0 && artwork.naturalHeight > 0 ? 'loaded' : 'error'
    );
  }

  if (artwork) {
    artwork.addEventListener('load', markArtworkState);
    artwork.addEventListener('error', markArtworkState);
    if (artwork.complete) markArtworkState();
  }

  function say(message, isError) {
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function fieldMarkup(field) {
    var id = 'mp-field-' + field.name;
    if (field.type === 'checkbox') {
      return '<label class="mp-check" for="' + id + '"><input id="' + id + '" name="' + escapeHtml(field.name) +
        '" type="checkbox"><span>' + escapeHtml(field.label) + '</span></label>';
    }
    if (field.type === 'select') {
      return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><select id="' + id + '" name="' +
        escapeHtml(field.name) + '" required>' + (field.options || []).map(function (option) {
          return '<option value="' + escapeHtml(option[0]) + '">' + escapeHtml(option[1]) + '</option>';
        }).join('') + '</select></label>';
    }
    var attributes = field.type === 'number'
      ? ' inputmode="decimal" step="' + escapeHtml(field.step === undefined ? 'any' : field.step) +
        '" min="' + escapeHtml(field.min === undefined ? 0 : field.min) + '"' +
        (field.max === undefined ? '' : ' max="' + escapeHtml(field.max) + '"')
      : field.type === 'date'
        ? ''
        : ' autocomplete="off"';
    return '<label for="' + id + '"><span>' + escapeHtml(field.label) + '</span><input id="' + id + '" name="' +
      escapeHtml(field.name) + '" type="' + escapeHtml(field.type) + '"' + attributes + ' required></label>';
  }

  function collectInput() {
    var values = {};
    contract.fields.forEach(function (field) {
      var control = form.elements[field.name];
      values[field.name] = field.type === 'checkbox' ? control.checked : control.value.trim();
    });
    return values;
  }

  function renderResult(result) {
    result = presentation && presentation.presentResult
      ? presentation.presentResult(englishId, result)
      : result;
    lastResult = result;
    output.hidden = false;
    output.innerHTML = '<p class="mp-result-label">Résultat calculé</p><p data-result-summary>' +
      escapeHtml(result.summary).replace(/\n/g, '<br>') + '</p><dl>' +
      Object.keys(result.resultFields).map(function (key) {
        return '<div><dt>' + escapeHtml(key.replace(/([A-Z])/g, ' $1')) + '</dt><dd data-result-field="' +
          escapeHtml(key) + '">' + escapeHtml(result.resultFields[key]) + '</dd></div>';
      }).join('') + '</dl><p class="mp-result-boundary">Estimation de planification vérifiée le ' +
      escapeHtml(result.checkedAt) + '. Aucun résultat officiel, juridique, fiscal, bancaire ou de marché n’est garanti.</p>';
    exportBar.hidden = false;
    output.focus();
  }

  function serializable() {
    var presentedInput = presentation && presentation.presentInputs
      ? presentation.presentInputs(englishId, contract.fields, lastInput)
      : lastInput;
    return {
      schemaVersion: 1,
      outil: contract.name,
      identifiantAnglais: contract.englishId,
      routeFrancaise: contract.frenchRoute,
      entrees: presentedInput,
      resultat: lastResult.resultFields,
      resume: lastResult.summary,
      verifieLe: lastResult.checkedAt,
      limite: 'Estimation de planification; vérification officielle ou professionnelle requise.'
    };
  }

  function download(bytes, type, filename) {
    var blob = new Blob([bytes], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function resultLines() {
    var data = serializable();
    var lines = ['Outil : ' + data.outil, 'Route : ' + data.routeFrancaise];
    Object.keys(data.entrees).forEach(function (key) { lines.push('Entrée ' + key + ' : ' + data.entrees[key]); });
    Object.keys(data.resultat).forEach(function (key) { lines.push('Résultat ' + key + ' : ' + data.resultat[key]); });
    lines.push('Résumé : ' + data.resume, 'Vérifié le : ' + data.verifieLe, data.limite);
    return lines;
  }

  function copyText(text, successMessage) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      say('Le presse-papiers n’est pas disponible. Utilisez l’export TXT.', true);
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(text).then(function () {
      say(successMessage);
      return true;
    }).catch(function () {
      say('La copie a échoué. Utilisez l’export TXT.', true);
      return false;
    });
  }

  function requireResult() {
    if (lastResult) return true;
    say('Effectuez d’abord le workflow avec des données synthétiques ou vos propres hypothèses.', true);
    return false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!contract || !window.AfroTools || !window.AfroTools.FrenchMortgagePropertyEngine) {
      say('Le moteur local est indisponible. Rechargez la page.', true);
      return;
    }
    if (!form.reportValidity()) {
      lastResult = null;
      output.hidden = true;
      output.textContent = '';
      exportBar.hidden = true;
      say('Complétez tous les champs obligatoires avec des valeurs valides avant de continuer.', true);
      return;
    }
    lastInput = collectInput();
    var result = window.AfroTools.FrenchMortgagePropertyEngine.run(contract, lastInput, {
      legalEngine: window.AfroTools.LegalEngine
    });
    if (!result.ok) {
      lastResult = null;
      output.hidden = false;
      output.textContent = result.message;
      exportBar.hidden = true;
      say('Aucun résultat n’a été produit : corrigez les champs signalés.', true);
      output.focus();
      return;
    }
    lastResult = result;
    renderResult(result);
    say('Résultat mis à jour à partir des champs du formulaire.');
  });

  root.querySelector('[data-action="reset"]').addEventListener('click', function () {
    form.reset();
    lastResult = null;
    lastInput = null;
    output.hidden = true;
    output.textContent = '';
    exportBar.hidden = true;
    say('Formulaire réinitialisé.');
    var first = form.querySelector('input,select,textarea');
    if (first) first.focus();
  });

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'reset') return;
    if (action === 'save') {
      if (!requireResult()) return;
      localStorage.setItem('afrotools:fr-mortgage-property:' + englishId, JSON.stringify({ input: lastInput, result: lastResult }));
      say('Résultat enregistré uniquement dans ce navigateur.');
    } else if (action === 'load') {
      var saved;
      try {
        saved = JSON.parse(localStorage.getItem('afrotools:fr-mortgage-property:' + englishId) || 'null');
      } catch (_) {
        saved = null;
      }
      if (!saved || !saved.input || !saved.result) {
        say('Aucun résultat local enregistré pour cet outil.', true);
        return;
      }
      contract.fields.forEach(function (field) {
        var control = form.elements[field.name];
        if (field.type === 'checkbox') control.checked = Boolean(saved.input[field.name]);
        else control.value = saved.input[field.name];
      });
      lastInput = saved.input;
      lastResult = saved.result;
      renderResult(lastResult);
      say('Résultat local chargé.');
    } else if (action === 'copy') {
      if (requireResult()) copyText(resultLines().join('\n'), 'Résumé français copié.');
    } else if (action === 'share') {
      if (!requireResult()) return;
      var shareText = resultLines().join('\n');
      if (navigator.share) {
        navigator.share({ title: contract.name, text: shareText }).then(function () {
          say('Résumé partagé.');
        }).catch(function (error) {
          if (error && error.name !== 'AbortError') say('Le partage a échoué.', true);
        });
      } else {
        copyText(shareText, 'Résumé copié pour partage.');
      }
    } else if (action === 'txt') {
      if (requireResult()) download('\uFEFF' + resultLines().join('\n') + '\n', 'text/plain;charset=utf-8', englishId + '-fr.txt');
    } else if (action === 'json') {
      if (requireResult()) download(JSON.stringify(serializable(), null, 2) + '\n', 'application/json;charset=utf-8', englishId + '-fr.json');
    } else if (action === 'pdf') {
      if (!requireResult()) return;
      var pdf = window.AfroTools.FrenchMortgagePropertyEngine.createPdf(contract.name, resultLines());
      download(pdf, 'application/pdf', englishId + '-fr.pdf');
    } else if (action === 'print') {
      if (requireResult()) window.print();
    }
  });

  fetch('/data/registry/french-mortgage-property.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('manifest');
      return response.json();
    })
    .then(function (manifest) {
      if (manifest.count !== 66 || !Array.isArray(manifest.rows)) throw new Error('manifest');
      contract = manifest.rows.find(function (row) { return row.englishId === englishId; });
      if (!contract) throw new Error('route');
      if (presentation && presentation.presentFields) {
        contract.fields = presentation.presentFields(englishId, contract.fields);
      }
      fieldsRoot.innerHTML = contract.fields.map(fieldMarkup).join('');
      contract.fields.forEach(function (field) {
        var control = form.elements[field.name];
        if (field.type === 'checkbox') control.checked = field.fixtureValue === 'true';
        else control.value = field.fixtureValue;
      });
      root.querySelector('[data-workflow-control]').textContent = contract.workflowControl;
      root.setAttribute('data-workflow-ready', 'true');
      say('Workflow local prêt. Les données restent dans ce navigateur.');
    })
    .catch(function () {
      form.querySelectorAll('button,input,select').forEach(function (control) { control.disabled = true; });
      say('Contrat de route introuvable ou racine de test incorrecte. Le workflow reste fermé.', true);
    });
}());

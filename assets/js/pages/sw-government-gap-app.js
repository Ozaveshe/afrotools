(function () {
  'use strict';

  var root = document.querySelector('[data-sw-government-app]');
  if (!root) return;
  var config = JSON.parse(document.getElementById('sw-government-config').textContent);
  var engine = window.AfroTools && window.AfroTools.governmentParityEngine;
  var form = root.querySelector('form');
  var fields = root.querySelector('[data-fields]');
  var output = root.querySelector('[data-result]');
  var status = root.querySelector('[data-status]');
  var sourceCard = root.querySelector('[data-source-card]');
  var sourceLink = root.querySelector('[data-source-link]');
  var sourceMeta = root.querySelector('[data-source-meta]');
  var lastReceipt = null;
  var source = null;
  var sourceState = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function say(message, error) {
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(error));
  }

  function input(name, label, type, value, min) {
    return '<label><span>' + escapeHtml(label) + '</span><input name="' + escapeHtml(name) + '" type="' +
      escapeHtml(type) + '" value="' + escapeHtml(value) + '"' +
      (type === 'number' ? ' inputmode="decimal" step="any" min="' + escapeHtml(min == null ? 0 : min) + '"' : '') +
      ' required></label>';
  }

  function renderFields() {
    if (config.mode === 'pension') {
      fields.innerHTML = input('monthlyContribution', 'Mchango wa mwezi uliothibitishwa', 'number', '1000') +
        input('currentBalance', 'Salio la sasa', 'number', '5000') +
        input('years', 'Miaka ya makisio', 'number', '10', 1) +
        input('annualRate', 'Kiwango cha mwaka ulichoingiza (%)', 'number', '5');
    } else if (config.mode === 'permit') {
      fields.innerHTML = input('mainApplicants', 'Waombaji wakuu', 'number', '1', 1) +
        input('dependants', 'Wategemezi', 'number', '0') +
        input('mainFee', 'Ada ya mwombaji mkuu uliyoihakiki', 'number', '100') +
        input('dependantFee', 'Ada ya mtegemezi uliyoihakiki', 'number', '50') +
        input('supportingCosts', 'Gharama za nyaraka', 'number', '20') +
        input('professionalCosts', 'Gharama za mtaalamu', 'number', '0') +
        input('travelCosts', 'Gharama za safari', 'number', '0') +
        input('otherCosts', 'Gharama nyingine', 'number', '0') +
        input('contingencyRate', 'Akiba ya tahadhari (%)', 'number', '10');
    } else if (config.mode === 'foi') {
      fields.innerHTML = input('authority', 'Mamlaka unayolenga', 'text', 'Mamlaka ya mfano') +
        input('subject', 'Mada ya ombi', 'text', 'Rekodi za umma') +
        '<label><span>Rekodi unazoomba</span><textarea name="records" required>Orodha ya rekodi za umma zinazoelezwa kwa usahihi.</textarea></label>' +
        input('format', 'Muundo unaopendelea', 'text', 'PDF');
    } else if (config.mode === 'land') {
      fields.innerHTML = input('propertyValue', 'Thamani ya mali uliyoingiza', 'number', '10000') +
        input('stampRate', 'Kiwango cha ushuru ulichohakiki (%)', 'number', '2') +
        input('registrationRate', 'Kiwango cha usajili ulichohakiki (%)', 'number', '1') +
        input('fixedCosts', 'Gharama zisizobadilika ulizohakiki', 'number', '50') +
        input('contingencyRate', 'Akiba ya tahadhari (%)', 'number', '10');
    } else if (config.mode === 'budget') {
      fields.innerHTML = input('previousAmount', 'Kiasi cha kipindi kilichopita', 'number', '10000') +
        input('currentAmount', 'Kiasi cha kipindi cha sasa', 'number', '12000') +
        input('population', 'Idadi ya watu ya kulinganishia', 'number', '1000', 1);
    } else {
      fields.innerHTML = '<fieldset><legend>Hatua ulizothibitisha kwenye chanzo rasmi</legend>' +
        config.checks.map(function (check, index) {
          return '<label class="mp-check"><input type="checkbox" name="check" value="' + escapeHtml(check.id) +
            '"' + (index < 2 ? ' checked' : '') + '><span>' + escapeHtml(check.label) + '</span></label>';
        }).join('') + '</fieldset>';
    }
  }

  function currentValues() {
    var data = Object.fromEntries(new FormData(form).entries());
    if (config.mode === 'planner') {
      data.selected = Array.prototype.map.call(form.querySelectorAll('input[name=check]:checked'), function (node) {
        return node.value;
      });
    }
    return data;
  }

  function sourceEvidence() {
    var cadence = config.highRisk ? 7 : 30;
    var evaluation = engine.evaluateSourceFreshness(sourceState, cadence);
    return {
      id: source ? source.id : null,
      label: source ? source.label : 'Hakuna chanzo rasmi kilichofungwa',
      url: source ? source.url : null,
      status: evaluation.mode,
      reason: evaluation.reason,
      checkedAt: sourceState ? sourceState.checkedAt : null,
      cadenceDays: cadence
    };
  }

  function updateSource() {
    var evidence = sourceEvidence();
    sourceCard.setAttribute('data-source-state', evidence.status);
    sourceLink.hidden = !evidence.url;
    if (evidence.url) sourceLink.href = evidence.url;
    if (evidence.status === 'fresh_verified') {
      sourceMeta.textContent = 'Chanzo kimepita ukaguzi wa upatikanaji na uadilifu ndani ya muda wa siku ' +
        evidence.cadenceDays + '. Hii haithibitishi ada, sifa, muda wala matokeo.';
    } else {
      sourceMeta.textContent = 'Hali ya chanzo: ukaguzi wa mikono unahitajika (' + evidence.reason +
        '). Hakuna ada, sifa, muda au matokeo yanayothibitishwa na zana hii.';
    }
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('sw-KE', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function compute(values) {
    var result;
    if (config.mode === 'pension') {
      result = engine.calculatePension(values);
      if (!result.ok) return result;
      return { ok: true, summary: 'Jumla ya makisio: ' + formatNumber(result.total) +
        '. Kiasi ulichochangia: ' + formatNumber(result.contributed) + '.' };
    }
    if (config.mode === 'permit') {
      result = engine.calculatePermit(values);
      if (!result.ok) return result;
      return { ok: true, summary: 'Jumla ya makisio ya kibali: ' + formatNumber(result.total) +
        '. Ada zote ni zile ulizoingiza mwenyewe; hakuna idhini inayotabiriwa.' };
    }
    if (config.mode === 'foi') {
      if (!values.authority || !values.subject || !values.records) return { ok: false };
      return { ok: true, summary: 'Mada: ombi la kupata taarifa — ' + values.subject + '\n\nKwa ' +
        values.authority + ',\n\nNaomba kufikia rekodi hizi za umma:\n' + values.records +
        '\n\nMuundo unaopendelewa: ' + values.format +
        '.\n\nTafadhali thibitisha utaratibu, muda, ada, vizuizi na njia ya rufaa kwenye chanzo rasmi.' };
    }
    if (config.mode === 'land') {
      result = engine.calculateLand(values);
      if (!result.ok) return result;
      return { ok: true, summary: 'Jumla ya makisio ya ada: ' + formatNumber(result.total) +
        '. Viwango na gharama zote ni ulizoingiza mwenyewe; hii si ada rasmi wala uwasilishaji.' };
    }
    if (config.mode === 'budget') {
      result = engine.calculateBudget(values);
      if (!result.ok) return result;
      return { ok: true, summary: 'Mabadiliko ya kiasi: ' + formatNumber(result.change) +
        '. Kiasi cha sasa kwa mtu: ' + formatNumber(result.currentPerPerson) +
        '. Thibitisha kipindi, sarafu, idadi ya watu na chanzo rasmi kabla ya kulinganisha.' };
    }
    var missing = engine.verificationGaps(config.checks, values.selected);
    if (!values.selected.length) return { ok: false, code: 'no_verified_steps' };
    return { ok: true, summary: 'Umehakiki hatua ' + values.selected.length + ' kati ya ' + config.checks.length +
      '. Zimebaki hatua ' + missing.length + '. Huu ni mpango wa ukaguzi, si uamuzi wa kustahiki, usajili, malipo au idhini.' };
  }

  function renderReceipt(receipt) {
    output.hidden = false;
    output.textContent = receipt.summary;
    root.querySelector('[data-export-bar]').hidden = false;
    output.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!engine || !form.reportValidity()) {
      lastReceipt = null;
      output.hidden = true;
      root.querySelector('[data-export-bar]').hidden = true;
      say('Jaza kila sehemu inayohitajika kwa thamani halali.', true);
      return;
    }
    var values = currentValues();
    var result = compute(values);
    if (!result.ok) {
      lastReceipt = null;
      output.hidden = true;
      root.querySelector('[data-export-bar]').hidden = true;
      say('Hakuna matokeo yaliyotolewa. Kagua maingizo.', true);
      return;
    }
    lastReceipt = {
      schemaVersion: 1,
      locale: 'sw',
      appId: config.id,
      route: config.route,
      inputs: values,
      summary: result.summary,
      source: sourceEvidence(),
      boundary: 'Mpango wa ukaguzi tu; si huduma rasmi, uwasilishaji, ustahiki, ada, muda, haki au idhini.'
    };
    renderReceipt(lastReceipt);
    say('Risiti ya ndani iko tayari.');
  });

  root.querySelector('[data-action=reset]').addEventListener('click', function () {
    form.reset();
    lastReceipt = null;
    output.hidden = true;
    root.querySelector('[data-export-bar]').hidden = true;
    say('Fomu imewekwa upya.');
  });

  function download(content, filename) {
    var blob = new Blob([content], { type: filename.endsWith('.json') ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  root.querySelector('[data-export=json]').addEventListener('click', function () {
    if (!lastReceipt) return say('Tengeneza risiti kwanza.', true);
    download(JSON.stringify(lastReceipt, null, 2) + '\n', config.id + '-sw.json');
  });
  root.querySelector('[data-export=txt]').addEventListener('click', function () {
    if (!lastReceipt) return say('Tengeneza risiti kwanza.', true);
    download('\uFEFF' + lastReceipt.summary + '\n\n' + lastReceipt.boundary + '\n', config.id + '-sw.txt');
  });
  root.querySelector('[data-import]').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var receipt = JSON.parse(text);
      if (receipt.appId !== config.id || receipt.locale !== 'sw') throw new Error('receipt');
      lastReceipt = receipt;
      renderReceipt(lastReceipt);
      say('Risiti ya ndani imefunguliwa tena.');
    }).catch(function () { say('Risiti hii si halali kwa zana hii.', true); });
  });

  renderFields();
  Promise.all([
    fetch('/data/government/official-sources.json', { cache: 'no-store' }).then(function (response) { return response.json(); }),
    fetch('/data/government/source-status.json', { cache: 'no-store' }).then(function (response) { return response.json(); })
  ]).then(function (documents) {
    var manifestEntries = documents[0].sources || documents[0].entries || [];
    var statusEntries = documents[1].sources || documents[1].entries || [];
    source = manifestEntries.find(function (entry) {
      return entry.id === config.id || (entry.tools || []).indexOf(config.id) !== -1;
    }) || null;
    sourceState = statusEntries.find(function (entry) {
      return entry.id === (source && source.id) || entry.id === config.id;
    }) || null;
    updateSource();
  }).catch(function () {
    source = null;
    sourceState = null;
    updateSource();
  });
}());

(function () {
  'use strict';
  var config = window.TRANSLATOR_VIP;
  if (!config || typeof PHRASES === 'undefined') return;
  var phrases = PHRASES.slice();
  var status = document.getElementById('vipExportStatus');
  var meaningSelect = document.getElementById('swahiliMeaningSelect');
  var meaningOutput = document.getElementById('swahiliMeaningOutput');
  var meaningNotes = {
    fine: 'Use “Niko vizuri” for “I am fine.” “Nzuri” means good or beautiful, but its form must agree with the noun being described.',
    sorry: 'Use “Pole” for sympathy or regret. Use “Samahani” for “excuse me,” to get attention, or for a direct apology.',
    place: 'Use “Ufukwe” for a beach or shore. “Pwani” usually means the coast or coastal region.',
    coffee: 'Use “Kahawa” for coffee generally or the drink. Agricultural language may use “buni” for the coffee plant or beans.',
    this: 'Swahili demonstratives agree with noun class. “Hii” is only one form; the right choice may be hiki, huu, hili, hii, or another class form.'
  };

  function rows() {
    return phrases.map(function (phrase) {
      return [phrase.en, phrase.lang || phrase.sw, phrase.pron || '', phrase.cat || '', phrase.note || ''].join('\t');
    });
  }

  function downloadTxt() {
    var text = [
      config.name + ' app-local draft phrasebook',
      'Coverage: ' + phrases.length + ' unverified draft entries; snapshot ' + config.checked,
      'Verify wording with a qualified Swahili speaker before important or public use.',
      'English\t' + config.name + '\tPronunciation guide\tCategory\tUsage note'
    ].concat(rows()).join('\n');
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = config.slug + '-phrasebook.txt';
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = 'TXT phrasebook prepared locally. No account or network request was used.';
  }

  document.querySelectorAll('[data-vip-inventory]').forEach(function (node) {
    node.textContent = String(phrases.length);
  });
  function renderMeaningNote() {
    meaningOutput.textContent = meaningNotes[meaningSelect.value] || '';
  }
  meaningSelect.addEventListener('change', renderMeaningNote);
  renderMeaningNote();
  document.getElementById('downloadPhrasebookTxt').addEventListener('click', downloadTxt);
  document.getElementById('printPhrasebookPdf').addEventListener('click', function () {
    status.textContent = 'Use the print dialog to save this local phrasebook as PDF.';
    window.print();
  });

  renderCloudTranslation(window.TRANSLATOR_CONFIG);

  function renderCloudTranslation(translationConfig) {
    var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
    var container = document.querySelector('.container');
    if (!consent || !container || !translationConfig) return;
    var toolId = translationConfig.toolId;
    var controller = null;
    var swapped = false;
    var card = document.createElement('section');
    card.className = 'card vip-cloud';
    card.id = 'liveTranslateCard';
    card.setAttribute('aria-labelledby', 'liveTranslateTitle');
    card.innerHTML = [
      '<h2 id="liveTranslateTitle">Optional cloud translation <span>External service</span></h2>',
      '<p>The local phrasebook works without a network request. Send only non-sensitive text you deliberately choose.</p>',
      '<div data-external-translation-consent-host></div>',
      '<div class="vip-cloud-grid">',
      '<div><label for="translateInput">Source text</label><textarea id="translateInput" rows="3" maxlength="2000" placeholder="Enter non-sensitive text…"></textarea></div>',
      '<div><div id="translateOutputLabel" class="vip-cloud-label">Swahili output</div><div id="translateOutput" role="region" aria-labelledby="translateOutputLabel">Cloud translation appears here after you opt in.</div></div>',
      '</div>',
      '<div class="vip-cloud-actions"><button type="button" id="translateBtn" disabled>Translate</button><button type="button" id="swapBtn" aria-label="Swap source and target languages">Swap</button><button type="button" id="clearTranslateBtn">Clear</button><span id="translateStatus" role="status" aria-live="polite"></span></div>'
    ].join('');
    container.appendChild(card);
    consent.render(card.querySelector('[data-external-translation-consent-host]'), {
      toolId: toolId,
      primaryProvider: 'MyMemory'
    });

    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    var outputLabel = document.getElementById('translateOutputLabel');
    var button = document.getElementById('translateBtn');
    var translateStatus = document.getElementById('translateStatus');

    function setBusy(busy) {
      button.disabled = busy || !consent.hasConsent(toolId);
      button.textContent = busy ? 'Translating…' : 'Translate';
    }
    function abortRequest() {
      if (controller) controller.abort();
      controller = null;
    }
    function clearResult(message) {
      abortRequest();
      output.textContent = 'Cloud translation appears here after you opt in.';
      translateStatus.textContent = message || '';
      setBusy(false);
    }
    card.addEventListener('afrotools:external-translation-consent-change', function (event) {
      if (!event.detail || !event.detail.accepted) clearResult('Cloud translation is off. No text will be sent.');
      else setBusy(false);
    });
    document.getElementById('clearTranslateBtn').addEventListener('click', function () {
      input.value = '';
      clearResult('Text and temporary translation result cleared.');
      input.focus();
    });
    document.getElementById('swapBtn').addEventListener('click', function () {
      swapped = !swapped;
      outputLabel.textContent = swapped ? 'English output' : 'Swahili output';
      clearResult('');
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        runTranslation();
      }
    });
    button.addEventListener('click', runTranslation);

    async function runTranslation() {
      if (!consent.requireConsent(toolId, 'Cloud translation is off. Review the notice and opt in first.')) {
        translateStatus.textContent = 'No text was sent. Cloud translation needs your explicit opt-in.';
        return;
      }
      var text = input.value.trim();
      if (!text) {
        output.textContent = 'Enter text above to translate.';
        input.focus();
        return;
      }
      abortRequest();
      controller = typeof AbortController === 'function' ? new AbortController() : null;
      var requestController = controller;
      setBusy(true);
      output.textContent = 'Translating…';
      translateStatus.textContent = 'Sending the text you selected to the external translation service.';
      try {
        var response = await fetch('/api/translate', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, consent.headers(toolId)),
          credentials: 'same-origin',
          cache: 'no-store',
          signal: requestController ? requestController.signal : undefined,
          body: JSON.stringify({
            text: text,
            source: swapped ? translationConfig.target : translationConfig.source,
            target: swapped ? translationConfig.source : translationConfig.target,
            allowFallback: false
          })
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok || !data.translatedText) {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          translateStatus.textContent = data.message || data.error || 'No external translation was returned.';
          return;
        }
        output.textContent = data.translatedText;
        translateStatus.textContent = (data.provider || 'External provider') +
          (data.unchanged ? ' · unchanged; verify this result' : '') +
          ' · temporary uncached result';
      } catch (error) {
        if (error && error.name === 'AbortError') translateStatus.textContent = 'Cloud translation request cancelled.';
        else {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          translateStatus.textContent = 'Connection error. No result was stored.';
        }
      } finally {
        if (controller === requestController) controller = null;
        setBusy(false);
      }
    }
    setBusy(false);
  }
}());

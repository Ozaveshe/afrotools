(function () {
  'use strict';

  function start() {
    var vip = window.TRANSLATOR_VIP;
    var config = window.TRANSLATOR_CONFIG;
    if (!vip || !config || typeof PHRASES === 'undefined') return;

    var phrases = PHRASES.slice();
    var exportStatus = document.getElementById('vipExportStatus');
    var usageSelect = document.getElementById('hausaUsageSelect');
    var usageOutput = document.getElementById('hausaUsageOutput');
    var usageNotes = {
      address: 'kana / ka address a male; kina / ki address a female. Plural and respectful forms differ, so a slash is a choice point, not text to say aloud.',
      name: 'sunanka asks a male addressee; sunanki asks a female addressee. Use the form that matches the person.',
      letters: 'Boko Hausa uses hooked letters including ɓ, ɗ, ƙ and the apostrophe-like ’y. Replacing them with plain b, d, k, or y can change the word.',
      script: 'This app provides Boko (Latin-script) entries only. It does not transliterate to Ajami, whose spelling conventions vary.',
      region: 'Nigerian and Nigerien Boko conventions and everyday vocabulary can differ; Ghanaian, Cameroonian, Chadian, and other communities add further variation.'
    };

    document.querySelectorAll('[data-vip-inventory]').forEach(function (node) {
      node.textContent = String(phrases.length);
    });

    function renderUsageNote() {
      usageOutput.textContent = usageNotes[usageSelect.value] || '';
    }
    usageSelect.addEventListener('change', renderUsageNote);
    renderUsageNote();

    document.getElementById('downloadPhrasebookTxt').addEventListener('click', function () {
      var text = [
        vip.name + ' app-local draft phrasebook',
        'Coverage: ' + phrases.length + ' unreviewed starter records; boundaries checked ' + vip.checked + '.',
        'Script: Boko only. No Ajami transliteration, tone annotation, or full regional coverage.',
        'English\tHausa\tPronunciation guide\tCategory\tUsage note'
      ].concat(phrases.map(function (phrase) {
        return [phrase.en, phrase.lang, phrase.pron, phrase.cat, phrase.note || ''].join('\t');
      })).join('\n');
      var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = vip.slug + '-phrasebook.txt';
      link.click();
      URL.revokeObjectURL(url);
      exportStatus.textContent = 'TXT phrasebook prepared locally. No account or network request was used.';
    });

    document.getElementById('printPhrasebookPdf').addEventListener('click', function () {
      exportStatus.textContent = 'Use the print dialog to save the visible local phrasebook as PDF.';
      window.print();
    });

    renderCloudTranslation(config);
  }

  function renderCloudTranslation(config) {
    var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
    var container = document.querySelector('.container');
    if (!consent || !container) return;

    var toolId = config.toolId;
    var controller = null;
    var swapped = false;
    var card = document.createElement('section');
    card.className = 'card vip-cloud';
    card.id = 'liveTranslateCard';
    card.setAttribute('aria-labelledby', 'liveTranslateTitle');
    card.innerHTML = [
      '<h2 id="liveTranslateTitle">Optional cloud translation <span>External service</span></h2>',
      '<p>The local phrasebook and usage guide work without a network request. Send only non-sensitive text you deliberately choose.</p>',
      '<div data-external-translation-consent-host></div>',
      '<div class="vip-cloud-grid">',
      '<div><label for="translateInput">Source text</label><textarea id="translateInput" rows="3" maxlength="2000" placeholder="Enter non-sensitive text…"></textarea></div>',
      '<div><div id="translateOutputLabel" class="vip-cloud-label">Hausa output</div><div id="translateOutput" role="region" aria-labelledby="translateOutputLabel">Cloud translation appears here after you opt in.</div></div>',
      '</div>',
      '<div class="vip-cloud-actions"><button type="button" id="translateBtn" disabled>Translate</button><button type="button" id="swapBtn" aria-label="Swap source and target languages">Swap</button><button type="button" id="clearTranslateBtn">Clear</button><span id="translateStatus" role="status" aria-live="polite"></span></div>'
    ].join('');
    container.appendChild(card);
    consent.render(card.querySelector('[data-external-translation-consent-host]'), { toolId: toolId, primaryProvider: 'MyMemory' });

    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    var outputLabel = document.getElementById('translateOutputLabel');
    var button = document.getElementById('translateBtn');
    var status = document.getElementById('translateStatus');

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
      status.textContent = message || '';
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
      outputLabel.textContent = swapped ? 'English output' : 'Hausa output';
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
        status.textContent = 'No text was sent. Cloud translation needs your explicit opt-in.';
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
      status.textContent = 'Sending the text you selected to the external translation service.';
      try {
        var response = await fetch('/api/translate', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, consent.headers(toolId)),
          credentials: 'same-origin',
          cache: 'no-store',
          signal: requestController ? requestController.signal : undefined,
          body: JSON.stringify({
            text: text,
            source: swapped ? config.target : config.source,
            target: swapped ? config.source : config.target,
            allowFallback: false
          })
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok || !data.translatedText) {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          status.textContent = data.message || data.error || 'No external translation was returned.';
          return;
        }
        output.textContent = data.translatedText;
        status.textContent = (data.provider || 'External provider') + (data.unchanged ? ' · unchanged; verify this result' : '') + ' · temporary uncached result';
      } catch (error) {
        if (error && error.name === 'AbortError') status.textContent = 'Cloud translation request cancelled.';
        else {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          status.textContent = 'Connection error. No result was stored.';
        }
      } finally {
        if (controller === requestController) controller = null;
        setBusy(false);
      }
    }
    setBusy(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());

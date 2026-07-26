(function () {
  'use strict';

  function start() {
    var vip = window.TRANSLATOR_VIP;
    var config = window.TRANSLATOR_CONFIG;
    if (!vip || !config || typeof PHRASES === 'undefined') return;

    var phrases = PHRASES.slice();
    var exportStatus = document.getElementById('vipExportStatus');
    var orthographySelect = document.getElementById('yorubaOrthographySelect');
    var orthographyOutput = document.getElementById('yorubaOrthographyOutput');
    var orthographyNotes = {
      owo: 'owó = money; ọwọ́ = hand; ọ̀wọ̀ = respect. Removing tone and dot-below marks collapses different words into “owo”.',
      oko: 'ọkọ̀ ayọ́kẹ́lẹ́ = car; ọkọ́ can refer to a husband; plain “oko” may be read as farm or another word depending on tone and vowel quality.',
      ogun: 'ogún = inheritance or twenty in different contexts; òògùn = medicine; ogun can also relate to war. A plain-keyboard spelling is not enough.',
      ile: 'ilé = house or home; ilẹ̀ = land or ground. Dot-below and tone marks distinguish the meanings.',
      honorific: 'o / rẹ are informal singular forms. ẹ / yín are respectful or plural forms. Choose them for the person and social setting.'
    };
    document.querySelectorAll('[data-vip-inventory]').forEach(function (node) {
      node.textContent = String(phrases.length);
    });

    document.getElementById('downloadPhrasebookTxt').addEventListener('click', function () {
      var text = [
        vip.name + ' local phrasebook',
        'Coverage: ' + phrases.length + ' embedded starter records from an unreviewed app-local draft.',
        'Product boundaries checked: ' + vip.checked + '.',
        'Verification: ask a qualified ' + vip.name + ' speaker to review important wording.',
        'Browser listen buttons are not pronunciation authority.',
        'English\t' + vip.name + '\tPronunciation guide\tCategory\tUsage note'
      ].concat(phrases.map(function (phrase) {
        return [
          phrase.en,
          phrase.lang || phrase.sw,
          phrase.pron || '',
          phrase.cat || '',
          phrase.note || ''
        ].join('\t');
      })).join('\n');
      var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = vip.slug + '-phrasebook.txt';
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
      exportStatus.textContent = 'TXT phrasebook prepared locally. No account or network request was used.';
    });

    document.getElementById('printPhrasebookPdf').addEventListener('click', function () {
      exportStatus.textContent = 'Use the print dialog to save the visible local phrasebook as PDF.';
      window.print();
    });

    function renderOrthographyNote() {
      orthographyOutput.textContent = orthographyNotes[orthographySelect.value] || '';
    }
    orthographySelect.addEventListener('change', renderOrthographyNote);
    renderOrthographyNote();

    renderCloudTranslation(config);
  }

  function renderCloudTranslation(config) {
    var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
    var container = document.querySelector('.container');
    if (!consent || !container) return;

    var toolId = String(config.toolId || 'yoruba-translator');
    var controller = null;
    var swapped = false;
    var card = document.createElement('section');
    card.className = 'card vip-cloud';
    card.id = 'liveTranslateCard';
    card.setAttribute('aria-labelledby', 'liveTranslateTitle');
    card.innerHTML = [
      '<h2 id="liveTranslateTitle">Optional cloud translation <span>External service</span></h2>',
      '<p>The local phrasebook above works without a network request. Use this separate service only for non-sensitive text you choose to send.</p>',
      '<div data-external-translation-consent-host></div>',
      '<div class="vip-cloud-grid">',
      '<div><label for="translateInput">Source text</label><textarea id="translateInput" rows="3" maxlength="2000" placeholder="Enter non-sensitive text…"></textarea></div>',
      '<div><div id="translateOutputLabel" class="vip-cloud-label">Yoruba output</div><div id="translateOutput" role="region" aria-labelledby="translateOutputLabel">Cloud translation appears here after you opt in.</div></div>',
      '</div>',
      '<div class="vip-cloud-actions">',
      '<button type="button" id="translateBtn" disabled>Translate</button>',
      '<button type="button" id="swapBtn" aria-label="Swap source and target languages">Swap</button>',
      '<button type="button" id="clearTranslateBtn">Clear</button>',
      '<span id="translateStatus" role="status" aria-live="polite"></span>',
      '</div>'
    ].join('');
    container.appendChild(card);

    consent.render(card.querySelector('[data-external-translation-consent-host]'), {
      toolId: toolId,
      primaryProvider: 'MyMemory'
    });

    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    var outputLabel = document.getElementById('translateOutputLabel');
    var translateButton = document.getElementById('translateBtn');
    var status = document.getElementById('translateStatus');

    function setBusy(busy) {
      translateButton.dataset.busy = busy ? 'true' : 'false';
      translateButton.disabled = busy || !consent.hasConsent(toolId);
      translateButton.textContent = busy ? 'Translating…' : 'Translate';
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
      if (!event.detail || !event.detail.accepted) {
        clearResult('Cloud translation is off. No text will be sent.');
      } else {
        setBusy(false);
      }
    });

    document.getElementById('clearTranslateBtn').addEventListener('click', function () {
      input.value = '';
      clearResult('Text and temporary translation result cleared.');
      input.focus();
    });

    document.getElementById('swapBtn').addEventListener('click', function () {
      swapped = !swapped;
      input.placeholder = swapped ? 'Enter non-sensitive Yoruba text…' : 'Enter non-sensitive source text…';
      outputLabel.textContent = swapped ? 'English output' : 'Yoruba output';
      clearResult('');
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        runTranslation();
      }
    });
    translateButton.addEventListener('click', runTranslation);

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
      if (Array.from(text).length > 2000) {
        output.textContent = 'Text is too long. Use 2,000 characters or fewer.';
        input.focus();
        return;
      }

      abortRequest();
      controller = typeof AbortController === 'function' ? new AbortController() : null;
      var requestController = controller;
      var source = swapped ? config.target : (config.source || 'en');
      var target = swapped ? (config.source || 'en') : config.target;
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
            source: source,
            target: target,
            allowFallback: false
          })
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok || !data.translatedText) {
          if (response.status === 428) consent.reset(toolId);
          output.textContent = 'Cloud translation is unavailable. The local phrasebook above still works.';
          status.textContent = data.message || data.error || 'No external translation was returned.';
          return;
        }
        output.textContent = data.translatedText;
        status.textContent = (data.provider || 'External provider')
          + (data.unchanged ? ' · unchanged; verify this result' : '')
          + ' · temporary uncached result';
      } catch (error) {
        if (error && error.name === 'AbortError') {
          status.textContent = 'Cloud translation request cancelled.';
        } else {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook above still works.';
          status.textContent = 'Connection error. No result was stored.';
        }
      } finally {
        if (controller === requestController) controller = null;
        setBusy(false);
      }
    }

    setBusy(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());

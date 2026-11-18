(function () {
  'use strict';

  function start() {
    var vip = window.TRANSLATOR_VIP;
    var config = window.TRANSLATOR_CONFIG;
    if (!vip || !config || typeof PHRASES === 'undefined') return;

    var phrases = PHRASES.slice();
    var exportStatus = document.getElementById('vipExportStatus');
    document.querySelectorAll('[data-vip-inventory]').forEach(function (node) {
      node.textContent = String(phrases.length);
    });
    renderWritingGuide();

    document.getElementById('downloadPhrasebookTxt').addEventListener('click', function () {
      var text = [
        vip.name + ' app-local draft phrasebook',
        'Coverage: ' + phrases.length + ' unreviewed starter records; boundaries checked ' + vip.checked + '.',
        'Important wording needs qualified review. Tone marks, pronunciation cues, and dialect coverage are incomplete.',
        'English\tIgbo\tPronunciation guide\tCategory\tUsage note'
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

  function renderWritingGuide() {
    var select = document.getElementById('igboWritingTopic');
    var result = document.getElementById('igboWritingResult');
    if (!select || !result) return;
    var guidance = {
      vowels: '<strong>Keep the eight vowels distinct:</strong> <span lang="ig">a, e, i, ị, o, ọ, u, ụ</span>. The dot below changes the vowel; it is not optional decoration. Compare <span lang="ig">ulo</span> with the reviewed spelling <span lang="ig">ụlọ</span>.',
      harmony: '<strong>Vowel harmony:</strong> Igbo vowels form two harmony sets. This app preserves reviewed spellings but does not calculate or certify harmony for newly entered words.',
      tone: '<strong>Tone matters:</strong> unmarked <span lang="ig">akwa</span> can represent different words. Harvard ELIAS illustrates four tone patterns for egg, bed, cloth, and cry. This phrasebook does not claim complete tone marking.',
      dialect: '<strong>Community usage varies:</strong> Standard Igbo is useful for lookup, but Onitsha, Nsukka, Enuani, Ikwerre, Central Igbo, and other varieties can differ. Confirm important wording with a qualified speaker from the relevant community.'
    };
    function update() {
      result.innerHTML = guidance[select.value] || guidance.vowels;
    }
    select.addEventListener('change', update);
    update();
  }

  function renderCloudTranslation(config) {
    var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
    var container = document.querySelector('.container');
    if (!consent || !container) return;

    var toolId = config.toolId;
    var controller = null;
    var swapped = false;
    var requestSequence = 0;
    var lastResult = null;
    var copySequence = 0;
    var card = document.createElement('section');
    card.className = 'card vip-cloud';
    card.id = 'liveTranslateCard';
    card.setAttribute('aria-labelledby', 'liveTranslateTitle');
    card.innerHTML = [
      '<h2 id="liveTranslateTitle">Optional cloud translation <span>External service</span></h2>',
      '<p>The local phrasebook works without a network request. Send only non-sensitive text you deliberately choose.</p>',
      '<div data-external-translation-consent-host></div>',
      '<div class="vip-cloud-grid">',
      '<div><label for="translateInput" id="translateInputLabel">English text</label><textarea id="translateInput" rows="3" maxlength="2000" placeholder="Enter non-sensitive text…"></textarea></div>',
      '<div><div id="translateOutputLabel" class="vip-cloud-label">Igbo output</div><div id="translateOutput" tabindex="0" role="region" aria-labelledby="translateOutputLabel">Cloud translation appears here after you opt in.</div></div>',
      '</div>',
      '<div class="vip-cloud-actions"><button type="button" id="translateBtn" disabled>Translate</button><button type="button" id="swapBtn" aria-label="Swap source and target languages">Swap</button><button type="button" id="copyTranslateBtn" disabled>Copy translation</button><button type="button" id="clearTranslateBtn">Clear</button><span id="translateStatus" role="status" aria-live="polite"></span></div>'
    ].join('');
    container.insertBefore(card, document.getElementById('wotd'));
    consent.render(card.querySelector('[data-external-translation-consent-host]'), {
      toolId: toolId,
      primaryProvider: 'MyMemory'
    });

    var input = document.getElementById('translateInput');
    var output = document.getElementById('translateOutput');
    var outputLabel = document.getElementById('translateOutputLabel');
    var inputLabel = document.getElementById('translateInputLabel');
    var button = document.getElementById('translateBtn');
    var status = document.getElementById('translateStatus');
    var copyButton = document.getElementById('copyTranslateBtn');

    function setBusy(busy) {
      button.disabled = busy || !consent.hasConsent(toolId);
      button.textContent = busy ? 'Translating…' : 'Translate';
    }
    function abortRequest() {
      requestSequence += 1;
      if (controller) controller.abort();
      controller = null;
    }
    function currentResult() {
      return lastResult && lastResult.input === input.value && lastResult.swapped === swapped;
    }
    function updateLanguageLabels() {
      inputLabel.textContent = swapped ? 'Igbo text' : 'English text';
      outputLabel.textContent = swapped ? 'English output' : 'Igbo output';
      input.setAttribute('lang', swapped ? config.target : config.source);
      output.setAttribute('lang', swapped ? config.source : config.target);
    }
    function clearResult(message) {
      abortRequest();
      lastResult = null;
      copyButton.disabled = true;
      output.textContent = consent.hasConsent(toolId) ? 'Translation will appear here.' : 'Cloud translation appears here after you opt in.';
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
      var translated = currentResult() ? lastResult.text : null;
      swapped = !swapped;
      if (translated !== null) input.value = translated;
      updateLanguageLabels();
      clearResult(translated !== null
        ? 'Translation moved to the input. Choose Translate to translate it back.'
        : 'Languages swapped. Your text has been kept; check the input language before translating.');
      input.focus();
    });
    document.getElementById('translateSearch').addEventListener('click', function () {
      var text = document.getElementById('search').value.trim();
      if (!text) return;
      swapped = false;
      updateLanguageLabels();
      input.value = text;
      clearResult('Text filled from your phrase search. Review it and choose whether to opt in before translating.');
      input.focus();
      card.scrollIntoView({ block: 'start' });
    });
    input.addEventListener('input', function () {
      clearResult('Text changed. Choose Translate when your current text is ready.');
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        runTranslation();
      }
    });
    button.addEventListener('click', runTranslation);
    copyButton.addEventListener('click', async function () {
      if (!currentResult()) return;
      var result = lastResult;
      var sequence = requestSequence;
      var copyId = ++copySequence;
      copyButton.disabled = true;
      function stillCurrent() {
        return sequence === requestSequence && result === lastResult && copyId === copySequence && currentResult();
      }
      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(result.text);
        if (stillCurrent()) status.textContent = 'Translation copied.';
      } catch (error) {
        if (!stillCurrent()) return;
        var selected = false;
        try {
          var selection = window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(output);
          selection.removeAllRanges();
          selection.addRange(range);
          output.focus();
          selected = true;
        } catch (selectionError) { /* Manual text selection remains available. */ }
        status.textContent = selected
          ? 'Automatic copy failed. Translation selected; use your device’s Copy command.'
          : 'Automatic copy failed. Select the translation and use your device’s Copy command.';
      } finally {
        if (stillCurrent()) copyButton.disabled = false;
      }
    });

    async function runTranslation() {
      if (!consent.requireConsent(toolId, 'Cloud translation is off. Review the notice and opt in first.')) {
        clearResult('No text was sent. Cloud translation needs your explicit opt-in.');
        return;
      }
      var sourceInput = input.value;
      var text = sourceInput.trim();
      if (!text) {
        clearResult('Enter text above to translate.');
        input.focus();
        return;
      }
      abortRequest();
      controller = typeof AbortController === 'function' ? new AbortController() : null;
      var requestController = controller;
      var sequence = requestSequence;
      var requestSwapped = swapped;
      lastResult = null;
      copyButton.disabled = true;
      function isCurrent() {
        return sequence === requestSequence && input.value === sourceInput && swapped === requestSwapped && consent.hasConsent(toolId);
      }
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
        if (!isCurrent()) return;
        var data = await response.json().catch(function () { return {}; });
        if (!isCurrent()) return;
        if (!response.ok || typeof data.translatedText !== 'string' || !data.translatedText.trim()) {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          status.textContent = data.message || data.error || 'No external translation was returned.';
          return;
        }
        lastResult = { text: data.translatedText, input: sourceInput, swapped: requestSwapped };
        output.textContent = data.translatedText;
        copyButton.disabled = false;
        status.textContent = (data.provider || 'External provider') +
          (data.unchanged ? ' · unchanged; verify this result' : '') +
          ' · temporary uncached result';
      } catch (error) {
        if (!isCurrent()) return;
        if (error && error.name === 'AbortError') status.textContent = 'Cloud translation request cancelled.';
        else {
          output.textContent = 'Cloud translation is unavailable. The local phrasebook still works.';
          status.textContent = 'Connection error. No result was stored.';
        }
      } finally {
        if (sequence === requestSequence) {
          controller = null;
          setBusy(false);
        }
      }
    }
    updateLanguageLabels();
    setBusy(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());

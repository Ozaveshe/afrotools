(function () {
  'use strict';
  var CHECKED_DATE = '2026-07-26';

  function filteredPhrases() {
    var query = String((document.getElementById('search') || {}).value || '').toLowerCase().trim();
    var category = typeof activeCat === 'string' ? activeCat : 'All';
    return (window.PHRASES || PHRASES || []).filter(function (phrase) {
      var categoryMatch = category === 'All' || phrase.cat === category;
      var haystack = [phrase.en, phrase.lang, phrase.roman, phrase.pron].join(' ').toLowerCase();
      return categoryMatch && (!query || haystack.indexOf(query) !== -1);
    });
  }

  function exportText() {
    var rows = filteredPhrases().map(function (phrase) {
      return [phrase.en, phrase.lang, phrase.roman || '', phrase.pron || '', phrase.cat].join('\t');
    });
    return [
      'AfroTools Amharic phrasebook',
      'Coverage: 106 app-local, unverified draft phrase rows; audited ' + CHECKED_DATE + '.',
      'Limits: local lookup only. Romanisation and pronunciation cues are approximate and are not a reversible writing system.',
      '',
      'English\tAmharic (Ethiopic)\tRomanisation\tPronunciation cue\tCategory'
    ].concat(rows).join('\n');
  }

  function status(message) {
    document.getElementById('phrasebookExportStatus').textContent = message;
  }

  function downloadText() {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([exportText()], { type: 'text/plain;charset=utf-8' }));
    link.download = 'afrotools-amharic-phrasebook.txt';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status('TXT export prepared locally. No phrase text was uploaded.');
  }

  function copyText() {
    navigator.clipboard.writeText(exportText()).then(function () {
      status('Visible phrase rows copied locally.');
    }, function () {
      status('Copy was blocked by the browser. Use the TXT export instead.');
    });
  }

  function labelControls(root) {
    (root || document).querySelectorAll('.phrase button,.wotd button').forEach(function (button) {
      if (!button.getAttribute('aria-label')) {
        var phrase = button.closest('.phrase');
        var action = button.dataset.action === 'listen' ? 'Try device Amharic voice for' : 'Copy Amharic phrase';
        button.setAttribute('aria-label', action + (phrase ? ': ' + phrase.querySelector('.en').textContent.trim() : ' of the day'));
      }
    });
    (root || document).querySelectorAll('.quiz-opt').forEach(function (button) {
      if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Quiz answer: ' + button.textContent.trim());
    });
  }

  function init() {
    var container = document.querySelector('.container');
    if (!container || typeof PHRASES === 'undefined') return;
    var evidence = document.createElement('section');
    evidence.className = 'phrasebook-evidence';
    evidence.setAttribute('aria-labelledby', 'phrasebookEvidenceTitle');
    evidence.innerHTML =
      '<h2 id="phrasebookEvidenceTitle">Local phrasebook coverage</h2>' +
      '<p><strong>106 app-local draft phrase rows across 14 categories.</strong> The list, search, quiz, copy and export tools run in this browser.</p>' +
      '<p>Romanisation and stress cues are approximate learning aids. Amharic spelling, pronunciation, formality and speaker gender can change the right wording. The optional cloud translator is separate and requires a fresh, non-persistent opt-in.</p>' +
      '<p><strong>Verification status:</strong> this app-local table has not received entry-level provenance or qualified Amharic review. <strong>Audited:</strong> ' + CHECKED_DATE + '. Treat every row as a draft and confirm wording with a qualified Amharic translator before relying on it.</p>' +
      '<div class="phrasebook-actions" aria-label="Phrasebook export actions"><button type="button" id="copyPhrasebook">Copy visible rows</button><button type="button" id="downloadPhrasebook">Download TXT</button><button type="button" id="printPhrasebook">Print / save PDF</button></div>' +
      '<p class="phrasebook-status" id="phrasebookExportStatus" role="status" aria-live="polite"></p>';
    container.insertBefore(evidence, container.firstChild);
    document.getElementById('copyPhrasebook').addEventListener('click', copyText);
    document.getElementById('downloadPhrasebook').addEventListener('click', downloadText);
    document.getElementById('printPhrasebook').addEventListener('click', function () { status('Opening the browser print dialog for local PDF saving.'); window.print(); });
    labelControls();
    new MutationObserver(function (records) { records.forEach(function (record) { labelControls(record.target); }); }).observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());

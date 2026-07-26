(function () {
  'use strict';
  var CHECKED_DATE = '2026-07-26';
  function filteredPhrases() {
    var query = String((document.getElementById('search') || {}).value || '').toLowerCase().trim();
    var category = typeof activeCat === 'string' ? activeCat : 'All';
    return PHRASES.filter(function (phrase) {
      return (category === 'All' || phrase.cat === category) &&
        (!query || [phrase.en, phrase.lang, phrase.pron].join(' ').toLowerCase().indexOf(query) !== -1);
    });
  }
  function exportText() {
    return ['AfroTools isiZulu phrasebook', 'Coverage: 132 app-local, unverified draft phrase rows; audited ' + CHECKED_DATE + '.', 'Limits: local lookup only. Tone, regional variation, noun-class agreement and click pronunciation are not fully represented.', '', 'English\tisiZulu\tPronunciation cue\tCategory'].concat(filteredPhrases().map(function (phrase) {
      return [phrase.en, phrase.lang, phrase.pron || '', phrase.cat].join('\t');
    })).join('\n');
  }
  function status(message) { document.getElementById('phrasebookExportStatus').textContent = message; }
  function copyText() { navigator.clipboard.writeText(exportText()).then(function () { status('Visible phrase rows copied locally.'); }, function () { status('Copy was blocked. Use the TXT export instead.'); }); }
  function downloadText() {
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([exportText()], { type: 'text/plain;charset=utf-8' })); link.download = 'afrotools-isizulu-phrasebook.txt'; link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0); status('TXT export prepared locally. No phrase text was uploaded.');
  }
  function labelControls(root) {
    (root || document).querySelectorAll('.phrase button,.wotd button').forEach(function (button) {
      if (!button.getAttribute('aria-label')) {
        var row = button.closest('.phrase');
        var action = button.matches('.speak-btn,[data-speak-index],#speakWotd') ? 'Try installed isiZulu device voice for' : 'Copy isiZulu phrase';
        button.setAttribute('aria-label', action + (row ? ': ' + ((row.querySelector('.lang') || {}).textContent || '').trim() : ''));
      }
    });
    (root || document).querySelectorAll('.quiz-opt').forEach(function (button) { if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Quiz answer: ' + button.textContent.trim()); });
  }
  function init() {
    var container = document.querySelector('.container'); if (!container || typeof PHRASES === 'undefined') return;
    var evidence = document.createElement('section'); evidence.className = 'phrasebook-evidence'; evidence.setAttribute('aria-labelledby', 'phrasebookEvidenceTitle');
    evidence.innerHTML = '<h2 id="phrasebookEvidenceTitle">Local phrasebook coverage</h2><p><strong>132 app-local draft phrase rows across 15 categories.</strong> Search, quiz, copy and export run in this browser.</p><p>Pronunciation cues are approximations: they do not encode tone, every click variant, regional usage or noun-class agreement. The optional cloud translator is separate and requires a fresh, non-persistent opt-in.</p><p><strong>Verification status:</strong> this app-local table has not received entry-level provenance or qualified isiZulu review. <strong>Audited:</strong> ' + CHECKED_DATE + '. Treat every row as a draft and confirm wording with a qualified isiZulu translator before relying on it.</p><div class="phrasebook-actions" aria-label="Phrasebook export actions"><button type="button" id="copyPhrasebook">Copy visible rows</button><button type="button" id="downloadPhrasebook">Download TXT</button><button type="button" id="printPhrasebook">Print / save PDF</button></div><p class="phrasebook-status" id="phrasebookExportStatus" role="status" aria-live="polite"></p>';
    container.insertBefore(evidence, container.firstChild);
    document.getElementById('copyPhrasebook').addEventListener('click', copyText); document.getElementById('downloadPhrasebook').addEventListener('click', downloadText);
    document.getElementById('printPhrasebook').addEventListener('click', function () { status('Opening the browser print dialog for local PDF saving.'); window.print(); });
    labelControls(); new MutationObserver(function (records) { records.forEach(function (record) { labelControls(record.target); }); }).observe(container, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}());

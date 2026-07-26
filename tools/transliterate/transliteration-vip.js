(function () {
  'use strict';
  var engine = window.AfroTransliterationEngine;
  var limits = {
    geez: '21 consonant rows × 7 Ethiopic orders (147 deterministic forms). Standalone vowels and many labialised, ejective or language-specific Amharic, Tigrinya and Ge’ez contrasts are outside this convention.',
    tifinagh: '26 Latin tokens mapped to a small Neo-Tifinagh subset. Regional orthographies and language-specific conventions vary.',
    arabic: '30 Latin tokens mapped to Arabic letters or marks. This is not Arabic or Ajami translation and does not infer vowels, dialect, grammar or spelling.'
  };
  var fixtures = {
    geez: { input: 'selam', output: 'ሰላም' },
    tifinagh: { input: 'azul', output: 'ⴰⵣⵓⵍ' },
    arabic: { input: 'bint', output: 'بِنت' }
  };
  function setStatus(message) { document.getElementById('translitStatus').textContent = message; }
  function exportText() {
    var script = document.getElementById('script');
    return [
      'AfroTools deterministic script mapping',
      'Checked: 2026-07-26',
      'Mapping: ' + script.options[script.selectedIndex].text,
      'Input: ' + document.getElementById('input').value,
      'Output: ' + document.getElementById('output').textContent,
      'Limit: ' + limits[script.value],
      'No reversible round trip, language accuracy or preserved meaning is promised.',
      'Privacy: raw input is not persisted or uploaded.'
    ].join('\n');
  }
  window.convert = function () {
    var script = document.getElementById('script').value;
    var input = document.getElementById('input').value;
    var analysis = engine.analyze(script, input);
    var target = document.getElementById('output');
    target.textContent = analysis.output;
    target.dataset.script = script;
    if (script === 'arabic') target.setAttribute('lang', 'ar'); else target.removeAttribute('lang');
    document.getElementById('mappingLimit').textContent = limits[script];
    document.getElementById('unsupportedNotice').textContent = analysis.unsupportedLatin.length ?
      'Preserved unsupported Latin characters: ' + analysis.unsupportedLatin.join(', ') + '.' :
      (input ? 'All Latin letters in this input matched the selected app-local table.' : 'Enter Latin mapping tokens to begin.');
  };
  function addTokenButton(grid, token, mapped, scriptName) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'char-cell';
    button.setAttribute('aria-label', 'Insert Latin token ' + token + ' for ' + scriptName + ' mapping');
    button.innerHTML = mapped + '<span class="latin">' + token + '</span>';
    button.addEventListener('click', function () {
      var input = document.getElementById('input');
      input.value += token;
      window.convert();
      input.focus();
    });
    grid.appendChild(button);
  }
  function renderGrid() {
    var grid = document.getElementById('charGrid');
    var script = document.getElementById('script').value;
    grid.innerHTML = '';
    if (script === 'geez') {
      var suffixes = ['e', 'u', 'i', 'a', 'ee', '', 'o'];
      Object.keys(engine.GEEZ).forEach(function (consonant) {
        Array.from(engine.GEEZ[consonant]).forEach(function (mapped, index) {
          addTokenButton(grid, consonant + suffixes[index], mapped, 'Ethiopic');
        });
      });
    } else {
      var table = script === 'arabic' ? engine.ARABIC : engine.TIFINAGH;
      Object.keys(table).forEach(function (token) {
        addTokenButton(grid, token, table[token], script === 'arabic' ? 'Arabic-letter' : 'Neo-Tifinagh');
      });
    }
  }
  window.updateCharGrid = function () {
    renderGrid();
    document.getElementById('sampleHint').textContent = '';
  };
  window.trySample = function () {
    var script = document.getElementById('script').value;
    var fixture = fixtures[script];
    var input = document.getElementById('input');
    input.value = fixture.input;
    window.convert();
    input.focus();
    document.getElementById('sampleHint').textContent = 'Deterministic fixture: ' + fixture.input + ' → ' + fixture.output + '. This is a mapping check, not a vocabulary or pronunciation claim.';
  };
  function init() {
    var select = document.getElementById('script');
    var option = document.createElement('option');
    option.value = 'arabic';
    option.textContent = 'Arabic letters (approximate Latin mapping)';
    select.appendChild(option);
    document.querySelector('label[for="script"]').textContent = 'Output script mapping';
    var input = document.getElementById('input');
    input.setAttribute('aria-describedby', 'mappingLimit unsupportedNotice translitStatus');
    var evidence = document.createElement('section');
    evidence.className = 'translit-evidence';
    evidence.innerHTML = '<p><strong>Unverified deterministic subsets:</strong> Ethiopic 21 base rows/147 forms; Neo-Tifinagh 26 tokens; Arabic 30 tokens.</p><p id="mappingLimit">' + limits.geez + '</p><p id="unsupportedNotice" role="status" aria-live="polite">Enter Latin mapping tokens to begin.</p><p><strong>Verification status:</strong> these app-local conventions have not received language-specific orthography review. The former N’Ko and Vai options are unavailable because their route tables did not map the advertised Latin tokens to the correct Unicode letters or syllables. Outputs are one-way typing approximations and are never promised to round-trip or preserve meaning.</p>';
    document.querySelector('.container').insertBefore(evidence, document.querySelector('.container').firstChild);
    var actions = document.createElement('div');
    actions.className = 'translit-actions';
    actions.innerHTML = '<button type="button" id="downloadTranslit">Download TXT</button><button type="button" id="printTranslit">Print / save PDF</button><span class="translit-status" id="translitStatus" role="status" aria-live="polite"></span>';
    document.querySelector('button[onclick*="copyOutput"]').parentElement.appendChild(actions);
    document.getElementById('downloadTranslit').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([exportText()], { type: 'text/plain;charset=utf-8' }));
      a.download = 'afrotools-script-mapping.txt';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 0);
      setStatus('TXT export prepared locally. No raw input was uploaded.');
    });
    document.getElementById('printTranslit').addEventListener('click', function () {
      setStatus('Opening the browser print dialog for local PDF saving.');
      window.print();
    });
    window.updateCharGrid();
    window.convert();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}());

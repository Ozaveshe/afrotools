(function () {
  'use strict';
  var engine = window.ArabicNumeralsEngine;
  function escapeHtml(value) {
    var element = document.createElement('div'); element.textContent = value; return element.innerHTML;
  }
  function currentExport() {
    var raw = document.getElementById('numInput').value;
    return [
      'AfroTools digit-shape conversion',
      'Checked: 2026-07-26',
      'Input: ' + raw,
      'Western: ' + engine.convertDigits(raw, 'western'),
      'Arabic-Indic: ' + engine.convertDigits(raw, 'arabic-indic'),
      'Eastern Arabic-Indic: ' + engine.convertDigits(raw, 'eastern-arabic-indic'),
      'Limit: digit-shape conversion only; this is not Arabic-language translation.',
      'Privacy: no raw input is persisted or uploaded.'
    ].join('\n');
  }
  function setStatus(message) { document.getElementById('numeralStatus').textContent = message; }
  function familySummary(families) {
    var labels = {
      western: 'Western',
      'arabic-indic': 'Arabic-Indic',
      'eastern-arabic-indic': 'Eastern Arabic-Indic'
    };
    if (!families.length) return 'No recognised decimal digits detected.';
    return 'Detected: ' + families.map(function (family) { return labels[family]; }).join(', ') + '.';
  }
  window.convert = function () {
    var raw = document.getElementById('numInput').value;
    var resultCard = document.getElementById('resultCard');
    if (!raw) { resultCard.style.display = 'none'; setStatus(''); return; }
    var families = engine.detectFamilies(raw);
    var rows = [
      ['Western digits', engine.convertDigits(raw, 'western'), 'en'],
      ['Arabic-Indic digits', engine.convertDigits(raw, 'arabic-indic'), 'ar'],
      ['Eastern Arabic-Indic digits', engine.convertDigits(raw, 'eastern-arabic-indic'), 'fa']
    ];
    document.getElementById('results').innerHTML = rows.map(function (row, index) {
      return '<section class="res-block"><div class="lbl">' + row[0] + '</div><bdi class="val" lang="' + row[2] + '">' + escapeHtml(row[1]) + '</bdi><button type="button" class="copy-btn" data-copy-index="' + index + '" aria-label="Copy ' + row[0].toLowerCase() + '">Copy</button></section>';
    }).join('');
    resultCard.style.display = '';
    resultCard.querySelectorAll('[data-copy-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(rows[Number(button.dataset.copyIndex)][1]).then(function () { setStatus(rows[Number(button.dataset.copyIndex)][0] + ' copied.'); });
      });
    });
    document.getElementById('numeralDetected').textContent = familySummary(families);
    setStatus(families.length > 1 ? 'Mixed digit families converted without changing surrounding text or logical order.' : 'Converted locally. Surrounding text and punctuation were preserved.');
  };
  function init() {
    var input = document.getElementById('numInput');
    input.setAttribute('aria-describedby', 'numeralLimits numeralDetected numeralStatus');
    input.placeholder = 'Example: Order ١٢ / ref ۴۵ / 67';
    document.getElementById('inputFormat').closest('.row').remove();
    var evidence = document.createElement('section'); evidence.className = 'numeral-evidence'; evidence.id = 'numeralLimits';
    evidence.innerHTML = '<p><strong>Three distinct digit families:</strong> Western 0123456789, Arabic-Indic ٠١٢٣٤٥٦٧٨٩, and Eastern Arabic-Indic ۰۱۲۳۴۵۶۷۸۹.</p><p>This deterministic local tool changes digit shapes while preserving surrounding text. It does not translate Arabic language, infer reading direction, parse a monetary value, or reorder digits.</p><p><strong>Source:</strong> Unicode decimal digit blocks U+0030–0039, U+0660–0669 and U+06F0–06F9. <strong>Checked:</strong> 2026-07-26.</p>';
    input.parentNode.insertBefore(evidence, input);
    var examples = document.createElement('div'); examples.className = 'numeral-input-actions'; examples.setAttribute('aria-label', 'Input examples and clear action');
    examples.innerHTML = '<button type="button" data-example="Invoice 007 / ١٢ / ۴۵">Use mixed-script example</button><button type="button" id="clearNumerals">Clear input</button>';
    input.after(examples);
    var detected = document.createElement('p'); detected.id = 'numeralDetected'; detected.className = 'numeral-detected'; detected.setAttribute('role', 'status'); detected.setAttribute('aria-live', 'polite'); detected.textContent = 'No recognised decimal digits detected.';
    examples.after(detected);
    var actions = document.createElement('div'); actions.className = 'result-actions';
    actions.innerHTML = '<button type="button" id="copyAllNumerals">Copy all formats</button><button type="button" id="downloadNumerals">Download TXT</button><button type="button" id="printNumerals">Print / save PDF</button><span class="numeral-status" id="numeralStatus" role="status" aria-live="polite"></span>';
    document.getElementById('results').after(actions);
    document.getElementById('copyAllNumerals').addEventListener('click', function () { navigator.clipboard.writeText(currentExport()).then(function () { setStatus('All formats copied locally.'); }); });
    document.getElementById('downloadNumerals').addEventListener('click', function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([currentExport()], { type: 'text/plain;charset=utf-8' })); a.download = 'afrotools-digit-shapes.txt'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 0); setStatus('TXT export prepared locally.'); });
    document.getElementById('printNumerals').addEventListener('click', function () { setStatus('Opening the browser print dialog for local PDF saving.'); window.print(); });
    examples.querySelector('[data-example]').addEventListener('click', function (event) { input.value = event.currentTarget.getAttribute('data-example'); window.convert(); input.focus(); });
    document.getElementById('clearNumerals').addEventListener('click', function () { input.value = ''; window.convert(); detected.textContent = 'No recognised decimal digits detected.'; input.focus(); });
    document.querySelectorAll('.ref-table thead tr').forEach(function (row) { row.innerHTML = '<th scope="col">Western</th><th scope="col">Arabic-Indic</th><th scope="col">Eastern Arabic-Indic</th>'; });
    document.querySelectorAll('.ref-table tbody tr').forEach(function (row, index) { row.innerHTML = '<td>' + index + '</td><td class="ar" lang="ar">' + engine.ARABIC_INDIC[index] + '</td><td class="ar" lang="fa">' + engine.EASTERN_ARABIC_INDIC[index] + '</td>'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}());

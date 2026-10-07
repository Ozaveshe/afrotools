#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'ha', 'kayan-aiki', 'naira-zuwa-kalmomi', 'index.html');
const CHECK = process.argv.includes('--check');

// Own the result lifecycle as well as the localized wording: exports must
// always correspond to the currently validated amount, never a cached draft.
function repairExports(html) {
  const functions = {
    convert: `function convert() {
  var raw = cleanAmountInput(document.getElementById('amount').value);
  var card = document.getElementById('resultCard');
  var formatted = document.getElementById('formatted');
  lastWords = '';
  lastDocumentLine = '';
  formatted.textContent = '';
  document.getElementById('result').textContent = '';
  document.getElementById('docPreview').textContent = '';
  renderQuality(0, '');
  if (!raw || isNaN(raw) || parseFloat(raw) < 0) {
    card.style.display = 'none';
    return false;
  }
  var amount = parseFloat(raw);
  if (amount > 999999999999999.99) {
    document.getElementById('result').innerHTML = '<span style="color:#ef4444;">Adadin ya yi yawa. Matsakaici shi ne 999,999,999,999,999.99</span>';
    card.style.display = '';
    return false;
  }
  var code = document.getElementById('currency').value;
  var figure = amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var words = applyCaseMode(amountToWords(amount));
  lastWords = words;
  lastDocumentLine = buildDocumentLine(code, figure, words);
  formatted.textContent = code + ' ' + figure;
  document.getElementById('result').innerHTML = '<span class="currency-label">' + code + ' Adadi cikin kalmomi</span>' + words;
  document.getElementById('docPreview').textContent = lastDocumentLine;
  renderQuality(amount, raw);
  card.style.display = '';
  return true;
}`,
    copyResult: `function copyResult() {
  if (!convert()) { showToast('Saka adadi mai inganci tukuna.'); return; }
  copyValidatedText(lastWords, 'An kwafi!');
}`,
    copyDocumentLine: `function copyDocumentLine() {
  if (!convert()) { showToast('Saka adadi mai inganci tukuna.'); return; }
  copyValidatedText(lastDocumentLine, 'An kwafi layin takarda!');
}`,
    downloadDocumentLine: `function downloadDocumentLine() {
  if (!convert()) { showToast('Saka adadi mai inganci tukuna.'); return; }
  var blob = new Blob([lastDocumentLine + '\\n'], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'adadi-cikin-kalmomi.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 0);
  showToast('An sauke TXT.');
}`,
    downloadJsonResult: `function downloadJsonResult() {
  if (!convert()) { showToast('Saka adadi mai inganci tukuna.'); return; }
  var payload = {
    tool: 'naira-to-words', language: 'ha', currency: document.getElementById('currency').value,
    amount: Number(cleanAmountInput(document.getElementById('amount').value)), words: lastWords,
    documentLine: lastDocumentLine, generatedAt: new Date().toISOString(), localOnly: true
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = 'adadi-cikin-kalmomin-hausa.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 0); showToast('An sauke JSON.');
}`,
    clearAll: `function clearAll() {
  document.getElementById('amount').value = '';
  document.getElementById('payeeName').value = '';
  document.getElementById('docReference').value = '';
  convert();
}`
  };
  for (const [name, replacement] of Object.entries(functions)) {
    const pattern = new RegExp('function ' + name + '\\(\\) \\{[\\s\\S]*?\\n\\}');
    if (!pattern.test(html)) throw new Error('Missing Hausa result owner: ' + name);
    html = html.replace(pattern, () => replacement);
  }
  if (!html.includes('function copyValidatedText(')) {
    html = html.replace('function copyResult() {', `function copyValidatedText(text, successMessage) {
  function unavailable() { showToast('Ba a iya kwafi ba. Ka zabi rubutun ka kwafi da kanka.'); }
  if (!navigator.clipboard || !navigator.clipboard.writeText) { unavailable(); return; }
  Promise.resolve().then(function(){ return navigator.clipboard.writeText(text); })
    .then(function(){ showToast(successMessage); }).catch(unavailable);
}

function copyResult() {`);
  }
  html = html.replace('aria-label="Misali 250000.50"', 'aria-label="Adadin kudi"');
  html = html.replace('<div class="copy-toast" id="toast">', '<div class="copy-toast" id="toast" role="status" aria-live="polite" aria-atomic="true">');
  return html;
}

function build(source) {
  let html = source;
  if (!html.includes('/engines/hausa-number-words-engine.js')) {
    html = html.replace('<script>\nvar ones =', '<script src="/engines/hausa-number-words-engine.js" defer></script>\n<script>\nvar ones =');
  }
  if (!html.includes('onclick="downloadJsonResult()"')) {
    html = html.replace(
      '<button type="button" class="btn btn-outline" onclick="downloadDocumentLine()">Sauke TXT</button>',
      '<button type="button" class="btn btn-outline" onclick="downloadDocumentLine()">Sauke TXT</button>\n      <button type="button" class="btn btn-outline" onclick="downloadJsonResult()">Sauke JSON</button>'
    );
  }
  const oldAmount = /function amountToWords\(amount, currOpt\) \{[\s\S]*?\n\}/;
  const replacement = `function amountToWords(amount) {
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.hausaNumberWords;
  if (!engine) throw new Error('Injin rubutun Hausa bai samu ba. Sake loda shafin.');
  return engine.amount(amount, document.getElementById('currency').value);
}`;
  if (oldAmount.test(html)) html = html.replace(oldAmount, replacement);
  if (!html.includes('function downloadJsonResult()')) {
    html = html.replace('\nfunction clearAll() {', `
function downloadJsonResult() {
  convert();
  if (!lastWords || !lastDocumentLine) { showToast('Saka adadi tukuna.'); return; }
  var payload = {
    tool: 'naira-to-words', language: 'ha', currency: document.getElementById('currency').value,
    amount: Number(cleanAmountInput(document.getElementById('amount').value)), words: lastWords,
    documentLine: lastDocumentLine, generatedAt: new Date().toISOString(), localOnly: true
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = 'adadi-cikin-kalmomin-hausa.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 0); showToast('An sauke JSON.');
}

function clearAll() {`);
  }
  return repairExports(html);
}

const current = fs.readFileSync(PAGE, 'utf8');
const next = build(current);
if (CHECK) {
  if (next !== current) throw new Error('Hausa Naira page is stale; run node scripts/build-hausa-naira-words.js');
  console.log('Hausa Naira source owner is current.');
} else {
  fs.writeFileSync(PAGE, next, 'utf8');
  console.log(next === current ? 'Hausa Naira page already current.' : 'Updated Hausa Naira page.');
}

module.exports = { build };

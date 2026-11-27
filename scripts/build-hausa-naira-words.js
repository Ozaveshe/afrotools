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
  var input = document.getElementById('amount');
  var raw = input.value.trim();
  var card = document.getElementById('resultCard');
  var formatted = document.getElementById('formatted');
  lastWords = '';
  lastDocumentLine = '';
  formatted.textContent = '';
  document.getElementById('result').textContent = '';
  document.getElementById('docPreview').textContent = '';
  renderQuality(0, '');
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  if (!raw) {
    card.style.display = 'none';
    return false;
  }
  var code = document.getElementById('currency').value;
  var parsed;
  try {
    parsed = window.AfroTools.engines.hausaNumberWords.parseAmount(raw, code);
  } catch (error) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'result');
    document.getElementById('result').textContent = error.message;
    card.style.display = '';
    return false;
  }
  var figure = parsed.major.toLocaleString('en') + '.' + parsed.exact.split('.')[1];
  var words = applyCaseMode(amountToWords(parsed.exact));
  lastWords = words;
  lastDocumentLine = buildDocumentLine(code, figure, words);
  formatted.textContent = code + ' ' + figure;
  document.getElementById('result').innerHTML = '<span class="currency-label">' + code + ' Adadi cikin kalmomi</span>' + words;
  document.getElementById('docPreview').textContent = lastDocumentLine;
  renderQuality(parsed, raw);
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
  var parsed = window.AfroTools.engines.hausaNumberWords.parseAmount(document.getElementById('amount').value, document.getElementById('currency').value);
  var numeric = Number(parsed.exact);
  var decimalParts = String(numeric).split('.');
  var roundTrip = decimalParts[0] + '.' + (decimalParts[1] || '').padEnd(2, '0');
  var amountValue = roundTrip === parsed.exact ? numeric : parsed.exact;
  var payload = {
    tool: 'naira-to-words', language: 'ha', currency: document.getElementById('currency').value,
    amount: amountValue, amountExact: parsed.exact, words: lastWords,
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
  html = html.replace(/function cleanAmountInput\(raw\) \{[\s\S]*?\n\}\n/, '');
  html = html.replace('Math.round((amount % 1) * 100) > 0', 'amount.minor > 0')
    .replace('var big = amount >= 1000000;', 'var big = amount.major >= 1000000;');
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
  html = html.replace("Shafin yana da Hausa, sakamakon adadi kuma yana bin rubutun Turanci da ake saba amfani da shi a takardun kudi.", "Ana rubuta adadin da kalmomin Hausa.");
  html = html.replace("Hausa yana taimaka maka ka fahimci zabuka da matakai, yayin da sakamakon adadin ya tsaya a rubutun Turanci da bankuna da ofisoshi suka fi karba a Najeriya.", "Za ka iya zaɓar kuɗi, nau’in takarda da salon haruffa. Ana rubuta adadin da kalmomin Hausa.");
  html = html.replace("Sakamakon yana fita a rubutun Turanci da ake saba amfani da shi a cheque da invoice.", "Misali, ana rubuta 50 kobo a matsayin «Kobo hamsin».");
  html = html.replace("Kayan aikin zai fitar da rubutun kalmomi da za ka iya kwafa zuwa cheque, invoice, resit ko voucher.", "Kayan aikin zai rubuta adadin da kalmomin Hausa. Za ka iya kwafa rubutun zuwa cek, takardar kuɗi, rasit ko baucan biyan kuɗi.");
  html = html.replace("Saka adadin, sannan kayan aikin zai rubuta shi cikin kalmomi da tsarin da ake amfani da shi a cek.", "Saka adadin, sannan kayan aikin zai rubuta shi da kalmomin Hausa don cikawa a cek.");
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

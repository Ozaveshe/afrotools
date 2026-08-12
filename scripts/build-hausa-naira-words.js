#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'ha', 'kayan-aiki', 'naira-zuwa-kalmomi', 'index.html');
const CHECK = process.argv.includes('--check');

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
  return html;
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

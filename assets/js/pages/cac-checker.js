(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.CacNamePreflight;
  var area = document.getElementById('resultArea');
  if (!engine || !area) return;
  var result = null;
  var sourcePromise = null;
  function node(tag, text, attrs) {
    var element = document.createElement(tag); if (text) element.textContent = text;
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); }); return element;
  }
  function message(text) { var status = document.getElementById('cac-local-status'); if (status) status.textContent = text; }
  function download(content, type, name) {
    var url = URL.createObjectURL(new Blob([content], {type:type})); var link = node('a', '', {href:url,download:name});
    document.body.append(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function action(label, callback) { var button = node('button', label, {type:'button',class:'btn btn-secondary'}); button.addEventListener('click', callback); return button; }
  window.checkName = function () {
    result = engine.evaluate({name:document.getElementById('bizName').value, entityType:document.getElementById('regType').value, industry:document.getElementById('industry').value});
    area.replaceChildren();
    var card = node('div', '', {class:'card'}), body = node('div', '', {class:'card-body'});
    body.append(node('h2', 'Local name preflight'), node('p', 'Official availability not checked', {role:'status'}), node('p', result.name, {class:'cac-result-name'}));
    body.append(node('p', result.scope));
    var nameInput = document.getElementById('bizName');
    nameInput.setAttribute('aria-invalid', result.inputValid ? 'false' : 'true');
    if (!result.inputValid) { body.append(node('p', result.reviewItems[0], {id:'cac-name-validation',role:'alert'})); nameInput.setAttribute('aria-describedby', 'cac-name-validation'); card.append(body); area.append(card); nameInput.focus(); return; }
    nameInput.removeAttribute('aria-describedby');
    body.append(node('h3', 'Items to verify'));
    var list = node('ul', '', {class:'issues-list'}); (result.reviewItems.length ? result.reviewItems : ['No local flag. This does not establish registrability or availability.']).forEach(function (item) { list.append(node('li', item)); }); body.append(list);
    var captured = result;
    var sourceStatus = node('p', 'Loading public source metadata…', {role:'status'}); body.append(sourceStatus);
    if (!sourcePromise) { var timeoutController = new AbortController(); var sourceTimer = setTimeout(function () { timeoutController.abort(); }, 4000); sourcePromise = fetch('/data/cac-checker/source-evidence.json', {credentials:'same-origin',cache:'no-store',signal:timeoutController.signal}).then(function (r) { if (!r.ok) throw new Error('unavailable'); return r.json(); }).then(function (payload) { var data = engine.evidence(payload); if (!data) throw new Error('invalid-source-metadata'); return data; }).catch(function () { sourcePromise = null; return null; }).finally(function () { clearTimeout(sourceTimer); }); }
    sourcePromise.then(function (data) { if (result !== captured || !sourceStatus.isConnected) return; captured.sourceEvidence = data; sourceStatus.textContent = data ? 'Source references loaded. Current fees and official availability remain unverified.' : 'Source metadata unavailable. Keep the draft; verify official sources before action.'; });
    body.append(node('h3', 'Alternative drafts'));
    var drafts = node('ul'); result.alternatives.forEach(function (name) { drafts.append(node('li', name)); }); body.append(drafts);
    body.append(node('p', 'Copy a name, then check it on the official public search. Search results are not reservation or approval. Use your CAC account to confirm a reservation and its actual expiry. No name is sent automatically.'));
    body.append(node('a', 'Open official CAC public search', {href:result.officialSearchUrl,target:'_blank',rel:'noopener noreferrer'}));
    body.append(node('p', 'If the official service is unavailable, keep this draft and retry there later. This page cannot provide a substitute registry result.'));
    body.append(node('a', 'Open official CAC reservation portal', {href:result.officialPortalUrl,target:'_blank',rel:'noopener noreferrer'}));
    body.append(action('Copy preparation note', function () { var current = result; if (!navigator.clipboard) { message('Clipboard unavailable; use the local TXT download.'); return; } navigator.clipboard.writeText(engine.note(current)).then(function () { if (result === current) message('Preparation note copied.'); }, function () { if (result === current) message('Copy failed; use TXT download.'); }); }));
    body.append(action('Download preparation TXT', function () { if (result) download(engine.note(result), 'text/plain;charset=utf-8', 'cac-preflight.txt'); }));
    body.append(action('Download preparation JSON', function () { if (result) download(JSON.stringify(result, null, 2), 'application/json', 'cac-preflight.json'); }));
    body.append(node('p', '', {id:'cac-local-status',role:'status','aria-live':'polite'}));
    var existing = node('div', '', {class:'result-actions'}); existing.append(node('save-result-button', '', {'tool-slug':'cac-checker','tool-name':'CAC Checker'}), node('share-result-button', '', {'tool-slug':'cac-checker','tool-name':'CAC Checker'})); body.append(existing);
    card.append(body); area.append(card);
  };
  ['bizName','regType','industry'].forEach(function (id) { document.getElementById(id).addEventListener('input', function () { if (result) { result = null; var nameInput = document.getElementById('bizName'); nameInput.removeAttribute('aria-invalid'); nameInput.removeAttribute('aria-describedby'); area.replaceChildren(node('p', 'Inputs changed. Run the local preflight again.', {role:'status'})); } }); });
})();

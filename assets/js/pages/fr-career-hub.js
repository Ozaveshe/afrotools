(function () {
  'use strict';
  var host = document.querySelector('.fr-career-hub');
  if (!host) return;
  var paths = JSON.parse(document.getElementById('fr-career-paths').textContent);
  var key = 'afrotools-fr-career-hub-v1';
  var status = host.querySelector('[data-career-status]');
  var checklist = host.querySelector('[data-career-checklist]');
  var checks = host.querySelector('[data-career-checks]');
  var next = host.querySelector('[data-career-continue]');
  var state = { path: '', checks: {} };
  function announce(message, success) { status.textContent = message; status.classList.toggle('ok', Boolean(success)); }
  function normalize(raw) {
    var output = { path: raw && Object.hasOwn(paths, raw.path) ? raw.path : '', checks: {} };
    Object.keys(paths).forEach(function (id) {
      output.checks[id] = paths[id].checks.map(function (_, index) { return Boolean(raw && raw.checks && Array.isArray(raw.checks[id]) && raw.checks[id][index] === true); });
    });
    return output;
  }
  try { state = normalize(JSON.parse(localStorage.getItem(key) || '{}')); }
  catch (_) { announce('Le stockage local est indisponible ou la liste était illisible. Vous pouvez préparer une liste et la télécharger.'); }
  var requested = new URLSearchParams(location.search).get('path');
  if (requested && Object.hasOwn(paths, requested)) state.path = requested;
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); announce('Liste enregistrée uniquement sur cet appareil.', true); }
    catch (_) { announce('Enregistrement local impossible. Votre liste reste disponible ici ; téléchargez-la pour la conserver.'); }
  }
  function render() {
    var row = paths[state.path];
    host.querySelectorAll('[data-career-select]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.careerSelect === state.path)); });
    host.querySelector('[data-career-summary]').textContent = row ? row.description : 'Choisissez un parcours pour afficher les vérifications utiles avant le calcul.';
    checklist.hidden = !row;
    next.hidden = !row;
    checks.replaceChildren();
    ['save', 'copy', 'download'].forEach(function (action) { host.querySelector('[data-career-' + action + ']').disabled = !row; });
    if (!row) { next.removeAttribute('href'); return; }
    host.querySelector('[data-career-legend]').textContent = row.title;
    next.href = row.href;
    row.checks.forEach(function (text, index) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox'; input.id = 'fr-career-check-' + index; input.checked = state.checks[state.path][index];
      label.htmlFor = input.id;
      input.addEventListener('change', function () { state.checks[state.path][index] = input.checked; save(); });
      label.append(input, document.createTextNode(text)); checks.append(label);
    });
  }
  state = normalize(state);
  render();
  var search = host.querySelector('[data-career-search]');
  function fold(text) { return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function filter(query) {
    var count = 0;
    host.querySelectorAll('[data-career-path]').forEach(function (card) {
      var row = paths[card.dataset.careerPath];
      card.hidden = !fold(row.title + ' ' + row.description).includes(fold(query.trim()));
      if (!card.hidden) count++;
    });
    host.querySelector('[data-career-search-status]').textContent = count ? count + ' parcours disponible' + (count > 1 ? 's' : '') + '. La recherche reste sur cette page.' : 'Aucun parcours trouvé. Essayez salaire, carrière ou retraite, ou affichez les quatre parcours.';
  }
  search.addEventListener('submit', function (event) { event.preventDefault(); filter(search.querySelector('input').value); });
  search.addEventListener('reset', function () { filter(''); });
  host.querySelectorAll('[data-career-select]').forEach(function (button) { button.addEventListener('click', function () { state.path = button.dataset.careerSelect; render(); save(); }); });
  host.querySelector('[data-career-save]').addEventListener('click', save);
  host.querySelector('[data-career-copy]').addEventListener('click', function () {
    var url = new URL(location.pathname, location.origin); url.searchParams.set('path', state.path);
    if (!navigator.clipboard || !navigator.clipboard.writeText) { announce('Copie indisponible. Lien du parcours : ' + url.href); return; }
    navigator.clipboard.writeText(url.href).then(function () { announce('Lien du parcours copié. Les cases cochées ne sont pas partagées.', true); }, function () { announce('Copie impossible. Lien du parcours : ' + url.href); });
  });
  host.querySelector('[data-career-download]').addEventListener('click', function () {
    var row = paths[state.path];
    var text = 'AFROTOOLS — LISTE DE PRÉPARATION\n' + row.title + '\n' + row.description + '\n\n' + row.checks.map(function (item, index) { return (state.checks[state.path][index] ? '[x] ' : '[ ] ') + item; }).join('\n') + '\n\nAide-mémoire de planification ; vérifiez vos hypothèses avant toute décision.\n';
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var anchor = document.createElement('a'); anchor.href = url; anchor.download = 'afrotools-parcours-' + state.path + '.txt';
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    announce('Liste TXT préparée sur cet appareil.', true);
  });
  host.querySelector('[data-career-reset]').addEventListener('click', function () {
    state = normalize({}); render();
    var url = new URL(location.href); url.searchParams.delete('path'); history.replaceState(null, '', url.pathname + url.search + url.hash);
    try { localStorage.removeItem(key); announce('Liste locale effacée.', true); }
    catch (_) { announce('Liste effacée sur cette page. Le stockage bloqué empêche de confirmer l’effacement sur l’appareil.'); }
  });
})();

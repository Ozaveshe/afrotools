(function () {
  'use strict';
  var checks = Array.from(document.querySelectorAll('[data-nif-check]'));
  var status = document.getElementById('nif-status');
  if (!status || !checks.length) return;
  document.getElementById('nif-export-actions').hidden = false;
  function update() {
    var count = checks.filter(function (input) { return input.checked; }).length;
    status.textContent = count + ' repère' + (count > 1 ? 's' : '') + ' préparé' + (count > 1 ? 's' : '') + ' sur ' + checks.length + '.';
  }
  checks.forEach(function (input) { input.addEventListener('change', update); });
  document.getElementById('nif-download').addEventListener('click', function () {
    var lines = ['NIF RDC — Liste personnelle de préparation', 'Cette liste ne vaut ni demande, ni attestation, ni validation de la DGI.', ''];
    checks.forEach(function (input) { lines.push((input.checked ? '[x] ' : '[ ] ') + input.parentElement.textContent.trim()); });
    lines.push('', 'Démarche officielle : https://e-nif.dgirdc.cd/', 'Guide AfroTools : https://afrotools.com/fr/tools/guide-nif/dr-congo/', 'Sources contrôlées le 16 septembre 2026.');
    var url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'preparation-nif-rdc.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Liste TXT téléchargée. Aucun dossier n’a été transmis à la DGI.';
  });
  document.getElementById('nif-print').addEventListener('click', function () { window.print(); });
})();

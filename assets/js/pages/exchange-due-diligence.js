(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.ExchangeDueDiligence;
  var form = document.getElementById('exchangeWorkbookForm');
  if (!engine || !form) return;
  var fr = document.documentElement.lang === 'fr';
  var labels = fr ? {
    items: {'official-domain':'Domaine officiel','country-availability':'Disponibilité dans le pays prévu','regulator-register':'Registre du régulateur','fee-schedule':'Barème des frais','fiat-deposit':'Dépôt en monnaie locale','fiat-withdrawal':'Retrait en monnaie locale','custody-withdrawal':'Politique de garde et de retrait','security-disclosure':'Publication de sécurité ou de réserves','support-incident':'Assistance et procédure d’incident','small-withdrawal-test':'Petit test de retrait'},
    statuses:{confirmed:'Confirmé avec une source',unclear:'Incertain', 'not-checked':'Non vérifié','not-applicable':'Sans objet'},
    source:'URL de la source', notes:'Notes factuelles', sourceHint:'https://…', notesHint:'Ce que la source indique et ce qui reste incertain',
    documented:'éléments documentés', unresolved:'éléments non résolus', na:'sans objet',
    fix:'Complétez les noms, pays et dates valides des deux prestataires, puis corrigez toute URL invalide.',
    ready:'Dossier local créé. Aucun classement ni verdict de sécurité n’a été produit.',
    stale:'Les données ont changé. Recréez le dossier avant l’export.',
    staleResult:'Ce dossier est obsolète et a été retiré. Recréez-le avec les données actuelles.',
    invalidResult:'Aucun dossier valide. Corrigez les champs signalés puis recommencez.',
    json:'Télécharger JSON', txt:'Télécharger texte', pdf:'Télécharger PDF', print:'Imprimer / Enregistrer en PDF'
  } : {
    items:{'official-domain':'Official domain','country-availability':'Availability in intended country','regulator-register':'Regulator register','fee-schedule':'Fee schedule','fiat-deposit':'Local-currency deposit rail','fiat-withdrawal':'Local-currency withdrawal rail','custody-withdrawal':'Custody and withdrawal policy','security-disclosure':'Security or reserve disclosure','support-incident':'Support and incident route','small-withdrawal-test':'Small withdrawal test'},
    statuses:{confirmed:'Confirmed with a source',unclear:'Unclear','not-checked':'Not checked','not-applicable':'Not applicable'},
    source:'Source URL', notes:'Factual notes', sourceHint:'https://…', notesHint:'What the source says and what remains unclear',
    documented:'documented items', unresolved:'unresolved items', na:'not applicable',
    fix:'Complete both provider names, countries and valid checked dates, then correct any invalid URL.',
    ready:'Local evidence record created. No ranking or safety verdict was produced.',
    stale:'Inputs changed. Rebuild the record before exporting.',
    staleResult:'The prior record is stale and has been removed. Rebuild it from the current inputs.',
    invalidResult:'No valid record is available. Correct the flagged fields and try again.',
    json:'Download JSON', txt:'Download text', pdf:'Download PDF', print:'Print / Save PDF'
  };
  var result = document.getElementById('exchangeWorkbookResult');
  var status = document.getElementById('exchangeWorkbookStatus');
  var actions = document.querySelectorAll('[data-workbook-export]');
  var current = null;
  var signature = '';

  function element(name, className, text) {
    var node = document.createElement(name);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function createEvidenceRows(container, slot) {
    engine.ITEMS.forEach(function (code) {
      var row = element('div', 'exchange-evidence-row');
      row.dataset.item = code;
      var title = element('h3', '', labels.items[code]);
      var selectLabel = element('label', '', fr ? 'État de la preuve' : 'Evidence status');
      var select = element('select');
      select.name = 'provider-' + slot + '-' + code + '-status';
      selectLabel.htmlFor = select.name;
      select.id = select.name;
      engine.STATUSES.forEach(function (value) {
        var option = element('option', '', labels.statuses[value]); option.value = value; option.selected = value === 'not-checked'; select.appendChild(option);
      });
      var sourceLabel = element('label', '', labels.source);
      var source = element('input'); source.type = 'url'; source.maxLength = 500; source.placeholder = labels.sourceHint; source.name = 'provider-' + slot + '-' + code + '-source'; source.id = source.name; sourceLabel.htmlFor = source.id;
      var notesLabel = element('label', '', labels.notes);
      var notes = element('textarea'); notes.maxLength = 500; notes.rows = 2; notes.placeholder = labels.notesHint; notes.name = 'provider-' + slot + '-' + code + '-notes'; notes.id = notes.name; notesLabel.htmlFor = notes.id;
      row.append(title, selectLabel, select, sourceLabel, source, notesLabel, notes);
      container.appendChild(row);
    });
  }
  document.querySelectorAll('[data-evidence-rows]').forEach(function (node, index) { createEvidenceRows(node, index + 1); });

  function value(name) { var node = form.elements[name]; return node ? node.value : ''; }
  function collect() {
    return { providers: [1, 2].map(function (slot) {
      var items = {};
      engine.ITEMS.forEach(function (code) { items[code] = { status:value('provider-' + slot + '-' + code + '-status'), sourceUrl:value('provider-' + slot + '-' + code + '-source'), notes:value('provider-' + slot + '-' + code + '-notes') }; });
      return { name:value('provider-' + slot + '-name'), country:value('provider-' + slot + '-country'), checkedDate:value('provider-' + slot + '-date'), items:items };
    }) };
  }
  function snapshot() { return JSON.stringify(collect()); }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clearResult(message) { result.replaceChildren(element('p', 'exchange-empty-state', message)); }
  function render(report) {
    var wrap = element('div', 'exchange-summary-grid');
    report.providers.forEach(function (provider) {
      var card = element('article', 'exchange-summary');
      card.append(element('span', 'exchange-summary-kicker', (fr ? 'Prestataire ' : 'Provider ') + provider.slot), element('h3', '', provider.name));
      var counts = element('div', 'exchange-counts');
      counts.append(element('strong', '', provider.counts.documented + ' / ' + provider.counts.applicable), element('span', '', labels.documented), element('strong', '', String(provider.counts.unresolved)), element('span', '', labels.unresolved), element('strong', '', String(provider.counts.notApplicable)), element('span', '', labels.na));
      card.append(counts);
      if (provider.evidenceStale) card.appendChild(element('p', 'exchange-freshness-warning', fr ? 'Date ancienne (' + provider.ageDays + ' jours) : actualisez les sources. Les éléments confirmés restent non résolus.' : 'Old checked date (' + provider.ageDays + ' days): refresh the sources. Confirmed items remain unresolved.'));
      var unresolved = element('ul');
      provider.items.filter(function (item) { return item.status !== 'not-applicable' && !item.documented; }).forEach(function (item) { unresolved.appendChild(element('li', '', labels.items[item.code] + ' — ' + labels.statuses[item.status])); });
      if (!unresolved.childElementCount) unresolved.appendChild(element('li', '', fr ? 'Aucun élément applicable non résolu.' : 'No unresolved applicable item.'));
      card.append(unresolved); wrap.appendChild(card);
    });
    var boundary = element('p', 'exchange-result-boundary', fr ? 'Comparaison de couverture documentaire uniquement. Aucun score de confiance, classement, conseil, verdict de sécurité, décision réglementaire ou recommandation.' : report.boundary);
    result.replaceChildren(wrap, boundary);
    result.focus({ preventScroll:true });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var report = engine.build(collect());
    if (report.errors.length) { current = null; signature = ''; setActions(false); clearResult(labels.invalidResult); status.textContent = labels.fix; status.classList.add('is-error'); return; }
    current = report; signature = snapshot(); render(report); setActions(true); status.classList.remove('is-error'); status.textContent = labels.ready;
  });
  function markStale() {
    if (!current || signature === snapshot()) return;
    current = null; signature = ''; setActions(false); clearResult(labels.staleResult); status.classList.remove('is-error'); status.textContent = labels.stale;
  }
  form.querySelectorAll('input,select,textarea').forEach(function (control) {
    control.addEventListener('input', markStale);
    control.addEventListener('change', markStale);
  });

  function blobDownload(content, type, extension) {
    var url = URL.createObjectURL(new Blob([content], {type:type}));
    var link = element('a'); link.href = url; link.download = 'crypto-exchange-due-diligence.' + extension; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function reportText() { return engine.text(current, fr ? 'fr' : 'en', labels); }
  function pdfExport() {
    if (!window.jspdf || !window.jspdf.jsPDF) { status.textContent = fr ? 'Le moteur PDF local est indisponible.' : 'The local PDF engine is unavailable.'; return; }
    var doc = new window.jspdf.jsPDF({unit:'pt',format:'a4'}), y = 48, margin = 46, width = 503;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(fr ? 'Dossier de vérification d’une plateforme crypto' : 'Crypto exchange due-diligence record', margin, y); y += 24;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.splitTextToSize(reportText(), width).forEach(function (line) { if (y > 790) { doc.addPage(); y = 48; } doc.text(line, margin, y); y += 12; });
    doc.save('crypto-exchange-due-diligence.pdf');
  }
  actions.forEach(function (button) {
    button.addEventListener('click', function () {
      if (!current || signature !== snapshot()) {
        setActions(false);
        status.textContent = labels.stale;
        return;
      }
      var type = button.dataset.workbookExport;
      if (type === 'json') blobDownload(JSON.stringify(current, null, 2), 'application/json', 'json');
      if (type === 'txt') blobDownload(reportText(), 'text/plain;charset=utf-8', 'txt');
      if (type === 'pdf') pdfExport();
      if (type === 'print') window.print();
    });
  });
})();

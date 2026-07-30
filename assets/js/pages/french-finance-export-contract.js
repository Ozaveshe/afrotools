(function frenchFinanceExportContract(global) {
  'use strict';

  var CONFIG_ID = 'afrotools-fr-finance-export-contract';
  var ROOT_CLASS = 'fr-finance-export-contract';
  var COMPLETE_EVENT = 'afrotools-fr-finance-export-complete';
  var verifiedWorkflowEvidence = null;
  var initialResultState = new WeakMap();
  var FORMAT_ORDER = ['copy', 'txt', 'csv', 'json', 'pdf', 'print', 'ics', 'svg', 'png', 'jpeg'];
  var FORMAT_LABELS = {
    copy: 'Copier le résumé',
    txt: 'Télécharger le TXT',
    csv: 'Télécharger le CSV',
    json: 'Télécharger le JSON',
    pdf: 'Télécharger le PDF',
    print: 'Imprimer',
    ics: 'Télécharger le calendrier ICS',
    svg: 'Télécharger le SVG',
    png: 'Télécharger le PNG',
    jpeg: 'Télécharger le JPEG'
  };

  function parseConfig() {
    var node = document.getElementById(CONFIG_ID);
    if (!node) return null;
    try {
      var parsed = JSON.parse(node.textContent || '{}');
      parsed.formats = Array.isArray(parsed.formats)
        ? parsed.formats.filter(function (format) { return FORMAT_ORDER.indexOf(format) !== -1; })
        : [];
      return parsed.formats.length ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function isVisible(element) {
    if (!element || !element.isConnected) return false;
    var style = global.getComputedStyle(element);
    var rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function comparable(value) {
    return clean(value).replace(/₦/g, 'NGN').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function frenchLabel(element) {
    if (!element) return '';
    if (element.labels && element.labels[0]) return clean(element.labels[0].textContent);
    var labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      var labelled = document.getElementById(labelledBy);
      if (labelled) return clean(labelled.textContent);
    }
    return clean(
      element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.getAttribute('name')
      || element.id
      || 'Valeur'
    );
  }

  function inputValue(element) {
    if (element.tagName === 'SELECT') {
      return clean(element.options[element.selectedIndex] ? element.options[element.selectedIndex].textContent : element.value);
    }
    if (element.tagName === 'BUTTON') return clean(element.textContent);
    if (element.type === 'checkbox' || element.type === 'radio') return element.checked ? 'Oui' : 'Non';
    return clean(element.value);
  }

  function collectInputs() {
    if (verifiedWorkflowEvidence && Array.isArray(verifiedWorkflowEvidence.inputs)) {
      return verifiedWorkflowEvidence.inputs.map(function (item) {
        var element = document.querySelector(item.selector);
        if (!element || !element.isConnected) throw new Error('Le champ vérifié du scénario n’est plus disponible.');
        var currentValue = inputValue(element);
        if (comparable(currentValue) !== comparable(item.value)) {
          throw new Error('Le scénario affiché a changé. Relancez le calcul avant l’export.');
        }
        return { label: clean(item.label), value: clean(item.value) };
      });
    }
    var items = [];
    var scope = document.querySelector('main') || document.body;
    scope.querySelectorAll('input,select,textarea').forEach(function (element) {
      var type = String(element.type || '').toLowerCase();
      if (!isVisible(element) || element.disabled || /^(?:email|password|file|hidden|button|submit|reset)$/.test(type)) return;
      if (element.closest('.' + ROOT_CLASS + ',[role="dialog"],dialog')) return;
      var value = inputValue(element);
      if (!value) return;
      items.push({ label: frenchLabel(element), value: value });
    });
    return items.slice(0, 24);
  }

  function addResult(results, seen, label, value) {
    label = clean(label);
    value = clean(value);
    if (!label || !value || value.length > 2000) return;
    var key = label + '\u0000' + value;
    if (seen[key]) return;
    seen[key] = true;
    results.push({ label: label, value: value });
  }

  function forbiddenResultNode(element) {
    return !element || /^H[1-6]$/.test(element.tagName) || Boolean(element.closest([
      'nav', 'footer', 'header', 'afro-navbar', 'afro-footer',
      '.' + ROOT_CLASS, '#fr-finance-print-contract', '[role="dialog"]', 'dialog',
      '[class*="hero"]', '[class*="banner"]', '[class*="breadcrumb"]',
      '[class*="source"]', '[class*="method"]', '[class*="verification"]',
      '[class*="privacy"]', '[class*="safety"]', '[class*="disclaimer"]',
      '[class*="limitation"]', '[class*="assumption"]', '[class*="cta"]',
      '[class*="signup"]', '[class*="subscribe"]', '[data-tool-verification-panel]'
    ].join(',')));
  }

  function meaningfulResult(value) {
    value = clean(value);
    return Boolean(value && value.length <= 2000 && (
      /\d/.test(value)
      || /\b(?:admissible|inadmissible|éligible|non éligible|valide|invalide|conforme|non conforme|positif|négatif|faible|moyen|élevé|indisponibles?|disponibles?|bloqué|accepté|refusé|réussi|échec|complet|incomplet|rentable|déficit|alerte|risque|aucune estimation|sous la plage|dans la plage|au-dessus de la plage)\b/i.test(value)
    ));
  }

  function explicitResultNodes() {
    var scope = document.querySelector('main') || document.body;
    return Array.from(scope.querySelectorAll([
      'output', '[data-result]', '[data-results]', '[data-output]', '[data-result-rows]',
      '[role="status"]', '[role="alert"]',
      '[id*="result" i]', '[class*="result" i]',
      '[id*="summary" i]', '[class*="summary" i]',
      '[id*="output" i]', '[class*="output" i]'
    ].join(','))).filter(function (element) { return !forbiddenResultNode(element); });
  }

  function rememberInitialResultState() {
    explicitResultNodes().forEach(function (element) {
      initialResultState.set(element, {
        visible: isVisible(element),
        text: clean(element.textContent)
      });
    });
  }

  function collectResultsFromRegion(region, results, seen) {
    region.querySelectorAll('dt').forEach(function (term) {
      var value = term.nextElementSibling;
      if (value && value.tagName === 'DD' && meaningfulResult(value.textContent)) {
        addResult(results, seen, term.textContent, value.textContent);
      }
    });
    region.querySelectorAll('table tbody tr,tr[data-result-row]').forEach(function (row) {
      var cells = row.querySelectorAll('th,td');
      if (cells.length > 1) {
        var value = Array.from(cells).slice(1).map(function (cell) { return clean(cell.textContent); }).join(' | ');
        if (meaningfulResult(value)) addResult(results, seen, cells[0].textContent, value);
      }
    });
    if (!results.length) {
      var text = clean(region.textContent);
      if (meaningfulResult(text)) {
        addResult(
          results,
          seen,
          region.getAttribute('aria-label') || region.querySelector('h3,h4')?.textContent || 'Résultat',
          text
        );
      }
    }
  }

  function collectResults() {
    var results = [];
    var seen = Object.create(null);
    if (verifiedWorkflowEvidence && Array.isArray(verifiedWorkflowEvidence.expectedResults)) {
      verifiedWorkflowEvidence.expectedResults.forEach(function (item) {
        var region = document.querySelector(item.selector);
        if (!region || !isVisible(region) || forbiddenResultNode(region)) {
          throw new Error('La région de résultat vérifiée n’est plus disponible.');
        }
        if (comparable(region.textContent).indexOf(comparable(item.value)) === -1) {
          throw new Error('Le résultat affiché a changé. Relancez le calcul avant l’export.');
        }
        if (!meaningfulResult(item.value)) throw new Error('Le résultat vérifié n’est pas exploitable.');
        addResult(results, seen, item.label, item.value);
      });
      return results.slice(0, 32);
    }
    explicitResultNodes().forEach(function (region) {
      if (!isVisible(region)) return;
      var initial = initialResultState.get(region);
      var text = clean(region.textContent);
      if (initial && initial.visible && initial.text === text) return;
      collectResultsFromRegion(region, results, seen);
    });
    return results.slice(0, 32);
  }

  function snapshot(config) {
    var data = {
      schema: 'afrotools.fr.finance.export.v1',
      route: global.location.pathname.replace(/\/index\.html$/, '/'),
      title: clean(document.querySelector('h1')?.textContent || document.title),
      generatedAt: new Date().toISOString(),
      inputs: collectInputs(),
      results: collectResults(),
      privacy: {
        processing: 'local',
        accountRequired: false,
        emailRequired: false
      },
      englishOwnerRoute: config.englishRoute
    };
    if (!data.inputs.length) throw new Error('Renseignez le scénario avant l’export.');
    if (!data.results.length) throw new Error('Calculez ou actualisez un résultat avant l’export.');
    return data;
  }

  function summaryText(data) {
    var lines = [
      'AfroTools — résumé financier',
      data.title,
      'Route : ' + data.route,
      '',
      'Données saisies'
    ];
    data.inputs.forEach(function (item) { lines.push(item.label + ' : ' + item.value); });
    lines.push('', 'Résultats');
    data.results.forEach(function (item) { lines.push(item.label + ' : ' + item.value); });
    lines.push('', 'Confidentialité : traitement local, sans compte ni adresse e-mail.');
    return lines.join('\n');
  }

  function slug(value) {
    return clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'rapport';
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.dataset.noPdfGate = 'true';
    anchor.dataset.frFinanceGeneratedDownload = 'true';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(value) {
    return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
  }

  function csvText(data) {
    var rows = [['Type', 'Champ', 'Valeur']];
    data.inputs.forEach(function (item) { rows.push(['Donnée saisie', item.label, item.value]); });
    data.results.forEach(function (item) { rows.push(['Résultat', item.label, item.value]); });
    return '\ufeff' + rows.map(function (row) { return row.map(csvCell).join(';'); }).join('\r\n') + '\r\n';
  }

  function calendarText(data) {
    var date = data.inputs.map(function (item) { return item.value; }).find(function (value) {
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    }) || '2026-07-01';
    var compactDate = date.replace(/-/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AfroTools//Finance FR//FR',
      'BEGIN:VEVENT',
      'UID:' + slug(data.route) + '-fixture@afrotools.local',
      'DTSTART;VALUE=DATE:' + compactDate,
      'SUMMARY:' + clean(data.title).replace(/[,;\\]/g, ' '),
      'DESCRIPTION:' + clean(summaryText(data)).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;'),
      'END:VEVENT',
      'END:VCALENDAR',
      ''
    ].join('\r\n');
  }

  function svgText(data) {
    var firstInput = data.inputs[0];
    var firstResult = data.results[0];
    function escapeXml(value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character];
      });
    }
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
      '<rect width="1200" height="630" fill="#0f172a"/>',
      '<text x="72" y="105" fill="#38bdf8" font-family="Arial" font-size="30">AFROTOOLS</text>',
      '<text x="72" y="175" fill="#ffffff" font-family="Arial" font-size="38">' + escapeXml(data.title) + '</text>',
      '<text x="72" y="265" fill="#cbd5e1" font-family="Arial" font-size="25">' + escapeXml(firstInput.label + ' : ' + firstInput.value) + '</text>',
      '<text x="72" y="335" fill="#ffffff" font-family="Arial" font-size="28">' + escapeXml(firstResult.label + ' : ' + firstResult.value) + '</text>',
      '<text x="72" y="555" fill="#94a3b8" font-family="Arial" font-size="20">Calcul local · estimation de planification</text>',
      '</svg>'
    ].join('');
  }

  function imageDownload(format, data, filenameBase) {
    var svg = svgText(data);
    if (format === 'svg') {
      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filenameBase + '.svg');
      return Promise.resolve(filenameBase + '.svg');
    }
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        canvas.getContext('2d').drawImage(image, 0, 0);
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error('Impossible de créer l’image.'));
            return;
          }
          var extension = format === 'jpeg' ? 'jpg' : 'png';
          downloadBlob(blob, filenameBase + '.' + extension);
          resolve(filenameBase + '.' + extension);
        }, format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
      };
      image.onerror = function () { reject(new Error('Impossible de rouvrir le visuel SVG.')); };
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function pdfSafe(value) {
    return clean(value)
      .replace(/\u00a0/g, ' ')
      .replace(/₦/g, 'NGN ')
      .replace(/GH₵/g, 'GHS ')
      .replace(/€/g, 'EUR ')
      .replace(/£/g, 'GBP ')
      .replace(/[–—]/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e]/g, '');
  }

  function loadJsPdf() {
    if (global.jspdf && typeof global.jspdf.jsPDF === 'function') return Promise.resolve(global.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.querySelector('script[data-fr-finance-jspdf]');
      if (!script) {
        script = document.createElement('script');
        script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
        script.dataset.frFinanceJspdf = 'true';
        document.head.appendChild(script);
      }
      function ready() {
        if (global.jspdf && global.jspdf.jsPDF) resolve(global.jspdf.jsPDF);
        else reject(new Error('Le générateur PDF local est indisponible.'));
      }
      if (global.jspdf && global.jspdf.jsPDF) ready();
      else {
        script.addEventListener('load', ready, { once: true });
        script.addEventListener('error', function () {
          reject(new Error('Le générateur PDF local est indisponible.'));
        }, { once: true });
      }
    });
  }

  async function downloadPdf(data, filename) {
    var JsPDF = await loadJsPdf();
    var pdf = new JsPDF({ unit: 'mm', format: 'a4' });
    var y = 18;
    function write(value, bold, size) {
      var lines = pdf.splitTextToSize(pdfSafe(value), 170);
      var needed = Math.max(5, lines.length * 4.2);
      if (y + needed > 280) {
        pdf.addPage();
        y = 18;
      }
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size || 9);
      pdf.text(lines, 20, y);
      y += needed;
    }
    write('AFROTOOLS', true, 14);
    write(data.title, true, 12);
    y += 3;
    write('Donnees saisies', true, 11);
    data.inputs.slice(0, 14).forEach(function (item) { write(item.label + ' : ' + item.value); });
    y += 3;
    write('Resultats', true, 11);
    data.results.slice(0, 22).forEach(function (item) { write(item.label + ' : ' + item.value); });
    y += 3;
    write('Estimation de planification. Verifiez les regles, taux, sources et dates affiches.', false, 8);
    write('Traitement local. Aucun compte ni e-mail requis.', false, 8);
    downloadBlob(pdf.output('blob'), filename);
  }

  async function copyText(value) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(value);
      return;
    }
    var area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('La copie a échoué.');
  }

  function ensurePrintArea(data) {
    var area = document.getElementById('fr-finance-print-contract');
    if (!area) {
      area = document.createElement('section');
      area.id = 'fr-finance-print-contract';
      area.setAttribute('aria-label', 'Résumé à imprimer');
      document.body.appendChild(area);
    }
    area.innerHTML = '<h1></h1><h2>Données saisies</h2><dl data-print-inputs></dl><h2>Résultats</h2><dl data-print-results></dl>'
      + '<p>Estimation de planification. Vérifiez les règles, taux et sources datés avant toute décision.</p>';
    area.querySelector('h1').textContent = data.title;
    [
      ['[data-print-inputs]', data.inputs],
      ['[data-print-results]', data.results]
    ].forEach(function (entry) {
      var list = area.querySelector(entry[0]);
      entry[1].forEach(function (item) {
        var term = document.createElement('dt');
        var definition = document.createElement('dd');
        term.textContent = item.label;
        definition.textContent = item.value;
        list.append(term, definition);
      });
    });
    return area;
  }

  async function runExport(format, config, status) {
    var data = snapshot(config);
    var text = summaryText(data);
    var filenameBase = 'afrotools-' + slug(data.title) + '-' + new Date().toISOString().slice(0, 10);
    var filename = '';
    status.textContent = 'Préparation de l’export local…';
    if (format === 'copy') {
      await copyText(text);
      filename = 'presse-papiers';
    } else if (format === 'txt') {
      filename = filenameBase + '.txt';
      downloadBlob(new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' }), filename);
    } else if (format === 'csv') {
      filename = filenameBase + '.csv';
      downloadBlob(new Blob([csvText(data)], { type: 'text/csv;charset=utf-8' }), filename);
    } else if (format === 'json') {
      filename = filenameBase + '.json';
      downloadBlob(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }), filename);
    } else if (format === 'ics') {
      filename = filenameBase + '.ics';
      downloadBlob(new Blob([calendarText(data)], { type: 'text/calendar;charset=utf-8' }), filename);
    } else if (format === 'print') {
      ensurePrintArea(data);
      global.print();
      filename = 'impression';
    } else if (format === 'pdf') {
      filename = filenameBase + '.pdf';
      await downloadPdf(data, filename);
    } else if (format === 'svg' || format === 'png' || format === 'jpeg') {
      filename = await imageDownload(format, data, filenameBase);
    } else {
      throw new Error('Format non pris en charge.');
    }
    status.textContent = format === 'copy'
      ? 'Résumé copié.'
      : format === 'print'
        ? 'Vue d’impression préparée.'
        : 'Export ' + format.toUpperCase() + ' téléchargé.';
    global.dispatchEvent(new CustomEvent(COMPLETE_EVENT, {
      detail: { format: format, filename: filename, snapshot: data, summary: text }
    }));
    return data;
  }

  function controlFormat(control) {
    if (!control) return null;
    if (control.dataset.frFinanceExportFormat) return control.dataset.frFinanceExportFormat;
    var signal = clean([
      control.getAttribute('aria-label'),
      control.getAttribute('title'),
      control.getAttribute('download'),
      control.id,
      control.className,
      control.textContent,
      control.getAttribute('onclick')
    ].join(' ')).toLowerCase();
    if (/\b(?:imprimer|impression|print)\b/.test(signal)) return 'print';
    if (/\b(?:copier|copy)\b/.test(signal)) return 'copy';
    if (/\bpdf\b/.test(signal)) return 'pdf';
    if (/\bcsv\b/.test(signal)) return 'csv';
    if (/\bjson\b/.test(signal)) return 'json';
    if (/\b(?:txt|texte|text)\b/.test(signal)) return 'txt';
    if (/\b(?:ics|calendrier|calendar)\b/.test(signal)) return 'ics';
    if (/\bsvg\b/.test(signal)) return 'svg';
    if (/\bpng\b/.test(signal)) return 'png';
    if (/\bjpe?g\b/.test(signal)) return 'jpeg';
    return null;
  }

  function isExportControl(control, format, config) {
    if (!control || !format || config.formats.indexOf(format) === -1) return false;
    if (control.dataset.frFinanceGeneratedDownload === 'true' || control.dataset.noPdfGate === 'true') return false;
    if (control.closest('nav,footer,afro-navbar,afro-footer,[data-chat],[class*="chat"]')) return false;
    var label = clean(control.getAttribute('aria-label') || control.textContent || control.value);
    if (/^(?:import|importer)\b/i.test(label)) return false;
    if (control.tagName === 'A' && !control.hasAttribute('download') && !control.hasAttribute('onclick')
      && !control.dataset.frFinanceExportFormat) return false;
    return true;
  }

  function render(config) {
    var root = document.createElement('section');
    root.className = ROOT_CLASS;
    root.setAttribute('aria-labelledby', 'fr-finance-export-title');
    root.innerHTML = '<div class="fr-finance-export-shell"><p class="fr-finance-export-kicker">Exports locaux et privés</p>'
      + '<h2 id="fr-finance-export-title">Conserver ce résultat</h2>'
      + '<p>Les fichiers sont créés dans votre navigateur à partir du scénario affiché. Aucun compte ni e-mail n’est requis.</p>'
      + '<div class="fr-finance-export-actions"></div><p class="fr-finance-export-status" role="status" aria-live="polite"></p></div>';
    var actions = root.querySelector('.fr-finance-export-actions');
    FORMAT_ORDER.forEach(function (format) {
      if (config.formats.indexOf(format) === -1) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'fr-finance-export-button';
      button.dataset.frFinanceExportFormat = format;
      button.textContent = FORMAT_LABELS[format];
      actions.appendChild(button);
    });
    var main = document.querySelector('main');
    if (main) main.appendChild(root);
    else document.body.appendChild(root);
    return root;
  }

  function installStyles() {
    if (document.getElementById('fr-finance-export-contract-styles')) return;
    var style = document.createElement('style');
    style.id = 'fr-finance-export-contract-styles';
    style.textContent = ''
      + '.' + ROOT_CLASS + '{box-sizing:border-box;min-width:0;max-width:100%;padding:20px 16px 40px;color:var(--color-text,#172033)}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-shell{box-sizing:border-box;min-width:0;width:100%;max-width:1100px;margin:0 auto;padding:20px;border:1px solid var(--color-border,#dbe3ef);border-radius:14px;background:var(--color-surface,#fff)}'
      + '.' + ROOT_CLASS + ' h2{margin:4px 0 8px;font-size:1.25rem}'
      + '.' + ROOT_CLASS + ' p{max-width:75ch;line-height:1.55}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-kicker{margin:0;color:var(--color-primary,#0056b3);font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-actions{min-width:0;max-width:100%;display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-button{box-sizing:border-box;min-width:0;max-width:100%;min-height:44px;padding:10px 14px;border:1px solid var(--color-primary,#0056b3);border-radius:9px;background:var(--color-surface,#fff);color:var(--color-primary,#0056b3);font:inherit;font-weight:750;white-space:normal;overflow-wrap:anywhere;cursor:pointer}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-button:focus-visible{outline:3px solid #f4c145;outline-offset:3px}'
      + '.' + ROOT_CLASS + ' .fr-finance-export-status{min-height:1.4em;margin:10px 0 0;font-size:.88rem}'
      + '#fr-finance-print-contract{display:none}'
      + '@media(max-width:375px){.' + ROOT_CLASS + ' .fr-finance-export-actions{display:grid;grid-template-columns:1fr}.' + ROOT_CLASS + ' .fr-finance-export-button{width:100%}}'
      + '@media print{body>*:not(#fr-finance-print-contract){display:none!important}#fr-finance-print-contract{display:block!important;padding:24px;color:#111}#fr-finance-print-contract dl{display:grid;grid-template-columns:minmax(160px,1fr) 2fr;gap:6px 14px}#fr-finance-print-contract dt{font-weight:700}#fr-finance-print-contract dd{margin:0}}';
    document.head.appendChild(style);
  }

  function init() {
    var config = parseConfig();
    if (!config) return;
    rememberInitialResultState();
    installStyles();
    var root = render(config);
    var status = root.querySelector('[role="status"]');
    global.addEventListener('click', function (event) {
      var control = event.target.closest('button,a,input[type="button"],input[type="submit"]');
      var format = controlFormat(control);
      if (!isExportControl(control, format, config)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      runExport(format, config, status).catch(function (error) {
        status.textContent = error && error.message ? error.message : 'L’export a échoué.';
        global.dispatchEvent(new CustomEvent(COMPLETE_EVENT, {
          detail: { format: format, error: status.textContent }
        }));
      });
    }, true);
  }

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.frenchFinanceExport = {
    setWorkflowEvidence: function (evidence) {
      verifiedWorkflowEvidence = evidence && typeof evidence === 'object' ? evidence : null;
    },
    snapshot: function () {
      var config = parseConfig() || { englishRoute: '', englishId: '' };
      return snapshot(config);
    },
    summaryText: summaryText,
    run: function (format) {
      var config = parseConfig();
      if (!config) return Promise.reject(new Error('Contrat d’export absent.'));
      var status = document.querySelector('.' + ROOT_CLASS + ' [role="status"]');
      return runExport(format, config, status);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);

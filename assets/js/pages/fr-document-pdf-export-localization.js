(function () {
  'use strict';

  if (window.__frDocumentPdfExportLocalizationInstalled) return;
  window.__frDocumentPdfExportLocalizationInstalled = true;

  var NativeBlob = window.Blob;
  if (typeof NativeBlob !== 'function') return;

  var labels = {
    'Line item': 'Poste',
    'Year 1': 'Année 1',
    'Year 2': 'Année 2',
    'Year 3': 'Année 3',
    'Year 4': 'Année 4',
    'Year 5': 'Année 5',
    'Revenue': 'Chiffre d’affaires',
    'Direct costs': 'Coûts directs',
    'Gross profit': 'Marge brute',
    'Operating expenses': 'Charges d’exploitation',
    'Salaries': 'Salaires',
    'Marketing': 'Marketing',
    'Capex': 'Dépenses d’investissement',
    'Operating profit': 'Résultat d’exploitation',
    'Net cash': 'Trésorerie nette',
    'Startup costs': 'Coûts de démarrage',
    'Owner equity': 'Apport du propriétaire',
    'Funding required': 'Financement nécessaire',
    'Action': 'Action',
    'Owner': 'Responsable',
    'Due date': 'Échéance',
    'Priority': 'Priorité',
    'Status': 'Statut',
    'Source': 'Source',
    'job_title': 'poste',
    'company': 'entreprise',
    'country': 'pays',
    'city_remote': 'ville_ou_distanciel',
    'job_link': 'lien_offre',
    'source': 'source',
    'deadline': 'échéance',
    'salary_range': 'fourchette_salariale',
    'status': 'statut',
    'cv_version_used': 'version_cv_utilisée',
    'cover_letter_attached': 'lettre_motivation_jointe',
    'application_pack_attached': 'dossier_candidature_joint',
    'notes': 'notes',
    'follow_up_date': 'date_relance',
    'updated_at': 'mis_à_jour_le',
    'Local-first backup. Keep private if the document contains sensitive business or personal data.': 'Sauvegarde locale. Gardez-la privée si le document contient des données professionnelles ou personnelles sensibles.'
  };

  function exact(value) {
    return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value;
  }

  function parseCsvRow(row) {
    var cells = [];
    var value = '';
    var quoted = false;
    for (var index = 0; index < row.length; index += 1) {
      var char = row[index];
      if (char === '"') {
        if (quoted && row[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        cells.push(value);
        value = '';
      } else {
        value += char;
      }
    }
    cells.push(value);
    return cells;
  }

  function csvCell(value) {
    var text = exact(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function localizeCsv(source) {
    return source.split(/\r?\n/).map(function (row) {
      return parseCsvRow(row).map(csvCell).join(',');
    }).join('\n');
  }

  function localizeJson(source) {
    try {
      var parsed = JSON.parse(source);
      function visit(value) {
        if (Array.isArray(value)) return value.map(visit);
        if (value && typeof value === 'object') {
          Object.keys(value).forEach(function (key) { value[key] = visit(value[key]); });
          return value;
        }
        return typeof value === 'string' ? exact(value) : value;
      }
      return JSON.stringify(visit(parsed), null, 2);
    } catch (_) {
      return source;
    }
  }

  function localizeLines(source) {
    return source.split(/\r?\n/).map(function (line) {
      var match = line.match(/^(\s*)([^:]{1,60})(:\s*)([\s\S]*)$/);
      if (match && exact(match[2]) !== match[2]) {
        return match[1] + exact(match[2]) + match[3] + match[4];
      }
      var trimmed = line.trim();
      return exact(trimmed) === trimmed ? line : line.replace(trimmed, exact(trimmed));
    }).join('\n');
  }

  function localizeHtml(source) {
    return source.replace(/>([^<>]{1,80})</g, function (whole, text) {
      var trimmed = text.trim();
      return exact(trimmed) === trimmed
        ? whole
        : '>' + text.replace(trimmed, exact(trimmed)) + '<';
    });
  }

  function localizeCalendar(source) {
    return source
      .replace(/^SUMMARY:Next meeting:\s*/m, 'SUMMARY:Prochaine réunion : ')
      .replace(
        /^DESCRIPTION:Follow-up meeting generated from AfroTools minutes\.$/m,
        'DESCRIPTION:Réunion de suivi créée à partir du compte rendu AfroTools.'
      );
  }

  function localizePart(part, type) {
    if (typeof part !== 'string') return part;
    if (/text\/csv/i.test(type)) return localizeCsv(part);
    if (/application\/json/i.test(type)) return localizeJson(part);
    if (/text\/html|application\/msword/i.test(type)) return localizeHtml(part);
    if (/text\/calendar/i.test(type)) return localizeCalendar(part);
    if (/text\/plain/i.test(type)) return localizeLines(part);
    return part;
  }

  function FrenchExportBlob(parts, options) {
    var type = String(options && options.type || '');
    var textual = /^(?:text\/|application\/(?:json|msword))/i.test(type);
    var localizedParts = textual
      ? Array.prototype.map.call(parts || [], function (part) { return localizePart(part, type); })
      : parts;
    return new NativeBlob(localizedParts, options);
  }

  FrenchExportBlob.prototype = NativeBlob.prototype;
  Object.setPrototypeOf(FrenchExportBlob, NativeBlob);
  window.Blob = FrenchExportBlob;
})();

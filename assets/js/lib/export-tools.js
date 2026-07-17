(function installExportTools(root) {
  'use strict';

  function normalize(value) {
    var text = String(value == null ? '' : value);
    if (root.AfroToolsLocalization && typeof root.AfroToolsLocalization.normalizeDisplay === 'function') return root.AfroToolsLocalization.normalizeDisplay(text);
    return text.normalize('NFC');
  }

  function label(key, fallback) {
    var runtime = root.AfroTools && root.AfroTools.i18n;
    if (!runtime) return fallback;
    var result = runtime.t(key);
    return result.state === 'missing' ? fallback : result.value;
  }

  function escapeHtml(value) {
    return normalize(value).replace(/[&<>"']/g, function escape(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function download(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    var text = normalize(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function csv(rows, fileName) {
    if (!Array.isArray(rows) || !rows.length) return;
    var headers = Object.keys(rows[0]);
    var content = [headers.map(csvCell).join(',')];
    rows.forEach(function append(row) {
      content.push(headers.map(function value(header) { return csvCell(row[header]); }).join(','));
    });
    download(new Blob(['\uFEFF' + content.join('\r\n')], { type: 'text/csv;charset=utf-8' }), fileName || 'afrotools-export.csv');
  }

  function pdf(elementId, title) {
    var element = document.getElementById(elementId);
    if (!element) return;
    var reportTitle = normalize(title || 'AfroTools Export');
    var popup = root.open('', '_blank');
    if (!popup) return;
    var locale = document.documentElement.lang || undefined;
    var date = root.AfroTools && root.AfroTools.fmt ? root.AfroTools.fmt.date(new Date()) : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
    popup.document.write('<!DOCTYPE html><html lang="' + escapeHtml(locale || 'en') + '"><head><meta charset="utf-8"><title>' + escapeHtml(reportTitle) + '</title><style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}th{background:#0062CC;color:#fff;font-weight:700}.branding{text-align:center;margin-top:24px;font-size:11px;color:#64748b}</style></head><body><h2 style="color:#0062CC">' + escapeHtml(reportTitle) + '</h2><p style="font-size:12px;color:#64748b">' + escapeHtml(date) + '</p>' + normalize(element.innerHTML) + '<div class="branding">afrotools.com — AfroTools</div></body></html>');
    popup.document.close();
    popup.print();
  }

  function json(data, fileName) {
    download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }), fileName || 'afrotools-export.json');
  }

  function button(text, color, onClick) {
    var control = document.createElement('button');
    control.textContent = text;
    control.style.cssText = ['padding:8px 16px', 'border:1.5px solid ' + color + '40', 'background:' + color + '10', 'color:' + color, 'border-radius:8px', 'font-size:12px', 'font-weight:700', 'cursor:pointer', 'font-family:inherit'].join(';');
    control.addEventListener('click', onClick);
    return control;
  }

  var api = {
    csv: csv,
    pdf: pdf,
    json: json,
    mountButtons: function mountButtons(targetId, options) {
      var target = document.getElementById(targetId);
      if (!target) return;
      var opts = options || {};
      var bar = document.createElement('div');
      bar.className = 'afro-export-bar';
      bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:16px 0';
      if (opts.data) bar.appendChild(button(label('export.csv', 'Export CSV'), '#34C759', function onCsv() { csv(opts.data, opts.filename); }));
      if (opts.printElementId) bar.appendChild(button(label('export.pdf', 'Export PDF'), '#0062CC', function onPdf() { pdf(opts.printElementId, opts.title); }));
      if (opts.data) bar.appendChild(button(label('export.download', 'Download') + ' JSON', '#FF9500', function onJson() { json(opts.data, (opts.filename || 'afrotools-data').replace('.csv', '') + '.json'); }));
      target.appendChild(bar);
    }
  };

  root.AfroExport = api;
})(window);

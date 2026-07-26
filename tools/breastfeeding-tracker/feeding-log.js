(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.feedingLogEngine;
  var form = document.getElementById('feeding-log-form');
  var typeInput = document.getElementById('event-type');
  var timeInput = document.getElementById('event-time');
  var sideField = document.getElementById('side-field');
  var amountField = document.getElementById('amount-field');
  var errorBox = document.getElementById('form-error');
  var entries = [];
  var nextId = 1;

  function localDateTimeValue(date) {
    var shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function updateConditionalFields() {
    var type = typeInput.value;
    document.getElementById('feed-fields').hidden = type === 'wet-nappy' || type === 'stool';
    sideField.hidden = type !== 'breastfeed';
    amountField.hidden = type !== 'expressed-milk';
  }

  function resetSensitiveFields() {
    document.getElementById('duration-minutes').value = '';
    document.getElementById('amount-ml').value = '';
    timeInput.value = localDateTimeValue(new Date());
  }

  function entryDetails(entry) {
    var details = [];
    if (entry.sideLabel) details.push('Side: ' + entry.sideLabel);
    if (entry.durationMinutes) details.push('Recorded duration: ' + entry.durationMinutes + ' minutes');
    if (entry.amountMl) details.push('Recorded expressed amount: ' + entry.amountMl + ' mL');
    return details.length ? details.join(' | ') : 'No amount or duration recorded';
  }

  function render() {
    var list = document.getElementById('event-list');
    list.replaceChildren();
    entries.slice().reverse().forEach(function (record) {
      var item = document.createElement('li');
      var content = document.createElement('div');
      var title = document.createElement('strong');
      var time = document.createElement('time');
      var detail = document.createElement('span');
      var remove = document.createElement('button');

      title.textContent = record.entry.typeLabel;
      time.dateTime = record.entry.timestamp;
      time.textContent = formatDateTime(record.entry.timestamp);
      detail.textContent = entryDetails(record.entry);
      remove.type = 'button';
      remove.className = 'bfl-remove';
      remove.dataset.removeId = String(record.id);
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + record.entry.typeLabel + ' at ' + time.textContent);

      content.append(title, time, detail);
      item.append(content, remove);
      list.appendChild(item);
    });

    var summary = engine.summarize(entries.map(function (record) { return record.entry; }));
    document.getElementById('event-count').textContent =
      summary.eventCount + (summary.eventCount === 1 ? ' event' : ' events');
    document.getElementById('empty-state').hidden = entries.length > 0;
    document.getElementById('log-boundary').hidden = entries.length === 0;
  }

  function addEvent(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local log engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.create({
      type: typeInput.value,
      timestamp: timeInput.value,
      side: document.getElementById('feeding-side').value,
      durationMinutes: document.getElementById('duration-minutes').value,
      amountMl: document.getElementById('amount-ml').value,
      asOf: new Date().toISOString()
    });
    if (!result.valid) {
      errorBox.textContent = result.error;
      var invalidField = result.field && document.getElementById(result.field);
      (invalidField || timeInput).focus();
      return;
    }
    errorBox.textContent = '';
    entries.push({ id: nextId++, entry: result.entry });
    resetSensitiveFields();
    render();
    document.getElementById('log-title').focus({ preventScroll: true });
    document.getElementById('log-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function exportText() {
    return [
      'AFROTOOLS PRIVATE FEEDING AND NAPPY LOG',
      '',
      entries.map(function (record, index) {
        return (index + 1) + '. ' + record.entry.typeLabel + ' | ' +
          formatDateTime(record.entry.timestamp) + ' | ' + entryDetails(record.entry);
      }).join('\n'),
      '',
      'No clinical conclusion is calculated.',
      'Counts and times cannot confirm feeding adequacy, milk supply, hydration, weight gain or illness.',
      'Urgent boundary: seek local medical help for a baby who cannot feed or stopped feeding well, is hard to wake, has difficult breathing, blue/pale/grey skin, a seizure, or nappies much drier than usual.',
      'Sources: WHO breastfeeding Q&A; WHO newborn mortality; NHS feeding adequacy support; NHS serious illness signs; NHS mastitis.',
      'Sources checked: 26 July 2026.',
      'Created locally from the current page. No account, email, upload, analytics, localStorage or sessionStorage.',
      'Sensitive family-health data: store or share this downloaded file carefully.'
    ].join('\n');
  }

  function setStatus(message) {
    document.getElementById('export-status').textContent = message;
  }

  function downloadBlob(filename, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.dataset.localJspdf = 'true';
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadPdf() {
    if (!entries.length) return setStatus('Add an event before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools private feeding and nappy log' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(exportText(), 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-private-feeding-nappy-log.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  typeInput.addEventListener('change', updateConditionalFields);
  form.addEventListener('submit', addEvent);
  document.getElementById('event-list').addEventListener('click', function (event) {
    var button = event.target.closest('[data-remove-id]');
    if (!button) return;
    var id = Number(button.dataset.removeId);
    entries = entries.filter(function (record) { return record.id !== id; });
    render();
    setStatus('Event removed from page memory.');
  });
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!entries.length) return setStatus('Add an event before exporting.');
    downloadBlob('afrotools-private-feeding-nappy-log.txt', 'text/plain;charset=utf-8', exportText());
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-log').addEventListener('click', function () {
    entries = [];
    form.reset();
    updateConditionalFields();
    resetSensitiveFields();
    errorBox.textContent = '';
    render();
    setStatus('Entire page-memory log cleared.');
    typeInput.focus();
  });

  timeInput.max = localDateTimeValue(new Date());
  timeInput.value = localDateTimeValue(new Date());
  updateConditionalFields();
  render();

  window.AfroFeedingLog = {
    getEntries: function () { return entries.map(function (record) { return record.entry; }); },
    getOverflowDetails: function () {
      return Array.from(document.querySelectorAll('body *')).filter(function (element) {
        var rect = element.getBoundingClientRect();
        return rect.width > document.documentElement.clientWidth + 1 ||
          rect.right > document.documentElement.clientWidth + 1 ||
          rect.left < -1;
      }).map(function (element) {
        var rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ''),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      }).slice(0, 12);
    }
  };
})();

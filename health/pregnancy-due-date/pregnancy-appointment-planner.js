(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.pregnancyAppointmentEngine;
  var storageKey = 'afrotools.health.pregnancyAppointmentPlan.v1';
  var form = document.getElementById('appointment-form');
  var dateInput = document.getElementById('planning-date');
  var cycleInput = document.getElementById('cycle-length');
  var cycleField = document.getElementById('cycle-field');
  var dateLabel = document.getElementById('planning-date-label');
  var rememberInput = document.getElementById('remember-plan');
  var errorBox = document.getElementById('form-error');
  var results = document.getElementById('appointment-results');
  var lastPlan = null;
  var exportSnapshot = null;

  function localDateString(dayOffset) {
    var now = new Date();
    now.setDate(now.getDate() + (dayOffset || 0));
    var offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    var parts = iso.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function selectedBasis() {
    return form.elements.basis.value;
  }

  function updateBasis() {
    var isLmp = selectedBasis() === 'lmp';
    cycleField.hidden = !isLmp;
    cycleInput.disabled = !isLmp;
    dateLabel.textContent = isLmp
      ? 'First day of your last menstrual period'
      : 'Estimated due date from your maternity team';
    dateInput.removeAttribute('min');
    if (isLmp) {
      dateInput.max = localDateString();
    } else {
      dateInput.min = localDateString(-14);
      dateInput.max = localDateString(280);
    }
    errorBox.textContent = '';
  }

  function gestationText(plan) {
    if (!plan.gestationalAge) return 'Outside the 0- to 42-week planning span';
    var age = plan.gestationalAge;
    return age.weeks + ' weeks, ' + age.days + (age.days === 1 ? ' day' : ' days') + ' by calendar estimate';
  }

  function planText(plan) {
    var lines = [
      'AFROTOOLS ANTENATAL APPOINTMENT DATE PLAN',
      '',
      'Working estimated due date: ' + formatDate(plan.dueDate),
      '37- to 42-week date range: ' + formatDate(plan.week37Date) + ' to ' + formatDate(plan.week42Date),
      'Status on ' + formatDate(plan.calculatedOn) + ': ' + gestationText(plan),
      'Basis: ' + plan.assumptions,
      '',
      'WHO ROUTINE CONTACT TIMING - REVIEW WITH YOUR LOCAL CLINIC'
    ];
    plan.contacts.forEach(function (contact) {
      lines.push(
        'Contact ' + contact.number + ' | ' + contact.timing + ' | ' +
        formatDate(contact.date) + ' | ' + contact.purpose
      );
    });
    lines.push(
      '',
      'These are calendar prompts, not booked appointments or medical advice.',
      'Urgent symptoms or concerns must be assessed by a local maternity service.',
      'Sources: WHO antenatal care model; NHS due-date guidance; ACOG due-date methods.',
      'Sources checked: 26 July 2026.',
      'Created locally in your browser. No account or email required.'
    );
    return lines.join('\n');
  }

  function render(plan) {
    lastPlan = plan;
    exportSnapshot = null;
    document.getElementById('result-basis').textContent = plan.assumptions;
    document.getElementById('due-date-output').textContent = formatDate(plan.dueDate);
    document.getElementById('birth-window-output').textContent =
      formatDate(plan.week37Date) + ' to ' + formatDate(plan.week42Date);
    document.getElementById('gestation-output').textContent = gestationText(plan);

    var body = document.getElementById('contact-plan-body');
    body.replaceChildren();
    var labels = ['Contact', 'WHO timing', 'Planning date', 'Use with your clinic'];
    plan.contacts.forEach(function (contact) {
      var row = document.createElement('tr');
      [String(contact.number), contact.timing, formatDate(contact.date), contact.purpose].forEach(function (value, index) {
        var cell = document.createElement('td');
        cell.dataset.label = labels[index];
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });

    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveIfRequested(plan) {
    if (rememberInput.checked) {
      localStorage.setItem(storageKey, JSON.stringify({
        basis: plan.basis,
        date: plan.inputDate,
        cycleLength: plan.cycleLength
      }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  function calculate(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The date engine did not load. Refresh the page and try again.';
      return;
    }
    var plan = engine.calculate({
      basis: selectedBasis(),
      date: dateInput.value,
      cycleLength: cycleInput.value,
      asOf: localDateString()
    });
    if (!plan.valid) {
      errorBox.textContent = plan.error;
      dateInput.focus();
      return;
    }
    errorBox.textContent = '';
    saveIfRequested(plan);
    render(plan);
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

  function currentExportText() {
    if (exportSnapshot && exportSnapshot.fields) {
      return [
        'AFROTOOLS ANTENATAL APPOINTMENT DATE PLAN',
        '',
        exportSnapshot.headline || 'Visit-preparation result'
      ].concat(exportSnapshot.fields.map(function (field) {
        return String(field.label || 'Field') + ': ' + String(field.value || '');
      })).concat([
        '',
        'Created locally in your browser. No account or email required.'
      ]).join('\n');
    }
    return lastPlan ? planText(lastPlan) : '';
  }

  function setStatus(message) {
    document.getElementById('export-status').textContent = message;
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-local-jspdf]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.jspdf.jsPDF); }, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.dataset.localJspdf = 'true';
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadPdf() {
    var text = currentExportText();
    if (!text) {
      setStatus('Build a plan before exporting.');
      return;
    }
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: 'AfroTools antenatal appointment date plan' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(text, 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-health-antenatal-appointment-plan.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  function calendarText(plan) {
    function compact(iso) { return iso.replace(/-/g, ''); }
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//AfroTools//AntenatalPlan//EN'
    ];
    plan.contacts.forEach(function (contact) {
      var endDate = engine.toIsoDate(engine.addDays(engine.parseIsoDate(contact.date), 1));
      lines.push(
        'BEGIN:VEVENT',
        'UID:afrotools-anc-' + contact.number + '-' + compact(contact.date) + '@local',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + compact(contact.date),
        'DTEND;VALUE=DATE:' + compact(endDate),
        'SUMMARY:Review antenatal contact ' + contact.number + ' with clinic',
        'DESCRIPTION:Planning date only - confirm timing with your maternity team.',
        'END:VEVENT'
      );
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function restore() {
    var raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      if (saved.basis !== 'confirmed-edd' && saved.basis !== 'lmp') throw new Error('invalid');
      var radio = form.querySelector('input[name="basis"][value="' + saved.basis + '"]');
      if (radio) radio.checked = true;
      dateInput.value = saved.date || '';
      if (saved.cycleLength) cycleInput.value = saved.cycleLength;
      rememberInput.checked = true;
      updateBasis();
    } catch (error) {
      localStorage.removeItem(storageKey);
    }
  }

  function overflowDetails() {
    return Array.from(document.querySelectorAll('main *')).filter(function (element) {
      if (element.closest('thead')) return false;
      var rect = element.getBoundingClientRect();
      return rect.width > document.documentElement.clientWidth + 1 ||
        rect.right > document.documentElement.clientWidth + 1 ||
        rect.left < -1;
    }).map(function (element) {
      return {
        tag: element.tagName,
        id: element.id,
        className: String(element.className || ''),
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width)
      };
    }).slice(0, 12);
  }

  form.addEventListener('submit', calculate);
  form.querySelectorAll('input[name="basis"]').forEach(function (radio) {
    radio.addEventListener('change', updateBasis);
  });

  document.getElementById('txt-export').addEventListener('click', function () {
    var text = currentExportText();
    if (!text) return setStatus('Build a plan before exporting.');
    downloadBlob('afrotools-antenatal-appointment-plan.txt', 'text/plain;charset=utf-8', text);
    setStatus('TXT plan downloaded locally.');
  });

  document.getElementById('pdf-export').addEventListener('click', downloadPdf);

  document.getElementById('ics-export').addEventListener('click', function () {
    if (!lastPlan) return setStatus('Build a plan before exporting.');
    downloadBlob('afrotools-antenatal-appointment-plan.ics', 'text/calendar;charset=utf-8', calendarText(lastPlan));
    setStatus('Calendar file downloaded locally. Review every date with your clinic.');
  });

  document.getElementById('clear-plan').addEventListener('click', function () {
    localStorage.removeItem(storageKey);
    form.reset();
    updateBasis();
    dateInput.value = '';
    rememberInput.checked = false;
    results.hidden = true;
    lastPlan = null;
    exportSnapshot = null;
    setStatus('Saved dates and the current result were cleared from this device.');
    dateInput.focus();
  });

  window.AfroHealthWorkflow = window.AfroHealthWorkflow || {
    recordSnapshot: function (snapshot) {
      exportSnapshot = snapshot && snapshot.toolId === 'due-date' ? snapshot : null;
    }
  };
  window.AfroPregnancyAppointmentPlanner = {
    getPlan: function () { return lastPlan; },
    getOverflowDetails: overflowDetails
  };

  updateBasis();
  restore();
})();

(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.ExamCountdownEngine;
  if (!engine) return;

  var CHECKED_DATE = '2026-07-26';
  var STORAGE_KEY = 'afro_exam_countdowns';
  var presets = [
    {
      key: 'uganda-uneb-registration',
      name: 'UNEB late registration deadline',
      date: '2026-07-31',
      kind: 'registration',
      country: 'Uganda',
      source: 'https://uneb.ac.ug/2026/06/01/uneb-normal-registration-extended-to-30th-june-2026/',
      sourceLabel: 'UNEB registration notice',
      dateMeaning: 'Late-registration deadline, not an examination date',
      note: 'UNEB says 2026 late registration runs from 1 to 31 July. Confirm that the candidate is registered with the school or UNEB.'
    },
    {
      key: 'zambia-grade-7',
      name: 'ECZ Grade 7 window',
      date: '2026-10-26',
      kind: 'exam',
      country: 'Zambia',
      source: 'https://www.exams-council.org.zm/grade-7/',
      sourceLabel: 'ECZ Grade 7 timetable',
      dateMeaning: 'Official examination window begins',
      note: 'ECZ lists the 2026 Primary School Leaving examination window as 26 to 30 October.'
    },
    {
      key: 'zambia-grade-12',
      name: 'ECZ School Certificate timetable',
      date: '2026-10-30',
      kind: 'exam',
      country: 'Zambia',
      source: 'https://www.exams-council.org.zm/wp-content/uploads/2026/04/2026-SCHOOL-CERTIFICATE-EXAMINATION_TIME-TABLE-Final.pdf',
      sourceLabel: 'ECZ 2026 School Certificate PDF',
      dateMeaning: 'Official timetable opens; a candidate’s first paper may be later',
      note: 'ECZ opens the timetable on 30 October with candidate and invigilator guidance; subject papers begin on the dates shown in the PDF.'
    },
    {
      key: 'tanzania-csee',
      name: 'NECTA CSEE written timetable',
      date: '2026-11-09',
      kind: 'exam',
      country: 'Tanzania',
      source: 'https://www.necta.go.tz/webroot/uploads/news/TIMETABLE%20FOR%20CSEE%20%202026.pdf',
      sourceLabel: 'NECTA CSEE 2026 PDF',
      dateMeaning: 'Written papers begin; some practical preparation starts earlier',
      note: 'NECTA’s final timetable starts written CSEE papers on 9 November. Food and Human Nutrition practical preparation is scheduled in October.'
    },
    {
      key: 'south-africa-nsc',
      name: 'South Africa NSC timetable',
      date: '2026-10-12',
      kind: 'exam',
      country: 'South Africa',
      source: 'https://www.education.gov.za/Portals/0/Documents/Publications/2026/2026%20Nov%20NSC%20Timetable.pdf',
      sourceLabel: 'DBE 2026 NSC PDF',
      dateMeaning: 'Published timetable opens; it is not every candidate’s first paper',
      note: 'The DBE timetable includes a Life Orientation rewrite on 12 October and subject-specific papers and practical windows on other dates. Enter your own first paper for a personal countdown.'
    },
    {
      key: 'ghana-waec',
      name: 'WAEC Ghana 2026',
      date: '',
      kind: 'exam',
      country: 'Ghana',
      source: 'https://waecgh.org/timetable/',
      sourceLabel: 'WAEC Ghana timetables',
      dateMeaning: 'Choose the first paper from the correct BECE, WASSCE school, or private-candidate timetable',
      note: 'WAEC Ghana publishes separate 2026 timetables. Select the correct examination and enter the candidate’s actual first paper date.'
    },
    {
      key: 'kenya-kcse',
      name: 'KNEC KCSE 2026',
      date: '',
      kind: 'exam',
      country: 'Kenya',
      source: 'https://www.knec.ac.ke/wp-content/uploads/2026/02/2026-KCSE-Timetable.pdf',
      sourceLabel: 'KNEC 2026 KCSE PDF',
      dateMeaning: 'Choose the candidate’s first activity or paper',
      note: 'KNEC lists projects, rehearsal, oral and practical windows before written papers. Enter the first date that applies to the candidate.'
    },
    {
      key: 'zimbabwe-zimsec',
      name: 'ZIMSEC O/A Level 2026',
      date: '',
      kind: 'exam',
      country: 'Zimbabwe',
      source: 'https://www5.zimsec.co.zw/timetables/',
      sourceLabel: 'ZIMSEC timetable downloads',
      dateMeaning: 'Choose the first paper from the correct Ordinary or Advanced Level timetable',
      note: 'ZIMSEC publishes separate November 2026 Ordinary and Advanced Level timetables. Enter the candidate’s actual first paper date.'
    }
  ].map(function (preset) {
    preset.checked = CHECKED_DATE;
    return preset;
  });

  var countdowns = [];
  var remember = false;
  var selectedPreset = null;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeSavedItems(value) {
    if (!Array.isArray(value)) return [];
    return value.map(engine.normaliseCountdown).filter(Boolean).slice(0, 30).map(function (item, index) {
      item.id = item.id || 'saved-' + index + '-' + Date.now();
      return item;
    });
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      countdowns = safeSavedItems(JSON.parse(raw));
      remember = countdowns.length > 0;
    } catch (error) {
      countdowns = [];
      remember = false;
    }
  }

  function persist() {
    try {
      if (remember && countdowns.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setFormStatus('This browser could not update local saved countdowns.');
    }
    updatePrivacyStatus();
  }

  function updatePrivacyStatus() {
    var status = $('privacyStatus');
    if (!status) return;
    status.textContent = remember
      ? 'Remembering ' + countdowns.length + ' countdown' + (countdowns.length === 1 ? '' : 's') + ' on this device only.'
      : 'Session only: countdowns disappear when this tab is closed. Nothing is sent to AfroTools.';
  }

  function formatDate(value) {
    var parsed = engine.parseDateOnly(value);
    if (!parsed) return 'Choose a valid date';
    return new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString('en', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function findPreset(key) {
    return presets.find(function (preset) { return preset.key === key; }) || null;
  }

  function findCountdown(id) {
    return countdowns.find(function (item) { return String(item.id) === String(id); }) || null;
  }

  function setFormStatus(message, okay) {
    var status = $('formStatus');
    if (!status) return;
    status.textContent = message || '';
    status.style.color = okay ? '#166534' : '';
  }

  function renderPresets() {
    var grid = $('presetGrid');
    if (!grid) return;
    grid.innerHTML = presets.map(function (preset) {
      var selected = selectedPreset && selectedPreset.key === preset.key;
      return '<button type="button" class="preset-btn" data-preset-key="' + escapeHtml(preset.key) +
        '" data-needs-date="' + String(!preset.date) + '" aria-pressed="' + String(!!selected) + '">' +
        '<span class="preset-kind">' + (preset.kind === 'registration' ? 'Registration deadline' : 'Exam timetable') + '</span>' +
        '<span class="preset-name">' + escapeHtml(preset.name) + '</span>' +
        '<span class="preset-date">' + (preset.date ? escapeHtml(formatDate(preset.date)) : 'Enter the date that applies to you') + '</span>' +
        '<span class="preset-meaning">' + escapeHtml(preset.dateMeaning) + '</span>' +
        '<span class="preset-country">' + escapeHtml(preset.country) + ' · source checked ' + CHECKED_DATE + '</span>' +
        '</button>';
    }).join('');
  }

  function prepLinks(item) {
    if (!item.key) return '';
    var key = encodeURIComponent(item.key);
    return '<div class="cd-links">' +
      '<a class="cd-link" href="/tools/study-planner/?exam=' + key + '">Study planner</a>' +
      '<a class="cd-link" href="/tools/exam-timetable/?exam=' + key + '">Build timetable</a>' +
      '<a class="cd-link" href="/tools/flashcard-maker/?exam=' + key + '">Make flashcards</a>' +
      '</div>';
  }

  function renderCountdowns() {
    var grid = $('countdownGrid');
    if (!grid) return;
    if (!countdowns.length) {
      grid.innerHTML = '<div class="countdown-empty"><strong>No countdowns yet.</strong><br>Choose a source card or enter the exact date that applies to you.</div>';
      updateCoach();
      return;
    }
    grid.innerHTML = countdowns.map(function (item) {
      var state = engine.dateState(item.date);
      var phase = engine.planningPhase(state.days, state.kind);
      var source = item.source ? '<div class="cd-source">' +
        escapeHtml(item.note || 'Confirm the official timetable before acting.') +
        ' <a href="' + escapeHtml(item.source) + '" target="_blank" rel="noopener">' +
        escapeHtml(item.sourceLabel || 'Official source') + '</a>' +
        '<span class="cd-source-checked">Source checked ' + escapeHtml(item.checked || CHECKED_DATE) + '. ' +
        escapeHtml(item.dateMeaning || '') + '</span></div>' : '';
      return '<article class="cd-card" data-countdown-id="' + escapeHtml(item.id) + '">' +
        '<div class="cd-card-head"><div><div class="cd-exam-name">' + escapeHtml(item.name) +
        '</div><div class="cd-exam-date">' + escapeHtml(formatDate(item.date)) + '</div></div>' +
        '<button type="button" class="cd-remove" data-remove="' + escapeHtml(item.id) +
        '" aria-label="Remove ' + escapeHtml(item.name) + '">&times;</button></div>' +
        '<div class="cd-body"><div class="cd-digits"><div class="cd-unit"><div class="cd-num">' +
        (state.days === null ? '—' : Math.abs(state.days)) + '</div><div class="cd-lbl">' +
        (state.kind === 'past' ? 'Days past' : state.kind === 'today' ? 'Exam day' : 'Calendar days') +
        '</div></div></div><p class="cd-state-copy">' + escapeHtml(state.label) +
        '. The count compares calendar dates on this device; it is not a paper start time.</p>' +
        '<div class="cd-meta"><span class="cd-phase">' + escapeHtml(phase.label) + '</span>' + source +
        '<ul class="cd-plan">' + phase.actions.map(function (action) {
          return '<li>' + escapeHtml(action) + '</li>';
        }).join('') + '</ul></div>' + prepLinks(item) +
        '<div class="cd-actions">' +
        '<button type="button" class="cd-share" data-share>Share tool only</button>' +
        '<button type="button" class="cd-export" data-copy="' + escapeHtml(item.id) + '">Copy plan</button>' +
        '<button type="button" class="cd-export" data-download="' + escapeHtml(item.id) + '">Download TXT</button>' +
        '</div><div class="cd-export-status" id="status-' + escapeHtml(item.id) + '" aria-live="polite"></div>' +
        '</div></article>';
    }).join('');
    updateCoach();
  }

  function setCardStatus(id, message) {
    var status = $('status-' + id);
    if (status) status.textContent = message;
  }

  function addCountdown(raw) {
    var item = engine.normaliseCountdown(raw);
    if (!item) {
      setFormStatus('Enter a clear name and a valid date.');
      return false;
    }
    if (countdowns.some(function (existing) {
      return existing.name.toLowerCase() === item.name.toLowerCase() && existing.date === item.date;
    })) {
      setFormStatus('That countdown is already in your plan.');
      return false;
    }
    item.id = 'exam-' + Date.now() + '-' + Math.round(Math.random() * 100000);
    countdowns.push(item);
    persist();
    renderCountdowns();
    setFormStatus('Countdown added for this session' + (remember ? ' and saved on this device.' : '.'), true);
    return true;
  }

  function selectPreset(key) {
    var preset = findPreset(key);
    if (!preset) return;
    selectedPreset = preset;
    renderPresets();
    $('customName').value = preset.name;
    $('customDate').value = preset.date || '';
    $('customName').dataset.presetKey = preset.key;
    $('customKind').value = preset.kind;
    setFormStatus(preset.date
      ? 'Review the date meaning and official source, then add it.'
      : 'Open the official source and enter the first date that applies to you.', true);
    updateCoach(preset);
    if (!preset.date) $('customDate').focus();
  }

  function submitCustom(event) {
    event.preventDefault();
    var preset = findPreset($('customName').dataset.presetKey || '');
    var raw = {
      name: $('customName').value,
      date: $('customDate').value,
      kind: $('customKind').value,
      key: preset ? preset.key : '',
      country: preset ? preset.country : '',
      source: preset ? preset.source : '',
      sourceLabel: preset ? preset.sourceLabel : '',
      note: preset ? preset.note : '',
      checked: preset ? preset.checked : '',
      dateMeaning: preset ? preset.dateMeaning : ($('customKind').value === 'registration' ? 'Registration deadline entered by user' : 'Date entered by user')
    };
    if (!addCountdown(raw)) return;
    event.currentTarget.reset();
    $('customName').dataset.presetKey = '';
    selectedPreset = null;
    renderPresets();
  }

  function copyText(text, done, failed) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(failed);
      return;
    }
    failed();
  }

  function fallbackCopy(text, done) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    try { document.execCommand('copy'); done(); } catch (error) { window.prompt('Copy plan', text); }
    field.remove();
  }

  function copyPlan(id) {
    var item = findCountdown(id);
    if (!item) return;
    var text = engine.planText(item);
    var done = function () { setCardStatus(id, 'Plan copied.'); };
    copyText(text, done, function () { fallbackCopy(text, done); });
  }

  function downloadPlan(id) {
    var item = findCountdown(id);
    if (!item) return;
    var blob = new Blob([engine.planText(item)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = (item.key || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-plan.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCardStatus(id, 'TXT plan downloaded.');
  }

  function shareRouteOnly() {
    var url = 'https://afrotools.com/tools/exam-countdown/';
    var text = 'Build a private exam or registration deadline plan with official-source checks: ' + url;
    if (navigator.share) {
      navigator.share({ title: 'Exam & Deadline Planner', text: text, url: url }).catch(function () {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    }
  }

  function removeCountdown(id) {
    countdowns = countdowns.filter(function (item) { return String(item.id) !== String(id); });
    persist();
    renderCountdowns();
  }

  function updateCoach(preset) {
    var coach = $('countdownCoach');
    if (!coach) return;
    if (preset) {
      coach.innerHTML = '<h2>' + escapeHtml(preset.name) + '</h2><p>' + escapeHtml(preset.note) +
        '</p><ul><li><a href="' + escapeHtml(preset.source) + '" target="_blank" rel="noopener">Open ' +
        escapeHtml(preset.sourceLabel) + '</a></li><li>' + escapeHtml(preset.dateMeaning) +
        '</li><li>Source checked ' + CHECKED_DATE + '</li></ul>';
      return;
    }
    if (!countdowns.length) {
      coach.innerHTML = '<h2>Use a personal date, not a generic promise</h2><p>Official timetables often include projects, practicals, oral papers, written papers, and registration deadlines. Choose the first date that actually applies to the candidate.</p>';
      return;
    }
    var active = countdowns.slice().sort(function (a, b) {
      return engine.calendarDaysUntil(a.date) - engine.calendarDaysUntil(b.date);
    }).find(function (item) { return engine.calendarDaysUntil(item.date) >= 0; }) || countdowns[0];
    var state = engine.dateState(active.date);
    var phase = engine.planningPhase(state.days, state.kind);
    coach.innerHTML = '<h2>Next: ' + escapeHtml(active.name) + '</h2><p>' + escapeHtml(state.label) +
      '. ' + escapeHtml(active.note || 'Confirm the exact date, time, venue, and subject entry.') +
      '</p><ul>' + phase.actions.map(function (action) { return '<li>' + escapeHtml(action) + '</li>'; }).join('') + '</ul>';
  }

  function initQueryHint() {
    var key = new URLSearchParams(window.location.search).get('exam') ||
      new URLSearchParams(window.location.search).get('preset');
    if (key && findPreset(key)) selectPreset(key);
  }

  loadSaved();
  $('rememberDevice').checked = remember;
  updatePrivacyStatus();
  renderPresets();
  renderCountdowns();
  initQueryHint();

  $('presetGrid').addEventListener('click', function (event) {
    var button = event.target.closest('[data-preset-key]');
    if (button) selectPreset(button.dataset.presetKey);
  });
  $('countdownForm').addEventListener('submit', submitCustom);
  $('rememberDevice').addEventListener('change', function (event) {
    remember = event.target.checked;
    persist();
  });
  $('countdownGrid').addEventListener('click', function (event) {
    var target = event.target;
    if (target.matches('[data-remove]')) removeCountdown(target.dataset.remove);
    else if (target.matches('[data-copy]')) copyPlan(target.dataset.copy);
    else if (target.matches('[data-download]')) downloadPlan(target.dataset.download);
    else if (target.matches('[data-share]')) shareRouteOnly();
  });
  $('printPlans').addEventListener('click', function () { window.print(); });
  $('clearPlans').addEventListener('click', function () {
    countdowns = [];
    persist();
    renderCountdowns();
    setFormStatus('All countdowns removed from this session and this device.', true);
  });
}());

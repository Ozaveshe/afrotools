(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ExamCountdownEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 86400000;

  function parseDateOnly(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var probe = new Date(Date.UTC(year, month - 1, day));
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) return null;
    return { year: year, month: month, day: day, utc: probe.getTime() };
  }

  function todayUtc(now) {
    var current = now instanceof Date ? now : new Date(now || Date.now());
    return Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  }

  function calendarDaysUntil(dateValue, now) {
    var parsed = parseDateOnly(dateValue);
    if (!parsed) return null;
    return Math.round((parsed.utc - todayUtc(now)) / DAY_MS);
  }

  function dateState(dateValue, now) {
    var days = calendarDaysUntil(dateValue, now);
    if (days === null) return { kind: 'invalid', days: null, label: 'Choose a valid date' };
    if (days < 0) return { kind: 'past', days: days, label: 'Date passed' };
    if (days === 0) return { kind: 'today', days: 0, label: 'Today' };
    if (days === 1) return { kind: 'upcoming', days: 1, label: '1 calendar day' };
    return { kind: 'upcoming', days: days, label: days + ' calendar days' };
  }

  function planningPhase(days, kind) {
    if (kind === 'past') return {
      label: 'Update the date',
      actions: ['Open the official timetable', 'Replace this past date', 'Check venue and paper times']
    };
    if (kind === 'today') return {
      label: 'Today',
      actions: ['Check the exact paper time and venue', 'Pack permitted materials', 'Leave enough travel time']
    };
    if (days <= 7) return {
      label: 'Final week',
      actions: ['Confirm paper times and transport', 'Review mistakes and key recall', 'Protect sleep and arrival time']
    };
    if (days <= 30) return {
      label: 'Timed practice',
      actions: ['Complete timed past papers', 'Review every error', 'Confirm the official subject timetable']
    };
    if (days <= 75) return {
      label: 'Revision build',
      actions: ['Rank weak topics', 'Block weekly revision sessions', 'Turn repeated mistakes into flashcards']
    };
    return {
      label: 'Foundation',
      actions: ['Map the syllabus', 'Set weekly subject blocks', 'Schedule a monthly timed-paper check']
    };
  }

  function normaliseCountdown(raw) {
    raw = raw || {};
    var name = String(raw.name || '').trim().replace(/\s+/g, ' ');
    var date = String(raw.date || '').trim();
    if (!name || name.length > 120 || !parseDateOnly(date)) return null;
    return {
      id: String(raw.id || ''),
      name: name,
      date: date,
      key: String(raw.key || ''),
      kind: raw.kind === 'registration' ? 'registration' : 'exam',
      country: String(raw.country || ''),
      source: /^https:\/\//.test(String(raw.source || '')) ? String(raw.source) : '',
      sourceLabel: String(raw.sourceLabel || ''),
      note: String(raw.note || ''),
      checked: String(raw.checked || ''),
      dateMeaning: String(raw.dateMeaning || '')
    };
  }

  function planText(raw, now) {
    var item = normaliseCountdown(raw);
    if (!item) return '';
    var state = dateState(item.date, now);
    var phase = planningPhase(state.days, state.kind);
    var lines = [
      item.name,
      'Date: ' + item.date,
      'Date meaning: ' + (item.dateMeaning || (item.kind === 'registration' ? 'Registration deadline' : 'Date entered by user')),
      'Countdown: ' + state.label,
      'Planning stage: ' + phase.label,
      item.country ? 'Country: ' + item.country : '',
      item.note ? 'Source note: ' + item.note : '',
      item.checked ? 'Source checked: ' + item.checked : '',
      item.source ? 'Official source: ' + item.source : '',
      '',
      'Next checks:'
    ].filter(Boolean);
    phase.actions.forEach(function (action, index) {
      lines.push((index + 1) + '. ' + action);
    });
    lines.push('');
    lines.push('Planning worksheet only. Confirm your own paper date, time, venue, subject entry, and permitted materials with the official authority or your school.');
    return lines.join('\n');
  }

  return {
    parseDateOnly: parseDateOnly,
    calendarDaysUntil: calendarDaysUntil,
    dateState: dateState,
    planningPhase: planningPhase,
    normaliseCountdown: normaliseCountdown,
    planText: planText
  };
}));

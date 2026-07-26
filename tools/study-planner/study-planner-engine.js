(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.studyPlannerEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function finite(value) {
    if (value === '' || value === null || value === undefined) return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function parseTime(value) {
    var match = /^(\d{2}):(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var hours = Number(match[1]);
    var minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function formatTime(totalMinutes) {
    if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || totalMinutes > 1440) return '';
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    if (hours === 24 && minutes === 0) return '24:00';
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }

  function validatePlan(input) {
    input = input || {};
    var hoursPerDay = finite(input.hoursPerDay);
    var daysPerWeek = finite(input.daysPerWeek);
    var sessionLength = finite(input.sessionLength);
    var startMinutes = parseTime(input.startTime);
    var subjectCount = Number(input.subjectCount || 0);
    var errors = [];
    if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) errors.push('Days per week must be between 1 and 7.');
    if (hoursPerDay === null || hoursPerDay <= 0 || hoursPerDay > 12) errors.push('Hours per day must be above 0 and no more than 12.');
    if (sessionLength === null || sessionLength <= 0 || sessionLength > 4) errors.push('Choose a valid session length.');
    if (startMinutes === null) errors.push('Choose a valid start time.');
    if (subjectCount < 1) errors.push('Add at least one subject.');
    if (errors.length) return { ok: false, errors: errors };
    var sessionsPerDay = Math.floor(hoursPerDay / sessionLength);
    if (sessionsPerDay < 1) errors.push('Hours per day must fit at least one full session.');
    var endMinutes = startMinutes + Math.round(sessionsPerDay * sessionLength * 60);
    if (endMinutes > 1440) errors.push('The final session would end after midnight. Choose an earlier start or fewer hours.');
    if (errors.length) return { ok: false, errors: errors };
    return {
      ok: true,
      hoursPerDay: hoursPerDay,
      daysPerWeek: daysPerWeek,
      sessionLength: sessionLength,
      sessionsPerDay: sessionsPerDay,
      totalSessions: sessionsPerDay * daysPerWeek,
      scheduledHours: sessionsPerDay * daysPerWeek * sessionLength,
      unusedMinutesPerDay: Math.round((hoursPerDay - sessionsPerDay * sessionLength) * 60),
      startMinutes: startMinutes,
      endMinutes: endMinutes
    };
  }

  function allocateSessions(subjects, totalSessions) {
    var safeSubjects = (subjects || []).map(function (subject, index) {
      var weight = finite(subject.weight);
      return { index: index, weight: weight !== null && weight > 0 ? weight : 1 };
    });
    var allocations = safeSubjects.map(function () { return 0; });
    if (!safeSubjects.length || !Number.isInteger(totalSessions) || totalSessions < 1) return allocations;
    var totalWeight = safeSubjects.reduce(function (sum, subject) { return sum + subject.weight; }, 0);
    var ranked = safeSubjects.map(function (subject) {
      var exact = subject.weight / totalWeight * totalSessions;
      var floor = Math.floor(exact);
      allocations[subject.index] = floor;
      return { index: subject.index, fraction: exact - floor, weight: subject.weight };
    });
    var allocated = allocations.reduce(function (sum, value) { return sum + value; }, 0);
    ranked.sort(function (a, b) {
      return b.fraction - a.fraction || b.weight - a.weight || a.index - b.index;
    });
    for (var remaining = totalSessions - allocated, i = 0; i < remaining; i++) {
      allocations[ranked[i % ranked.length].index] += 1;
    }
    return allocations;
  }

  function calendarDay(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return Math.floor(date.getTime() / 86400000);
  }

  function daysUntil(target, today) {
    var targetDay = calendarDay(target);
    var todayDay = calendarDay(today);
    if (targetDay === null || todayDay === null) return null;
    return targetDay - todayDay;
  }

  function todayLocal(now) {
    now = now || new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
  }

  function timeRange(startMinutes, sessionLength, slot) {
    var start = startMinutes + Math.round(slot * sessionLength * 60);
    var end = start + Math.round(sessionLength * 60);
    return formatTime(start) + ' - ' + formatTime(end);
  }

  return {
    allocateSessions: allocateSessions,
    calendarDay: calendarDay,
    daysUntil: daysUntil,
    formatTime: formatTime,
    parseTime: parseTime,
    timeRange: timeRange,
    todayLocal: todayLocal,
    validatePlan: validatePlan
  };
});

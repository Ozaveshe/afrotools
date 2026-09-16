(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.leaveCalendar = api; }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  var DAY = 86400000;
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('invalid-date');
    var stamp = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) throw new Error('invalid-date');
    return stamp;
  }
  function iso(stamp) { return new Date(stamp).toISOString().slice(0, 10); }
  function plan(options) {
    var start = parseDate(options.start);
    var duration = Number(options.days);
    if (!Number.isInteger(duration) || duration < 1 || duration > 3660) throw new Error('invalid-duration');
    if (options.unit !== 'calendar' && options.unit !== 'working') throw new Error('invalid-unit');
    var weekdays = options.weekdays || [1, 2, 3, 4, 5];
    if (!Array.isArray(weekdays) || !weekdays.length || weekdays.some(function (day) { return !Number.isInteger(day) || day < 0 || day > 6; })) throw new Error('invalid-weekdays');
    var excluded = new Set((options.excludedDates || []).map(parseDate));
    function working(stamp) { return weekdays.indexOf(new Date(stamp).getUTCDay()) !== -1 && !excluded.has(stamp); }
    var last = start, remaining = duration;
    // An explicit start is retained; excluded days do not consume working-day leave.
    for (var count = 0; remaining && count < 30000; count++, last += DAY) {
      if (options.unit === 'calendar' || working(last)) remaining--;
    }
    if (remaining) throw new Error('invalid-schedule');
    var exclusiveEnd = last;
    var returnDate = exclusiveEnd;
    if (options.unit === 'working') {
      var guard = 0;
      while (!working(returnDate) && guard++ < 30000) returnDate += DAY;
      if (guard >= 30000) throw new Error('invalid-schedule');
    }
    return {start: iso(start), lastLeaveDate: iso(exclusiveEnd - DAY), endExclusive: iso(exclusiveEnd), returnDate: iso(returnDate), days: duration, unit: options.unit};
  }
  function text(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
  function fold(line) {
    var lines = [], part = '', length = 0;
    Array.from(line).forEach(function (character) {
      var bytes = unescape(encodeURIComponent(character)).length;
      if (length + bytes > 75) { lines.push(part); part = ' '; length = 1; }
      part += character; length += bytes;
    });
    lines.push(part); return lines.join('\r\n');
  }
  function calendar(schedule, options) {
    var start = parseDate(schedule.start), end = parseDate(schedule.endExclusive), back = parseDate(schedule.returnDate);
    if (end <= start || back < end) throw new Error('invalid-schedule');
    if (!options.uid || /[\r\n]/.test(options.uid)) throw new Error('invalid-uid');
    var timestamp = new Date(options.timestamp || Date.now());
    if (!Number.isFinite(timestamp.getTime())) throw new Error('invalid-timestamp');
    var stamp = timestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var compact = function (value) { return value.replace(/-/g, ''); };
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AfroTools//Leave Planner//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + text(options.uid) + '-leave@afrotools.com', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + compact(schedule.start), 'DTEND;VALUE=DATE:' + compact(schedule.endExclusive),
      'SUMMARY:' + text(options.title), 'DESCRIPTION:' + text(options.description), 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:' + text(options.uid) + '-return@afrotools.com', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + compact(schedule.returnDate), 'DTEND;VALUE=DATE:' + compact(iso(back + DAY)),
      'SUMMARY:' + text(options.returnTitle), 'END:VEVENT', 'END:VCALENDAR', ''].map(fold).join('\r\n');
  }
  return {plan: plan, calendar: calendar};
});

'use strict';

// UTC cron semantics shared by the operational audit and collector health API.
function parseCronField(field, min, max) {
  const values = new Set();
  const raw = String(field || '').trim();
  if (!raw) return values;
  // Fail closed rather than treating malformed fields as a wildcard or a
  // partial schedule. Generated policy and audit input share this validation.
  const segments = raw.split(',');
  for (const segment of segments) {
    if (!/^(?:\*|\d+(?:-\d+)?)(?:\/\d+)?$/.test(segment)) return new Set();
    const [base, step] = segment.split('/');
    if (step !== undefined && (!Number.isSafeInteger(Number(step)) || Number(step) <= 0)) return new Set();
    if (base !== '*') {
      const [start, end = start] = base.split('-').map(Number);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < min || end > max || start > end) return new Set();
    }
  }

  raw.split(',').forEach((part) => {
    const segment = part.trim();
    if (!segment) return;

    let base = segment;
    let step = 1;
    if (segment.includes('/')) {
      const pieces = segment.split('/');
      base = pieces[0] || '*';
      step = Math.max(1, Number(pieces[1]) || 1);
    }

    let start = min;
    let end = max;
    if (base !== '*') {
      if (base.includes('-')) {
        const range = base.split('-').map((value) => Number(value));
        start = Number.isFinite(range[0]) ? range[0] : min;
        end = Number.isFinite(range[1]) ? range[1] : max;
      } else {
        start = Number(base);
        end = start;
      }
    }

    for (let value = start; value <= end; value += step) {
      if (Number.isFinite(value) && value >= min && value <= max) values.add(value);
    }
  });

  return values;
}

function cronDayMatches(schedule, date) {
  const dayOfMonth = schedule.daysOfMonth;
  const dayOfWeek = schedule.daysOfWeek;
  const domWildcard = String(schedule.dayOfMonth || '').trim() === '*';
  const dowWildcard = String(schedule.dayOfWeek || '').trim() === '*';
  const utcDay = date.getUTCDay();
  const domMatches = dayOfMonth.has(date.getUTCDate());
  const dowMatches = dayOfWeek.has(utcDay) || (utcDay === 0 && dayOfWeek.has(7));

  if (domWildcard && dowWildcard) return true;
  if (domWildcard) return dowMatches;
  if (dowWildcard) return domMatches;
  return domMatches || dowMatches;
}

function parseCronSchedule(expression) {
  const parts = String(expression || '').trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const schedule = {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    minutes: parseCronField(minute, 0, 59),
    hours: parseCronField(hour, 0, 23),
    months: parseCronField(month, 1, 12),
    daysOfMonth: parseCronField(dayOfMonth, 1, 31),
    daysOfWeek: parseCronField(dayOfWeek, 0, 7),
  };
  return [schedule.minutes, schedule.hours, schedule.months, schedule.daysOfMonth, schedule.daysOfWeek]
    .every(values => values.size > 0) ? schedule : null;
}

function cronMatches(schedule, date) {
  return schedule.minutes.has(date.getUTCMinutes()) &&
    schedule.hours.has(date.getUTCHours()) &&
    schedule.months.has(date.getUTCMonth() + 1) &&
    cronDayMatches(schedule, date);
}

function nextScheduledAt(expression, fromDate) {
  const schedule = parseCronSchedule(expression);
  if (!schedule) return null;

  const start = fromDate instanceof Date ? fromDate : new Date(fromDate || Date.now());
  if (!Number.isFinite(start.getTime())) return null;

  const candidate = new Date(start.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  const maxMinutes = 366 * 24 * 60;
  for (let i = 0; i < maxMinutes; i += 1) {
    if (cronMatches(schedule, candidate)) return candidate.toISOString();
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }
  return null;
}

function previousScheduledAt(expression, fromDate) {
  const schedule = parseCronSchedule(expression);
  if (!schedule) return null;

  const start = fromDate instanceof Date ? fromDate : new Date(fromDate || Date.now());
  if (!Number.isFinite(start.getTime())) return null;

  const candidate = new Date(start.getTime());
  candidate.setUTCSeconds(0, 0);

  const maxMinutes = 366 * 24 * 60;
  for (let i = 0; i < maxMinutes; i += 1) {
    if (cronMatches(schedule, candidate)) return candidate.toISOString();
    candidate.setUTCMinutes(candidate.getUTCMinutes() - 1);
  }
  return null;
}


module.exports = { parseCronField, nextScheduledAt, previousScheduledAt };

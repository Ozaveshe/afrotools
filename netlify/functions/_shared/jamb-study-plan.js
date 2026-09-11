'use strict';

const MAX_RESPONSE_BYTES = 35000;
const DAY_MS = 86400000;

function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) throw new Error('Invalid study plan date');
  const stamp = Date.parse(value + 'T00:00:00.000Z');
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0,10) !== value) throw new Error('Invalid study plan date');
  return stamp;
}

function validateStudyPlanRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || !Number.isInteger(input.days) || input.days < 1 || input.days > 7
      || !Number.isInteger(input.hours_per_day) || input.hours_per_day < 1 || input.hours_per_day > 12) {
    throw new Error('Invalid study plan constraints');
  }
  const start = dateValue(input.start_date);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(new Date(start + (input.days - 1) * DAY_MS).toISOString())) throw new Error('Study plan date exceeds supported range');
  return { days:input.days, hours_per_day:input.hours_per_day, start_date:input.start_date };
}

function safeText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
    && !/[<>]/.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

function parseStudyPlanResponse(text, input) {
  const limits = validateStudyPlanRequest(input);
  if (typeof text !== 'string' || Buffer.byteLength(text,'utf8') > MAX_RESPONSE_BYTES) throw new Error('Invalid study plan response size');
  let plan;
  try { plan = JSON.parse(text); } catch (_) { throw new Error('Study plan response must be JSON only'); }
  if (!plan || typeof plan !== 'object' || Array.isArray(plan) || !safeText(plan.summary,400)
      || !Array.isArray(plan.days) || plan.days.length !== limits.days) throw new Error('Invalid study plan response');
  const start = dateValue(limits.start_date);
  const days = plan.days.map((day,index) => {
    const expectedDate = new Date(start + index * DAY_MS).toISOString().slice(0,10);
    if (!day || typeof day !== 'object' || Array.isArray(day) || day.day !== index + 1
        || day.date !== expectedDate || !safeText(day.focus,120)
        || !Array.isArray(day.tasks) || day.tasks.length < 1 || day.tasks.length > 6) throw new Error('Invalid study plan day');
    let minutes = 0;
    const tasks = day.tasks.map(task => {
      if (!task || typeof task !== 'object' || Array.isArray(task) || typeof task.time !== 'string'
          || !/^[1-9]\d{0,2} min$/.test(task.time) || !safeText(task.task,600)) throw new Error('Invalid study plan task');
      minutes += Number(task.time.split(' ')[0]);
      if (minutes > limits.hours_per_day * 60) throw new Error('Study plan exceeds daily time budget');
      return {time:task.time, task:task.task};
    });
    return {day:index+1, date:expectedDate, focus:day.focus, tasks};
  });
  return {summary:plan.summary, days};
}

module.exports = { validateStudyPlanRequest, parseStudyPlanResponse };

'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/study-planner/study-planner-engine.js');

const tiny = engine.validatePlan({
  subjectCount: 7,
  hoursPerDay: 1,
  daysPerWeek: 1,
  sessionLength: 1,
  startTime: '08:00'
});
assert.equal(tiny.ok, true);
assert.equal(tiny.totalSessions, 1);
assert.deepEqual(
  engine.allocateSessions(
    [{ weight: 2 }, { weight: 3 }, { weight: 2 }, { weight: 2 }, { weight: 2 }, { weight: 1 }, { weight: 3 }],
    tiny.totalSessions
  ),
  [0, 1, 0, 0, 0, 0, 0]
);

const uneven = engine.validatePlan({
  subjectCount: 2,
  hoursPerDay: 2.25,
  daysPerWeek: 5,
  sessionLength: 1,
  startTime: '08:00'
});
assert.equal(uneven.ok, true);
assert.equal(uneven.scheduledHours, 10);
assert.equal(uneven.unusedMinutesPerDay, 15);
assert.equal(engine.allocateSessions([{ weight: 3 }, { weight: 1 }], 10).reduce((a, b) => a + b, 0), 10);

const overnight = engine.validatePlan({
  subjectCount: 1,
  hoursPerDay: 3,
  daysPerWeek: 1,
  sessionLength: 1,
  startTime: '22:30'
});
assert.equal(overnight.ok, false);
assert.match(overnight.errors.join(' '), /after midnight/i);

assert.equal(engine.daysUntil('2026-07-27', '2026-07-26'), 1);
assert.equal(engine.daysUntil('2026-07-25', '2026-07-26'), -1);
assert.equal(engine.timeRange(8 * 60, 1.5, 1), '09:30 - 11:00');

console.log('study-planner VIP engine tests: 13 assertions passed');

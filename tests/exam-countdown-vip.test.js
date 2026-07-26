const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/exam-countdown/exam-countdown-engine.js');

test('validates real date-only values', () => {
  assert.equal(engine.parseDateOnly('2026-02-29'), null);
  assert.deepEqual(engine.parseDateOnly('2028-02-29'), {
    year: 2028,
    month: 2,
    day: 29,
    utc: Date.UTC(2028, 1, 29)
  });
});

test('counts local calendar days without time-of-day drift', () => {
  const morning = new Date(2026, 6, 26, 1, 5);
  const evening = new Date(2026, 6, 26, 23, 55);
  assert.equal(engine.calendarDaysUntil('2026-07-27', morning), 1);
  assert.equal(engine.calendarDaysUntil('2026-07-27', evening), 1);
  assert.equal(engine.dateState('2026-07-26', evening).kind, 'today');
  assert.equal(engine.dateState('2026-07-25', morning).kind, 'past');
});

test('uses practical planning stages and distinguishes past dates', () => {
  assert.equal(engine.planningPhase(90, 'upcoming').label, 'Foundation');
  assert.equal(engine.planningPhase(31, 'upcoming').label, 'Revision build');
  assert.equal(engine.planningPhase(30, 'upcoming').label, 'Timed practice');
  assert.equal(engine.planningPhase(7, 'upcoming').label, 'Final week');
  assert.equal(engine.planningPhase(-1, 'past').label, 'Update the date');
});

test('rejects invalid saved records and unsafe source URLs', () => {
  assert.equal(engine.normaliseCountdown({ name: '', date: '2026-10-01' }), null);
  assert.equal(engine.normaliseCountdown({ name: 'Exam', date: 'not-a-date' }), null);
  const item = engine.normaliseCountdown({
    name: '  Biology   Paper 1 ',
    date: '2026-10-01',
    source: 'javascript:alert(1)'
  });
  assert.equal(item.name, 'Biology Paper 1');
  assert.equal(item.source, '');
});

test('export explains the date meaning and verification boundary', () => {
  const text = engine.planText({
    name: 'UNEB late registration',
    date: '2026-07-31',
    kind: 'registration',
    dateMeaning: 'Registration deadline',
    source: 'https://uneb.ac.ug/example',
    checked: '2026-07-26'
  }, new Date(2026, 6, 26, 12));
  assert.match(text, /5 calendar days/);
  assert.match(text, /Date meaning: Registration deadline/);
  assert.match(text, /Confirm your own paper date, time, venue/);
});

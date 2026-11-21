'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
require('../engines/src/compliance-calendar-engine.js');
const calendar = global.ComplianceCalendarEngine;

test('EMP201 and applicable SARS components share the adjusted local filing date', () => {
  for (const [year, month, day] of [[2026, 11, 6], [2026, 12, 7], [2027, 1, 7], [2026, 6, 5], [2023, 4, 6]]) {
    const events = calendar.getEventsForMonth(['ZA'], month, year).filter(event => event.due_rule === 'za-emp201');
    assert.deepEqual(events.map(event => event.id).sort(), ['za-emp201', 'za-sdl', 'za-uif']);
    const iso = [year, String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
    for (const event of events) {
      assert.equal(event.dueDate.getMonth() + 1, month);
      assert.equal(event.dueDate.getDate(), day);
      assert.ok(calendar.exportCSV([event]).includes('"' + iso + '"'));
    }
    const stamp = iso.replace(/-/g, '');
    assert.ok(calendar.exportIcal(['ZA'], year).includes('UID:za-emp201-' + stamp + '@afrotools.com\r\nDTSTART;VALUE=DATE:' + stamp));
  }
});

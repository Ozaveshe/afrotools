#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'leave-calculator', 'index.html'), 'utf8');

function readObject(variable, nextMarker) {
  const start = html.indexOf(`var ${variable} = {`);
  assert.notStrictEqual(start, -1, `${variable} should exist`);
  const bodyStart = html.indexOf('{', start);
  const end = html.indexOf(nextMarker, bodyStart);
  assert.notStrictEqual(end, -1, `${variable} end marker should exist`);
  return vm.runInNewContext(`(${html.slice(bodyStart, end + 2)})`);
}

const leaveData = readObject('LEAVE_DATA', '\n};\n\n//');
const holidays = readObject('LC_HOLIDAYS', '\n};\n\n//');

assert.strictEqual(Object.keys(leaveData).length, 54, 'leave entitlement lookup should cover all 54 African countries');
for (const code of ['NG', 'KE', 'GH', 'ZA', 'TZ', 'UG']) {
  assert.ok(leaveData[code], `${code} leave rules should be present`);
  assert.ok(holidays[code] && holidays[code][2026], `${code} should have a 2026 holiday calendar`);
}

assert.ok(holidays.NG[2026].some((item) => item.d === '2026-03-19'), 'Nigeria declared Eid-ul-Fitr holiday should be present');
assert.ok(holidays.NG[2026].some((item) => item.d === '2026-05-28'), 'Nigeria second Eid-ul-Adha holiday should be present');
assert.ok(holidays.KE[2026].some((item) => item.d === '2026-10-10' && /Mazingira/.test(item.n)), 'Kenya Mazingira Day should be present');
assert.ok(holidays.GH[2026].some((item) => item.d === '2026-12-28' && /observed/.test(item.n)), 'Ghana Boxing Day observed holiday should be present');
assert.ok(holidays.TZ[2026].some((item) => item.d === '2026-04-07' && /Karume/.test(item.n)), 'Tanzania Karume Day should be present');
assert.ok(holidays.UG[2026].some((item) => item.d === '2026-05-12' && /swearing-in/.test(item.n)), 'Uganda one-off inauguration holiday should be present');

assert.match(html, /function lcIcalEscape\(value\)/, 'iCal escaping helper should exist');
assert.match(html, /function lcDownloadBlob\(filename, content, type\)/, 'download helper should attach generated links to the DOM');
assert.match(html, /function acDownloadReminder\(\)/, 'accrual tab should export a leave-balance reminder');
assert.match(html, /Download balance reminder/, 'accrual result should expose the reminder action');
assert.match(html, /function lwDownloadHolidaysICal\(\)/, 'long-weekend tab should export holiday calendars');
assert.match(html, /moon-sighting notice/, 'holiday export should warn about moon-sighting changes');

assert.doesNotMatch(html, /leaveWeeks = Math\.ceil\(d\.patDays \/ 5\)/, 'paternity leave should not be rounded into full workweeks');
assert.match(html, /leaveDurationDays = d\.patDays/, 'paternity planner should preserve day-based duration');
assert.match(html, /end:p\.endExclusive/, 'parental leave event should use exclusive DTEND');
assert.match(html, /end:lcAddDays\(p\.returnDate, 1\)/, 'return-to-work event should have a non-zero all-day duration');

for (const host of ['interior.gov.ng', 'new.kenyalaw.org', 'ghalii.org', 'mfa.gov.gh', 'labour.gov.za', 'gov.za', 'pmo.go.tz', 'ulii.org']) {
  assert.ok(html.includes(host), `official source reference should include ${host}`);
}

assert.match(
  html,
  /Assumptions: planning estimate only\. Confirm current labour law, public holidays, contract terms, and employer policy before acting\./,
  'exports should carry planning-only assumptions'
);

console.log('leave PTO calendar source and export checks passed');

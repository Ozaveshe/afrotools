const assert = require("assert");
const engine = require("../engines/src/business-roi-engine.js");

const timezone = engine.timeZone({
  localDateTime: "2026-08-03T10:00",
  fromZone: "Africa/Dar_es_Salaam",
  toZone: "Africa/Lagos",
  locale: "sw"
});
assert.strictEqual(timezone.iso, "2026-08-03T07:00:00.000Z");
assert.match(timezone.from, /Jumatatu/i);
assert.match(timezone.toTime, /08[^\d]?00/);

const holiday = engine.holidayEntry({
  country: "KE",
  name: "Tukio la majaribio",
  date: "2026-08-04",
  confirmed: true,
  locale: "sw"
});
assert.strictEqual(holiday.country, "Kenya");
assert.strictEqual(holiday.authority, "Wizara ya Mambo ya Ndani");
assert.match(holiday.description, /Tukio limethibitishwa na mtumiaji/);
assert.match(holiday.ics, /PRODID:-\/\/AfroTools\/\/User Confirmed Holiday Entry\/\/SW/);
assert.match(holiday.ics, /X-AFROTOOLS-BOUNDARY:Tukio limethibitishwa na mtumiaji; si kalenda rasmi/);
assert.match(holiday.ics, /X-AFROTOOLS-SOURCE-URL:https:\/\/www.interior.go.ke\//);

const english = engine.holidayEntry({
  country: "ZA",
  name: "Synthetic fixture",
  date: "2026-08-04",
  confirmed: true,
  locale: "en"
});
assert.strictEqual(english.country, "South Africa");
assert.match(english.description, /^User-confirmed from South African Government/);

console.log("Swahili Business & ROI engine locale fixtures passed.");

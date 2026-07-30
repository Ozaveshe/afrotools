const assert = require("assert");
const engine = require("../engines/src/business-roi-engine.js");

assert.deepStrictEqual(engine.pomodoro({
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessions: 4
}), { focusSeconds: 1500, shortBreakSeconds: 300, longBreakSeconds: 900, cycleSeconds: 7800, sessions: 4 });

assert.strictEqual(engine.convertUnit({ group: "area", value: 2, from: "plot_ng", to: "sqm" }), 929.0304);
assert.strictEqual(Number(engine.convertTemperature({ value: 32, from: "F", to: "C" }).toFixed(6)), 0);

const budget = engine.budget({
  income: [1000, 500],
  categories: [
    { name: "Logement", kind: "needs", items: [400] },
    { name: "Souhaits", kind: "wants", items: [200] },
    { name: "Épargne", kind: "savings", items: [100] }
  ]
});
assert.deepStrictEqual(
  { income: budget.income, expenses: budget.expenses, balance: budget.balance, savingsRate: budget.savingsRate },
  { income: 1500, expenses: 700, balance: 800, savingsRate: 800 / 1500 * 100 }
);

assert.deepStrictEqual(engine.countdown({
  from: "2026-01-01T00:00:00Z", to: "2026-01-03T02:03:04Z"
}), { complete: false, milliseconds: 180184000, days: 2, hours: 2, minutes: 3, seconds: 4 });

const timezone = engine.timeZone({
  localDateTime: "2026-07-29T10:00", fromZone: "Africa/Abidjan", toZone: "Africa/Nairobi"
});
assert.strictEqual(timezone.iso, "2026-07-29T10:00:00.000Z");
assert.match(timezone.toTime, /13[^\d]?00/);

const holiday = engine.holidayEntry({
  country: "GH", name: "Journée civique synthétique", date: "2026-08-04",
  note: "Fixture", confirmed: true
});
assert.match(holiday.ics, /DTSTART;VALUE=DATE:20260804/);
assert.match(holiday.ics, /X-AFROTOOLS-SOURCE-URL:https:\/\/www.mint.gov.gh\//);

assert.deepStrictEqual(engine.workingDays({
  start: "2026-07-27", end: "2026-08-02", holidays: ["2026-07-29"]
}), { workDays: 4, calendarDays: 7, weekendDays: 2, holidayDays: 1 });

assert.deepStrictEqual(engine.age({
  birthDate: "2000-02-29", atDate: "2026-07-29"
}), {
  years: 26, months: 5, days: 0, totalMonths: 317,
  totalWeeks: 1378, totalDays: 9647, daysUntilBirthday: 215
});

const grade = engine.grade({
  courses: [{ name: "A", credits: 3, points: 4 }, { name: "B", credits: 2, points: 3 }],
  previousCredits: 10, previousGpa: 3, futureCredits: 5, targetGpa: 3.5
});
assert.strictEqual(grade.gpa, 3.6);
assert.strictEqual(Number(grade.cgpa.toFixed(6)), 3.2);
assert.strictEqual(Number(grade.requiredFutureGpa.toFixed(6)), 4.4);

assert.deepStrictEqual(engine.pick({ items: ["A", "B", "C"], random: .5 }).value, "B");
assert.deepStrictEqual(engine.teams({
  items: ["A", "B", "C", "D"], teamCount: 2, randomValues: [0, 0, 0]
}), [["B", "D"], ["C", "A"]]);

const meeting = engine.meetingCost({
  attendees: 5, annualSalary: 52000, durationMinutes: 60,
  overhead: 1.5, annualFrequency: 52, workHoursPerYear: 2080
});
assert.deepStrictEqual(
  { meetingCost: meeting.meetingCost, perMinute: meeting.perMinute, annualCost: meeting.annualCost, personHours: meeting.personHours },
  { meetingCost: 187.5, perMinute: 3.125, annualCost: 9750, personHours: 260 }
);

assert.deepStrictEqual(engine.tip({
  bill: 100, tipRate: 10, taxRate: 5, people: 3, roundTo: 10
}), {
  bill: 100, tax: 5, billWithTax: 105, tip: 10, rawTotal: 115,
  total: 120, roundingExtra: 5, people: 3, perPerson: 40, tipPerPerson: 10 / 3
});

assert.throws(() => engine.age({ birthDate: "2030-01-01", atDate: "2026-01-01" }), /invalid-age-range/);
assert.throws(() => engine.workingDays({ start: "2026-02-02", end: "2026-01-01" }), /invalid-range/);
assert.throws(() => engine.holidayEntry({ country: "GH", name: "", date: "2026-01-01", confirmed: true }), /incomplete-confirmation/);

console.log("Business & ROI shared engine: 12/12 owner fixtures passed.");

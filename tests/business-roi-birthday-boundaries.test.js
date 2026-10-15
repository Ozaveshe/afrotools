const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engines/src/business-roi-engine.js');
const cases = [
  ['next leap year', '2000-02-29', '2027-03-02', 364],
  ['year boundary before leap year', '2000-02-29', '2027-12-31', 60],
  ['leap birthday tomorrow', '2000-02-29', '2028-02-28', 1],
  ['leap birthday today', '2000-02-29', '2028-02-29', 0],
  ['ordinary birthday today', '2000-07-29', '2026-07-29', 0],
  ['nonleap March1 anniversary today', '2000-02-29', '2027-03-01', 0],
  ['nonleap anniversary tomorrow', '2000-02-29', '2027-02-28', 1],
  ['anniversary after leap year', '2000-02-29', '2028-03-01', 365],
  ['newborn today', '2026-07-29', '2026-07-29', 0],
  ['next birthday tomorrow across year boundary', '2000-01-01', '2026-12-31', 1],
  ['century is not a leap year', '2000-02-29', '2099-12-31', 60],
  ['ordinary birthday next year includes leap day', '2000-03-01', '2027-03-02', 365]
];
for (const [name, birthDate, atDate, days] of cases) {
  test(name, () => assert.equal(engine.age({ birthDate, atDate }).daysUntilBirthday, days));
}
test('future and invalid birthdays remain rejected', () => {
  for (const birthDate of ['2027-01-01', '2026-02-30', 'invalid']) {
    assert.throws(() => engine.age({ birthDate, atDate: '2026-07-29' }), /invalid-age-range/);
  }
});
for (const [birthDate, atDate, expected] of [
  ['2000-02-29', '2027-03-01', [27, 0, 0]],
  ['2000-02-29', '2027-03-02', [27, 0, 1]],
  ['2000-02-29', '2027-03-29', [27, 1, 0]],
  ['2000-02-29', '2026-07-29', [26, 5, 0]],
  ['2026-01-31', '2026-02-28', [0, 0, 28]],
  ['2026-01-31', '2026-03-01', [0, 0, 29]],
  ['2026-01-31', '2026-03-03', [0, 1, 0]],
  ['2026-01-31', '2026-03-31', [0, 2, 0]],
  ['2028-01-31', '2028-03-02', [0, 1, 0]]
]) {
  test('calendar breakdown '+birthDate+' to '+atDate, () => {
    const result = engine.age({ birthDate, atDate });
    assert.deepEqual([result.years, result.months, result.days], expected);
  });
}

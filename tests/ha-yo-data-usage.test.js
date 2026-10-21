'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const usage = require('../assets/js/pages/ha-yo-data-usage');
const normal = { browse: '2', video: '1', calls: '2', study: '2', social: '1' };
for (const locale of ['ha', 'yo']) {
  test(locale + ' preserves the existing coefficients, month/week horizon, buffer and upward rounding', () => {
    for (const values of [normal, { browse: 0, video: 0, calls: 0, study: 0, social: 0 }, { browse: 0.5, video: 1.5, calls: 5.5, study: 3, social: 2.5 }, { browse: 24, video: 24, calls: 168, study: 24, social: 24 }]) {
      const old = values.browse * 0.08 * 30 + values.video * 0.9 * 30 + values.calls * 0.7 * 4 + values.study * 0.15 * 30;
      assert.equal(usage.estimate(values, locale), Math.ceil((old + (locale === 'yo' ? values.social * 0.12 * 30 : 0)) * 1.15));
    }
    assert.equal(usage.estimate(normal, locale), locale === 'ha' ? 54 : 58);
  });
  test(locale + ' rejects empty, nonfinite, negative, over-limit and non-half-hour values', () => {
    for (const value of ['', ' ', null, 'nonsense', Infinity, -0.5, 24.5, 0.1]) {
      const values = { ...normal, browse: value };
      assert.deepEqual(usage.validate(values, locale).map(error => error.field), ['browse']);
      assert.throws(() => usage.estimate(values, locale), RangeError);
    }
    assert.equal(usage.validate({ ...normal, calls: 168 }, locale).length, 0);
    assert.equal(usage.validate({ ...normal, calls: 168.5 }, locale)[0].field, 'calls');
    assert.equal(usage.validate({ ...normal, browse: 0 }, locale).length, 0);
  });
  test(locale + ' report contains matching localized result, field order and assumptions', () => {
    const result = usage.estimate(normal, locale), text = usage.report(normal, locale, result);
    assert.ok(text.includes(result + ' GB')); assert.ok(text.includes('15%')); assert.ok(text.includes('30')); assert.ok(text.includes('4'));
    assert.ok(text.includes(locale === 'ha' ? '2; 1; 2; 2' : '2; 1; 2; 2; 1'));
  });
}
test('unknown locale does not silently choose a formula or language', () => {
  assert.throws(() => usage.estimate(normal, 'en'), /Unsupported/);
});

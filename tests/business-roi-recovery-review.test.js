const test = require('node:test');
const assert = require('node:assert/strict');
const review = require('../data/calculation-quality/reviews/2026-10-13-business-roi-recovery.json');

function observe(engine, fixture) {
  try {
    const result = engine[fixture.method](fixture.input);
    if (fixture.projection !== 'calendar-properties') {
      return Object.fromEntries(fixture.fields.map(key => [key, result[key]]));
    }
    const unfolded = result.ics.replace(/\r\n[ \t]/g, '');
    const property = key => {
      const line = unfolded.split('\r\n').find(value => value.startsWith(key + ':'));
      return line ? line.slice(key.length + 1) : null;
    };
    return {
      uid: property('UID'), stamp: property('DTSTAMP'),
      start: property('DTSTART;VALUE=DATE'), end: property('DTEND;VALUE=DATE'),
      foldedWithin75: result.ics.split('\r\n').every(line => Buffer.byteLength(line) <= 75),
      noBareNewlines: !(/\r(?!\n)|(?<!\r)\n/.test(result.ics)),
      summary: property('SUMMARY')
    };
  } catch (error) {
    return { error: error.message };
  }
}

for (const artifact of ['../engines/src/business-roi-engine.js', '../engines/business-roi-engine.js']) {
  const engine = require(artifact);
  for (const fixture of review.boundaryFixtures) {
    test(artifact + ': ' + fixture.fixtureId, () => {
      assert.deepEqual(observe(engine, fixture), fixture.nextExpected);
    });
  }
}

test('review records every observed changed result without claiming human approval', () => {
  const changed = review.boundaryFixtures.filter(fixture =>
    JSON.stringify(fixture.previousExpected) !== JSON.stringify(fixture.nextExpected));
  assert.ok(changed.length > 0);
  assert.deepEqual(review.fixtureDeltas.map(row => row.fixtureId), changed.map(row => row.fixtureId));
  assert.equal(review.humanApproval.status, 'pending');
});

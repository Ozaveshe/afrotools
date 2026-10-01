const test = require('node:test');
const assert = require('node:assert/strict');
const { parse, url, matches, nonvisual } = require('../assets/js/lib/jamb-year-practice');
const subjects = { english: {}, mathematics: {} };
test('year quick links explicitly select mode and preserve it in retry URLs', () => {
  const parsed = parse('?subject=english&year=2022&mode=quick', subjects, 2026);
  assert.deepEqual(parsed, { scope: { subject: 'english', year: 2022, mode: 'quick' }, error: null });
  assert.equal(url('english', 2022, 'quick'), '/jamb/cbt/?subject=english&year=2022&mode=quick');
  assert.equal(parse('?subject=english&year=2022', subjects, 2026).scope.mode, 'subject');
  assert.equal(url('english', 2022, 'subject'), '/jamb/cbt/?subject=english&year=2022');
  assert.equal(parse('?mode=quick', subjects, 2026).scope, null);
});
test('invalid, ambiguous and unsupported scoped query values fail closed', () => {
  for (const query of ['subject=bad&year=2022', 'subject=english&year=abc', 'subject=english&year=2027',
    'subject=english&year=1977', 'subject=english&year=2022&mode=bad', 'subject=english&year=2022&mode=',
    'subject=english&year=2022&mode=full', 'subject=english&year=2022&mode=quick&mode=quick',
    'subject=english&subject=english&year=2022', 'subject=english&year=2022&year=2022', 'year=2022', 'subject=english']) {
    assert.equal(parse('?' + query, subjects, 2026).scope, null, query);
    assert.ok(parse('?' + query, subjects, 2026).error, query);
  }
});
test('resume matches the exact requested collection mode, year and single subject', () => {
  const scope = { subject: 'english', year: 2022, mode: 'quick' };
  const snapshot = { subjects: ['english'], year: 2022, mode: 'quick' };
  assert.equal(matches(snapshot, scope), true);
  for (const change of [{ mode: 'subject' }, { year: 2023 }, { subjects: ['mathematics'] }, { subjects: ['english', 'mathematics'] }]) {
    assert.equal(matches({ ...snapshot, ...change }, scope), false);
  }
});

test('quick CTA counts exclude unresolved visual references and attached figures', () => {
  assert.equal(nonvisual({ question: 'What is 2+2?', options: { A: '4' } }), true);
  for (const q of [{ question: 'Use the diagram above' }, { question: 'The graph above shows' },
    { question: 'Calculate this', options: { A: 'use the figure' } }, { question: 'A circle', image: '/figure.svg' },
    { question: 'A circle', has_diagram: true }]) assert.equal(nonvisual(q), false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engines/src/business-roi-engine.js');
const base = {country:'NG', date:'2026-10-01', name:'Synthetic event', confirmed:true};
const unfold = text => text.replace(/\r\n[ \t]/g, '');
const property = (text, key) => unfold(text).split('\r\n').filter(line => line.startsWith(key + ':')).map(line => line.slice(key.length + 1));
for (const locale of ['en', 'fr', 'sw']) {
  test(locale + ' export includes a UTC timestamp and preserves all-day boundaries', () => {
    const ics = engine.holidayEntry({...base, locale, uid:'fixture-1@afrotools.com', timestamp:'2026-10-11T07:00:00.123Z'}).ics;
    assert.deepEqual(property(ics,'UID'), ['fixture-1@afrotools.com']);
    assert.deepEqual(property(ics,'DTSTAMP'), ['20261011T070000Z']);
    assert.match(ics, /DTSTART;VALUE=DATE:20261001\r\n/);
    assert.match(ics, /DTEND;VALUE=DATE:20261002\r\n/);
    assert.equal(property(ics,'BEGIN').filter(value => value === 'VEVENT').length, 1);
  });
  test(locale + ' different events on the same date have separate identifiers', () => {
    const first=engine.holidayEntry({...base,locale,name:'Synthetic event A'}).ics;
    const second=engine.holidayEntry({...base,locale,name:'Synthetic event B'}).ics;
    assert.notEqual(property(first,'UID')[0],property(second,'UID')[0]);
    assert.match(property(first,'DTSTAMP')[0], /^\d{8}T\d{6}Z$/);
  });
  test(locale + ' long Unicode text folds by bytes and unfolds without loss', () => {
    const name='Synthetic '+ 'é🌍'.repeat(40), note='Synthetic '+ 'é🌍'.repeat(80);
    const result=engine.holidayEntry({...base,locale,name,note});
    for(const line of result.ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
    assert.equal(property(result.ics,'SUMMARY')[0],name);
    assert.equal(property(result.ics,'DESCRIPTION')[0],result.description);
    assert.ok(!result.ics.includes('\uFFFD'));
  });
}
test('all newline forms and text delimiters remain inside a single property', () => {
  const note='one\rtwo\nthree\r\nfour,semi;slash\\END:VEVENT';
  const ics=engine.holidayEntry({...base,note,locale:'en'}).ics;
  assert.ok(!/\r(?!\n)|(?<!\r)\n/.test(ics));
  const value=property(ics,'DESCRIPTION')[0];
  assert.ok(value.endsWith('one\\ntwo\\nthree\\nfour\\,semi\\;slash\\\\END:VEVENT'));
  assert.equal(property(ics,'END').filter(value=>value==='VEVENT').length,1);
});
test('caller-supplied event identity and timestamp produce a stable export', () => {
  const input={...base,uid:'stable@afrotools.com',timestamp:0};
  assert.equal(engine.holidayEntry(input).ics,engine.holidayEntry(input).ics);
  assert.deepEqual(property(engine.holidayEntry(input).ics,'DTSTAMP'),['19700101T000000Z']);
});
test('invalid metadata cannot add calendar properties', () => {
  for(const uid of ['', 'bad\r\nBEGIN:VEVENT', 'x'.repeat(201)]) assert.throws(()=>engine.holidayEntry({...base,uid}),/invalid-calendar-uid/);
  for(const timestamp of ['bad',Infinity,'+010000-01-01T00:00:00Z']) assert.throws(()=>engine.holidayEntry({...base,timestamp}),/invalid-calendar-timestamp/);
});
test('calendar year and leap day exclusive ends are preserved', () => {
  for(const [date,end] of [['2026-12-31','20270101'],['2028-02-29','20280301']]) assert.ok(engine.holidayEntry({...base,date}).ics.includes('DTEND;VALUE=DATE:'+end+'\r\n'));
});
test('source confirmation remains required', () => {
  assert.throws(()=>engine.holidayEntry({...base,confirmed:false}),/incomplete-confirmation/);
  assert.throws(()=>engine.holidayEntry({...base,date:'2026-02-30'}),/incomplete-confirmation/);
});

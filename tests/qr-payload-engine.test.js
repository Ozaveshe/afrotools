'use strict';

const assert = require('assert');
const engine = require('../assets/js/engines/qr-payload-engine');

assert.deepStrictEqual(engine.buildPayload({ mode: 'text', text: 'Habari Afrika' }), { ok: true, data: 'Habari Afrika' });
assert.deepStrictEqual(engine.buildPayload({ mode: 'url', url: 'https://afrotools.com/sw/' }), { ok: true, data: 'https://afrotools.com/sw/' });
assert.deepStrictEqual(engine.buildPayload({ mode: 'text', text: '' }), { ok: false, error: 'required_fields' });
assert.deepStrictEqual(engine.buildPayload({ mode: 'wifi', ssid: '', password: '', security: 'WPA' }), { ok: false, error: 'required_fields' });
assert.deepStrictEqual(engine.buildPayload({ mode: 'wifi', ssid: 'Duka', password: '', security: 'WPA' }), { ok: false, error: 'wifi_password_required' });
assert.deepStrictEqual(engine.buildPayload({ mode: 'wifi', ssid: 'Duka', password: 'fupi', security: 'WPA' }), { ok: false, error: 'wifi_password_length' });
assert.deepStrictEqual(
  engine.buildPayload({ mode: 'wifi', ssid: 'Duka:Kuu', password: 'siri;1234', security: 'WPA' }),
  { ok: true, data: 'WIFI:T:WPA;S:Duka\\:Kuu;P:siri\\;1234;;' }
);
assert.deepStrictEqual(
  engine.buildPayload({ mode: 'vcard', name: 'Amina; Njeri', phone: '+254700000000', email: 'amina@example.test', org: 'Soko, Ltd' }),
  { ok: true, data: 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Amina\\; Njeri\r\nN:;Amina\\; Njeri;;;\r\nTEL:+254700000000\r\nEMAIL:amina@example.test\r\nORG:Soko\\, Ltd\r\nEND:VCARD\r\n' }
);

const mononym = 'Ọlá';
assert.strictEqual(engine.buildPayload({ mode: 'vcard', name: mononym }).data,
  `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${mononym}\r\nN:;${mononym};;;\r\nEND:VCARD\r\n`);
const multilineName = 'N\\Ko;é,李\r\nORG:Example';
const escapedName = 'N\\\\Ko\\;é\\,李\\nORG:Example';
const contact = engine.buildPayload({ mode: 'vcard', name: multilineName }).data;
assert.deepStrictEqual(contact.split('\r\n'), [
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:' + escapedName, 'N:;' + escapedName + ';;;', 'END:VCARD', ''
]);

const matrix = {
  getModuleCount: () => 2,
  isDark: (row, column) => row === column
};
const svg = engine.buildSvg(matrix, '#112233', '#ffffff');
assert.match(svg, /viewBox="0 0 10 10" width="1024" height="1024"/);
assert.match(svg, /<rect width="10" height="10" fill="#ffffff"\/>/);
assert.match(svg, /M4 4h1v1h-1zM5 5h1v1h-1z/);
assert.match(svg, /fill="#112233"/);

console.log('qr-payload-engine.test.js passed');

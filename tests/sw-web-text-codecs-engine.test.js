'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/js/engines/web-text-codecs.js', 'utf8'), context);
const codecs = context.window.AfroToolsWebTextCodecs;

const urlFixture = 'Dar es Salaam & café/東京?x=1';
assert.equal(codecs.url.encodeUri(urlFixture), encodeURI(urlFixture));
assert.equal(codecs.url.encodeComponent(urlFixture), encodeURIComponent(urlFixture));
assert.equal(codecs.url.encodeRfc3986("!*'()"), '%21%2A%27%28%29');
assert.equal(codecs.url.encodeFormValue('Dar es Salaam + café'), 'Dar+es+Salaam+%2B+caf%C3%A9');
assert.equal(codecs.url.decodeFormValue('Dar+es+Salaam+%2B+caf%C3%A9'), 'Dar es Salaam + café');
assert.throws(() => codecs.url.decodeFormValue('%E0%A4%A'), /URI malformed/);

const htmlFixture = '<p title="A&B">© — café</p>';
assert.equal(codecs.html.encode(htmlFixture, 'named'), '&lt;p title=&quot;A&amp;B&quot;&gt;&copy; &mdash; café&lt;/p&gt;');
assert.equal(codecs.html.encode('© é &', 'decimal'), '&#169; &#233; &#38;');
assert.equal(codecs.html.encode('© é &', 'hex'), '&#xA9; &#xE9; &#x26;');
assert.throws(() => codecs.html.encode('x', 'unknown'), /Unsupported HTML entity style/);

console.log('web-text-codecs engine: URL and HTML owner oracles passed');

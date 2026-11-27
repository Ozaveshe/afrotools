#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rules = fs.readFileSync(path.join(__dirname, '../_headers'), 'utf8').split(/\r?\n/);
function headersFor(pathname) {
  let matches = false;
  const headers = {};
  for (const line of rules) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g, '.*');
      matches = new RegExp('^' + pattern + '$').test(pathname);
    } else if (matches) {
      const i = line.indexOf(':');
      headers[line.slice(0,i).trim()] = line.slice(i+1).trim();
    }
  }
  return headers;
}
const original = headersFor('/tools/example/');
for (const tool of ['creator-clip', 'creator-voice', 'creator-record']) {
  for (const suffix of ['app','app/','app.html']) {
    const current = headersFor('/tools/' + tool + '/' + suffix);
    assert.equal(current['Content-Security-Policy'], original['Content-Security-Policy'].replace(/;$/, '') + "; media-src 'self' blob:;");
    let permissions = original['Permissions-Policy'];
    if (tool !== 'creator-clip') permissions = permissions.replace('microphone=()', 'microphone=(self)');
    if (tool === 'creator-record') permissions = permissions.replace('camera=()', 'camera=(self)');
    assert.equal(current['Permissions-Policy'], permissions);
  }
  assert.deepEqual(headersFor('/tools/' + tool + '/'), original);
}

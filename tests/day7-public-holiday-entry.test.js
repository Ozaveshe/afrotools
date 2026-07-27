const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'public-holidays', 'index.html'), 'utf8');
assert.match(html, /does not publish a complete national calendar/i);
assert.match(html, /User-confirmed entry only - not an official calendar/i);
assert.match(html, /X-AFROTOOLS-BOUNDARY:User-confirmed entry/);
assert.match(html, /user-confirmed-public-holiday\.ics/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /function islamicDates|approximately 13 official|built for all 54/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);
console.log('Day 7 public holiday user-confirmed entry boundary verified.');

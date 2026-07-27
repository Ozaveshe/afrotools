const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'tools', 'voter-registration', 'index.html'),
  'utf8'
);

assert.match(html, /does not decide eligibility, show an election deadline, confirm registration/i);
assert.match(html, /No eligibility or registration verdict is produced/);
assert.match(html, /Official-source handoff from the AfroTools government source manifest/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /\bfetch\s*\(/, 'planner must not make a network request');
assert.doesNotMatch(html, /localStorage|sessionStorage/, 'planner must not persist civic selections');
assert.doesNotMatch(html, /next election|Eligible to Vote|Not Eligible|turnout|93 million|22 million/i);

console.log('Day 7 voter registration verification boundary verified.');

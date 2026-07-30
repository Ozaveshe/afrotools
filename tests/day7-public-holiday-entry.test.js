const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'public-holidays', 'index.html'), 'utf8');
const engineSource = fs.readFileSync(path.join(__dirname, '..', 'engines', 'src', 'business-roi-engine.js'), 'utf8');
const sandbox = { window: {}, Intl, Date };
sandbox.window = sandbox;
vm.runInNewContext(engineSource, sandbox, { filename: 'engines/src/business-roi-engine.js' });
const commonInput = {
  country: 'NG',
  name: 'Verified public holiday',
  date: '2026-10-01',
  note: '',
  confirmed: true,
};
const englishEntry = sandbox.BusinessRoiEngine.holidayEntry({ ...commonInput, locale: 'en' });
const frenchEntry = sandbox.BusinessRoiEngine.holidayEntry({ ...commonInput, locale: 'fr' });

assert.match(html, /does not publish a complete national calendar/i);
assert.match(html, /User-confirmed entry only - not an official calendar/i);
assert.match(html, /user-confirmed-public-holiday\.ics/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /function islamicDates|approximately 13 official|built for all 54/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);
assert.match(englishEntry.ics, /PRODID:-\/\/AfroTools\/\/User Confirmed Holiday Entry\/\/EN/);
assert.match(englishEntry.ics, /X-AFROTOOLS-BOUNDARY:User-confirmed entry; unofficial calendar/);
assert.match(englishEntry.description, /^User-confirmed from /);
assert.match(frenchEntry.ics, /PRODID:-\/\/AfroTools\/\/User Confirmed Holiday Entry\/\/FR/);
assert.match(frenchEntry.ics, /X-AFROTOOLS-BOUNDARY:Entree confirmee par utilisateur; calendrier non officiel/);
assert.match(frenchEntry.description, /^Entr\u00e9e confirm\u00e9e par l\u2019utilisateur depuis /);
console.log('Day 7 public holiday user-confirmed entry boundary verified.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const african = read('assets/js/african-workflow.js');
const religious = read('assets/js/religious-cultural-apps.js');
const telecom = read('assets/js/telecom-toolkit.js');

for (const [owner, source] of [
  ['African workflow', african],
  ['Religious and cultural workflow', religious],
]) {
  assert.doesNotMatch(
    source,
    /capture-lead|unlock (?:the )?pdf|email-gated pdf/i,
    `${owner} must not gate or transmit a local primary PDF export`,
  );
  assert.match(
    source,
    /pdf/i,
    `${owner} must retain its PDF workflow`,
  );
}

assert.match(telecom, /Email for optional updates/);
assert.match(telecom, /type="checkbox"> Send useful telecom updates/);
assert.doesNotMatch(
  telecom,
  /type="checkbox" checked/,
  'Telecom marketing consent must not be preselected',
);
assert.match(
  telecom,
  /optInDigest&&.+email&&.+await M\(/,
  'Telecom lead capture must require explicit opt-in and a valid email',
);
assert.match(
  telecom,
  /PDF brief generated locally/,
  'Telecom PDF must retain a local-generation status',
);

console.log('Day 10 shared export privacy: local PDFs are ungated and telecom capture is explicit opt-in only.');

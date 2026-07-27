const assert = require('assert');
const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, '..', 'tools', 'visa-checker');
const files = fs.readdirSync(directory).filter(file => file !== 'index.html' && file.endsWith('.html')).sort();
assert.strictEqual(files.length, 54, 'visa country route count drifted');
for (const file of files) {
  const slug = file.slice(0, -5);
  const html = fs.readFileSync(path.join(directory, file), 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com/tools/visa-checker/${slug}">`));
  assert.match(html, /data-visa-family/);
  assert.match(html, /no live visa status, exemption, arrival right, eVisa availability, eligibility, fee, stay limit/i);
  assert.match(html, /not sent over the network or written to browser storage/i);
  assert.match(html, /Freshness:<\/strong> entry rules can change without notice/);
  assert.match(html, /"@type":"WebApplication"/);
  assert.doesNotMatch(html, /Visa Free|Visa on Arrival|Visa Required|Check if you need|53 other African countries/i);
  assert.doesNotMatch(html, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
}
console.log('Day 7 visa family contract verified for 54 country routes.');

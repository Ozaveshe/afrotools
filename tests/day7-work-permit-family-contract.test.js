const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools/work-permit-cost/index.html'), 'utf8');
const match = html.match(/var sources=(\[[^\n]+\]);\n    var form/);
assert.ok(match, 'work-permit country option array is missing');
const sources = JSON.parse(match[1]);
assert.strictEqual(sources.length, 54, 'work-permit expanded country option count drifted');
assert.strictEqual(new Set(sources.map(row => row[0])).size, 54);
const boundUrls = Object.fromEntries(sources.filter(row => row[4]).map(row => [row[0], row[4]]));
assert.deepStrictEqual(boundUrls, {
  "NG": "https://immigration.gov.ng/e-cerpac-combined-expatriate-residence-permit-and-aliens-card/",
  "KE": "https://fns.immigration.go.ke/infopack/permits/",
  "ZA": "https://www.gov.za/faq/finance-business/how-do-i-obtain-work-permit",
  "GH": "https://gis.gov.gh/fees-and-charges/",
  "LS": "https://www.gov.ls/eservice/provision-of-work-permits/",
  "RW": "https://www.migration.gov.rw/our-services/permit/employment",
  "SC": "https://ics.gov.sc/permits/gainful-occupation-permit",
  "TZ": "https://epermit.kazi.go.tz/main/guidelines",
  "UG": "https://www.immigration.go.ug/permit/entry-permit",
  "ZM": "https://www.zambiaimmigration.gov.zm/permit-types/"
});
assert.match(html, /Source gap: no immigration authority URL is bound/);
assert.match(html, /does not provide a live fee, category, eligibility rule or approval result/);
console.log('Day 7 work-permit family contract verified for 54 country options with 10 bound authorities and 44 explicit source gaps.');

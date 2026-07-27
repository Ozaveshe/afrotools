const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'africa-election-tracker', 'index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'government', 'africa-election-tracker.json'), 'utf8'));

assert.ok(Array.isArray(data.elections) && data.elections.length > 0, 'published election records are required');
assert.ok(data.generatedAt, 'source generation date is required');
assert.ok(Number(data.reviewCadenceDays) > 0, 'review cadence is required');
data.elections.forEach((record) => {
  assert.ok(record.electionDate, `${record.id || record.country}: election date missing`);
  assert.ok(record.dateStatus, `${record.id || record.country}: date status missing`);
  assert.ok(record.sourceStatus, `${record.id || record.country}: source status missing`);
  assert.ok(Array.isArray(record.sources) && record.sources.length > 0, `${record.id || record.country}: source link missing`);
});
assert.match(html, /review overdue by/);
assert.match(html, /id="resetFilters"/);
assert.match(html, /els\.searchInput\.focus\(\)/);
assert.doesNotMatch(html, /data-df-upgrade="africa-election-tracker"|built for all 54 African countries/);

console.log(`Day 7 election tracker contract verified for ${data.elections.length} source-labelled records.`);

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validateFeed, MAX_BYTES } = require('../assets/js/lib/regulatory-public-feed.js');
const root = path.resolve(__dirname, '..');
const bytes = fs.readFileSync(path.join(root, 'data/regulatory/public-feed.json'));
if (bytes.length > MAX_BYTES) throw new Error('Public regulatory feed is too large');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'engines/src/regulatory-alerts-engine.js'), 'utf8'), sandbox);
const feed = validateFeed(JSON.parse(bytes), sandbox.RAEngine);
const sources = JSON.parse(fs.readFileSync(path.join(root, 'data/hr-payroll/official-sources.json'), 'utf8')).sources;
for (const record of feed.records) {
  const source = sources.find(s => s.id === record.source_id);
  const primary = record.sources.find(s => s.kind === 'primary');
  if (!source || source.country !== record.country_code || source.url !== primary.url ||
      source.publishedDate !== record.source_published_date || source.effectiveDate !== record.effective_date) {
    throw new Error('Public regulatory record does not match its maintained official source');
  }
}
console.log(JSON.stringify({status:'pass', records:feed.records.length, countries:feed.coverage.countries,
  qualification:'Selected historical events; no comprehensive monitoring or deployed-publication claim'}));

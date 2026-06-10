#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'government', 'africa-election-tracker.json');

const allowedDateStatuses = new Set([
  'official',
  'official-revised',
  'confirmed-external',
  'tentative',
  'projected',
]);

const allowedSourceStatuses = new Set([
  'official',
  'mixed',
  'needs-review',
]);

const allowedSourceTypes = new Set([
  'official',
  'external-calendar',
  'external-report',
]);

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

const failures = [];
assert(fs.existsSync(DATA_PATH), 'Africa election tracker data file is missing', failures);

const data = fs.existsSync(DATA_PATH) ? loadData() : {};
assert(data.version === 1, 'data version must be 1', failures);
assert(data.toolId === 'africa-election-tracker', 'toolId must be africa-election-tracker', failures);
assert(isIsoDate(data.generatedAt), 'generatedAt must be an ISO date', failures);
assert(Array.isArray(data.elections) && data.elections.length >= 8, 'expected at least 8 election records', failures);

const ids = new Set();
const executiveRecords = [];

for (const record of data.elections || []) {
  assert(record.id && !ids.has(record.id), `duplicate or missing id: ${record.id}`, failures);
  ids.add(record.id);

  assert(/^[A-Z]{2}$/.test(record.countryCode || ''), `${record.id} has invalid countryCode`, failures);
  assert(record.country && record.country.length >= 3, `${record.id} is missing country`, failures);
  assert(record.jurisdiction, `${record.id} is missing jurisdiction`, failures);
  assert(record.office, `${record.id} is missing office`, failures);
  assert(record.electionType, `${record.id} is missing electionType`, failures);
  assert(record.level, `${record.id} is missing level`, failures);
  assert(isIsoDate(record.electionDate), `${record.id} has invalid electionDate`, failures);

  if (record.dateEnd) {
    assert(isIsoDate(record.dateEnd), `${record.id} has invalid dateEnd`, failures);
    assert(record.dateEnd >= record.electionDate, `${record.id} dateEnd precedes electionDate`, failures);
  }

  assert(allowedDateStatuses.has(record.dateStatus), `${record.id} has invalid dateStatus`, failures);
  assert(allowedSourceStatuses.has(record.sourceStatus), `${record.id} has invalid sourceStatus`, failures);
  assert(typeof record.executiveFocus === 'boolean', `${record.id} executiveFocus must be boolean`, failures);
  assert(record.notes && record.notes.length >= 40, `${record.id} needs a useful note`, failures);
  assert(record.nextWatch && record.nextWatch.length >= 25, `${record.id} needs a nextWatch item`, failures);
  assert(Array.isArray(record.sources) && record.sources.length > 0, `${record.id} needs sources`, failures);

  const hasOfficialSource = (record.sources || []).some((source) => source.type === 'official');
  if (record.dateStatus === 'official' || record.dateStatus === 'official-revised') {
    assert(record.sourceStatus === 'official', `${record.id} official date must have official sourceStatus`, failures);
    assert(hasOfficialSource, `${record.id} official date must include an official source`, failures);
  }

  for (const source of record.sources || []) {
    assert(source.label && source.label.length >= 6, `${record.id} has a source with a weak label`, failures);
    assert(/^https:\/\//.test(source.url || ''), `${record.id} source URL must be https`, failures);
    assert(allowedSourceTypes.has(source.type), `${record.id} has invalid source type ${source.type}`, failures);
    assert(isIsoDate(source.checkedAt), `${record.id} source checkedAt must be an ISO date`, failures);
  }

  if (record.executiveFocus) executiveRecords.push(record);
}

assert(executiveRecords.length >= 7, `expected at least 7 executive-focus records, found ${executiveRecords.length}`, failures);
assert((data.elections || []).some((record) => record.electionType === 'governorship'), 'expected at least one governorship record', failures);
assert((data.elections || []).some((record) => record.electionType === 'presidential'), 'expected at least one presidential record', failures);
assert((data.elections || []).some((record) => record.sourceStatus === 'needs-review'), 'expected at least one needs-review record', failures);

if (failures.length) {
  console.error('Africa election tracker data test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Africa election tracker data verified: ${data.elections.length} records, ${executiveRecords.length} executive-focus records.`);

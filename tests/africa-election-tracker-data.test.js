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

const allowedNewsSourceTypes = new Set([
  'official-rss',
  'media-rss',
  'external-calendar',
  'official-page',
]);

const allowedNewsStatuses = new Set([
  'active',
  'manual-watch',
  'needs-review',
  'paused',
]);

const allowedCandidateFactStatuses = new Set([
  'roster-only',
  'fact-file-started',
  'verified-profile',
]);

const allowedFactSourceTypes = new Set([
  'official',
  'official-record',
  'court-record',
  'candidate-platform',
  'manifesto',
  'media-report',
  'public-record',
]);

const allowedPublicRecordStatuses = new Set([
  'alleged',
  'court-record',
  'official-finding',
  'cleared',
  'retracted',
  'settled',
  'under-review',
]);

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDateTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function assertDatedSource(source, context, allowedTypes, failures) {
  assert(source && typeof source === 'object', `${context} needs a source object`, failures);
  if (!source || typeof source !== 'object') return;
  assert(source.label && source.label.length >= 6, `${context} source needs a useful label`, failures);
  assert(/^https:\/\//.test(source.url || ''), `${context} source URL must be https`, failures);
  assert(allowedTypes.has(source.type), `${context} has invalid source type ${source.type}`, failures);
  assert(isIsoDate(source.checkedAt), `${context} source checkedAt must be an ISO date`, failures);
}

function assertSourcedFact(item, context, failures) {
  const text = item && (item.title || item.claim || item.role || item.summary || item.description);
  assert(text && String(text).length >= 6, `${context} needs neutral fact text`, failures);
  assertDatedSource(item && item.source, `${context} fact`, allowedFactSourceTypes, failures);
}

const failures = [];
assert(fs.existsSync(DATA_PATH), 'Africa election tracker data file is missing', failures);

const data = fs.existsSync(DATA_PATH) ? loadData() : {};
assert(data.version === 1, 'data version must be 1', failures);
assert(data.toolId === 'africa-election-tracker', 'toolId must be africa-election-tracker', failures);
assert(isIsoDate(data.generatedAt), 'generatedAt must be an ISO date', failures);
assert(Array.isArray(data.elections) && data.elections.length >= 8, 'expected at least 8 election records', failures);
assert(!data.sourcePolicy, 'sourcePolicy must not be published in customer-facing tracker data', failures);
assert(data.verification && data.verification.summary, 'verification summary is missing', failures);
assert(
  Array.isArray(data.verification && data.verification.publicFactRules)
    && data.verification.publicFactRules.length >= 3,
  'verification publicFactRules must explain the public fact guardrails',
  failures
);

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
    assertDatedSource(source, record.id, allowedSourceTypes, failures);
  }

  if (record.executiveFocus) executiveRecords.push(record);
}

assert(executiveRecords.length >= 7, `expected at least 7 executive-focus records, found ${executiveRecords.length}`, failures);
assert((data.elections || []).some((record) => record.electionType === 'governorship'), 'expected at least one governorship record', failures);
assert((data.elections || []).some((record) => record.electionType === 'presidential'), 'expected at least one presidential record', failures);
assert((data.elections || []).some((record) => record.sourceStatus === 'needs-review'), 'expected at least one needs-review record', failures);

assert(Array.isArray(data.newsFeeds) && data.newsFeeds.length >= 1, 'expected at least one news/RSS watch source', failures);
assert((data.newsFeeds || []).some((feed) => feed.feedUrl), 'expected at least one RSS feed URL', failures);

for (const feed of data.newsFeeds || []) {
  assert(feed.id && /^[a-z0-9-]+$/.test(feed.id), `news feed has invalid id: ${feed.id}`, failures);
  assert(feed.label && feed.label.length >= 6, `${feed.id} needs a useful label`, failures);
  assert(feed.scope && feed.scope.length >= 12, `${feed.id} needs a useful scope`, failures);
  assert(allowedNewsSourceTypes.has(feed.sourceType), `${feed.id} has invalid sourceType ${feed.sourceType}`, failures);
  assert(allowedNewsStatuses.has(feed.status), `${feed.id} has invalid status ${feed.status}`, failures);
  assert(isIsoDate(feed.checkedAt), `${feed.id} checkedAt must be an ISO date`, failures);
  assert(/^https:\/\//.test(feed.feedUrl || feed.url || ''), `${feed.id} needs an https feedUrl or url`, failures);
  if (feed.latestItem) {
    assert(feed.latestItem.title && feed.latestItem.title.length >= 8, `${feed.id} latest item needs a title`, failures);
    assert(/^https:\/\//.test(feed.latestItem.url || ''), `${feed.id} latest item URL must be https`, failures);
    assert(isIsoDateTime(feed.latestItem.publishedAt), `${feed.id} latest item publishedAt must be an ISO datetime`, failures);
  }
}

const candidateEvidence = data.candidateEvidence || {};
assert(candidateEvidence.summary && candidateEvidence.summary.length >= 40, 'candidateEvidence summary is missing or too short', failures);
assert(
  Array.isArray(candidateEvidence.elections) && candidateEvidence.elections.length >= 1,
  'expected at least one candidate evidence election',
  failures
);

for (const entry of candidateEvidence.elections || []) {
  assert(ids.has(entry.electionId), `${entry.electionId} candidate evidence points to an unknown election`, failures);
  assert(entry.title && entry.title.length >= 8, `${entry.electionId} candidate evidence needs a title`, failures);
  assert(entry.rosterStatus && entry.rosterStatus.length >= 8, `${entry.electionId} needs rosterStatus`, failures);
  assert(entry.publicNote && entry.publicNote.length >= 30, `${entry.electionId} needs a public candidate note`, failures);
  assertDatedSource(entry.rosterSource, `${entry.electionId} roster`, allowedSourceTypes, failures);
  assert(
    Array.isArray(entry.rosterSource && entry.rosterSource.attachments)
      && entry.rosterSource.attachments.every((url) => /^https:\/\//.test(url)),
    `${entry.electionId} roster attachments must be https URLs`,
    failures
  );
  assert(Array.isArray(entry.contestants) && entry.contestants.length >= 1, `${entry.electionId} needs contestants`, failures);

  for (const contestant of entry.contestants || []) {
    const context = `${entry.electionId} ${contestant && contestant.party} ${contestant && contestant.name}`;
    assert(contestant.party && contestant.party.length >= 1, `${context} needs a party`, failures);
    assert(contestant.name && contestant.name.length >= 6, `${context} needs a candidate name`, failures);
    assert(contestant.runningMate && contestant.runningMate.length >= 6, `${context} needs a running mate`, failures);
    assert(allowedCandidateFactStatuses.has(contestant.factStatus), `${context} has invalid factStatus`, failures);
    assert(Array.isArray(contestant.previousRoles), `${context} previousRoles must be an array`, failures);
    assert(Array.isArray(contestant.promises), `${context} promises must be an array`, failures);
    assert(Array.isArray(contestant.promiseChecks), `${context} promiseChecks must be an array`, failures);
    assert(Array.isArray(contestant.publicRecords), `${context} publicRecords must be an array`, failures);

    for (const role of contestant.previousRoles || []) assertSourcedFact(role, `${context} previous role`, failures);
    for (const promise of contestant.promises || []) assertSourcedFact(promise, `${context} promise`, failures);
    for (const check of contestant.promiseChecks || []) assertSourcedFact(check, `${context} promise check`, failures);
    for (const record of contestant.publicRecords || []) {
      assert(allowedPublicRecordStatuses.has(record.status), `${context} public record has invalid status ${record.status}`, failures);
      assertSourcedFact(record, `${context} public record`, failures);
    }
  }
}

if (failures.length) {
  console.error('Africa election tracker data test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Africa election tracker data verified: ${data.elections.length} records, ${executiveRecords.length} executive-focus records.`);

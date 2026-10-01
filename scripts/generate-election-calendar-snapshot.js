'use strict';

// A readable calendar fallback is generated from the same reviewed ledger as the
// interactive tracker. Feed headlines never enter this page.
const fs = require('node:fs');
const path = require('node:path');
const { localeCopy } = require('../assets/js/pages/election-edition.js');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data/government/africa-election-tracker.json');
const PAGE_PATH = path.join(ROOT, 'tools/africa-election-tracker/index.html');
const START = '<!-- ELECTION_CALENDAR_SNAPSHOT_START -->';
const END = '<!-- ELECTION_CALENDAR_SNAPSHOT_END -->';
const COUNTRY_START = '<!-- ELECTION_COUNTRY_INDEX_START -->';
const COUNTRY_END = '<!-- ELECTION_COUNTRY_INDEX_END -->';
const EDITIONS = [
  { locale: 'ha', path: path.join(ROOT, 'ha/zabe/index.html'), start: '<!-- ELECTION_HA_SNAPSHOT_START -->', end: '<!-- ELECTION_HA_SNAPSHOT_END -->' },
  { locale: 'yo', path: path.join(ROOT, 'yo/idibo/index.html'), start: '<!-- ELECTION_YO_SNAPSHOT_START -->', end: '<!-- ELECTION_YO_SNAPSHOT_END -->' }
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// A build/runtime consistency marker, not a security signature.
function ledgerFingerprint(data) {
  const payload = JSON.stringify({ generatedAt: data.generatedAt, dateStatusLabels: data.dateStatusLabels, elections: data.elections });
  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function formatDate(value) {
  assert(validDate(value), 'Invalid election snapshot date: ' + value);
  const [year, month, day] = value.split('-').map(Number);
  return day + ' ' + MONTHS[month - 1] + ' ' + year;
}

function dateDisplay(record) {
  const [year, month, day] = record.electionDate.split('-').map(Number);
  if (record.datePrecision === 'year') {
    return { datetime: String(year), large: String(year), small: '', full: String(year) };
  }
  if (record.datePrecision === 'month' || record.dateStatus === 'projected' || record.dateStatus === 'tentative') {
    return { datetime: record.electionDate.slice(0, 7), large: MONTHS[month - 1], small: String(year), full: MONTHS[month - 1] + ' ' + year };
  }
  return { datetime: record.electionDate, large: String(day), small: MONTHS[month - 1] + ' ' + year, full: formatDate(record.electionDate) };
}

function officialSources(record) {
  return (record.sources || []).filter((item) => item && item.type === 'official').map((source) => {
    let url;
    try {
      url = new URL(source.url);
    } catch (_) {
      throw new Error(record.id + ': invalid official source URL');
    }
    assert(url.protocol === 'https:' && !url.username && !url.password, record.id + ': official source must use HTTPS');
    assert(source.label && validDate(source.checkedAt), record.id + ': official source needs a label and checked date');
    return source;
  });
}

function recordEndDate(record) {
  if (record.dateEnd) {
    assert(validDate(record.dateEnd), record.id + ': invalid date range end');
    return record.dateEnd;
  }
  assert(validDate(record.electionDate), record.id + ': invalid election date');
  if (record.datePrecision === 'year') return record.electionDate.slice(0, 4) + '-12-31';
  if (record.datePrecision === 'month' || record.dateStatus === 'projected' || record.dateStatus === 'tentative') {
    const [year, month] = record.electionDate.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return record.electionDate.slice(0, 7) + '-' + String(lastDay).padStart(2, '0');
  }
  return record.electionDate;
}

function renderRecord(record, dateStatusLabels) {
  assert(record && record.id && record.country && record.office, 'Election snapshot record is missing identity fields');
  assert(/^[a-z0-9-]+$/.test(record.id), record.id + ': election id is unsafe for an anchor');
  assert(validDate(record.electionDate), record.id + ': invalid election date');
  assert(['day', 'month', 'year'].includes(record.datePrecision), record.id + ': invalid date precision');
  const dateStatus = dateStatusLabels[record.dateStatus];
  assert(dateStatus, record.id + ': unknown date status');
  const sources = officialSources(record);
  if (record.sourceStatus === 'official') assert(sources.length, record.id + ': official record lacks an official link');
  const sourceStatus = record.sourceStatus === 'official' ? 'Official source' :
    record.sourceStatus === 'mixed' ? 'Mixed sources' : 'Needs review';
  const date = dateDisplay(record);
  if (record.dateEnd) assert(validDate(record.dateEnd), record.id + ': invalid date range end');
  const range = record.dateEnd ? ' to ' + dateDisplay({ ...record, electionDate: record.dateEnd }).full : '';
  const sourceMarkup = sources.length
    ? sources.map((source) => '<div class="et-snapshot-source"><a class="et-source-link" href="' + escapeHtml(source.url) + '" rel="noopener noreferrer" target="_blank">' + escapeHtml(source.label) + '</a>' +
      '<span class="et-source-checked">Checked ' + escapeHtml(formatDate(source.checkedAt)) + '</span></div>').join('')
    : '<span class="et-source-checked">No official link is available for this record; verify before relying on its date.</span>';

  return [
    '<article class="et-election-card" id="election-' + escapeHtml(record.id) + '" data-snapshot-election-id="' + escapeHtml(record.id) + '">',
    '  <div class="et-election-top">',
    '    <div class="et-date-box"><time datetime="' + escapeHtml(date.datetime) + '" aria-label="' + escapeHtml(date.full + range + '; ' + dateStatus) + '"><strong>' + escapeHtml(date.large) + '</strong><span>' + escapeHtml(date.small) + '</span></time></div>',
    '    <div>',
    '      <h4 class="et-election-title">' + escapeHtml(record.country) + ': ' + escapeHtml(record.office) + '</h4>',
    '      <span class="et-pill">' + escapeHtml(sourceStatus) + '</span><span class="et-pill">Date: ' + escapeHtml(dateStatus) + '</span>',
    '      <p class="et-election-meta">' + escapeHtml([record.jurisdiction, record.region, String(record.electionType || '').replace(/-/g, ' ')].filter(Boolean).join(' / ')) + '</p>',
    '      <p class="et-election-brief">' + escapeHtml(record.notes || '') + '</p>',
    '    </div>',
    '  </div>',
  '  <details class="et-record-details"><summary>Official notices and next watch for ' + escapeHtml(record.country) + ' ' + escapeHtml(record.office) + '</summary>',
    '    <div class="et-election-bottom"><div class="et-source-links">' + sourceMarkup + '</div></div>',
    '    <p class="et-watch"><strong>Watch:</strong> ' + escapeHtml(record.nextWatch || '') + '</p>',
    '  </details>',
    '</article>'
  ].join('\n');
}

function renderSnapshot(data) {
  assert(data && data.toolId === 'africa-election-tracker', 'Election tracker ledger is required');
  assert(validDate(data.generatedAt), 'Election tracker generatedAt must be a valid date');
  assert(Array.isArray(data.elections) && data.elections.length, 'Election snapshot needs published records');
  assert(data.dateStatusLabels && typeof data.dateStatusLabels === 'object', 'Election date-status labels are required');
  const records = [...data.elections].sort((a, b) =>
    String(a.electionDate || '').localeCompare(String(b.electionDate || '')) ||
    String(a.country || '').localeCompare(String(b.country || ''))
  );
  const upcoming = records.filter((record) => recordEndDate(record) >= data.generatedAt);
  const earlier = records.filter((record) => recordEndDate(record) < data.generatedAt).reverse();
  return [
    '<p class="et-snapshot-note" data-snapshot-date="' + escapeHtml(data.generatedAt) + '" data-ledger-fingerprint="' + ledgerFingerprint(data) + '">Published ledger snapshot generated ' + escapeHtml(formatDate(data.generatedAt)) + '. Dates can change. Each record links its available official notices; live filters load with JavaScript.</p>',
    ...(upcoming.length ? ['<h3 class="et-snapshot-heading">Upcoming as of ' + escapeHtml(formatDate(data.generatedAt)) + '</h3>'] : []),
    ...upcoming.map((record) => renderRecord(record, data.dateStatusLabels)),
    ...(earlier.length ? ['<h3 class="et-snapshot-heading">Earlier records</h3>'] : []),
    ...earlier.map((record) => renderRecord(record, data.dateStatusLabels))
  ].join('\n');
}

function renderCountryIndex(data) {
  assert(data && data.toolId === 'africa-election-tracker', 'Election tracker ledger is required');
  assert(validDate(data.generatedAt), 'Election tracker generatedAt must be a valid date');
  assert(Array.isArray(data.elections) && data.elections.length, 'Country index needs published records');
  assert(data.dateStatusLabels && typeof data.dateStatusLabels === 'object', 'Election date-status labels are required');

  const countries = new Map();
  for (const record of data.elections) {
    assert(record && /^[a-z0-9-]+$/.test(record.id || ''), 'Country index needs a safe election id');
    assert(/^[A-Z]{2}$/.test(record.countryCode || '') && record.country && record.region, record.id + ': country identity is missing');
    assert(validDate(record.electionDate), record.id + ': invalid election date');
    assert(data.dateStatusLabels[record.dateStatus], record.id + ': unknown date status');
    if (!countries.has(record.countryCode)) {
      countries.set(record.countryCode, { code: record.countryCode, name: record.country, region: record.region, records: [] });
    }
    const country = countries.get(record.countryCode);
    assert(country.name === record.country && country.region === record.region, record.id + ': country identity changed within the ledger');
    country.records.push(record);
  }

  return Array.from(countries.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => {
      const records = country.records.sort((a, b) => a.electionDate.localeCompare(b.electionDate) || a.office.localeCompare(b.office));
      const officeCounts = new Map();
      records.forEach((record) => officeCounts.set(record.office, (officeCounts.get(record.office) || 0) + 1));
      const notices = records.map((record) => {
        const date = dateDisplay(record);
        const range = record.dateEnd ? ' to ' + dateDisplay({ ...record, electionDate: record.dateEnd }).full : '';
        const label = officeCounts.get(record.office) > 1 ? record.jurisdiction + ': ' + record.office : record.office;
        const official = officialSources(record).sort((a, b) =>
          b.checkedAt.localeCompare(a.checkedAt) || a.label.localeCompare(b.label))[0];
        const source = official
          ? '<span class="et-country-record-source">Official link in record: <a href="' + escapeHtml(official.url) + '" rel="noopener noreferrer" target="_blank">' + escapeHtml(official.label) + '</a> · Checked ' + escapeHtml(formatDate(official.checkedAt)) + '</span>'
          : '<span class="et-country-record-source">No official link is available in this ledger.</span>';
        return [
          '<li><a href="#election-' + escapeHtml(record.id) + '" aria-label="' + escapeHtml(country.name + ': ' + label + ' — ' + date.full + ' calendar record') + '">' + escapeHtml(label) + '</a>',
          '<time datetime="' + escapeHtml(date.datetime) + '">' + escapeHtml(date.full + range) + '</time>',
          '<span>Date: ' + escapeHtml(data.dateStatusLabels[record.dateStatus]) + '</span>',
          source + '</li>'
        ].join('');
      }).join('\n');
      return [
        '<li class="et-country-file" id="country-' + country.code + '">',
        '<h3><a href="#country-' + country.code + '" data-country-code="' + country.code + '"><img class="et-country-flag" src="/assets/img/flags/afroatlas/' + country.code.toLowerCase() + '.svg" width="36" height="24" alt="" loading="lazy">' + escapeHtml(country.name) + '</a></h3>',
        '<p class="et-country-region">' + escapeHtml(country.region) + ' · ' + records.length + ' ' + (records.length === 1 ? 'election' : 'elections') + ' on file</p>',
        '<ul class="et-country-records">' + notices + '</ul>',
        '</li>'
      ].join('\n');
    }).join('\n');
}

function renderLocalizedRecord(record, copy) {
  assert(record && record.id && record.countryCode && record.office, 'Localized election snapshot record is missing identity fields');
  assert(validDate(record.electionDate), record.id + ': invalid election date');
  assert(['day', 'month', 'year'].includes(record.datePrecision), record.id + ': invalid date precision');
  assert(copy.country[record.countryCode] && copy.office[record.office] && copy.region[record.region], record.id + ': locale labels are missing');
  assert(copy.dateStatus[record.dateStatus], record.id + ': locale date-status label is missing');

  const sources = officialSources(record);
  if (record.sourceStatus === 'official') assert(sources.length, record.id + ': official record lacks an official link');
  const unconfirmed = record.dateStatus === 'tentative' || record.dateStatus === 'projected' || record.datePrecision !== 'day';
  const precision = record.datePrecision === 'year' ? 4 : unconfirmed ? 7 : 10;
  const date = record.electionDate.slice(0, precision);
  const end = record.dateEnd ? record.dateEnd.slice(0, precision) : '';
  if (record.dateEnd) assert(validDate(record.dateEnd), record.id + ': invalid date range end');
  const dateText = date + (end && end !== date ? ' – ' + end : '');
  const sourceMarkup = sources.length
    ? sources.map((source, index) => [
      '<p><span>' + escapeHtml(copy.sourceChecked) + ': <time datetime="' + escapeHtml(source.checkedAt) + '">' + escapeHtml(source.checkedAt) + '</time></span><br>',
      '<a href="' + escapeHtml(source.url) + '" rel="noopener noreferrer" target="_blank">' + escapeHtml(copy.officialLink) + ' · ' + (index + 1) + '</a></p>'
    ].join('')).join('')
    : '<p class="ed-caution">' + escapeHtml(copy.sourceUnavailable) + '</p>';

  return [
    '<article class="ed-entry" data-ed-snapshot-election-id="' + escapeHtml(record.id) + '">',
    '  <div class="ed-entry-date"><time datetime="' + escapeHtml(date) + '">' + escapeHtml(dateText) + '</time></div>',
    '  <div class="ed-entry-story">',
    '    <h3>' + escapeHtml(copy.country[record.countryCode]) + ' · ' + escapeHtml(copy.office[record.office]) + '</h3>',
    '    <p>' + escapeHtml(copy.region[record.region]) + '</p>',
    '    <span class="ed-label">' + escapeHtml(copy.dateStatus[record.dateStatus]) + '</span>',
    '  </div>',
    '  <div class="ed-entry-meta">',
    unconfirmed ? '    <p class="ed-caution">' + escapeHtml(copy.exactDayUnconfirmed) + '</p>' : '',
    sourceMarkup,
    record.sourceStatus !== 'official' ? '    <p class="ed-caution">' + escapeHtml(copy.sourceNeedsReview) + '</p>' : '',
    '  </div>',
    '</article>'
  ].filter(Boolean).join('\n');
}

function renderLocalizedSnapshot(data, locale) {
  assert(data && data.toolId === 'africa-election-tracker', 'Election tracker ledger is required');
  assert(validDate(data.generatedAt), 'Election tracker generatedAt must be a valid date');
  assert(Array.isArray(data.elections) && data.elections.length, 'Election snapshot needs published records');
  const copy = localeCopy[locale];
  assert(copy, 'Unsupported election edition locale: ' + locale);
  const records = [...data.elections].sort((a, b) =>
    String(a.electionDate || '').localeCompare(String(b.electionDate || '')) ||
    String(a.country || '').localeCompare(String(b.country || ''))
  );
  const upcoming = records.filter((record) => recordEndDate(record) >= data.generatedAt);
  const earlier = records.filter((record) => recordEndDate(record) < data.generatedAt).reverse();
  return [
    '<p class="ed-noscript" data-ed-snapshot-date="' + escapeHtml(data.generatedAt) + '">' + escapeHtml(copy.ledgerDate) + ': <time datetime="' + escapeHtml(data.generatedAt) + '">' + escapeHtml(data.generatedAt) + '</time>.</p>',
    ...[...upcoming, ...earlier].map((record) => renderLocalizedRecord(record, copy))
  ].join('\n');
}

function injectSnapshot(html, snapshot, start = START, end = END) {
  const first = html.indexOf(start);
  const last = html.indexOf(end);
  assert(first !== -1 && last > first, 'Election calendar snapshot markers are missing or reversed');
  assert(html.indexOf(start, first + start.length) === -1 && html.indexOf(end, last + end.length) === -1, 'Election calendar snapshot markers must be unique');
  const lineStart = html.lastIndexOf('\n', first) + 1;
  const endLineStart = html.lastIndexOf('\n', last) + 1;
  const indent = html.slice(lineStart, first);
  assert(/^\s*$/.test(indent) && html.slice(endLineStart, last) === indent, 'Election calendar snapshot markers must have matching indentation');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const lines = snapshot.split('\n').map((line) => indent + line).join(eol);
  return html.slice(0, lineStart) + indent + start + eol + lines + eol + indent + end + html.slice(last + end.length);
}

function injectEditionStatus(html, data, locale) {
  const open = '<p class="ed-status" data-ed-status data-ed-snapshot-status role="status" aria-live="polite">';
  const first = html.indexOf(open);
  assert(first !== -1 && html.indexOf(open, first + open.length) === -1, locale + ': snapshot status must be unique');
  const close = html.indexOf('</p>', first + open.length);
  assert(close !== -1 && !html.slice(first + open.length, close).includes('<'), locale + ': snapshot status must be plain text');
  return html.slice(0, first + open.length) + escapeHtml(localeCopy[locale].ledgerDate) + ': ' + escapeHtml(data.generatedAt) + '.' + html.slice(close);
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const targets = [
    { path: PAGE_PATH, snapshot: renderSnapshot(data), countryIndex: renderCountryIndex(data), start: START, end: END },
    ...EDITIONS.map((edition) => ({
      ...edition,
      snapshot: renderLocalizedSnapshot(data, edition.locale)
    }))
  ].map((target) => {
    const current = fs.readFileSync(target.path, 'utf8');
    const initialized = target.locale ? injectEditionStatus(current, data, target.locale) :
      injectSnapshot(current, target.countryIndex, COUNTRY_START, COUNTRY_END);
    return { ...target, current, next: injectSnapshot(initialized, target.snapshot, target.start, target.end) };
  });
  if (process.argv.includes('--check')) {
    const drifted = targets.filter((target) => target.current !== target.next);
    assert(!drifted.length, 'Election calendar snapshot has drifted in ' + drifted.map((target) => path.relative(ROOT, target.path)).join(', ') + '. Run npm run elections:calendar:build.');
  } else {
    targets.filter((target) => target.current !== target.next).forEach((target) => {
      fs.writeFileSync(target.path, target.next, 'utf8');
    });
  }
  console.log((process.argv.includes('--check') ? 'Checked' : 'Generated') + ' English, Hausa and Yoruba election calendar snapshots from ' + data.elections.length + ' ledger records.');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { escapeHtml, ledgerFingerprint, renderRecord, renderSnapshot, renderCountryIndex, renderLocalizedRecord, renderLocalizedSnapshot, injectSnapshot, injectEditionStatus, main };

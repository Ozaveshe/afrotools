'use strict';

// A readable calendar fallback is generated from the same reviewed ledger as the
// interactive tracker. Feed headlines never enter this page.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data/government/africa-election-tracker.json');
const PAGE_PATH = path.join(ROOT, 'tools/africa-election-tracker/index.html');
const START = '<!-- ELECTION_CALENDAR_SNAPSHOT_START -->';
const END = '<!-- ELECTION_CALENDAR_SNAPSHOT_END -->';
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
  if (record.datePrecision === 'month' || record.dateStatus === 'projected') {
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
  if (record.datePrecision === 'month' || record.dateStatus === 'projected') {
    const [year, month] = record.electionDate.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return record.electionDate.slice(0, 7) + '-' + String(lastDay).padStart(2, '0');
  }
  return record.electionDate;
}

function renderRecord(record, dateStatusLabels) {
  assert(record && record.id && record.country && record.office, 'Election snapshot record is missing identity fields');
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
    '<article class="et-election-card" data-snapshot-election-id="' + escapeHtml(record.id) + '">',
    '  <div class="et-election-top">',
    '    <div class="et-date-box"><time datetime="' + escapeHtml(date.datetime) + '" aria-label="' + escapeHtml(date.full + range + '; ' + dateStatus) + '"><strong>' + escapeHtml(date.large) + '</strong><span>' + escapeHtml(date.small) + '</span></time></div>',
    '    <div>',
    '      <h4 class="et-election-title">' + escapeHtml(record.country) + ': ' + escapeHtml(record.office) + '</h4>',
    '      <span class="et-pill">' + escapeHtml(sourceStatus) + '</span><span class="et-pill">Date: ' + escapeHtml(dateStatus) + '</span>',
    '      <p class="et-election-meta">' + escapeHtml([record.jurisdiction, record.region, String(record.electionType || '').replace(/-/g, ' ')].filter(Boolean).join(' / ')) + '</p>',
    '    </div>',
    '  </div>',
  '  <details class="et-record-details"><summary>Read source note and official links</summary>',
    '    <p class="et-election-note">' + escapeHtml(record.notes || '') + '</p>',
    '    <div class="et-election-bottom"><div class="et-source-links">' + sourceMarkup + '</div></div>',
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
    '<p class="et-snapshot-note" data-snapshot-date="' + escapeHtml(data.generatedAt) + '">Published ledger snapshot generated ' + escapeHtml(formatDate(data.generatedAt)) + '. Dates can change. Each record links its available official notices; live filters load with JavaScript.</p>',
    ...(upcoming.length ? ['<h3 class="et-snapshot-heading">Upcoming as of ' + escapeHtml(formatDate(data.generatedAt)) + '</h3>'] : []),
    ...upcoming.map((record) => renderRecord(record, data.dateStatusLabels)),
    ...(earlier.length ? ['<h3 class="et-snapshot-heading">Earlier records</h3>'] : []),
    ...earlier.map((record) => renderRecord(record, data.dateStatusLabels))
  ].join('\n');
}

function injectSnapshot(html, snapshot) {
  const first = html.indexOf(START);
  const last = html.indexOf(END);
  assert(first !== -1 && last > first, 'Election calendar snapshot markers are missing or reversed');
  assert(html.indexOf(START, first + START.length) === -1 && html.indexOf(END, last + END.length) === -1, 'Election calendar snapshot markers must be unique');
  const lineStart = html.lastIndexOf('\n', first) + 1;
  const endLineStart = html.lastIndexOf('\n', last) + 1;
  const indent = html.slice(lineStart, first);
  assert(/^\s*$/.test(indent) && html.slice(endLineStart, last) === indent, 'Election calendar snapshot markers must have matching indentation');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const lines = snapshot.split('\n').map((line) => indent + line).join(eol);
  return html.slice(0, lineStart) + indent + START + eol + lines + eol + indent + END + html.slice(last + END.length);
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const current = fs.readFileSync(PAGE_PATH, 'utf8');
  const next = injectSnapshot(current, renderSnapshot(data));
  if (process.argv.includes('--check')) {
    assert(current === next, 'Election calendar snapshot has drifted. Run npm run elections:calendar:build.');
  } else if (current !== next) {
    fs.writeFileSync(PAGE_PATH, next, 'utf8');
  }
  console.log((process.argv.includes('--check') ? 'Checked' : 'Generated') + ' election calendar snapshot from ' + data.elections.length + ' ledger records.');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { escapeHtml, renderRecord, renderSnapshot, injectSnapshot, main };

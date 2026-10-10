const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');

// Decode fields independently of the serializers, including quoted newlines.
function csvRows(text) {
  const rows = []; let row = [], value = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; }
      else { assert(quoted || value === '', 'Quote must start a field'); quoted = !quoted; }
    } else if (!quoted && ch === ',') { row.push(value); value = ''; }
    else if (!quoted && (ch === '\r' || ch === '\n')) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); rows.push(row); row = []; value = '';
    } else value += ch;
  }
  assert.equal(quoted, false, 'CSV quote must close');
  if (row.length || value) { row.push(value); rows.push(row); }
  return rows;
}

function load(relative) {
  const context = { window: {}, Blob };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), context);
  return context.window.AfroTools;
}

const engines = [
  { name: 'schedule', file: 'creator-schedule-engine.js', key: 'CreatorScheduleEngine', column: 0, columns: 5,
    record: text => ({ title: text, platform: 'youtube', scheduledAt: '2026-10-09T09:00', status: 'planned', note: 'Synthetic note' }) },
  { name: 'team', file: 'creator-team-engine.js', key: 'CreatorTeamEngine', column: 1, columns: 6,
    record: text => ({ project: 'Synthetic project', title: text, owner: 'Synthetic owner', status: 'review', dueDate: '2026-10-09', note: 'Synthetic note' }) },
  { name: 'stock', file: 'creator-stock-engine.js', key: 'CreatorStockEngine', column: 0, columns: 7,
    record: text => ({ title: text, sourceUrl: 'https://example.com/synthetic', creator: 'Synthetic owner', license: 'Synthetic license', usage: 'Test only', checkedOn: '2026-10-09', note: 'Synthetic note' }) },
  { name: 'analytics', file: 'creator-analytics-engine.js', key: null, column: 3, columns: 13,
    record: text => ({ id: 'synthetic', date: '2026-10-09', platform: 'youtube', format: 'video', label: text, impressions: 200, reach: 100, likes: 10, comments: 2, shares: 1, saves: 1, followers: 3 }) }
];

const risky = ['=1+1', '+1+1', '-1+1', '@SUM(1,1)', '＝1+1', '＋1+1', '－1+1', '＠SUM(1,1)', '=1;2', '=1,"quoted"\nnext'];
// Analytics has always normalized labels to one line before serialization.
const exportedLabel = (spec, text) => spec.name === 'analytics' ? text.replace(/\s+/g, ' ').trim() : text;
for (const spec of engines) {
  const loaded = load('engines/src/' + spec.file);
  const engine = spec.key ? loaded[spec.key] : loaded.engines.creatorAnalytics;
  test(spec.name + ' CSV preserves structure and prefixes formula-like text without mutating JSON data', () => {
    for (const text of risky) {
      const records = [spec.record(text), spec.record('Ordinary second row')];
      const before = JSON.stringify(records);
      const rows = csvRows(engine.toCsv(records));
      assert.equal(rows.length, 3);
      for (const row of rows) assert.equal(row.length, spec.columns);
      assert.equal(rows[1][spec.column], "'" + exportedLabel(spec, text));
      assert.equal(rows[2][spec.column], 'Ordinary second row');
      assert.equal(JSON.stringify(records), before);
    }
  });
  test(spec.name + ' CSV retains ordinary text and existing label normalization', () => {
    for (const text of ['Ordinary', 'Café – mfano', 'A;B', 'Text, "quoted"\nsecond line', "O'Brien"] ) {
      const record = spec.record(text), before = JSON.stringify(record);
      const rows = csvRows(engine.toCsv([record]));
      assert.equal(rows.length, 2); assert.equal(rows[1].length, spec.columns);
      assert.equal(rows[1][spec.column], exportedLabel(spec, text));
      assert.equal(JSON.stringify(record), before);
    }
  });
}

function sharedExport() {
  let captured;
  const context = { window: {}, Blob,
    URL: { createObjectURL(blob) { captured = blob; return 'blob:synthetic'; }, revokeObjectURL() {} },
    document: { body: { appendChild() {} }, createElement() { return { click() {}, remove() {} }; } }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/lib/export-tools.js'), 'utf8'), context);
  return { api: context.window.AfroExport, text: () => captured.text() };
}

test('shared CSV protects text headers and cells while retaining signed numeric values', async () => {
  const shared = sharedExport();
  const records = [{ '=header': '=1+1', positive: 12, negative: -12.5, zero: 0, textNumber: '-12.5' }];
  const before = JSON.stringify(records);
  shared.api.csv(records, 'synthetic.csv');
  const rows = csvRows(await shared.text());
  assert.deepEqual(rows, [["'=header", 'positive', 'negative', 'zero', 'textNumber'], ["'=1+1", '12', '-12.5', '0', "'-12.5"]]);
  assert.equal(JSON.stringify(records), before);
});

test('shared CSV preserves literal control-prefixed text and does not split quoted fields', async () => {
  for (const text of [...risky, '\ttext', '\rtext', '\ntext', '  =1+1', '\u0000=1+1']) {
    const shared = sharedExport(); shared.api.csv([{ value: text, other: 'End' }], 'synthetic.csv');
    assert.deepEqual(csvRows(await shared.text()), [['value', 'other'], ["'" + text, 'End']]);
  }
});

test('shared CSV retains normal text and its existing NFC normalization', async () => {
  const shared = sharedExport(); shared.api.csv([{ value: 'Cafe\u0301, "quoted"\nnext', other: null }], 'synthetic.csv');
  assert.deepEqual(csvRows(await shared.text()), [['value', 'other'], ['Café, "quoted"\nnext', '']]);
});

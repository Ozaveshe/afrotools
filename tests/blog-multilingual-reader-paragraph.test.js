'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const owner = 'scripts/build-blog-multilingual-wave2-2026-08.js';
const dataFile = 'data/content/blog-multilingual-wave2-2026-08.json';
const data = JSON.parse(fs.readFileSync(path.join(root, dataFile), 'utf8'));
const targets = data.topics.map((topic) => `sw/blogu/${topic.locales.sw.slug}/index.html`);
const legacy = '<p>Fungua tena kila faili uliyopakua na rudia hesabu muhimu kwa njia tofauti. Kagua labels, units, mpangilio wa kurasa, tarehe, alama, rounding na sehemu ya kuwasilisha. hakikisho la awali au pakua iliyofanikiwa inaonyesha hatua imekamilika tu, si kwamba matokeo yamekubaliwa au yanafaa.</p>';
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
const body = (html) => html.match(/<article class="article-body">([\s\S]*?)<\/article>/)[1];

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afro-reader-test-'));
  t.after(() => {
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('afro-reader-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const write = (file, text) => {
    const target = path.join(dir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  };
  for (const file of [owner, dataFile, 'blog/assets/js/blog-reading.js', 'assets/js/lazy-analytics.js']) {
    write(file, fs.readFileSync(path.join(root, file)));
  }
  for (const file of targets) {
    let html = fs.readFileSync(path.join(root, file), 'utf8');
    const paragraphs = html.match(/<p>Fungua tena kila faili uliyopakua[^<]*<\/p>/g) || [];
    assert.equal(paragraphs.length, 1);
    html = html.replace(paragraphs[0], legacy);
    html = html.replace(/"wordCount":\d+/, '"wordCount":' + words(body(html)));
    // Persistent presentation/runtime content must survive the scoped owner.
    html = html.replace('</head>', '<meta name="test-outer-sentinel" content="preserve:byline-image-cache-analytics">\r\n</head>');
    write(file, html);
  }
  const sentinels = ['blog/index.html', 'fr/blog/index.html', 'sw/blogu/index.html', 'data/localization/fr-blog-manifest.json', 'reports/blog-multilingual-wave2-2026-08.md'];
  for (const file of sentinels) write(file, 'NOT A GENERATOR INPUT: ' + file);
  const snapshot = () => Object.fromEntries([...targets, ...sentinels].map((file) => [file, fs.readFileSync(path.join(dir, file), 'utf8')]));
  const run = (...args) => spawnSync(process.execPath, [path.join(dir, owner), '--reader-paragraph-only', ...args], { cwd: dir, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  return { dir, write, snapshot, run, sentinels };
}

test('scoped CLI preserves complete documents, recomputes count, and is idempotent', (t) => {
  const f = fixture(t), before = f.snapshot();
  const pending = f.run();
  assert.equal(pending.status, 1, pending.stderr);
  assert.match(pending.stdout, /10 file\(s\) out of date/);
  assert.deepEqual(f.snapshot(), before);
  const first = f.run('--write');
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /10 file\(s\) updated/);
  const after = f.snapshot();
  for (const file of targets) {
    const paragraph = after[file].match(/<p>Fungua tena kila faili uliyopakua[^<]*<\/p>/g);
    assert.equal(paragraph.length, 1);
    assert.doesNotMatch(paragraph[0], /\b(?:labels|units|rounding|download|Preview)\b/);
    const count = Number(after[file].match(/"wordCount":(\d+)/)[1]);
    assert.equal(count, words(body(after[file])));
    assert.equal(after[file].replace(paragraph[0], legacy).replace('"wordCount":' + count, '"wordCount":' + words(body(before[file]))), before[file]);
  }
  for (const file of f.sentinels) assert.equal(after[file], before[file]);
  const again = f.run('--write');
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /0 file\(s\) updated/);
  assert.deepEqual(f.snapshot(), after);
  assert.equal(f.run().status, 0);
});

const corruptions = [
  ['unknown paragraph', (html) => html.replace('Kagua labels, units,', 'Unexpected editorial revision,')],
  ['duplicate paragraph', (html) => html.replace(legacy, legacy + legacy)],
  ['wrong language', (html) => html.replace('lang="sw"', 'lang="en"')],
  ['wrong owner', (html) => html.replace('content="scripts/build-blog-multilingual-wave2-2026-08.js"', 'content="different-owner.js"')],
  ['wrong canonical', (html) => html.replace(/(<link rel="canonical" href=")[^"]+/, '$1https://afrotools.com/wrong/')],
  ['duplicate Article', (html) => html.replace('</head>', html.match(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"Article"[\s\S]*?<\/script>/)[0] + '</head>')],
  ['duplicate count', (html) => html.replace('"wordCount":', '"wordCount":1,"wordCount":')],
  ['stale count', (html) => html.replace(/"wordCount":\d+/, '"wordCount":1')],
  ['wrong schema language', (html) => html.replace('"inLanguage":"sw"', '"inLanguage":"fr"')],
  ['paragraph outside details', (html) => html.replace(legacy, '').replace('</article>', legacy + '</article>')]
];
for (const [name, mutate] of corruptions) {
  test('invalid last document prevents every write: ' + name, (t) => {
    const f = fixture(t), last = targets[targets.length - 1];
    f.write(last, mutate(f.snapshot()[last]));
    const before = f.snapshot(), result = f.run('--write');
    assert.notEqual(result.status, 0);
    assert.deepEqual(f.snapshot(), before);
  });
}

test('missing final target fails before writing the first nine', (t) => {
  const f = fixture(t), before = f.snapshot(), last = targets[targets.length - 1];
  fs.unlinkSync(path.join(f.dir, last));
  const result = f.run('--write');
  assert.notEqual(result.status, 0);
  for (const file of targets.slice(0, -1)) assert.equal(fs.readFileSync(path.join(f.dir, file), 'utf8'), before[file]);
});

test('duplicate source-derived targets fail before any mutation', (t) => {
  const f = fixture(t), duplicate = JSON.parse(JSON.stringify(data));
  duplicate.topics[duplicate.topics.length - 1].locales.sw.slug = duplicate.topics[0].locales.sw.slug;
  f.write(dataFile, JSON.stringify(duplicate));
  const before = f.snapshot(), result = f.run('--write');
  assert.notEqual(result.status, 0);
  assert.deepEqual(f.snapshot(), before);
});

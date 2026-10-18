'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// Exercise the actual CLI in an isolated repository-shaped fixture. Never run
// --write on the checked-out article collection as part of this test.
function assertPublicationStatusLifecycle() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-blog-status-'));
  try {
    const owner = path.join(temporary, 'scripts/build-blog-content-manifest.js');
    fs.mkdirSync(path.dirname(owner), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'scripts/build-blog-content-manifest.js'), owner);
    const rows = [
      { contentId: 'preserved-french-id', file: 'fr/blog/fallback/index.html', slug: 'fallback', locale: 'fr', category: 'Preserved', publicationStatus: 'published', extra: { keep: true } },
      { contentId: 'preserved-redirect-id', file: 'blog/redirect/index.html', slug: 'redirect', locale: 'en', category: 'Preserved', publicationStatus: 'published' },
      { contentId: 'preserved-article-id', file: 'blog/article/index.html', slug: 'article', locale: 'en', category: 'Preserved', publicationStatus: 'unpublished' }
    ];
    const original = { schemaVersion: 1, generatedAt: 'keep-this-date', extra: 'keep-this-field', articles: rows };
    const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
    const manifestFile = path.join(temporary, 'data/content/blog-article-manifest.json');
    fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
    fs.writeFileSync(manifestFile, serialize(original));
    const pages = new Map();
    for (const row of rows) {
      const noindex = row.slug === 'article' ? '' : '<meta name="robots" content="noindex, follow">';
      const html = `<html lang="${row.locale}"><head><meta name="content-language" content="${row.locale}"><meta name="afrotools-content-id" content="${row.contentId}">${noindex}</head><body>${row.slug}</body></html>`;
      pages.set(row.file, html);
      fs.mkdirSync(path.dirname(path.join(temporary, row.file)), { recursive: true });
      fs.writeFileSync(path.join(temporary, row.file), html);
    }
    const listings = {
      'blog/index.html': '<html lang="en"><head><meta name="content-language" content="en"></head><body><strong id="statArticles">1</strong><article data-locale="en" class="article-card"><a href="/blog/article/">Article</a></article></body></html>',
      'fr/blog/index.html': '<html lang="fr"><head><meta name="content-language" content="fr"></head><body><a href="/fr/blog/fallback/">Fallback</a></body></html>'
    };
    for (const [file, html] of Object.entries(listings)) fs.writeFileSync(path.join(temporary, file), html);
    const run = (mode) => spawnSync(process.execPath, [owner, mode], { encoding: 'utf8', timeout: 10000, env: { ...process.env, NODE_OPTIONS: '' } });
    const checked = run('--check');
    assert.notStrictEqual(checked.status, 0, 'check must reject stale publication statuses');
    assert.match(checked.stderr, /manifest publicationStatus published does not match html status unpublished/);
    assert.match(checked.stderr, /manifest publicationStatus unpublished does not match html status published/);
    assert.strictEqual(fs.readFileSync(manifestFile, 'utf8'), serialize(original), 'check is read-only');
    const written = run('--write');
    assert.strictEqual(written.status, 0, written.stderr);
    const expected = JSON.parse(serialize(original));
    expected.articles[0].publicationStatus = 'unpublished';
    expected.articles[1].publicationStatus = 'unpublished';
    expected.articles[2].publicationStatus = 'published';
    const reconciled = fs.readFileSync(manifestFile, 'utf8');
    assert.strictEqual(reconciled, serialize(expected), 'write changes only existing row statuses, retaining IDs, order, date and extra fields');
    for (const [file, html] of [...pages, ...Object.entries(listings)]) assert.strictEqual(fs.readFileSync(path.join(temporary, file), 'utf8'), html, `${file} remains byte-identical`);
    assert.strictEqual(run('--check').status, 0, 'reconciled check passes');
    assert.strictEqual(run('--write').status, 0, 'second write passes');
    assert.strictEqual(fs.readFileSync(manifestFile, 'utf8'), reconciled, 'write is idempotent');

    function refusesWithoutManifestWrite(label, mutate, diagnostic) {
      const broken = JSON.parse(serialize(original));
      mutate(broken);
      const before = serialize(broken);
      fs.writeFileSync(manifestFile, before);
      const result = run('--write');
      assert.notStrictEqual(result.status, 0, label);
      assert.match(result.stderr, diagnostic, label);
      assert.strictEqual(fs.readFileSync(manifestFile, 'utf8'), before, `${label}: no manifest write`);
    }
    refusesWithoutManifestWrite('locale mismatch', (value) => { value.articles[0].locale = 'en'; }, /manifest locale en does not match html lang fr/);
    refusesWithoutManifestWrite('missing record', (value) => { value.articles.splice(0, 1); }, /missing manifest record/);
    refusesWithoutManifestWrite('missing source', (value) => { value.articles.push({ ...rows[0], file: 'fr/blog/missing/index.html' }); }, /manifest source is missing/);
    refusesWithoutManifestWrite('invalid schema', (value) => { value.schemaVersion = 2; }, /schemaVersion 1/);
    fs.writeFileSync(path.join(temporary, 'fr/blog/index.html'), listings['fr/blog/index.html'].replace('/fr/blog/fallback/', '/fr/blog/absent/'));
    refusesWithoutManifestWrite('invalid locale listing', () => {}, /has no explicit locale record/);
    // Both listings must pass before a proposed English noindex-card removal
    // reaches disk. A failed French preflight must leave every file untouched.
    fs.writeFileSync(manifestFile, serialize(original));
    fs.writeFileSync(path.join(temporary, 'blog/index.html'), listings['blog/index.html'].replace('</body>', '<article data-locale="en" class="article-card"><a href="/blog/redirect/">Retired</a></article></body>'));
    const beforeRejectedWrite = new Map();
    function snapshot(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) snapshot(file);
        else beforeRejectedWrite.set(file, fs.readFileSync(file));
      }
    }
    snapshot(temporary);
    const rejectedWrite = run('--write');
    assert.notStrictEqual(rejectedWrite.status, 0, 'invalid French listing rejects English card removal');
    assert.match(rejectedWrite.stderr, /has no explicit locale record/);
    for (const [file, before] of beforeRejectedWrite) assert.deepStrictEqual(fs.readFileSync(file), before, `${path.relative(temporary, file)} unchanged after rejected write`);
    console.log('Blog publication status lifecycle passed (check/write/idempotence, 5 invalid-input guards and all-file listing preflight).');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

assertPublicationStatusLifecycle();
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/content/blog-article-manifest.json'), 'utf8'));
assert.strictEqual(manifest.schemaVersion, 1);
assert.ok(manifest.articles.length > 300);

const ids = new Set();
const byFile = new Map();
for (const row of manifest.articles) {
  assert.ok(!ids.has(row.contentId), `duplicate content id ${row.contentId}`);
  ids.add(row.contentId);
  byFile.set(row.file, row);
  const html = fs.readFileSync(path.join(ROOT, row.file), 'utf8');
  assert.match(html, new RegExp(`<meta\\s+name=["']content-language["']\\s+content=["']${row.locale}["']`, 'i'), `${row.file} content-language`);
  assert.ok(html.includes(`name="afrotools-content-id" content="${row.contentId}"`), `${row.file} stable content id`);
}

function assertListing(file, locale, prefix) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.ok(html.includes(`name="content-language" content="${locale}"`), `${file} explicit locale metadata`);
  const cards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*article-card[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)];
  assert.ok(cards.length > 0, `${file} article cards`);
  for (const card of cards) {
    assert.ok(new RegExp(`data-locale=["']${locale}["']`, 'i').test(card[0]), `${file} card locale`);
    const link = card[0].match(new RegExp(`href=["']${prefix.replace(/\//g, '\\/')}([^/"'#?]+)\\/?["']`, 'i'));
    if (!link) continue;
    const source = `${prefix.slice(1)}${link[1]}/index.html`;
    assert.strictEqual(byFile.get(source)?.locale, locale, `${file} must not mix ${source}`);
  }
}

assertListing('blog/index.html', 'en', '/blog/');
assertListing('fr/blog/index.html', 'fr', '/fr/blog/');

const feed = fs.readFileSync(path.join(ROOT, 'blog/feed.xml'), 'utf8');
const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)];
assert.ok(items.length > 0);
for (const item of items) {
  assert.ok(item[0].includes('<dc:language>en</dc:language>'));
  assert.ok(!item[0].includes('https://afrotools.com/fr/blog/'));
}

console.log(`Blog locale manifest tests passed (${manifest.articles.length} sources, ${items.length} feed items).`);

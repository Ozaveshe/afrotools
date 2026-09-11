'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildPublications } = require('../scripts/lib/jamb-publication');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages');
const { audit } = require('../scripts/audit-jamb-publication');
const { sitemap } = require('../scripts/build-jamb-sitemap');

test('artifact audit rejects an exposed ledger, changed public data and indexed review notices', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'jamb-publication-fixture-'));
  const root = path.join(parent, 'source'); const target = path.join(parent, 'dist');
  const write = (base, file, value) => {
    const full = path.join(base, file); fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof value === 'string' ? value : JSON.stringify(value));
  };
  const pool = { questions: [] }; const cards = { decks: [] }; const ledger = { schema_version: 1, questions: {}, sources: {} };
  const built = buildPublications(pool, cards, ledger);
  try {
    write(root, 'ops/jamb/source-pool.json', pool); write(root, 'ops/jamb/source-flashcards.json', cards);
    write(root, 'data/jamb/review-ledger.json', ledger);
    const page = renderYear('mathematics', 1987, [], ledger);
    write(root, 'jamb/mathematics/1987/index.html', page.html);
    write(target, 'jamb/mathematics/1987/index.html', page.html);
    for (const [file, payload] of Object.entries(built.files)) write(target, 'data/jamb/' + file, payload);
    write(target, 'jamb/sitemap.xml', sitemap(root));
    assert.doesNotThrow(() => audit(target, root));
    assert.doesNotMatch(sitemap(root), /<loc>/);
    write(target, 'data/jamb/review-ledger.json', ledger);
    assert.throws(() => audit(target, root), /Unapproved JAMB file/);
    fs.unlinkSync(path.join(target, 'data/jamb/review-ledger.json'));
    write(target, 'data/jamb/pools/practice-pool.json', { questions: [{ question: 'Unreviewed material' }] });
    assert.throws(() => audit(target, root), /publication/);
    write(target, 'data/jamb/pools/practice-pool.json', built.files['pools/practice-pool.json']);
    write(target, 'jamb/sitemap.xml', '<urlset><url><loc>https://afrotools.com/jamb/mathematics/1987/</loc></url></urlset>');
    assert.throws(() => audit(target, root), /Unreviewed paper remains/);
    write(target, 'jamb/sitemap.xml', sitemap(root));
    write(target, 'jamb/mathematics/1987/index.html', page.html.slice(0, -50));
    assert.throws(() => audit(target, root), /Incomplete|Truncated/);
  } finally {
    // Delete only this test's verified temporary directory, entirely in Node.
    const resolved = path.resolve(parent);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('jamb-publication-fixture-')) throw new Error('Unsafe fixture cleanup');
    fs.rmSync(resolved, { recursive: true });
  }
});

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const routes = ['fr/cape-verde/cv-paye', 'fr/cape-verde/cv-vat', 'fr/eq-guinea/gq-paye', 'fr/eq-guinea/gq-vat'];

test('deploy keeps native French calculator directories and legacy aliases without shadowing wrappers', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-fr-route-shape-'));
  const modules = path.join(root, 'node_modules');
  const write = (file, data) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data); };
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert(path.basename(resolved).startsWith('afrotools-fr-route-shape-'));
    if (fs.existsSync(modules)) { assert(fs.lstatSync(modules).isSymbolicLink()); fs.unlinkSync(modules); }
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  for (const file of ['scripts/build-dist.js', 'scripts/lib/css-minification.js', 'assets/js/lib/product-health.js', 'assets/js/components/analytics-consent-v2.js', 'assets/js/pwa-install.js', 'assets/js/lazy-analytics.js']) write(file, fs.readFileSync(path.join(ROOT, file)));
  // Independent expected publish delta: exactly these three root attributes.
  // Do not call the stamper under test or strip matches from the whole document.
  const publishAttributes = [
    ['consent', 'assets/js/components/analytics-consent-v2.js'],
    ['pwa', 'assets/js/pwa-install.js'],
    ['analytics', 'assets/js/lazy-analytics.js']
  ].map(([name, file]) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
    return ' data-afro-' + name + '-version="' + crypto.createHash('md5').update(source).digest('hex').slice(0, 8) + '"';
  }).join('');
  const expectedPublished = bytes => {
    const source = bytes.toString('utf8');
    const opening = /<html\b[^>]*>/i.exec(source);
    assert(opening, 'real French fixture has an explicit root');
    assert(!opening[0].includes('data-afro-'), 'fixture source has no publish-owned metadata');
    const insertion = opening.index + opening[0].length - 1;
    return Buffer.from(source.slice(0, insertion) + publishAttributes + source.slice(insertion), 'utf8');
  };
  fs.symlinkSync(path.join(ROOT, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
  const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
  write('_redirects', redirects);
  write('_headers', '/*\n  X-Content-Type-Options: nosniff\n');
  write('index.html', '<h1>Synthetic root</h1>');
  write('404.html', '<h1>Missing</h1>');
  write('tools/synthetic/index.html', '<h1>Synthetic tool</h1>');
  const preserved = new Map();
  for (const route of routes) {
    for (const suffix of ['.html', '/index.html']) {
      const file = route + suffix;
      const bytes = fs.readFileSync(path.join(ROOT, file));
      preserved.set(file, bytes); write(file, bytes);
    }
    assert(redirects.split(/\r?\n/).some(line => line.trim().replace(/\s+/g, ' ') === '/' + route + '.html /' + route + '/ 301!'), 'legacy .html alias retained: ' + route);
  }
  // This healthy alias has a different final basename and must remain deployable.
  for (const file of ['fr/cote-divoire/ci-paye.html', 'fr/cote-divoire/ci-paye/index.html', 'fr/cote-divoire/calculateur-salaire-net.html']) {
    const bytes = fs.readFileSync(path.join(ROOT, file)); preserved.set(file, bytes); write(file, bytes);
  }
  execFileSync(process.execPath, [path.join(root, 'scripts/build-dist.js')], { cwd: root, encoding: 'utf8', env: { ...process.env, NETLIFY: 'false', CONTEXT: 'local', COMMIT_REF: '' } });
  for (const route of routes) {
    assert.equal(fs.existsSync(path.join(root, 'dist', route + '.html')), false, 'shadowing wrapper: ' + route);
    assert.deepEqual(fs.readFileSync(path.join(root, 'dist', route + '/index.html')), expectedPublished(preserved.get(route + '/index.html')), 'native calculator bytes plus exact root metadata: ' + route);
  }
  for (const [file, bytes] of preserved) {
    assert.deepEqual(fs.readFileSync(path.join(root, file)), bytes, 'source preserved: ' + file);
    if (file.startsWith('fr/cote-divoire/')) assert.deepEqual(fs.readFileSync(path.join(root, 'dist', file)), expectedPublished(bytes), 'healthy alias bytes plus exact root metadata: ' + file);
  }
  assert.equal(fs.readFileSync(path.join(root, 'dist/_redirects'), 'utf8'), redirects);
});

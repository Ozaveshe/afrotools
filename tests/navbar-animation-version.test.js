'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const ROOT = path.resolve(__dirname, '..');

function fixture(t) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-animation-version-'));
  for (const relative of ['scripts/build-navbar-data.js', 'scripts/lib/safe-write.js', 'assets/js/components/navbar.js', 'assets/css/navbar.css', 'data/navigation/navbar-data.json']) {
    const target = path.join(tempRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), target);
  }
  const animationPath = path.join(tempRoot, 'assets/js/animations.js');
  const navbarPath = path.join(tempRoot, 'assets/js/components/navbar.js');
  const run = () => execFileSync(process.execPath, [path.join(tempRoot, 'scripts/build-navbar-data.js')], { encoding: 'utf8', stdio: 'pipe' });
  const href = () => fs.readFileSync(navbarPath, 'utf8').match(/const ANIMATIONS_JS_HREF = '([^']+)'/)[1];
  t.after(() => {
    const resolved = fs.realpathSync(tempRoot);
    assert.equal(resolved, path.resolve(tempRoot));
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert.ok(path.basename(resolved).startsWith('afrotools-animation-version-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { animationPath, navbarPath, run, href };
}

test('the existing navbar owner changes the animation URL when its bytes change and is otherwise idempotent', t => {
  const f = fixture(t);
  fs.writeFileSync(f.animationPath, 'window.animationVersion = 1;\n');
  f.run(); const first = f.href();
  assert.match(first, /^\/assets\/js\/animations\.js\?v=[a-f0-9]{8}$/);
  const firstNavbar = fs.readFileSync(f.navbarPath);
  f.run(); assert.deepEqual(fs.readFileSync(f.navbarPath), firstNavbar);
  fs.writeFileSync(f.animationPath, 'window.animationVersion = 2;\n');
  f.run(); assert.notEqual(f.href(), first);
  const second = f.href();
  fs.writeFileSync(f.animationPath, 'window.animationVersion = 2;\r\n');
  f.run(); assert.equal(f.href(), second, 'Windows line endings must not create spurious asset versions');
});

test('a missing animation source fails the build instead of retaining a stale navbar URL', t => {
  const f = fixture(t);
  const before = fs.readFileSync(f.navbarPath);
  assert.throws(f.run, /animations\.js/);
  assert.deepEqual(fs.readFileSync(f.navbarPath), before);
});

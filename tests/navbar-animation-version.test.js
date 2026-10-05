'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const crypto = require('node:crypto');
const { parse, toPlainObject } = require('css-tree');
const ROOT = path.resolve(__dirname, '..');

function fixture(t) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-animation-version-'));
  for (const relative of ['scripts/build-navbar-data.js', 'scripts/lib/safe-write.js', 'scripts/lib/css-minification.js', 'assets/js/components/navbar.js', 'assets/css/navbar.css', 'data/navigation/navbar-data.json']) {
    const target = path.join(tempRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relative), target);
  }
  const animationPath = path.join(tempRoot, 'assets/js/animations.js');
  const modules = path.join(tempRoot, 'node_modules');
  fs.symlinkSync(path.join(ROOT, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
  const navbarPath = path.join(tempRoot, 'assets/js/components/navbar.js');
  const run = () => execFileSync(process.execPath, [path.join(tempRoot, 'scripts/build-navbar-data.js')], { encoding: 'utf8', stdio: 'pipe' });
  const href = () => fs.readFileSync(navbarPath, 'utf8').match(/const ANIMATIONS_JS_HREF = '([^']+)'/)[1];
  t.after(() => {
    const resolved = fs.realpathSync(tempRoot);
    assert.equal(resolved, path.resolve(tempRoot));
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert.ok(path.basename(resolved).startsWith('afrotools-animation-version-'));
    assert(fs.lstatSync(modules).isSymbolicLink());
    fs.unlinkSync(modules);
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { animationPath, navbarPath, run, href, root: tempRoot };
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

test('navbar shadow CSS preserves parsed rules and versions the generated stylesheet', t => {
  const f = fixture(t);
  fs.writeFileSync(f.animationPath, 'window.animationVersion = 1;\n');
  f.run();
  const source = fs.readFileSync(path.join(f.root, 'assets/css/navbar.css'), 'utf8');
  const output = fs.readFileSync(path.join(f.root, 'assets/css/navbar.min.css'), 'utf8');
  assert.deepEqual(toPlainObject(parse(output, { parseCustomProperty: false })), toPlainObject(parse(source, { parseCustomProperty: false })));
  const hash = crypto.createHash('md5').update(output.replace(/\r\n?/g, '\n')).digest('hex').slice(0, 8);
  assert(fs.readFileSync(f.navbarPath, 'utf8').includes('/assets/css/navbar.min.css?v=' + hash));
});

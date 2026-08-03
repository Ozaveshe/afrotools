'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'build-en-fr-ui-polish-inventory.js');

test('visible markup is audited without counting script-template noise', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-ui-polish-'));

  try {
    const registryDirectory = path.join(root, 'assets', 'js', 'components');
    const routeDirectory = path.join(root, 'tools', 'fixture');
    fs.mkdirSync(registryDirectory, { recursive: true });
    fs.mkdirSync(routeDirectory, { recursive: true });
    fs.mkdirSync(path.join(root, 'assets', 'css'), { recursive: true });
    fs.writeFileSync(
      path.join(registryDirectory, 'tool-registry.js'),
      "var AFRO_TOOLS = [{ id: 'fixture', lang: 'en', href: '/tools/fixture/' }];\n",
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, 'index.html'),
      '<!doctype html><html><head><link rel="stylesheet" href="assets/css/home.css"></head><body><main class="home-card">Home</main></body></html>',
      'utf8'
    );
    fs.writeFileSync(path.join(root, 'assets', 'css', 'home.css'), '.home{color:#172033}\n', 'utf8');
    fs.writeFileSync(
      path.join(routeDirectory, 'index.html'),
      [
        '<!doctype html><html><head>',
        '<style>.surface{background:linear-gradient(#fff,#eee)}</style>',
        '<script>const template = \'<div class="script-card badge">unlock 🚀</div>\';</script>',
        '</head><body>',
        '<main><section class="real-card"><p>Use the calculator.</p></section></main>',
        '</body></html>'
      ].join(''),
      'utf8'
    );

    const report = JSON.parse(execFileSync(
      process.execPath,
      [SCRIPT, '--root', root, '--json'],
      { encoding: 'utf8' }
    ));
    const fixture = report.candidates.find((candidate) => candidate.file === 'tools/fixture/index.html');
    const homepage = report.candidates.find((candidate) => candidate.file === 'index.html');

    assert.ok(fixture);
    assert.equal(fixture.signals.cardClass, 1);
    assert.equal(fixture.signals.badgeClass, 0);
    assert.equal(fixture.signals.gradient, 1);
    assert.equal(fixture.signals.genericCopy, 0);
    assert.equal(fixture.signals.decorativeEmoji, 0);
    assert.ok(homepage);
    assert.deepEqual(homepage.sourceHints, ['/assets/css/home.css']);
    assert.equal(report.summary.en.topLevelHubCandidates, 1);

    const output = path.join(root, 'reports', 'ui-polish.json');
    execFileSync(process.execPath, [SCRIPT, '--root', root, '--output', output, '--write']);
    execFileSync(process.execPath, [SCRIPT, '--root', root, '--output', output, '--check']);
    const written = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(Object.hasOwn(written, 'commit'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

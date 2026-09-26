const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { writeReleaseMetadata } = require('../scripts/build-dist');

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-function-release-'));
const functionDir = path.join(fixture, 'functions');
const distDir = path.join(fixture, 'dist');
const keys = ['NETLIFY', 'CONTEXT', 'COMMIT_REF'];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
try {
  process.env.NETLIFY = 'true';
  process.env.CONTEXT = 'production';
  process.env.COMMIT_REF = 'a'.repeat(40);
  writeReleaseMetadata({ distDir, functionDir });
  const publicPath = path.join(distDir, 'status/release.json');
  const generatedPath = path.join(functionDir, 'generated-release.json');
  assert.equal(fs.readFileSync(publicPath, 'utf8'), fs.readFileSync(generatedPath, 'utf8'));
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(generatedPath, 'utf8'))).sort(), ['built_at', 'commit', 'context', 'production', 'schema_version']);
  fs.copyFileSync(path.join(__dirname, '../netlify/functions/_shared/function-release.js'), path.join(functionDir, 'function-release.js'));
  delete process.env.COMMIT_REF;
  const reader = require(path.join(functionDir, 'function-release.js'));
  assert.equal(reader.getFunctionReleaseMetadata().commit, 'a'.repeat(40), 'runtime proof must work without build environment');
  process.env.COMMIT_REF = 'b'.repeat(40);
  assert.equal(reader.getFunctionReleaseMetadata().commit, 'a'.repeat(40), 'runtime environment must not replace bundled identity');
  for (const value of ['', 'not-a-sha', 'a'.repeat(7)]) {
    process.env.COMMIT_REF = value;
    assert.throws(() => writeReleaseMetadata({ distDir, functionDir }), /full build commit SHA/);
  }
  delete process.env.NETLIFY;
  delete process.env.CONTEXT;
  delete process.env.COMMIT_REF;
  writeReleaseMetadata({ distDir, functionDir });
  delete require.cache[require.resolve(generatedPath)];
  assert.equal(reader.getFunctionReleaseMetadata().commit, null, 'local build must overwrite a previous production stamp');
  delete require.cache[require.resolve(generatedPath)];
  fs.unlinkSync(generatedPath);
  assert.equal(reader.getFunctionReleaseMetadata().commit, null, 'missing local artifact is explicit unknown identity');
  console.log('Function release metadata: PASS (build/runtime separation, shared identity, strict production SHA, local reset).');
} finally {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
  assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith('afrotools-function-release-'));
  fs.rmSync(fixture, { recursive: true, force: true });
}

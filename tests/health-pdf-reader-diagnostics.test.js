'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const helperPath = path.join(__dirname, 'support', 'health-pdf-reader-diagnostics.js');
const source = fs.readFileSync(helperPath, 'utf8');
const nativeRequire = createRequire(helperPath);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const privateText = 'SYNTHETIC_PRIVATE_REPORT_NEVER_LOG';

function harness(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-health-reader-unit-'));
  t.after(() => {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('afrotools-health-reader-unit-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const file = path.join(root, 'synthetic.pdf');
  const bytes = Buffer.from('%PDF-1.3\n' + privateText + '\n%%EOF');
  fs.writeFileSync(file, bytes);
  const output = path.join(root, 'diagnostics'), messages = [];
  let readBuffer;
  const wrappedFs = Object.create(fs);
  wrappedFs.readFileSync = (...args) => {
    let result = fs.readFileSync(...args);
    if (args[0] === file && options.readOffset !== undefined) {
      const backing = Buffer.alloc(options.readOffset + result.length + 17, 0xa7);
      result.copy(backing, options.readOffset);
      result = backing.subarray(options.readOffset, options.readOffset + result.length);
    }
    if (args[0] === file) readBuffer = result;
    return result;
  };
  wrappedFs.writeFileSync = (...args) => {
    if (options.failFailureWrite && path.basename(String(args[0])).startsWith('failed-')) {
      throw new Error('Synthetic persistence failure ' + privateText);
    }
    return fs.writeFileSync(...args);
  };
  const requireBound = name => name === 'node:fs' ? wrappedFs : nativeRequire(name);
  requireBound.resolve = nativeRequire.resolve;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    require: requireBound, module, exports: module.exports, Buffer,
    process: { pid: process.pid, version: process.version, versions: process.versions,
      platform: process.platform, arch: process.arch,
      env: options.env || { GITHUB_RUN_ID: '123456', GITHUB_RUN_ATTEMPT: '2' } },
    console: { error: message => messages.push(message) }
  }, { filename: helperPath });
  const info = { testId: 'test-synthetic-identity', titlePath: ['suite', privateText],
    workerIndex: 1, parallelIndex: 0, outputPath: name => {
      assert.equal(name, 'pdf-reader-diagnostics'); return output;
    } };
  const metadata = () => JSON.parse(fs.readFileSync(path.join(output, 'call-0001.json'), 'utf8'));
  return { root, file, bytes, output, info, read: module.exports.readHealthPdf,
    metadata, messages, originalReadBuffer: () => readBuffer };
}

test('exact parser bytes use a dedicated zero-offset backing buffer; return identity and preparse metadata are retained', async t => {
  const h = harness(t), result = { text: 'original-return-object' };
  const actual = await h.read(h.file, h.info, async data => {
    assert.notStrictEqual(data, h.originalReadBuffer());
    assert.equal(Buffer.isBuffer(data), false);
    assert.equal(ArrayBuffer.isView(data), true);
    assert.deepEqual(Buffer.from(data), h.bytes);
    assert.equal(data.byteOffset, 0);
    assert.equal(data.buffer.byteLength, data.length);
    const record = h.metadata();
    assert.equal(record.phase, 'before');
    assert.equal(record.input.sha256, sha(h.bytes));
    assert.equal(record.input.bytes, h.bytes.length);
    assert.equal(record.input.byteOffset, h.originalReadBuffer().byteOffset);
    assert.equal(record.input.backingBufferBytes, h.originalReadBuffer().buffer.byteLength);
    assert.equal(record.parserInput.sha256, record.input.sha256);
    assert.equal(record.parserInput.bytes, record.input.bytes);
    assert.equal(record.parserInput.byteOffset, 0);
    assert.equal(record.parserInput.backingBufferBytes, data.length);
    assert.equal(record.testId, h.info.testId);
    assert.ok(record.parser.files.every(row => /^[a-f0-9]{64}$/.test(row.sha256)));
    assert.match(record.parser.nodeEnsureEntrySha256, /^[a-f0-9]{64}$/);
    return result;
  });
  assert.strictEqual(actual, result);
  assert.equal(h.metadata().phase, 'success');
  assert.equal(h.metadata().afterInputSha256, sha(h.bytes));
  assert.equal(fs.readdirSync(h.output).length, 1);
});

test('parser rejection rethrows the same Error and preserves exact original PDF bytes', async t => {
  const h = harness(t), error = new Error(privateText);
  let calls = 0;
  await assert.rejects(h.read(h.file, h.info, async () => { calls++; throw error; }), actual => actual === error);
  assert.equal(calls, 1);
  assert.deepEqual(fs.readFileSync(path.join(h.output, 'failed-0001.pdf')), h.bytes);
  assert.equal(h.metadata().phase, 'parser-failed');
  assert.equal(h.metadata().errorName, 'Error');
  assert.equal(h.messages.length, 0);
});

test('failure after parser mutation preserves before bytes and records distinct input hashes', async t => {
  const h = harness(t), error = new Error('bad XRef entry');
  await assert.rejects(h.read(h.file, h.info, async data => {
    data.fill(0); throw error;
  }), actual => actual === error);
  assert.deepEqual(fs.readFileSync(path.join(h.output, 'failed-0001.pdf')), h.bytes);
  assert.equal(h.metadata().input.sha256, sha(h.bytes));
  assert.equal(h.metadata().afterInputSha256, h.metadata().input.sha256);
  assert.notEqual(h.metadata().afterParserInputSha256, h.metadata().parserInput.sha256);
  assert.deepEqual(h.originalReadBuffer(), h.bytes);
});

test('worker-local sequencing records prior identities without changing downloaded files', async t => {
  const h = harness(t);
  await h.read(h.file, h.info, async () => ({ text: 'first' }));
  const secondInfo = { ...h.info, testId: 'second-synthetic-identity' };
  await h.read(h.file, secondInfo, async () => ({ text: 'second' }));
  const second = JSON.parse(fs.readFileSync(path.join(h.output, 'call-0002.json'), 'utf8'));
  assert.equal(second.sequence, 2);
  assert.equal(second.priorParserCalls.length, 1);
  assert.equal(second.priorParserCalls[0].testId, h.info.testId);
  assert.equal(second.priorParserCalls[0].inputSha256, sha(h.bytes));
  assert.deepEqual(fs.readFileSync(h.file), h.bytes);
  assert.deepEqual(fs.readdirSync(h.root).sort(), ['diagnostics', 'synthetic.pdf']);
});

test('metadata and messages exclude private content and nonnumeric/general environment values', async t => {
  const h = harness(t, { env: { GITHUB_RUN_ID: privateText, GITHUB_RUN_ATTEMPT: '03', PRIVATE_KEY: privateText } });
  const error = new Error(privateText); error.name = privateText;
  await assert.rejects(h.read(h.file, h.info, async () => { throw error; }), actual => actual === error);
  const raw = fs.readFileSync(path.join(h.output, 'call-0001.json'), 'utf8');
  assert.ok(!raw.includes(privateText));
  assert.ok(!raw.includes('PRIVATE_KEY'));
  assert.ok(!raw.includes(h.file));
  assert.equal(h.metadata().runId, null);
  assert.equal(h.metadata().attempt, '03');
  assert.equal(h.metadata().errorName, 'OtherError');
  assert.equal(h.metadata().titlePathSha256, sha(JSON.stringify(h.info.titlePath)));
  assert.ok(!JSON.stringify(h.messages).includes(privateText));
});

test('failure-output persistence errors never replace the original parser error', async t => {
  const h = harness(t, { failFailureWrite: true }), error = new Error('bad XRef entry');
  await assert.rejects(h.read(h.file, h.info, async () => { throw error; }), actual => actual === error);
  assert.equal(h.metadata().phase, 'before');
  assert.deepEqual(h.messages, ['Health PDF diagnostic persistence failed; original parser error retained.']);
  assert.ok(!JSON.stringify(h.messages).includes(privateText));
});

test('non-Error rejection identity survives name access and diagnostic persistence failure', async t => {
  const throwingName = { get name() { throw new Error(privateText); } };
  for (const rejection of [null, privateText, 42, throwingName]) {
    for (const failFailureWrite of [false, true]) {
      const h = harness(t, { failFailureWrite });
      await assert.rejects(h.read(h.file, h.info, async () => { throw rejection; }), actual => actual === rejection);
      const raw = fs.readFileSync(path.join(h.output, 'call-0001.json'), 'utf8');
      assert.ok(!raw.includes(privateText));
      if (!failFailureWrite) {
        assert.equal(h.metadata().errorName, 'OtherError');
        assert.deepEqual(fs.readFileSync(path.join(h.output, 'failed-0001.pdf')), h.bytes);
      }
      assert.ok(!JSON.stringify(h.messages).includes(privateText));
    }
  }
});

for (const offset of [5, 3520]) {
  test('legacy backing-buffer substream sees exact report bytes from source offset ' + offset, async t => {
    const h = harness(t, { readOffset: offset });
    await h.read(h.file, h.info, async data => {
      const original = h.originalReadBuffer();
      assert.equal(original.byteOffset, offset);
      const legacySubview = value => Buffer.from(new Uint8Array(value.buffer).subarray(0, value.length));
      assert.notDeepEqual(legacySubview(original), h.bytes);
      assert.deepEqual(legacySubview(data), h.bytes);
      assert.deepEqual(Buffer.from(data), h.bytes);
      assert.equal(data.byteOffset, 0);
      assert.equal(data.buffer.byteLength, h.bytes.length);
      return { text: 'same parser boundary' };
    });
    assert.deepEqual(fs.readFileSync(h.file), h.bytes);
    assert.deepEqual(h.originalReadBuffer(), h.bytes);
    assert.equal(h.metadata().parserInput.sha256, h.metadata().input.sha256);
  });
}

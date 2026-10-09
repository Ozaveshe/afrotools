const test = require('node:test');
const assert = require('node:assert/strict');
const Busboy = require('@fastify/busboy');
const { Request } = require('@whatwg-node/node-fetch');

// Synthetic bodies stay in memory. No requests, storage writes or user records.
const headers = { 'content-type': 'multipart/form-data; boundary=synthetic-boundary' };
const malformed = [
  'form-data; name="field\rname"',
  'form-data; name="field\nname"',
  'form-data; name="field"; filename="file\rname.txt"',
  'form-data; name="field"; filename="file\nname.txt"',
  "form-data; name*=utf-8''field%0Dname",
  "form-data; name*=utf-8''field%0Aname",
  "form-data; name=\"field\"; filename*=utf-8''file%0Dname.txt",
  "form-data; name=\"field\"; filename*=utf-8''file%0Aname.txt"
];

function body(disposition) {
  return '--synthetic-boundary\r\nContent-Disposition: ' + disposition + '\r\n\r\nsynthetic\r\n--synthetic-boundary--\r\n';
}

function parse(disposition) {
  return new Promise((resolve, reject) => {
    const events = [];
    const parser = new Busboy({ headers });
    parser.on('file', (name, stream, filename) => {
      events.push({ type: 'file', name, filename });
      stream.resume();
    });
    parser.on('field', (name, value) => events.push({ type: 'field', name, value }));
    parser.on('error', reject);
    parser.on('finish', () => resolve(events));
    parser.end(body(disposition));
  });
}

for (const [index, disposition] of malformed.entries()) {
  test('multipart parser omits a part containing a CR/LF parameter: ' + index, async () => {
    assert.deepEqual(await parse(disposition), []);
  });
  test('transitive Request formData omits a part containing a CR/LF parameter: ' + index, async () => {
    const request = new Request('http://synthetic.invalid/', { method: 'POST', headers, body: body(disposition) });
    assert.deepEqual(Array.from((await request.formData()).entries()), []);
  });
}

test('multipart parser retains a normal text field', async () => {
  assert.deepEqual(await parse('form-data; name="label"'), [{ type: 'field', name: 'label', value: 'synthetic' }]);
});

test('multipart parser retains a normal filename', async () => {
  assert.deepEqual(await parse('form-data; name="document"; filename="synthetic.txt"'), [{ type: 'file', name: 'document', filename: 'synthetic.txt' }]);
});

test('transitive Request retains normal uploaded file bytes', async () => {
  const request = new Request('http://synthetic.invalid/', { method: 'POST', headers, body: body('form-data; name="document"; filename="synthetic.txt"') });
  const file = (await request.formData()).get('document');
  assert.equal(file.name, 'synthetic.txt');
  assert.equal(await file.text(), 'synthetic');
});

test('Netlify Blobs CommonJS entry still loads', () => {
  assert.equal(typeof require('@netlify/blobs').getStore, 'function');
});

test('Netlify Blobs ESM entry still loads', async () => {
  assert.equal(typeof (await import('@netlify/blobs')).getStore, 'function');
});

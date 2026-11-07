'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const U = require('../tools/afrostream/news-utils');
const { allowedUrl, fetchImage } = require('../netlify/functions/afrostream-image').__test;
const localPath = '/assets/img/afrostream/news/showmax-closes-dstv-stream-2026.webp';
const localPath2 = '/assets/img/afrostream/news/jiwe-io-ma3-simulator-crowdfunding-2026.webp';
const jpeg = Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,1,1,0,0]);

function handlerFor(row, imageResponse) {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../netlify/functions/afrostream-image.js'), 'utf8');
  vm.runInNewContext(source, {
    exports, Buffer, URL, AbortSignal,
    process: { env: { SUPABASE_DATA_SERVICE_ROLE_KEY: 'synthetic-test-key' } },
    require: (name) => name === 'node:dns/promises' ? {
      lookup: async () => [{ address: '75.2.60.5' }]
    } : name === '../../tools/afrostream/news-utils' ? U : (() => { throw new Error('Unexpected import: ' + name); })(),
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.startsWith('https://zpclagtgczsygrgztlts.supabase.co/rest/v1/as_news?')) {
        return new Response(JSON.stringify(row ? [row] : []), { headers: { 'content-type': 'application/json' } });
      }
      return imageResponse();
    }
  }, { filename: 'afrostream-image.js' });
  return { handler: exports.handler, calls };
}

test('published local story images resolve to the owned image directory only', () => {
  for (const value of [localPath, localPath2, 'https://afrotools.com' + localPath]) {
    assert.equal(allowedUrl(value)?.href, 'https://afrotools.com' + (value.includes('jiwe') ? localPath2 : localPath));
  }
  for (const value of ['/api/afrostream/news', '/admin/index.html', '/assets/img/tools/afrostream.webp',
    '/assets/img/afrostream/news/a.svg', localPath + '?redirect=https://evil.example',
    '//afrotools.com' + localPath, 'assets/img/afrostream/news/story.webp',
    '/assets/img/afrostream/news/../news/story.webp', '/assets/img/afrostream/news/a%2fstory.webp',
    'https://afrotools.com.evil.example' + localPath, 'http://afrotools.com' + localPath]) {
    assert.equal(allowedUrl(value), null, value);
  }
});

test('GET and HEAD deliver real local story raster bytes without forwarding database credentials', async () => {
  for (const method of ['GET', 'HEAD']) {
    const instance = handlerFor({ id: 30, image_url: localPath }, () => new Response(jpeg, { headers: { 'content-type': 'image/jpeg' } }));
    const result = await instance.handler({ httpMethod: method, queryStringParameters: { id: '30' } });
    assert.equal(result.statusCode, 200);
    assert.equal(result.headers['Content-Type'], 'image/jpeg');
    assert.equal(result.body, method === 'HEAD' ? '' : jpeg.toString('base64'));
    assert.equal(instance.calls.length, 2);
    assert.equal(instance.calls[1].url, 'https://afrotools.com' + localPath);
    assert.equal(instance.calls[1].options.headers.Authorization, undefined);
    assert.equal(instance.calls[1].options.headers.apikey, undefined);
  }
});

test('generic AfroStream branding is not presented as a story photograph or fetched by the proxy', async () => {
  for (const image_url of ['/assets/img/tools/afrostream.webp', 'https://afrotools.com/assets/img/tools/afrostream.webp']) {
    assert.equal(U.isPlaceholderImage(image_url), true);
    assert.equal(U.imageHref({ id: 65, image_url }), '');
    const instance = handlerFor({ id: 65, image_url }, () => { throw new Error('Placeholder must not be fetched'); });
    assert.equal((await instance.handler({ httpMethod: 'GET', queryStringParameters: { id: '65' } })).statusCode, 404);
    assert.equal(instance.calls.length, 1);
  }
  assert.equal(U.isPlaceholderImage(localPath), false);
});

test('owned image URLs retain redirect, DNS, MIME and size boundaries', async () => {
  const resolver = async () => [{ address: '75.2.60.5' }];
  await assert.rejects(fetchImage(localPath, async () => new Response(null, { status: 302, headers: { location: '/api/afrostream/news' } }), resolver), /host not allowed/);
  await assert.rejects(fetchImage(localPath, async () => { throw new Error('Must not fetch private DNS'); }, async () => [{ address: '127.0.0.1' }]), /not public/);
  await assert.rejects(fetchImage(localPath, async () => new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }), resolver), /Invalid image response/);
  await assert.rejects(fetchImage(localPath, async () => new Response(jpeg, { headers: { 'content-type': 'image/jpeg', 'content-length': '9999999' } }), resolver), /Invalid image response/);
});

test('unpublished, absent and still-broken upstream images are not disguised as successful photos', async () => {
  const missing = handlerFor(null, () => { throw new Error('Must not fetch'); });
  assert.equal((await missing.handler({ httpMethod: 'GET', queryStringParameters: { id: '30' } })).statusCode, 404);
  const broken = handlerFor({ id: 13371, image_url: 'https://storage.googleapis.com/story.webp' }, () => new Response('Forbidden', { status: 403 }));
  assert.equal((await broken.handler({ httpMethod: 'GET', queryStringParameters: { id: '13371' } })).statusCode, 502);
});

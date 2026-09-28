// Only published story images from vetted publishers can pass through this endpoint.
// A same-origin image avoids CSP blocks without widening the site's image policy.
'use strict';
const { lookup } = require('node:dns/promises');
const U = require('../../tools/afrostream/news-utils');
const PROJECT = 'https://zpclagtgczsygrgztlts.supabase.co';
const HOSTS = new Set([
  'storage.googleapis.com', 'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'www.bellanaija.com',
  'notjustok.com', 'esportsafricanews.com', 'biz-file.com', 'technext24.com', 'afrocritik.com',
  'sahiphopmag.co.za', 'www.techinafrica.com', 'samusicawards.co.za', 'africanfolder.com',
  'ventureburn.com', 'about.fb.com', 'memeburn.com', 'static.wixstatic.com', 'africanfixer.tv',
  'ynaija.com', 'slikouronlife.co.za', 'cdn.businessday.ng', 'storage.ghost.io', 'images.unsplash.com',
  'eu-images.contentstack.com', 'e8wm23is9ki.exactdn.com', 'substackcdn.com',
  'substack-post-media.s3.amazonaws.com', 'thecondia.com', 'texxandthecity.com',
  'c76c7bbc41.mjedge.net', 'c7684bdb45.mjedge.net', 'news.broadcastmediaafrica.com', 'ocdn.eu',
  'app-circl.com', 'cdn.sanity.io', 'img1.wsimg.com', 'cdn.allafrica.com', 'files.zambianmusicblog.co',
  'culturecustodian.com', 'thelagosreview.ng', 'musiccustodian.com', 'www.glitched.online',
  'is1-ssl.mzstatic.com', 'is2-ssl.mzstatic.com', 'is3-ssl.mzstatic.com', 'is4-ssl.mzstatic.com', 'is5-ssl.mzstatic.com'
]);
const MAX_BYTES = 3 * 1024 * 1024;
function allowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && HOSTS.has(url.hostname) ? url : null;
  } catch (_) { return null; }
}
function publicAddress(address) {
  // Do not permit private, loopback, link-local, multicast, reserved, or mapped IPv4 addresses.
  if (address.includes(':')) {
    return /^[23][0-9a-f]{0,3}:/i.test(address) && !/^2001:(?:db8|0):/i.test(address);
  }
  const p = address.split('.').map(Number);
  return p.length === 4 && p.every(n => Number.isInteger(n) && n >= 0 && n < 256) &&
    ![0,10,127].includes(p[0]) && p[0] < 224 &&
    !(p[0] === 169 && p[1] === 254) && !(p[0] === 172 && p[1] >= 16 && p[1] <= 31) &&
    !(p[0] === 192 && (p[1] === 168 || p[1] === 0 || p[1] === 2)) &&
    !(p[0] === 100 && p[1] >= 64 && p[1] <= 127) &&
    !(p[0] === 198 && ([18,19].includes(p[1]) || (p[1] === 51 && p[2] === 100))) && !(p[0] === 203 && p[1] === 0 && p[2] === 113);
}
function imageType(bytes) {
  if (bytes.length < 12) return '';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (/^GIF8[79]a/.test(bytes.subarray(0,6).toString('ascii'))) return 'image/gif';
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return 'image/webp';
  if (bytes.subarray(4,8).toString() === 'ftyp' && /avif|avis/.test(bytes.subarray(8,32).toString())) return 'image/avif';
  return '';
}
async function fetchImage(value, fetcher = fetch, resolver = lookup) {
  let current = value;
  const signal = AbortSignal.timeout(9000);
  for (let redirect = 0; redirect < 4; redirect++) {
    const url = allowedUrl(current);
    if (!url) throw new Error('Image host not allowed');
    const addresses = await resolver(url.hostname, { all: true });
    if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('Image address not public');
    const response = await fetcher(url.href, { signal, redirect: 'manual', headers: { 'User-Agent': 'AfroStream/1.0 (+https://afrotools.com/tools/afrostream/)', Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif' } });
    if ([301,302,303,307,308].includes(response.status)) {
      const destination = response.headers.get('location');
      if (!destination) throw new Error('Missing image redirect');
      current = new URL(destination, url).href;
      await response.body?.cancel();
      continue;
    }
    const declared = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)$/.test(declared) || Number(response.headers.get('content-length')) > MAX_BYTES) {
      await response.body?.cancel();
      throw new Error('Invalid image response');
    }
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > MAX_BYTES) { await response.body?.cancel().catch(() => {}); throw new Error('Image too large'); }
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    const type = imageType(bytes);
    if (!type) throw new Error('Invalid image bytes');
    return { bytes, type };
  }
  throw new Error('Too many image redirects');
}
exports.handler = async function (event) {
  if (!['GET','HEAD'].includes(event.httpMethod)) return { statusCode: 405, headers: { Allow: 'GET, HEAD' }, body: '' };
  const id = event.queryStringParameters?.id;
  if (!/^\d{1,12}$/.test(id || '')) return { statusCode: 400, body: 'Invalid story' };
  const key = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { statusCode: 503, body: 'Image unavailable' };
  try {
    const response = await fetch(PROJECT + '/rest/v1/as_news?select=id,image_url&id=eq.' + id + '&is_published=eq.true&limit=1', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error('Story unavailable');
    const rows = await response.json();
    if (!rows[0] || U.isPlaceholderImage(rows[0].image_url)) return { statusCode: 404, headers: { 'Cache-Control': 'public,max-age=300' }, body: '' };
    const image = await fetchImage(rows[0].image_url);
    return { statusCode: 200, isBase64Encoded: true, headers: {
      'Content-Type': image.type, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public,max-age=86400', 'Netlify-CDN-Cache-Control': 'public,max-age=86400,stale-while-revalidate=86400'
    }, body: event.httpMethod === 'HEAD' ? '' : image.bytes.toString('base64') };
  } catch (_) { return { statusCode: 502, headers: { 'Cache-Control': 'public,max-age=60' }, body: 'Image unavailable' }; }
};
exports.__test = { allowedUrl, publicAddress, imageType, fetchImage };

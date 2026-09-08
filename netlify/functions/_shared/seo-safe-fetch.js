'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const zlib = require('node:zlib');

function isPublicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (family === 6) {
    // Global unicast only; reject mapped, transition, documentation and special-use ranges.
    const normalized = new URL('http://[' + address + ']/').hostname.slice(1, -1);
    const parts = normalized.split(':');
    const first = parseInt(parts[0], 16), second = parseInt(parts[1] || '0', 16);
    return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 && first !== 0x3fff &&
      !(first === 0x2001 && (second <= 0x1ff || second === 0xdb8));
  }
  return false;
}

function createSafeLookup(resolve = dns.lookup.bind(dns)) {
  return function lookup(hostname, options, callback) {
    resolve(hostname, { all: true, verbatim: true }).then(records => {
      if (!records.length || records.some(record => !isPublicAddress(record.address))) {
        callback(new Error('That host resolves to a private or reserved address and cannot be audited.'));
        return;
      }
      const family = options && options.family;
      const usable = family ? records.filter(record => record.family === family) : records;
      if (!usable.length) { callback(new Error('No supported public address for that host.')); return; }
      // Node connects to this exact checked address; there is no second DNS resolution.
      if (options && options.all) callback(null, usable);
      else callback(null, usable[0].address, usable[0].family);
    }).catch(() => callback(new Error('That domain does not resolve. Check the spelling.')));
  };
}

async function readStream(stream, maxBytes) {
  const chunks = [];
  let received = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += buffer.length;
    if (received > maxBytes) {
      stream.destroy();
      throw new Error('Response is larger than the ' + Math.round(maxBytes / 1024) + ' KB audit limit. No partial report was generated.');
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function safeFetch(rawUrl, options = {}, requestOverride) {
  const url = new URL(rawUrl);
  const literal = url.hostname.replace(/^\[|\]$/g, '');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80', '443'].includes(url.port)) ||
      /(?:^|\.)(?:localhost|local|internal)\.?$/i.test(url.hostname) ||
      (net.isIP(literal) && !isPublicAddress(literal))) {
    return Promise.reject(new Error('Private, reserved or unsupported URL cannot be audited.'));
  }
  const timeoutMs = options.timeoutMs || 10000;
  const maxBytes = options.maxBytes || 2 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    let req, response, decoded, settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) { if (decoded) decoded.destroy(); if (response) response.destroy(); if (req) req.destroy(); reject(error); }
      else resolve(result);
    };
    const timer = setTimeout(() => finish(new Error('Page response exceeded ' + timeoutMs / 1000 + ' seconds. No partial report was generated.')), timeoutMs);
    const request = requestOverride || (url.protocol === 'https:' ? https.request : http.request);
    try {
      req = request(url, {
        method: 'GET', agent: false, lookup: createSafeLookup(),
        headers: Object.assign({ 'Accept-Encoding': 'gzip, deflate, br' }, options.headers || {})
      }, async res => {
        response = res;
        const get = name => { const value = res.headers[name.toLowerCase()]; return Array.isArray(value) ? value.join(', ') : value || ''; };
        const status = res.statusCode;
        const base = { status, ok: status >= 200 && status < 300, headers: { get } };
        if (status < 200 || status >= 300) { res.destroy(); finish(null, Object.assign(base, { text: async () => '' })); return; }
        try {
          if (Number(get('content-length')) > maxBytes) throw new Error('Response is larger than the audit limit.');
          const encoding = get('content-encoding').toLowerCase();
          decoded = res;
          if (encoding && encoding !== 'identity') {
            const decoder = { gzip: zlib.createGunzip, br: zlib.createBrotliDecompress, deflate: zlib.createInflate }[encoding];
            if (!decoder) throw new Error('Unsupported response compression.');
            decoded = decoder();
            res.on('error', error => decoded.destroy(error));
            res.pipe(decoded);
          }
          const body = await readStream(decoded, maxBytes);
          finish(null, Object.assign(base, { text: async () => body }));
        } catch (error) { finish(error); }
      });
      req.on('error', error => finish(error));
      req.end();
    } catch (error) { finish(error); }
  });
}

module.exports = { isPublicAddress, createSafeLookup, readStream, safeFetch };

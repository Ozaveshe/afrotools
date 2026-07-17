/**
 * Read real pixel dimensions from an image file, without any dependency.
 *
 * Exists because og:image:width/height were being stamped as a hardcoded 1200x630 regardless of
 * the file behind them. Social platforms lay a preview card out from those hints before they fetch
 * the image, so a wrong hint mis-renders the card. Measuring is the only honest option.
 *
 * Supports the formats actually used for og:image in this repo: webp, png, jpeg, gif, svg.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function webpSize(b) {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF') return null;
  const fmt = b.toString('ascii', 12, 16);
  if (fmt === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (fmt === 'VP8 ') {
    const o = b.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    if (o < 0 || o + 7 > b.length) return null;
    return { w: b.readUInt16LE(o + 3) & 0x3fff, h: b.readUInt16LE(o + 5) & 0x3fff };
  }
  if (fmt === 'VP8L') {
    if (b.length < 25) return null;
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function pngSize(b) {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function jpegSize(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let o = 2;
  while (o < b.length - 8) {
    if (b[o] !== 0xff) { o += 1; continue; }
    const marker = b[o + 1];
    // standalone markers carry no length payload
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { o += 2; continue; }
    // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) };
    }
    o += 2 + b.readUInt16BE(o + 2);
  }
  return null;
}

function gifSize(b) {
  if (b.length < 10 || b.toString('ascii', 0, 3) !== 'GIF') return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

function svgSize(b) {
  const head = b.toString('utf8', 0, Math.min(b.length, 4096));
  const w = head.match(/\bwidth\s*=\s*["']([\d.]+)/);
  const h = head.match(/\bheight\s*=\s*["']([\d.]+)/);
  if (w && h) return { w: Math.round(Number(w[1])), h: Math.round(Number(h[1])) };
  const vb = head.match(/viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/);
  if (vb) return { w: Math.round(Number(vb[1])), h: Math.round(Number(vb[2])) };
  return null;
}

const READERS = {
  '.webp': webpSize,
  '.png': pngSize,
  '.jpg': jpegSize,
  '.jpeg': jpegSize,
  '.gif': gifSize,
  '.svg': svgSize,
};

const cache = new Map();

/**
 * @param {string} file Absolute path to an image.
 * @returns {{w:number,h:number}|null} null when unreadable/unsupported — callers decide whether
 *   that is fatal. Never guesses a size.
 */
function imageSize(file) {
  if (cache.has(file)) return cache.get(file);
  let size = null;
  const reader = READERS[path.extname(file).toLowerCase()];
  if (reader) {
    try {
      const parsed = reader(fs.readFileSync(file));
      if (parsed && parsed.w > 0 && parsed.h > 0) size = parsed;
    } catch {
      size = null;
    }
  }
  cache.set(file, size);
  return size;
}

/**
 * Resolve a site-absolute URL or path ("/assets/img/x.webp", "https://host/assets/img/x.webp")
 * to a file under `root`, then measure it. Returns null for remote hosts or missing files.
 */
function imageSizeFromUrl(url, root) {
  if (!url) return null;
  const withoutOrigin = String(url).replace(/^https?:\/\/[^/]+/i, '');
  if (!withoutOrigin.startsWith('/')) return null;
  const rel = withoutOrigin.split('?')[0].split('#')[0].replace(/^\//, '');
  return imageSize(path.join(root, rel));
}

module.exports = { imageSize, imageSizeFromUrl };

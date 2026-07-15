"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

const SHARED_ASSETS = new Map([
  ["assets/js/components/navbar.js", "assets/js/components/navbar.min.js"],
  ["assets/js/components/footer.js", "assets/js/components/footer.min.js"],
  ["assets/css/design-system.css", "assets/css/design-system.min.css"],
  ["assets/css/global.css", "assets/css/global.min.css"],
]);

const ASSET_ATTRIBUTE_RE = /((?:src|href)=["'])([^"']*?assets\/(?:js\/components\/(?:navbar|footer)\.js|css\/(?:design-system|global)\.css))(?:\?[^"']*)?(["'])/gi;

const hashCache = new Map();

function contentHash(relativePath) {
  if (hashCache.has(relativePath)) return hashCache.get(relativePath);
  const absolutePath = path.join(ROOT, relativePath);
  const content = fs.readFileSync(absolutePath, "utf8").replace(/\r\n?/g, "\n");
  const hash = crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
  hashCache.set(relativePath, hash);
  return hash;
}

function normalizeAssetKey(reference) {
  const normalized = reference.replace(/\\/g, "/");
  for (const source of SHARED_ASSETS.keys()) {
    if (normalized.endsWith(source)) return source;
  }
  return null;
}

function rewriteSharedAssetReferences(html) {
  let replacements = 0;
  const output = html.replace(ASSET_ATTRIBUTE_RE, (match, prefix, reference, quote) => {
    const source = normalizeAssetKey(reference);
    if (!source) return match;
    const target = SHARED_ASSETS.get(source);
    const targetReference = reference.slice(0, -source.length) + target;
    replacements += 1;
    return `${prefix}${targetReference}?v=${contentHash(target)}${quote}`;
  });

  return { html: output, replacements };
}

module.exports = {
  ASSET_ATTRIBUTE_RE,
  SHARED_ASSETS,
  rewriteSharedAssetReferences,
};

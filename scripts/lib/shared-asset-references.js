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
const MANAGED_CHAT_BUNDLE_RE = /\sdata-chat-bundle=["'][^"']*["']/gi;
const MANAGED_CHAT_BUNDLE_PATH_RE = /\/assets\/js\/bundles\/chat\.[a-f0-9]+\.min\.js/gi;
const MANAGED_CORE_BUNDLE_PATH_RE = /\/assets\/js\/bundles\/core\.[a-f0-9]+\.min\.js/gi;
const MANAGED_CORE_BUNDLE_TAG_RE = /<script\s+[^>]*src=["'][^"']*\/assets\/js\/bundles\/core\.[a-f0-9]+\.min\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi;
const MANAGED_TOOL_REGISTRY_TAG_RE = /<script\s+[^>]*src=["'][^"']*\/assets\/js\/components\/tool-registry(?:\.min)?\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi;
const MANAGED_LAZY_ANALYTICS_TAG_RE = /<script\s+[^>]*src=["'][^"']*\/assets\/js\/lazy-analytics\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi;
const MANAGED_TWITTER_FALLBACK_TAG_RE = /<meta\b[^>]*\bname=["']twitter:(?:card|title|description|image)["'][^>]*>\s*/gi;
const MANAGED_ASSET_VERSION_RE = /((?:src|href)=["'][^"']*\/(?:assets|data|engines)\/[^"'?]+)\?v=[a-f0-9]+(["'])/gi;
const MANAGED_SEO_LINKS_RE = /<!-- seo-internal-links -->[\s\S]*?<!-- seo-internal-links -->\s*/gi;
const MANAGED_SHARED_ASSET_RE = /((?:src|href)=["'])([^"']*?assets\/(?:js\/components\/(?:navbar|footer)|css\/(?:design-system|global)))(?:\.min)?\.(js|css)(?:\?[^"']*)?(["'])/gi;

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

/**
 * Return source-equivalent HTML for generator/frozen-owner comparisons.
 *
 * The release asset pass owns the lazy chat-bundle pointer and the minified,
 * content-hashed navbar/footer/design-system/global references. Those fields
 * can change after a source generator runs without changing page behavior.
 * Normalizing only that managed boundary keeps source generators idempotent
 * while leaving every product, privacy, SEO, schema, engine and export byte in
 * the comparison.
 */
function normalizeBuildManagedHtml(html) {
  return String(html)
    .replace(MANAGED_CHAT_BUNDLE_RE, "")
    .replace(
      MANAGED_CORE_BUNDLE_TAG_RE,
      '<script src="/assets/js/lib/dark-mode.js" defer></script>\n  '
    )
    .replace(MANAGED_TOOL_REGISTRY_TAG_RE, "")
    .replace(MANAGED_LAZY_ANALYTICS_TAG_RE, "")
    .replace(MANAGED_TWITTER_FALLBACK_TAG_RE, "")
    .replace(MANAGED_SEO_LINKS_RE, "")
    .replace(MANAGED_ASSET_VERSION_RE, "$1$2")
    .replace(
      MANAGED_SHARED_ASSET_RE,
      (match, prefix, base, extension, quote) => `${prefix}${base}.${extension}${quote}`
    )
    .replace(/\r\n?/g, "\n");
}

function normalizeBuildManagedFingerprint(html) {
  return String(html)
    .replace(
      MANAGED_CHAT_BUNDLE_PATH_RE,
      "/assets/js/bundles/chat.88bd45ff.min.js"
    )
    .replace(
      MANAGED_CORE_BUNDLE_PATH_RE,
      "/assets/js/bundles/core.8401f4c6.min.js"
    )
    .replace(/\r\n?/g, "\n");
}

module.exports = {
  ASSET_ATTRIBUTE_RE,
  MANAGED_CHAT_BUNDLE_RE,
  MANAGED_CHAT_BUNDLE_PATH_RE,
  MANAGED_CORE_BUNDLE_PATH_RE,
  MANAGED_CORE_BUNDLE_TAG_RE,
  MANAGED_TOOL_REGISTRY_TAG_RE,
  MANAGED_LAZY_ANALYTICS_TAG_RE,
  MANAGED_TWITTER_FALLBACK_TAG_RE,
  MANAGED_ASSET_VERSION_RE,
  MANAGED_SEO_LINKS_RE,
  MANAGED_SHARED_ASSET_RE,
  SHARED_ASSETS,
  normalizeBuildManagedHtml,
  normalizeBuildManagedFingerprint,
  rewriteSharedAssetReferences,
};

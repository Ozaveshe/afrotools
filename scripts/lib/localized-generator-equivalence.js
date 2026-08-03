"use strict";

const { normalizeBuildManagedHtml } = require("./shared-asset-references");

/**
 * Normalize only markup owned by the release pipeline before comparing a
 * localized source generator with its checked-in page.
 *
 * Route-contract owns canonical/hreflang placement and the release build owns
 * asset hashes and the analytics loader. Product markup, copy, schemas,
 * controls, engines, privacy boundaries and exports remain byte-sensitive.
 */
function normalizeLocalizedGeneratorHtml(html) {
  return normalizeBuildManagedHtml(html)
    .replace(/\s*<script\b[^>]*src=["']\/assets\/js\/lib\/sw-accessibility\.js(?:\?v=[a-f0-9]+)?["'][^>]*><\/script>\s*/gi, "\n")
    .replace(/\s*<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, "\n")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/^[ \t]+/gm, "")
    .replace(/>\s+</g, "><")
    .replace(/href=["']\/sw\/tools\/["']/g, 'href="/sw/zana-zote/"')
    .trim();
}

function localizedGeneratorEquivalent(current, expected) {
  return normalizeLocalizedGeneratorHtml(current) === normalizeLocalizedGeneratorHtml(expected);
}

module.exports = {
  localizedGeneratorEquivalent,
  normalizeLocalizedGeneratorHtml,
};

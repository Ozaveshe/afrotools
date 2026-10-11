"use strict";

const review = require("../../data/image-generation/reviewed-discovery-artwork-presentation.json");

// Keep the existing protected HTML digests for these reviewed head-only image
// changes. Exact fragments are required: unknown artwork/metadata is not
// normalized, and body content, controls and executable wiring stay protected.
function normalizeReviewedArtworkPresentation(source) {
  const canonical = String(source).match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/afrotools\.com([^"']+)["'])[^>]*>/i);
  if (!canonical) return source;
  const record = review.records.find(item => item.route === canonical[1]);
  if (!record || !record.patches.every(patch => String(source).split(patch.current).length === 2)) return source;
  let normalized = String(source);
  for (const patch of record.patches.slice().reverse()) {
    normalized = normalized.replace(patch.current, patch.baseline);
  }
  return normalized;
}

module.exports = { normalizeReviewedArtworkPresentation };

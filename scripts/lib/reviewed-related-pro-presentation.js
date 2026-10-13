"use strict";

const review = require("../../data/calculation-quality/reviews/2026-10-12-related-pro-copy.json");

// Only these exact related-tool anchors are reversible presentation changes.
// Unknown copy, duplicate fragments, and other routes remain digest-sensitive.
function normalizeReviewedRelatedProPresentation(source) {
  const html = String(source);
  const canonicals = [...html.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/afrotools\.com([^"']+)["'])[^>]*>/gi)];
  if (canonicals.length !== 1) return source;
  const record = review.records.find(item => item.route === canonicals[0][1]);
  if (!record || html.split(record.current).length !== 2) return source;
  return html.replace(record.current, record.baseline);
}

module.exports = { normalizeReviewedRelatedProPresentation };

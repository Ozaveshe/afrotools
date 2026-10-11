'use strict';

// Replace only the three title tags owned by a page generator. Existing page
// bodies, artwork, structured data and other metadata stay byte-for-byte intact.
function applyTitleMetadata(current, generated) {
  const patterns = [
    /<title\b[^>]*>[\s\S]*?<\/title>/gi,
    /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/gi,
    /<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/gi
  ];
  let output = current;
  for (const pattern of patterns) {
    const before = output.match(pattern) || [];
    const after = generated.match(pattern) || [];
    if (before.length !== 1 || after.length !== 1) {
      throw new Error('Title metadata must contain exactly one title, og:title and twitter:title tag.');
    }
    output = output.replace(pattern, () => after[0]);
  }
  return output;
}

module.exports = { applyTitleMetadata };

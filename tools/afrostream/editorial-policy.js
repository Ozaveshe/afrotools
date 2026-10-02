(function (root, factory) {
  var policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  else root.AfroStreamEditorialPolicy = policy;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var MIN_WORDS = 600;
  function wordCount(body) {
    var text = String(body || '')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s*#{1,6}\s+.*$/gm, ' ')
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ');
    return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
  }
  function publicationError(row, previous) {
    if (Object.prototype.hasOwnProperty.call(row, 'is_published') && typeof row.is_published !== 'boolean') {
      return 'is_published must be a boolean';
    }
    var next = Object.assign({}, previous || {}, row);
    if (next.is_published === false) return null;
    // Existing articles keep their routes and may receive metadata corrections.
    var changed = !previous || previous.is_published !== true ||
      (Object.prototype.hasOwnProperty.call(row, 'body') && row.body !== previous.body) ||
      (Object.prototype.hasOwnProperty.call(row, 'author') && row.author !== previous.author);
    if (!changed) return null;
    if (!/^Afro(?:Stream|Tools)(?:\s|$)/i.test(next.author || '')) {
      return 'Publish an original AfroStream report with an AfroStream byline. Save publisher feed excerpts as drafts.';
    }
    var count = wordCount(next.body);
    return count < MIN_WORDS ? 'Article body needs at least ' + MIN_WORDS + ' words before publishing (' + count + ' now). Drafts can be shorter.' : null;
  }
  return { minWords: MIN_WORDS, wordCount: wordCount, publicationError: publicationError };
});

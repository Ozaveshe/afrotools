/**
 * TitleSmith Engine — Title & Headline Generator
 * Platform-aware title generation, favorites, history
 */
!function(){"use strict";

// ── AUTH HELPERS ──
var supabaseClient = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
    supabaseClient = AfroAuth.getSupabase();
    return supabaseClient;
  }
  return null;
}
function getUserId() {
  if (window.AfroAuth && AfroAuth.user) return AfroAuth.user.id;
  return null;
}
function scopedKey(base) {
  var uid = getUserId();
  return uid ? base + '_' + uid : base;
}

var TITLE_STYLES = [
  { id: 'clickbait', label: 'THE CLICKBAIT', icon: "\uD83D\uDD25" },
  { id: 'seo', label: 'THE SEO-OPTIMIZED', icon: "\uD83D\uDCCA" },
  { id: 'storyteller', label: 'THE STORYTELLER', icon: "\uD83D\uDCDA" },
  { id: 'listicle', label: 'THE LISTICLE', icon: "\uD83D\uDD22" },
  { id: 'question', label: 'THE QUESTION', icon: "\u2753" },
  { id: 'bold_claim', label: 'THE BOLD CLAIM', icon: "\uD83D\uDCA5" },
  { id: 'howto', label: 'THE HOW-TO', icon: "\uD83D\uDEE0\uFE0F" },
  { id: 'viral', label: 'THE VIRAL', icon: "\u26A1" }
];

var PLATFORMS = [
  { id: 'youtube', label: 'YouTube', maxChars: 100, recommended: 60 },
  { id: 'blog', label: 'Blog', maxChars: 70, recommended: 60 },
  { id: 'newsletter', label: 'Newsletter', maxChars: 80, recommended: 50 },
  { id: 'instagram', label: 'Instagram', maxChars: 0, recommended: 0 },
  { id: 'x', label: 'X', maxChars: 280, recommended: 100 },
  { id: 'linkedin', label: 'LinkedIn', maxChars: 150, recommended: 100 }
];

function getCharStatus(charCount, platform) {
  var p = PLATFORMS.find(function(pl) { return pl.id === platform; });
  if (!p || !p.maxChars) return 'ok';
  if (charCount > p.maxChars) return 'over';
  if (p.recommended && charCount > p.recommended) return 'warn';
  return 'ok';
}

function buildPrompt(topic, platform) {
  var p = PLATFORMS.find(function(pl) { return pl.id === platform; }) || PLATFORMS[0];
  var lengthNote = p.maxChars
    ? 'Platform: ' + p.label + ' (recommended max ' + p.recommended + ' chars, hard max ' + p.maxChars + ' chars)'
    : 'Platform: ' + p.label + ' (no strict character limit, but first line matters most)';

  return 'Generate 8 title/headline options for this content topic.\n\n' +
    'Topic: ' + topic + '\n' +
    lengthNote + '\n\n' +
    'Generate exactly 8 titles, one per style:\n' +
    '1. Clickbait — curiosity gap, bold claims, emotional triggers\n' +
    '2. SEO-Optimized — keywords first, search-friendly, clear intent\n' +
    '3. Storyteller — personal narrative, journey, transformation\n' +
    '4. Listicle — numbers, lists, quantified value\n' +
    '5. Question — provocative question that demands an answer\n' +
    '6. Bold Claim — controversial, strong opinion, hot take\n' +
    '7. How-To — practical, clear, actionable\n' +
    '8. Viral — trend-riding, platform-native, shareable\n\n' +
    'Use African context naturally when relevant (Lagos, Nairobi, Accra, SA, African creator culture). Never force it.\n' +
    'Vary sentence structure. Make EVERY title genuinely interesting.\n' +
    'For YouTube: use brackets like [2026 Guide] or (Watch This) sparingly.\n\n' +
    'Also pick the 2 strongest titles and do an A/B comparison explaining which is stronger and why.\n\n' +
    'Return ONLY valid JSON, no markdown code fences:\n' +
    '{"titles":[{"style":"clickbait","title":"...","charCount":58,"whyItWorks":"..."},{"style":"seo","title":"...","charCount":52,"whyItWorks":"..."},...],"abTest":{"titleA":0,"titleB":1,"winner":"A","reason":"..."}}';
}

function parseResponse(text) {
  try {
    var match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch(e) {}
  return null;
}

function createHistoryEntry(topic, platform, titles) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    topic: topic,
    platform: platform,
    titles: titles || [],
    createdAt: Date.now()
  };
}

function formatTimestamp(ts) {
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

window.AfroTools = window.AfroTools || {};
window.AfroTools.engines = window.AfroTools.engines || {};
window.AfroTools.engines.creatorTitles = {
  TITLE_STYLES: TITLE_STYLES,
  PLATFORMS: PLATFORMS,
  getCharStatus: getCharStatus,
  buildPrompt: buildPrompt,
  parseResponse: parseResponse,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp
};

}();

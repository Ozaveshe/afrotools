/**
 * Repurpose Engine — Content Repurposer
 * Source content → platform-optimized outputs
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

var PLATFORMS = {
  instagram:  { label: 'Instagram',        icon: '&#128247;', class: 'ig',   format: 'Caption' },
  twitter:    { label: 'X / Twitter',       icon: '&#120143;', class: 'x',    format: 'Thread' },
  linkedin:   { label: 'LinkedIn',          icon: '&#128188;', class: 'li',   format: 'Post' },
  tiktok:     { label: 'TikTok',            icon: '&#127925;', class: 'tt',   format: '3 Scripts' },
  newsletter: { label: 'Newsletter',        icon: '&#9993;',   class: 'nl',   format: 'Snippet' },
  facebook:   { label: 'Facebook',          icon: '&#128077;', class: 'fb',   format: 'Post' },
  blog:       { label: 'Blog Summary',      icon: '&#128221;', class: 'blog', format: 'Summary' }
};

var SOURCE_TYPES = {
  youtube_script: 'YouTube Script / Video',
  blog_post: 'Blog Post / Article',
  tweet_thread: 'Tweet Thread',
  newsletter: 'Newsletter',
  podcast_notes: 'Podcast Notes / Transcript',
  ig_caption: 'Instagram Caption'
};

function buildPrompt(source, sourceType, platforms) {
  var sourceLabel = SOURCE_TYPES[sourceType] || sourceType;
  var parts = [];

  parts.push('Repurpose this ' + sourceLabel + ' into platform-optimized content for: ' + platforms.map(function(p) { return (PLATFORMS[p] || {}).label || p; }).join(', ') + '.');
  parts.push('\nSOURCE CONTENT:\n"""' + source + '"""');

  parts.push('\nPLATFORM RULES:');

  if (platforms.indexOf('instagram') !== -1) {
    parts.push('- INSTAGRAM: Hook in first line (works in 125 chars before "...more"). Proper line breaks. CTA. 5-10 relevant hashtags. 1-3 emoji used strategically.');
  }
  if (platforms.indexOf('twitter') !== -1) {
    parts.push('- X/TWITTER: Split into tweet-sized chunks (max 280 chars each). Numbered 1/N format. First tweet is a hook. Last tweet is CTA. 3-8 tweets depending on source length.');
  }
  if (platforms.indexOf('linkedin') !== -1) {
    parts.push('- LINKEDIN: Professional tone. Bold first line for feed visibility. Short paragraphs. Engagement question at end. 3-5 hashtags at bottom.');
  }
  if (platforms.indexOf('tiktok') !== -1) {
    parts.push('- TIKTOK: Write 3 actual SCRIPTS for talking-head TikToks, NOT captions. Each 30-60 seconds (60-120 words). Hook → Point → CTA. Different angle per script (hot take, tutorial, storytime).');
  }
  if (platforms.indexOf('newsletter') !== -1) {
    parts.push('- NEWSLETTER: Subject line suggestion. Opening paragraph hook. Key takeaways as bullet points. CTA for full content.');
  }
  if (platforms.indexOf('facebook') !== -1) {
    parts.push('- FACEBOOK: Longer narrative. Question-driven for comments. Shareable framing.');
  }
  if (platforms.indexOf('blog') !== -1) {
    parts.push('- BLOG SUMMARY: Meta description (160 chars). Key takeaways (3-5 bullets). Social sharing snippet.');
  }

  parts.push('\nIMPORTANT:');
  parts.push('- Create GENUINELY DIFFERENT versions for each platform. Do NOT just copy-paste and shorten.');
  parts.push('- Each version should feel NATIVE to that platform.');
  parts.push('- Preserve the core message and key points but present them differently.');
  parts.push('- African context preservation — if the source mentions African specifics, keep them natural.');

  parts.push('\nOUTPUT FORMAT — Return ONLY valid JSON, no markdown fences:');
  parts.push('{');
  parts.push('  "source": { "wordCount": 2450, "keyPoints": ["Point 1", "Point 2"] },');
  parts.push('  "outputs": [');

  if (platforms.indexOf('instagram') !== -1) {
    parts.push('    { "platform": "instagram", "text": "...", "charCount": 1200, "hashtags": ["#tag1","#tag2"], "format": "caption" },');
  }
  if (platforms.indexOf('twitter') !== -1) {
    parts.push('    { "platform": "twitter", "tweets": [ { "number": 1, "text": "..." }, ... ], "format": "thread" },');
  }
  if (platforms.indexOf('linkedin') !== -1) {
    parts.push('    { "platform": "linkedin", "text": "...", "charCount": 800, "hashtags": ["#tag1"], "format": "post" },');
  }
  if (platforms.indexOf('tiktok') !== -1) {
    parts.push('    { "platform": "tiktok", "scripts": [ { "angle": "Hot Take", "text": "...", "duration": "30s" }, { "angle": "Tutorial", "text": "...", "duration": "45s" }, { "angle": "Storytime", "text": "...", "duration": "60s" } ], "format": "scripts" },');
  }
  if (platforms.indexOf('newsletter') !== -1) {
    parts.push('    { "platform": "newsletter", "subjectLine": "...", "text": "...", "format": "snippet" },');
  }
  if (platforms.indexOf('facebook') !== -1) {
    parts.push('    { "platform": "facebook", "text": "...", "charCount": 600, "format": "post" },');
  }
  if (platforms.indexOf('blog') !== -1) {
    parts.push('    { "platform": "blog", "text": "Meta: ...\\n\\nKey Takeaways:\\n- ...\\n\\nShare: ...", "format": "summary" },');
  }

  parts.push('  ],');
  parts.push('  "timeSaved": "~4 hours",');
  parts.push('  "contentMultiplier": "1 → ' + platforms.length + '"');
  parts.push('}');

  return parts.join('\n');
}

function parseOutput(raw) {
  try {
    var parsed = JSON.parse(raw);
    if (parsed.outputs && Array.isArray(parsed.outputs)) return parsed;
  } catch (e) {
    var match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { var obj = JSON.parse(match[0]); if (obj.outputs) return obj; } catch (e2) {}
    }
  }
  // Fallback: wrap entire response as a single output
  return {
    source: { wordCount: 0, keyPoints: [] },
    outputs: [{ platform: 'blog', text: raw, format: 'raw', charCount: raw.length }],
    timeSaved: '~1 hour',
    contentMultiplier: '1 → 1'
  };
}

function createHistoryEntry(sourceType, source, platforms, outputs) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    sourceType: sourceType,
    source: source.substring(0, 500),
    platforms: platforms,
    outputs: outputs,
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
window.AfroTools.RepurposeEngine = {
  PLATFORMS: PLATFORMS,
  SOURCE_TYPES: SOURCE_TYPES,
  buildPrompt: buildPrompt,
  parseOutput: parseOutput,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp
};

}();

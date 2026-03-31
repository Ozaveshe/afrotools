/**
 * CaptionCraft Engine — AI Caption Writer
 * Platform-specific caption generation, tone options, hashtag sets
 */
!function(){"use strict";

var PLATFORMS = {
  instagram: { label: 'Instagram', icon: '&#128247;', maxChars: 2200, previewChars: 125, hashtagStyle: 'separated', class: 'ig' },
  x:         { label: 'X / Twitter', icon: '&#120143;', maxChars: 280, previewChars: 280, hashtagStyle: 'minimal', class: 'x' },
  linkedin:  { label: 'LinkedIn', icon: '&#128188;', maxChars: 3000, previewChars: 140, hashtagStyle: 'end', class: 'li' },
  tiktok:    { label: 'TikTok', icon: '&#127925;', maxChars: 2200, previewChars: 150, hashtagStyle: 'inline', class: 'tt' },
  facebook:  { label: 'Facebook', icon: '&#128077;', maxChars: 63206, previewChars: 140, hashtagStyle: 'end', class: 'fb' }
};

var TONES = [
  { id: 'casual', label: 'Casual' },
  { id: 'professional', label: 'Professional' },
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'educational', label: 'Educational' }
];

var INCLUDE_OPTIONS = [
  { id: 'cta', label: 'CTA', default: true },
  { id: 'hashtags', label: 'Hashtags', default: true },
  { id: 'emoji', label: 'Emoji', default: true },
  { id: 'question', label: 'Question at end', default: false }
];

function buildPrompt(platform, topic, tone, includes, isRewrite, existingCaption) {
  var p = PLATFORMS[platform] || PLATFORMS.instagram;
  var parts = [];

  if (isRewrite) {
    parts.push('Rewrite and improve this existing caption for ' + p.label + ':');
    parts.push('"' + existingCaption + '"');
    parts.push('Generate 3 improved variations.');
  } else {
    parts.push('Write 3 caption variations for ' + p.label + '.');
    parts.push('Topic/brief: ' + topic);
  }

  parts.push('Tone: ' + (tone || 'casual'));

  // Platform-specific rules
  switch (platform) {
    case 'instagram':
      parts.push('INSTAGRAM RULES: First line is the hook (must work in ' + p.previewChars + ' chars before "...more"). Use proper line breaks for readability. Max ' + p.maxChars + ' chars.');
      if (includes.hashtags) parts.push('Add 10-15 hashtags separated from caption by line breaks.');
      if (includes.cta) parts.push('Include a CTA like "Link in bio", "Save this post", or "Share with someone who..."');
      break;
    case 'x':
      parts.push('X/TWITTER RULES: Hard limit ' + p.maxChars + ' chars per tweet. Punchy, short sentences. Line breaks for emphasis.');
      parts.push('Use hashtags VERY sparingly (0-2 max). If content is too long, split into a numbered thread.');
      break;
    case 'linkedin':
      parts.push('LINKEDIN RULES: First 2 lines visible before "...see more" — make them count. Short paragraphs (1-2 sentences). Professional tone even when casual.');
      if (includes.question) parts.push('End with an engagement question.');
      parts.push('3-5 hashtags at the very end only.');
      break;
    case 'tiktok':
      parts.push('TIKTOK RULES: Super short (' + p.previewChars + ' chars recommended). Emoji-heavy. Hashtags are crucial for discovery.');
      break;
    case 'facebook':
      parts.push('FACEBOOK RULES: Longer posts OK (100+ words perform well). Storytelling works. End with a question to drive comments.');
      break;
  }

  if (includes.emoji) parts.push('Use emoji strategically — not excessive.');
  if (includes.question) parts.push('End with an engagement question.');

  parts.push('\nOUTPUT FORMAT — Return ONLY valid JSON, no markdown fences:');
  parts.push('{');
  parts.push('  "captions": [');
  parts.push('    { "variation": 1, "label": "The Reliable One", "text": "...", "charCount": 245, "withinLimit": true, "hashtags": ["#tag1","#tag2"], "cta": "Save this for later", "firstLinePreview": "First 125 chars..." },');
  parts.push('    { "variation": 2, "label": "The Bold One", "text": "...", ... },');
  parts.push('    { "variation": 3, "label": "The Creative One", "text": "...", ... }');
  parts.push('  ],');
  parts.push('  "platformTip": "A helpful tip about this platform..."');
  parts.push('}');

  return parts.join('\n');
}

function parseOutput(raw) {
  try {
    var parsed = JSON.parse(raw);
    if (parsed.captions && Array.isArray(parsed.captions)) return parsed;
  } catch (e) {
    var match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { var obj = JSON.parse(match[0]); if (obj.captions) return obj; } catch (e2) {}
    }
  }
  // Fallback: treat as plain text, split into 3 variations
  var sections = raw.split(/(?:variation|option|#)\s*[123]/i).filter(function(s) { return s.trim().length > 20; });
  if (sections.length < 3) sections = [raw];
  var labels = ['The Reliable One', 'The Bold One', 'The Creative One'];
  return {
    captions: sections.slice(0, 3).map(function(s, i) {
      var text = s.trim();
      return { variation: i + 1, label: labels[i] || 'Option ' + (i + 1), text: text, charCount: text.length, withinLimit: true, hashtags: [], cta: '', firstLinePreview: text.substring(0, 125) };
    }),
    platformTip: ''
  };
}

function createHistoryEntry(platform, topic, tone, captions) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    platform: platform,
    topic: topic,
    tone: tone,
    captions: captions,
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
window.AfroTools.CaptionCraftEngine = {
  PLATFORMS: PLATFORMS,
  TONES: TONES,
  INCLUDE_OPTIONS: INCLUDE_OPTIONS,
  buildPrompt: buildPrompt,
  parseOutput: parseOutput,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp
};

}();

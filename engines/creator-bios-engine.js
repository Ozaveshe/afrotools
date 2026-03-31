/**
 * BioForge Engine — Bio Generator for Every Platform
 * Platform specs, prompt builder, response parser
 */
!function(){"use strict";

var PLATFORMS = {
  instagram:         { icon: '&#128247;', label: 'Instagram',        limit: 150,  field: 'Bio' },
  tiktok:            { icon: '&#127925;', label: 'TikTok',           limit: 80,   field: 'Bio' },
  x:                 { icon: '&#128038;', label: 'X / Twitter',      limit: 160,  field: 'Bio' },
  linkedin_headline: { icon: '&#128188;', label: 'LinkedIn Headline', limit: 220, field: 'Headline' },
  linkedin_about:    { icon: '&#128188;', label: 'LinkedIn About',   limit: 2600, field: 'About' },
  youtube:           { icon: '&#9654;&#65039;',  label: 'YouTube',   limit: 1000, field: 'About' },
  threads:           { icon: '&#128172;', label: 'Threads',          limit: 150,  field: 'Bio' }
};

var PLATFORM_ORDER = ['instagram','tiktok','x','linkedin_headline','linkedin_about','youtube','threads'];

function buildPrompt(who, what, vibe, singlePlatform) {
  var parts = [];

  parts.push('You are BioForge, a bio writing expert for African content creators.');
  parts.push('');
  parts.push('CREATOR INFO:');
  parts.push('- Who: ' + who);
  parts.push('- What they do: ' + what);
  parts.push('- Tone/Vibe: ' + vibe);
  parts.push('');

  if (singlePlatform) {
    var p = PLATFORMS[singlePlatform];
    parts.push('Generate ONLY a bio for ' + p.label + ' (' + p.field + ', ' + p.limit + ' char limit).');
    parts.push('');
    parts.push('OUTPUT FORMAT (JSON):');
    parts.push('{');
    parts.push('  "bios": [');
    parts.push('    { "platform": "' + singlePlatform + '", "text": "...", "charCount": N, "charLimit": ' + p.limit + ', "withinLimit": true }');
    parts.push('  ]');
    parts.push('}');
  } else {
    parts.push('RULES:');
    parts.push('- Generate bios for ALL platforms simultaneously');
    parts.push('- Each bio MUST respect the platform character limit EXACTLY');
    parts.push('- Each bio should feel NATIVE to that platform:');
    parts.push('  - Instagram (150 chars): visual, emoji structure, line breaks, link reference');
    parts.push('  - TikTok (80 chars): ultra-short, trendy, Gen-Z energy if appropriate');
    parts.push('  - X/Twitter (160 chars): witty, personality-first, no filler words');
    parts.push('  - LinkedIn headline (220 chars): professional keywords, searchable');
    parts.push('  - LinkedIn about (2600 chars): storytelling, credibility, paragraphs');
    parts.push('  - YouTube (1000 chars): discovery-focused, upload schedule mention, keywords');
    parts.push('  - Threads (150 chars): casual, conversational, personality');
    parts.push('- Use the specified tone consistently across all bios');
    parts.push('- African context natural — location, cultural references, local achievements');
    parts.push('- Emoji usage should match platform norms (heavy on IG/TikTok, minimal on LinkedIn)');
    parts.push('- NEVER use generic filler like "Passionate about..." or "Lover of..."');
    parts.push('- Include ONE unique element that makes the creator memorable');
    parts.push('');
    parts.push('OUTPUT FORMAT (JSON only, no markdown fences):');
    parts.push('{');
    parts.push('  "bios": [');
    parts.push('    { "platform": "instagram", "text": "...", "charCount": N, "charLimit": 150, "withinLimit": true },');
    parts.push('    { "platform": "tiktok", "text": "...", "charCount": N, "charLimit": 80, "withinLimit": true },');
    parts.push('    { "platform": "x", "text": "...", "charCount": N, "charLimit": 160, "withinLimit": true },');
    parts.push('    { "platform": "linkedin_headline", "text": "...", "charCount": N, "charLimit": 220, "withinLimit": true },');
    parts.push('    { "platform": "linkedin_about", "text": "...", "charCount": N, "charLimit": 2600, "withinLimit": true },');
    parts.push('    { "platform": "youtube", "text": "...", "charCount": N, "charLimit": 1000, "withinLimit": true },');
    parts.push('    { "platform": "threads", "text": "...", "charCount": N, "charLimit": 150, "withinLimit": true }');
    parts.push('  ],');
    parts.push('  "personalBrandTip": "One sentence of unique branding advice for this creator."');
    parts.push('}');
  }

  parts.push('');
  parts.push('Return ONLY valid JSON. No markdown code fences. No extra text.');

  return parts.join('\n');
}

function parseResponse(text) {
  // Try direct JSON parse
  try { return JSON.parse(text); } catch(e) {}

  // Try extracting JSON from markdown fences
  var fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch(e) {}
  }

  // Try extracting any JSON object
  var objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch(e) {}
  }

  // Fallback: return raw text as single bio
  return { bios: [{ platform: 'instagram', text: text, charCount: text.length, charLimit: 150, withinLimit: text.length <= 150 }] };
}

// Expose
if (!window.AfroTools) window.AfroTools = {};
window.AfroTools.BioForgeEngine = {
  PLATFORMS: PLATFORMS,
  PLATFORM_ORDER: PLATFORM_ORDER,
  buildPrompt: buildPrompt,
  parseResponse: parseResponse
};

}();

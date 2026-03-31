/**
 * ScriptPad Engine — Video Script Generator
 * Formats, prompts, output parsing, teleprompter, export
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

var SCRIPT_FORMATS = {
  youtube: { label: 'YouTube Standard', icon: '\uD83C\uDFAC', desc: 'Hook \u2192 Intro \u2192 Points \u2192 CTA \u2192 Outro' },
  podcast: { label: 'Podcast / Audio', icon: '\uD83C\uDFA7', desc: 'Cold open \u2192 Welcome \u2192 Discussion \u2192 Takeaways' },
  voiceover: { label: 'Voiceover / Narration', icon: '\uD83C\uDF99\uFE0F', desc: 'Clean narration with pause markers' },
  educational: { label: 'Educational / Tutorial', icon: '\uD83C\uDF93', desc: 'Objective \u2192 Steps \u2192 Recap' },
  storytime: { label: 'Storytime', icon: '\uD83D\uDCDA', desc: 'Setup \u2192 Rising action \u2192 Climax \u2192 Lesson' }
};

var DURATION_OPTIONS = ['3-5 min', '5-8 min', '8-12 min', '12-20 min'];

var PLATFORM_OPTIONS = ['YouTube', 'TikTok', 'Instagram Reels', 'Podcast', 'Course / LMS'];

var DURATION_WORD_MAP = {
  '3-5 min': { min: 600, max: 1100 },
  '5-8 min': { min: 1100, max: 1800 },
  '8-12 min': { min: 1800, max: 2700 },
  '12-20 min': { min: 2700, max: 4500 }
};

function buildGeneratePrompt(formData) {
  var parts = [];
  parts.push('You are ScriptPad, a video script writing expert for African content creators.');
  parts.push('');
  parts.push('RULES:');
  parts.push('- Generate a COMPLETE script, not an outline. Write every word the creator will say.');
  parts.push('- Structure with clear sections, each with a timestamp estimate.');
  parts.push('- Match the requested format: ' + (formData.format || 'youtube'));

  var wordRange = DURATION_WORD_MAP[formData.duration] || DURATION_WORD_MAP['5-8 min'];
  parts.push('- Target duration: ' + (formData.duration || '5-8 min') + ' (' + wordRange.min + '-' + wordRange.max + ' words)');
  parts.push('- Include B-roll/visual suggestions in each section.');
  parts.push('- Include transition phrases between sections.');
  parts.push('- Write in SPOKEN language, not written. Short sentences. Contractions. Natural flow.');
  parts.push('- African context where relevant \u2014 don\'t force it, but let it be natural.');
  parts.push('- Hook must be compelling.');
  parts.push('- CTA must be specific and natural.');
  parts.push('- Include delivery notes: [PAUSE], [EMPHASIS], [SHOW SCREEN], [CUT TO B-ROLL]');
  parts.push('');
  parts.push('VIDEO TOPIC: ' + (formData.topic || 'Untitled'));
  if (formData.platform) parts.push('PLATFORM: ' + formData.platform);
  if (formData.keyPoints) parts.push('KEY POINTS TO COVER: ' + formData.keyPoints);
  parts.push('');
  parts.push('OUTPUT FORMAT (respond with ONLY valid JSON, no markdown fences):');
  parts.push('{');
  parts.push('  "title": "Video title",');
  parts.push('  "format": "' + (formData.format || 'youtube') + '",');
  parts.push('  "estimatedDuration": "7:30",');
  parts.push('  "wordCount": 1650,');
  parts.push('  "sections": [');
  parts.push('    {');
  parts.push('      "type": "hook",');
  parts.push('      "label": "HOOK",');
  parts.push('      "timestamp": "0:00-0:15",');
  parts.push('      "text": "Full script text for this section...",');
  parts.push('      "visualCues": ["Face close-up", "Show stats graphic"],');
  parts.push('      "deliveryNotes": "Start quiet, build intensity."');
  parts.push('    }');
  parts.push('  ],');
  parts.push('  "fullScript": "Complete concatenated script text...",');
  parts.push('  "keywordSuggestions": ["keyword1", "keyword2"]');
  parts.push('}');

  return parts.join('\n');
}

function buildRegeneratePrompt(section, context) {
  var parts = [];
  parts.push('You are ScriptPad, a video script writing expert for African content creators.');
  parts.push('');
  parts.push('The creator has a script about: ' + (context.topic || 'a video'));
  parts.push('Format: ' + (context.format || 'youtube'));
  parts.push('');
  parts.push('They want you to REWRITE just this one section:');
  parts.push('Section type: ' + section.type);
  parts.push('Section label: ' + section.label);
  parts.push('Current text: ' + section.text);
  parts.push('');
  if (context.feedback) {
    parts.push('Creator feedback: ' + context.feedback);
    parts.push('');
  }
  parts.push('Rewrite this section only. Keep the same type and approximate timestamp.');
  parts.push('Write in SPOKEN language. Include delivery notes and visual cues.');
  parts.push('');
  parts.push('OUTPUT FORMAT (respond with ONLY valid JSON, no markdown fences):');
  parts.push('{');
  parts.push('  "text": "Rewritten section text...",');
  parts.push('  "visualCues": ["cue1", "cue2"],');
  parts.push('  "deliveryNotes": "Delivery instructions"');
  parts.push('}');

  return parts.join('\n');
}

function parseScriptJSON(text) {
  try { return JSON.parse(text); } catch (e) {
    var match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) {}
    }
    return null;
  }
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
}

function estimateDuration(wordCount) {
  // Average speaking rate: ~150 words per minute
  var minutes = wordCount / 150;
  var m = Math.floor(minutes);
  var s = Math.round((minutes - m) * 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function getFullScript(sections) {
  if (!sections || !sections.length) return '';
  return sections.map(function(s) { return s.text || ''; }).join('\n\n');
}

function buildTeleprompterText(sections) {
  if (!sections || !sections.length) return '';
  return sections.map(function(s) {
    var text = s.text || '';
    // Strip delivery notes for clean reading
    text = text.replace(/\[PAUSE[^\]]*\]/gi, '   ');
    text = text.replace(/\[EMPHASIS\]/gi, '');
    text = text.replace(/\[SHOW SCREEN\]/gi, '');
    text = text.replace(/\[CUT TO B-ROLL[^\]]*\]/gi, '');
    return text.trim();
  }).filter(function(t) { return t; }).join('\n\n');
}

function createHistoryEntry(topic, format, scriptData) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    topic: topic,
    format: format,
    title: scriptData.title || topic,
    wordCount: scriptData.wordCount || 0,
    estimatedDuration: scriptData.estimatedDuration || '',
    sectionCount: scriptData.sections ? scriptData.sections.length : 0,
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

function exportPlainText(scriptData) {
  var lines = [];
  lines.push(scriptData.title || 'Untitled Script');
  lines.push('Format: ' + (scriptData.format || 'youtube') + ' | Duration: ' + (scriptData.estimatedDuration || 'N/A'));
  lines.push('');
  lines.push('---');
  lines.push('');
  if (scriptData.sections) {
    scriptData.sections.forEach(function(s) {
      lines.push('[' + s.label + '] (' + s.timestamp + ')');
      lines.push('');
      lines.push(s.text);
      lines.push('');
      if (s.visualCues && s.visualCues.length) {
        lines.push('Visual cues: ' + s.visualCues.join(' | '));
        lines.push('');
      }
    });
  }
  if (scriptData.keywordSuggestions && scriptData.keywordSuggestions.length) {
    lines.push('---');
    lines.push('Keywords: ' + scriptData.keywordSuggestions.join(', '));
  }
  return lines.join('\n');
}

window.AfroTools = window.AfroTools || {};
window.AfroTools.CreatorScriptsEngine = {
  SCRIPT_FORMATS: SCRIPT_FORMATS,
  DURATION_OPTIONS: DURATION_OPTIONS,
  PLATFORM_OPTIONS: PLATFORM_OPTIONS,
  DURATION_WORD_MAP: DURATION_WORD_MAP,
  buildGeneratePrompt: buildGeneratePrompt,
  buildRegeneratePrompt: buildRegeneratePrompt,
  parseScriptJSON: parseScriptJSON,
  countWords: countWords,
  estimateDuration: estimateDuration,
  getFullScript: getFullScript,
  buildTeleprompterText: buildTeleprompterText,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp,
  exportPlainText: exportPlainText
};

}();

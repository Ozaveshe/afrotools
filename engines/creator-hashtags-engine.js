/**
 * TagWave Engine — Hashtag Generator
 * Platform configs, tag parsing, mix builder, history
 */
!function(){"use strict";

var PLATFORMS = {
  instagram: { label: 'Instagram', icon: '📷', maxTags: 30, recommended: 15, placement: 'Caption or first comment' },
  tiktok:    { label: 'TikTok',    icon: '🎵', maxTags: 8,  recommended: 6,  placement: 'In caption' },
  x:         { label: 'X',         icon: '𝕏',  maxTags: 3,  recommended: 2,  placement: 'In tweet body' },
  linkedin:  { label: 'LinkedIn',  icon: '💼', maxTags: 5,  recommended: 4,  placement: 'End of post' },
  youtube:   { label: 'YouTube',   icon: '▶️', maxTags: 15, recommended: 10, placement: 'Backend tags field' }
};

var DEFAULT_PLATFORM = 'instagram';

var REACH_LEVELS = {
  high:  { label: 'High Reach',  desc: '1M+ posts',     color: '#FF3B30' },
  mid:   { label: 'Mid Reach',   desc: '100K–1M posts', color: '#FFD60A' },
  niche: { label: 'Niche',       desc: '<100K posts',   color: '#34C759' }
};

function buildPrompt(topic, platform) {
  var p = PLATFORMS[platform] || PLATFORMS.instagram;
  return 'Generate hashtags for this post:\n\nTOPIC: ' + topic +
    '\nPLATFORM: ' + p.label + ' (recommended ' + p.recommended + ' tags per set, max ' + p.maxTags + ')' +
    '\n\nGenerate exactly 3 hashtag sets with different strategies.' +
    '\nSet 1 "THE BROAD REACH": Maximum impressions — mix of high, mid, and niche tags.' +
    '\nSet 2 "THE NICHE PLAY": Higher engagement — mostly mid and niche tags.' +
    '\nSet 3 "THE COMMUNITY": African creator communities and local tags — mostly niche tags.' +
    '\n\nFor each tag include reach level (high/mid/niche) and estimated post count.' +
    '\nInclude African creator community tags when relevant.' +
    '\nNO banned or shadowbanned hashtags. NO #FollowForFollow or #Like4Like.' +
    '\nOnly tags that are ACTUALLY USED on the platform.' +
    '\nInclude trending/seasonal tags when applicable.' +
    '\n\nReturn ONLY valid JSON (no markdown fences):\n' +
    '{"sets":[{"name":"THE BROAD REACH","strategy":"...","tags":[{"tag":"#Example","reach":"high","estimatedPosts":"5M"}],"totalTags":' + p.recommended + ',"estimatedReach":"45M"},...],' +
    '"trendingNote":"optional trending tip or empty string",' +
    '"avoidList":["#BadTag — reason"]}';
}

function parseSets(raw) {
  if (typeof raw === 'object' && raw.sets) return raw;
  if (typeof raw !== 'string') return null;
  try {
    var match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch(e) {}
  return null;
}

function formatReach(num) {
  if (!num) return '';
  var s = String(num).replace(/,/g, '');
  if (/\d+[MmKkBb]/.test(s)) return s.toUpperCase();
  var n = parseFloat(s);
  if (isNaN(n)) return num;
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}

function tagsToString(tags) {
  return tags.map(function(t) { return t.tag; }).join(' ');
}

function createHistoryEntry(topic, platform, sets, customMix) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    topic: topic,
    platform: platform,
    sets: sets,
    customMix: customMix || [],
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
window.AfroTools.TagWaveEngine = {
  PLATFORMS: PLATFORMS,
  DEFAULT_PLATFORM: DEFAULT_PLATFORM,
  REACH_LEVELS: REACH_LEVELS,
  buildPrompt: buildPrompt,
  parseSets: parseSets,
  formatReach: formatReach,
  tagsToString: tagsToString,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp
};

}();

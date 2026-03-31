/**
 * HookFactory Engine — Video Hook Generation & Teleprompter Utilities
 * Hook categories, platform config, read time calc, local storage
 */
(function() {
  'use strict';

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

  var CreatorHooks = {
    id: 'creator-hooks',
    version: '1.0.0',

    // ── HOOK CATEGORIES ─────────────────────────────────────────────
    CATEGORIES: [
      { key: 'pattern_interrupt', label: '\u26A1 THE PATTERN INTERRUPT', desc: 'Commands attention with "Stop.", "Wait.", "Don\'t scroll."', readRange: '2-3s' },
      { key: 'question',          label: '\uD83E\uDD14 THE QUESTION',          desc: 'Asks something the viewer can\'t help but think about.',   readRange: '3-4s' },
      { key: 'bold_statement',    label: '\uD83D\uDCA5 THE BOLD STATEMENT',    desc: 'Starts with a controversial or surprising claim.',        readRange: '2-4s' },
      { key: 'story_opener',      label: '\uD83D\uDCD6 THE STORY OPENER',      desc: 'Narrative pull — the viewer needs to know what happened.', readRange: '3-5s' },
      { key: 'statistic',         label: '\uD83D\uDCC8 THE STATISTIC',         desc: 'Leads with a shocking number or data point.',             readRange: '3-4s' },
      { key: 'direct_address',    label: '\uD83D\uDC4B THE DIRECT ADDRESS',    desc: 'Calls out the specific viewer. Personal, targeted.',      readRange: '3-4s' }
    ],

    // ── PLATFORM CONFIG ─────────────────────────────────────────────
    PLATFORMS: {
      tiktok:  { label: 'TikTok',         maxSeconds: 3,   style: 'Ultra-short, punchy, informal, trending language OK' },
      reels:   { label: 'Instagram Reels', maxSeconds: 3,   style: 'Short, punchy, visual-first, informal' },
      shorts:  { label: 'YouTube Shorts',  maxSeconds: 4,   style: 'Slightly longer OK, can be more informational' },
      youtube: { label: 'YouTube',         maxSeconds: 5,   style: 'More narrative setup allowed, 4-5s hooks' }
    },

    // ── CONTENT TYPES ───────────────────────────────────────────────
    CONTENT_TYPES: [
      { key: 'educational',   label: 'Educational' },
      { key: 'story',         label: 'Storytime' },
      { key: 'review',        label: 'Review' },
      { key: 'tutorial',      label: 'Tutorial' },
      { key: 'reaction',      label: 'Reaction' },
      { key: 'entertainment', label: 'Entertainment' }
    ],

    // ── READ TIME CALCULATOR ────────────────────────────────────────
    // 150 words per minute average speaking pace
    WPM: 150,

    calcReadTime: function(text) {
      var words = this.countWords(text);
      return Math.round((words / this.WPM) * 60 * 10) / 10;
    },

    countWords: function(text) {
      return (text || '').trim().split(/\s+/).filter(Boolean).length;
    },

    /**
     * Get time badge class based on read time
     * green <= 3s, yellow 3-4s, orange 4-5s, red > 5s
     */
    getTimeBadgeClass: function(seconds) {
      if (seconds <= 3) return '';
      if (seconds <= 4) return 'warn';
      return 'long';
    },

    /**
     * Check if hook fits platform timing
     */
    fitsplatform: function(readTimeSeconds, platform) {
      var config = this.PLATFORMS[platform];
      if (!config) return true;
      return readTimeSeconds <= config.maxSeconds;
    },

    /**
     * Get platform warning text if hook is too long
     */
    getPlatformWarning: function(readTimeSeconds, platform) {
      var config = this.PLATFORMS[platform];
      if (!config || readTimeSeconds <= config.maxSeconds) return null;
      return 'This hook is ' + readTimeSeconds.toFixed(1) + 's \u2014 might lose ' + config.label + ' viewers (aim for ' + config.maxSeconds + 's or less)';
    },

    // ── LOCAL STORAGE ───────────────────────────────────────────────
    LS_HISTORY_KEY: 'ch-history',
    LS_FAVORITES_KEY: 'ch-favorites',
    MAX_HISTORY: 20,

    getHistory: function() {
      try {
        return JSON.parse(localStorage.getItem(this.LS_HISTORY_KEY) || '[]');
      } catch(e) { return []; }
    },

    saveHistory: function(entry) {
      var history = this.getHistory();
      history.unshift(entry);
      if (history.length > this.MAX_HISTORY) history = history.slice(0, this.MAX_HISTORY);
      localStorage.setItem(this.LS_HISTORY_KEY, JSON.stringify(history));
    },

    clearHistory: function() {
      localStorage.removeItem(this.LS_HISTORY_KEY);
    },

    getFavorites: function() {
      try {
        return JSON.parse(localStorage.getItem(this.LS_FAVORITES_KEY) || '[]');
      } catch(e) { return []; }
    },

    saveFavorites: function(favorites) {
      localStorage.setItem(this.LS_FAVORITES_KEY, JSON.stringify(favorites));
    },

    toggleFavorite: function(hookText) {
      var favs = this.getFavorites();
      var idx = favs.indexOf(hookText);
      if (idx === -1) {
        favs.push(hookText);
      } else {
        favs.splice(idx, 1);
      }
      this.saveFavorites(favs);
      return idx === -1; // returns true if added, false if removed
    },

    isFavorite: function(hookText) {
      return this.getFavorites().indexOf(hookText) !== -1;
    },

    // ── SYSTEM PROMPT BUILDER ───────────────────────────────────────
    /**
     * Build the system prompt for AI hook generation
     */
    buildSystemPrompt: function(platform, contentType) {
      var platConfig = this.PLATFORMS[platform] || this.PLATFORMS.tiktok;
      return 'You are HookFactory, a video hook expert for African content creators.\n\n' +
        'RULES:\n' +
        '- Generate exactly 6 hooks, one per category: Pattern Interrupt, Question, Bold Statement, Story Opener, Statistic, Direct Address\n' +
        '- Each hook must be 2-5 seconds of spoken word (roughly 8-25 words)\n' +
        '- Calculate estimated read time (average speaking pace: 150 words per minute)\n' +
        '- Hooks must feel NATURAL when spoken aloud \u2014 no written-language phrases\n' +
        '- Use African context when relevant \u2014 cities, cultural references, local expressions\n' +
        '- Platform: ' + platConfig.label + ' \u2014 ' + platConfig.style + ' (max ' + platConfig.maxSeconds + 's)\n' +
        '- Content type: ' + contentType + '\n' +
        '- NEVER start with "Hey guys" or "What\'s up everyone" \u2014 those are weak hooks\n' +
        '- Every hook should create a REASON to keep watching\n\n' +
        'OUTPUT FORMAT (JSON only, no other text):\n' +
        '{"hooks":[{"category":"pattern_interrupt","categoryLabel":"\u26A1 THE PATTERN INTERRUPT","text":"...","wordCount":17,"readTimeSeconds":3.2,"whyItWorks":"...","deliveryTip":"..."},...]}\n';
    }
  };

  // Register on global namespace
  if (!window.AfroTools) window.AfroTools = {};
  if (!window.AfroTools.engines) window.AfroTools.engines = {};
  window.AfroTools.engines.creatorHooks = CreatorHooks;
})();

(function (window) {
  'use strict';

  var PLATFORMS = ['instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'facebook', 'other'];
  var FORMATS = ['reel', 'carousel', 'story', 'static', 'thread', 'short', 'long-form', 'other'];

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function normalizePost(input) {
    var source = input || {};
    var platform = clean(source.platform).toLowerCase();
    var format = clean(source.format || source.type).toLowerCase();
    var post = {
      id: clean(source.id) || ('post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)),
      date: clean(source.date),
      platform: PLATFORMS.indexOf(platform) >= 0 ? platform : 'other',
      format: FORMATS.indexOf(format) >= 0 ? format : 'other',
      label: clean(source.label),
      impressions: number(source.impressions),
      reach: number(source.reach),
      likes: number(source.likes),
      comments: number(source.comments),
      shares: number(source.shares),
      saves: number(source.saves),
      followers: number(source.followers)
    };
    post.interactions = post.likes + post.comments + post.shares + post.saves;
    post.engagementRate = post.reach > 0 ? post.interactions / post.reach * 100 : 0;
    return post;
  }

  function validatePost(input) {
    var post = normalizePost(input);
    var errors = [];
    if (!post.date || !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) errors.push('date');
    if (post.reach <= 0) errors.push('reach');
    if (post.interactions > post.reach * 20) errors.push('metrics');
    return { valid: errors.length === 0, errors: errors, post: post };
  }

  function groupAverage(posts, key) {
    var grouped = {};
    posts.forEach(function (post) {
      var name = post[key] || 'other';
      if (!grouped[name]) grouped[name] = { name: name, posts: 0, reach: 0, interactions: 0 };
      grouped[name].posts += 1;
      grouped[name].reach += post.reach;
      grouped[name].interactions += post.interactions;
    });
    return Object.keys(grouped).map(function (name) {
      var item = grouped[name];
      item.engagementRate = item.reach > 0 ? item.interactions / item.reach * 100 : 0;
      return item;
    }).sort(function (a, b) {
      return b.engagementRate - a.engagementRate || b.posts - a.posts;
    });
  }

  function summarize(inputs) {
    var posts = (inputs || []).map(normalizePost).filter(function (post) {
      return post.date && post.reach > 0;
    }).sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
    var totals = posts.reduce(function (acc, post) {
      acc.reach += post.reach;
      acc.impressions += post.impressions;
      acc.interactions += post.interactions;
      acc.followers += post.followers;
      return acc;
    }, { reach: 0, impressions: 0, interactions: 0, followers: 0 });
    var byPlatform = groupAverage(posts, 'platform');
    var byFormat = groupAverage(posts, 'format');
    return {
      posts: posts,
      totalPosts: posts.length,
      totalReach: totals.reach,
      totalImpressions: totals.impressions,
      totalInteractions: totals.interactions,
      followersGained: totals.followers,
      engagementRate: totals.reach > 0 ? totals.interactions / totals.reach * 100 : 0,
      bestPlatform: byPlatform[0] || null,
      bestFormat: byFormat[0] || null,
      byPlatform: byPlatform,
      byFormat: byFormat
    };
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function toCsv(inputs) {
    var posts = (inputs || []).map(normalizePost);
    var headers = ['date', 'platform', 'format', 'label', 'impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'followers_gained', 'interactions', 'engagement_rate_percent'];
    var rows = posts.map(function (post) {
      return [
        post.date, post.platform, post.format, post.label, post.impressions, post.reach,
        post.likes, post.comments, post.shares, post.saves, post.followers,
        post.interactions, post.engagementRate.toFixed(2)
      ].map(csvCell).join(',');
    });
    return [headers.join(',')].concat(rows).join('\r\n');
  }

  function brief(summary, locale) {
    var fr = String(locale || '').toLowerCase().indexOf('fr') === 0;
    var sw = String(locale || '').toLowerCase().indexOf('sw') === 0;
    if (!summary || !summary.totalPosts) {
      if (fr) return 'Ajoutez au moins une publication pour obtenir une synthèse.';
      if (sw) return 'Ongeza angalau chapisho moja ili kupata muhtasari.';
      return 'Add at least one post to generate a summary.';
    }
    var platform = summary.bestPlatform ? summary.bestPlatform.name : '—';
    var format = summary.bestFormat ? summary.bestFormat.name : '—';
    if (sw) {
      return summary.totalPosts + ' chapisho, reach jumla ' + summary.totalReach.toLocaleString('sw') +
        ' na engagement ' + summary.engagementRate.toFixed(2) + '%. Jukwaa bora: ' + platform +
        '. Muundo bora: ' + format + '. Linganisha vipindi vinavyofanana na ujaribu kigezo kimoja kwa wakati.';
    }
    return fr
      ? summary.totalPosts + ' publication(s), ' + summary.totalReach.toLocaleString('fr-FR') + ' de portée et ' + summary.engagementRate.toFixed(2) + ' % d’engagement. Plateforme la plus performante : ' + platform + '. Format le plus performant : ' + format + '. Comparez des périodes et testez une variable à la fois.'
      : summary.totalPosts + ' post(s), ' + summary.totalReach.toLocaleString('en') + ' total reach and ' + summary.engagementRate.toFixed(2) + '% engagement. Best platform: ' + platform + '. Best format: ' + format + '. Compare like-for-like periods and test one variable at a time.';
  }

  var engine = {
    id: 'creator-analytics',
    version: '1.0.0',
    platforms: PLATFORMS.slice(),
    formats: FORMATS.slice(),
    normalizePost: normalizePost,
    validatePost: validatePost,
    summarize: summarize,
    toCsv: toCsv,
    brief: brief
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorAnalytics = engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(typeof window !== 'undefined' ? window : globalThis);

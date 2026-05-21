(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.matchdayFanPoints = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var DEFAULT_CONFIG = {
    predictionSaved: 1,
    whatsappShare: 1,
    shareCardCta: 1,
    communityActivity: 1,
    badgeEarned: 2,
    verifiedReferral: 2,
    referralFirstLockedPrediction: 3,
    maxReferralReward: 25,
    maxDailySharePoints: 3,
    referralAwardTiming: 'pending-until-first-locked-prediction'
  };

  var ZERO_POINT_EVENTS = {
    referral_link_copied: true,
    referral_visit: true
  };

  function normalizeConfig(config) {
    return Object.assign({}, DEFAULT_CONFIG, config || {});
  }

  function eventDay(event) {
    return String(event && event.timestamp ? event.timestamp : '').slice(0, 10) || 'unknown';
  }

  function eventKey(event) {
    if (!event) return '';
    if (event.type === 'referral_verified_session' || event.type === 'referral_first_locked_prediction') {
      return [event.type, event.referrerId, event.referredUserId].join(':');
    }
    return event.eventId || [event.type, event.timestamp, event.source].join(':');
  }

  function uniqueEvents(events) {
    var seen = {};
    return (events || []).filter(function (event) {
      var key = eventKey(event);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function isSelfReferral(event) {
    return Boolean(event && event.referrerId && event.referredUserId && event.referrerId === event.referredUserId);
  }

  function baseFanPoints(event, config, dailyShareTotals) {
    if (!event || ZERO_POINT_EVENTS[event.type] || isSelfReferral(event)) return 0;
    if (event.type === 'prediction_saved') return config.predictionSaved;
    if (event.type === 'community_activity') return config.communityActivity;
    if (event.type === 'badge_earned') return config.badgeEarned;
    if (event.type === 'whatsapp_share' || event.type === 'share_card_cta') {
      var day = eventDay(event);
      dailyShareTotals[day] = dailyShareTotals[day] || 0;
      if (dailyShareTotals[day] >= config.maxDailySharePoints) return 0;
      dailyShareTotals[day] += event.type === 'whatsapp_share' ? config.whatsappShare : config.shareCardCta;
      return event.type === 'whatsapp_share' ? config.whatsappShare : config.shareCardCta;
    }
    return 0;
  }

  function calculateReferralPoints(events, config) {
    var byReferredUser = {};
    var awarded = 0;
    var pending = 0;
    uniqueEvents(events).forEach(function (event) {
      if (!event || !event.referredUserId || !event.referrerId || isSelfReferral(event)) return;
      var bucket = byReferredUser[event.referredUserId] || {
        referrerId: event.referrerId,
        verified: false,
        firstLockedPrediction: false
      };
      if (event.type === 'referral_verified_session') bucket.verified = true;
      if (event.type === 'referral_first_locked_prediction') bucket.firstLockedPrediction = true;
      byReferredUser[event.referredUserId] = bucket;
    });

    Object.keys(byReferredUser).forEach(function (referredUserId) {
      var bucket = byReferredUser[referredUserId];
      if (bucket.verified && bucket.firstLockedPrediction) {
        awarded += config.verifiedReferral + config.referralFirstLockedPrediction;
      } else if (bucket.verified) {
        pending += config.verifiedReferral;
      }
    });

    return {
      awarded: Math.min(awarded, config.maxReferralReward),
      pending: Math.min(pending, Math.max(0, config.maxReferralReward - Math.min(awarded, config.maxReferralReward))),
      maxReferralReward: config.maxReferralReward
    };
  }

  function calculateFanScore(events, configInput) {
    var config = normalizeConfig(configInput);
    var dailyShareTotals = {};
    var nonReferralTotal = 0;
    uniqueEvents(events).forEach(function (event) {
      nonReferralTotal += baseFanPoints(event, config, dailyShareTotals);
    });
    var referral = calculateReferralPoints(events, config);
    return {
      fanPoints: nonReferralTotal + referral.awarded,
      pendingReferralPoints: referral.pending,
      referralPoints: referral.awarded,
      maxReferralReward: referral.maxReferralReward,
      config: config
    };
  }

  function buildScoreTypes(predictionPoints, events, config) {
    var fan = calculateFanScore(events, config);
    return {
      predictionPoints: Number(predictionPoints) || 0,
      cashPrizePoints: Number(predictionPoints) || 0,
      fanPoints: fan.fanPoints,
      pendingReferralPoints: fan.pendingReferralPoints,
      referralPoints: fan.referralPoints,
      note: 'Referral and sharing activity never changes Prediction Points or cash-prize ranking.'
    };
  }

  function findReferralFlags(events, options) {
    var opts = Object.assign({ rapidWindowMinutes: 10, clusterThreshold: 3 }, options || {});
    var flags = [];
    var byDevice = {};
    var byIpHash = {};
    var signups = [];

    uniqueEvents(events).forEach(function (event) {
      if (!event) return;
      if (isSelfReferral(event)) {
        flags.push({ ruleId: 'self-referral', severity: 'high', referredUserId: event.referredUserId || null });
      }
      if (event.deviceSignalHash) {
        byDevice[event.deviceSignalHash] = byDevice[event.deviceSignalHash] || [];
        byDevice[event.deviceSignalHash].push(event);
      }
      if (event.ipHash) {
        byIpHash[event.ipHash] = byIpHash[event.ipHash] || [];
        byIpHash[event.ipHash].push(event);
      }
      if (event.type === 'referral_verified_session' && event.timestamp) signups.push(event);
    });

    Object.keys(byDevice).forEach(function (hash) {
      var rows = byDevice[hash];
      var userIds = rows.map(function (row) { return row.referredUserId; }).filter(Boolean);
      if (Array.from(new Set(userIds)).length > 1) {
        flags.push({ ruleId: 'same-device-referral', severity: 'high', hash: hash, count: userIds.length });
      }
    });

    Object.keys(byIpHash).forEach(function (hash) {
      var rows = byIpHash[hash];
      if (rows.length >= opts.clusterThreshold) {
        flags.push({ ruleId: 'repeated-ip-cluster', severity: 'medium', hash: hash, count: rows.length });
      }
    });

    signups.sort(function (a, b) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    for (var i = 0; i < signups.length; i += 1) {
      var start = new Date(signups[i].timestamp).getTime();
      var count = signups.filter(function (event) {
        return Math.abs(new Date(event.timestamp).getTime() - start) <= opts.rapidWindowMinutes * 60000;
      }).length;
      if (count >= opts.clusterThreshold) {
        flags.push({ ruleId: 'suspicious-rapid-signups', severity: 'medium', count: count, windowMinutes: opts.rapidWindowMinutes });
        break;
      }
    }

    return flags;
  }

  return {
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    normalizeConfig: normalizeConfig,
    calculateFanScore: calculateFanScore,
    calculateReferralPoints: calculateReferralPoints,
    buildScoreTypes: buildScoreTypes,
    findReferralFlags: findReferralFlags
  };
});
